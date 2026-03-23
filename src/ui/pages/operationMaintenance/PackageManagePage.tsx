import { DeleteOutlined, DownloadOutlined, EditOutlined, InboxOutlined, SearchOutlined, UploadOutlined } from '@ant-design/icons';
import { Button, Card, Form, Input, Modal, Select, Space, Table, Tag, Typography, Upload, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { UploadFile, UploadProps } from 'antd/es/upload/interface';
import { useCallback, useMemo, useState } from 'react';
import { getCurrentUser } from '../../../logic/auth/authStore';
import {
  packageManageList,
  type PackageManageRecord,
  type PackagePartItem,
  type PackageType,
} from '../../../data/operationMaintenance/packageManageList';
import { useI18n } from '../../../i18n/I18nProvider';

const { Dragger } = Upload;

function formatSize(bytes: number): string {
  if (bytes <= 0) {
    return '0 KB';
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function nowText(): string {
  const date = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function buildPseudoMd5(file: File): string {
  const seed = `${file.name}|${file.size}|${file.lastModified}`;
  let h1 = 0x811c9dc5;
  let h2 = 0x9e3779b1;
  let h3 = 0x85ebca77;
  let h4 = 0xc2b2ae3d;
  for (let i = 0; i < seed.length; i += 1) {
    const c = seed.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 0x01000193) >>> 0;
    h2 = Math.imul(h2 ^ c, 0x27d4eb2d) >>> 0;
    h3 = Math.imul(h3 ^ c, 0x165667b1) >>> 0;
    h4 = Math.imul(h4 ^ c, 0x85ebca6b) >>> 0;
  }
  return [h1, h2, h3, h4].map((value) => value.toString(16).padStart(8, '0')).join('');
}

function extractPartsFromFilename(fileName: string): PackagePartItem[] {
  const plainName = fileName.replace(/\.(zip|rar|7z|tar|gz)$/i, '');
  const pairs = [...plainName.matchAll(/([a-zA-Z][a-zA-Z0-9-]{1,30})[-_]?v(\d+\.\d+\.\d+)/g)];
  if (pairs.length === 0) {
    return [];
  }
  return pairs.map((item) => ({
    part: item[1],
    version: `v${item[2]}`,
  }));
}

async function extractPackageParts(file: File, type: PackageType): Promise<PackagePartItem[]> {
  // Mock extraction strategy: infer component-version pairs from filename first,
  // then fallback to preset "archive internal manifest" data for demo usage.
  const inferred = extractPartsFromFilename(file.name);
  if (inferred.length > 0) {
    return inferred;
  }

  const fallbackCloud: PackagePartItem[] = [
    { part: 'api-gateway', version: 'v3.2.0' },
    { part: 'report-service', version: 'v2.8.0' },
    { part: 'dispatch-engine', version: 'v1.5.2' },
  ];
  const fallbackRobot: PackagePartItem[] = [
    { part: 'motion-controller', version: 'v5.0.1' },
    { part: 'camera-driver', version: 'v2.4.5' },
    { part: 'arm-firmware', version: 'v5.0.9' },
  ];
  const candidates = type === 'cloud' ? fallbackCloud : fallbackRobot;
  const offset = file.size % 3;
  return candidates.map((item, index) => {
    if (index !== offset) {
      return item;
    }
    const main = item.version.replace(/^v/, '').split('.');
    const patch = Number(main[2] ?? 0) + 1;
    return { ...item, version: `v${main[0]}.${main[1]}.${patch}` };
  });
}

function downloadPackage(record: PackageManageRecord): void {
  const content = JSON.stringify(
    {
      name: record.name,
      type: record.type,
      targetParts: record.targetParts,
      description: record.description,
      md5: record.md5,
      uploadedAt: record.uploadedAt,
      uploader: record.uploader,
    },
    null,
    2,
  );
  const blob = new Blob([content], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${record.name}.meta.json`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export function PackageManagePage() {
  const { locale, t } = useI18n();
  const [messageApi, contextHolder] = message.useMessage();
  const [tableData, setTableData] = useState<PackageManageRecord[]>(packageManageList);
  const [keyword, setKeyword] = useState('');
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingRecord, setEditingRecord] = useState<PackageManageRecord | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedType, setSelectedType] = useState<PackageType | null>(null);
  const [editingFile, setEditingFile] = useState<File | null>(null);
  const [editExtracting, setEditExtracting] = useState(false);
  const [partList, setPartList] = useState<PackagePartItem[]>([]);
  const [extracting, setExtracting] = useState(false);
  const [form] = Form.useForm<{ description: string }>();
  const [editForm] = Form.useForm<{ name: string; type: PackageType; description: string; targetPartsRaw: string }>();

  const label = useMemo(() => {
    if (locale === 'en-US') {
      return {
        upload: 'Upload',
        tableName: 'Name',
        tableType: 'Type',
        tableParts: 'Target Components',
        tableDescription: 'Description',
        tableSize: 'Size',
        tableMd5: 'MD5',
        tableUploader: 'Uploader',
        tableUploadTime: 'Upload Time',
        tableAction: 'Action',
        typeCloud: 'Cloud Platform',
        typeRobot: 'Robot',
        actionDownload: 'Download',
        actionEdit: 'Edit',
        actionDelete: 'Delete',
        batchDownload: 'Batch Download',
        uploadTitle: 'Upload Package',
        fileArea: 'Upload Package File',
        fileHint: 'Click or drag compressed file here',
        typeField: 'Type',
        extractField: 'Extracted Components & Versions',
        extractEmpty: 'No extracted component info',
        descriptionField: 'Description',
        descriptionPlaceholder: 'Enter package description',
        submitUpload: 'Upload',
        fileRequired: 'Please select package file',
        typeRequired: 'Please select package type',
        uploadDone: 'Package uploaded',
        deleteDone: 'Package deleted',
        downloadDone: 'Package downloaded',
        batchDownloadRequired: 'Please select packages to download',
        batchDownloadDone: 'Downloaded {count} packages',
        editTitle: 'Edit Package',
        editDone: 'Package updated',
        partsPlaceholder: 'Format: component@v1.2.3, component2@v2.0.0',
        reuploadField: 'Re-upload Package (Optional)',
        reuploadHint: 'Drop new package to replace current one',
        partsReadonlyHint: 'Target components are auto-extracted from the uploaded package and cannot be edited manually.',
        searchPlaceholder: 'Search by name, type, component, MD5, uploader',
      };
    }
    return {
      upload: '上传',
      tableName: '名称',
      tableType: '类型',
      tableParts: '目标部件',
      tableDescription: '描述',
      tableSize: '体积',
      tableMd5: 'MD5',
      tableUploader: '上传者',
      tableUploadTime: '上传时间',
      tableAction: '操作',
      typeCloud: '云平台',
      typeRobot: '机器人',
      actionDownload: '下载',
      actionEdit: '编辑',
      actionDelete: '删除',
      batchDownload: '批量下载',
      uploadTitle: '上传安装包',
      fileArea: '上传文件区域',
      fileHint: '点击或拖拽压缩包到此处',
      typeField: '类型',
      extractField: '自动提取部件与版本',
      extractEmpty: '暂无提取信息',
      descriptionField: '描述',
      descriptionPlaceholder: '请输入描述',
      submitUpload: '上传',
      fileRequired: '请先选择安装包文件',
      typeRequired: '请选择安装包类型',
      uploadDone: '安装包上传成功',
      deleteDone: '安装包已删除',
      downloadDone: '安装包下载成功',
      batchDownloadRequired: '请先勾选要下载的安装包',
      batchDownloadDone: '已下载 {count} 个安装包',
      editTitle: '编辑安装包',
      editDone: '安装包已更新',
      partsPlaceholder: '格式：部件名@v1.2.3, 部件名2@v2.0.0',
      reuploadField: '重新上传安装包（可选）',
      reuploadHint: '拖拽新安装包可替换当前文件',
      partsReadonlyHint: '目标部件由安装包自动提取，不支持手动编辑。',
      searchPlaceholder: '按名称、类型、部件、MD5、上传者搜索',
    };
  }, [locale]);

  const typeText = useCallback((type: PackageType) => (type === 'cloud' ? label.typeCloud : label.typeRobot), [label.typeCloud, label.typeRobot]);

  const runExtract = async (file: File | null, type: PackageType | null) => {
    if (!file || !type) {
      setPartList([]);
      return;
    }
    setExtracting(true);
    try {
      const extracted = await extractPackageParts(file, type);
      setPartList(extracted);
    } finally {
      setExtracting(false);
    }
  };

  const uploadProps: UploadProps = {
    accept: '.zip,.rar,.7z,.tar,.gz',
    multiple: false,
    maxCount: 1,
    beforeUpload: (file) => {
      setSelectedFile(file);
      void runExtract(file, selectedType);
      return false;
    },
    onRemove: () => {
      setSelectedFile(null);
      setPartList([]);
    },
    fileList: selectedFile
      ? [
          {
            uid: '-1',
            name: selectedFile.name,
            status: 'done',
            size: selectedFile.size,
          } as UploadFile,
        ]
      : [],
  };

  const editUploadProps: UploadProps = {
    accept: '.zip,.rar,.7z,.tar,.gz',
    multiple: false,
    maxCount: 1,
    beforeUpload: (file) => {
      setEditingFile(file);
      const currentType = (editForm.getFieldValue('type') as PackageType | undefined) ?? editingRecord?.type ?? null;
      if (!currentType) {
        return false;
      }
      setEditExtracting(true);
      void extractPackageParts(file, currentType)
        .then((items) => {
          editForm.setFieldValue(
            'targetPartsRaw',
            items.map((item) => `${item.part}@${item.version}`).join(', '),
          );
        })
        .finally(() => setEditExtracting(false));
      return false;
    },
    onRemove: () => {
      setEditingFile(null);
    },
    fileList: editingFile
      ? [
          {
            uid: '-2',
            name: editingFile.name,
            status: 'done',
            size: editingFile.size,
          } as UploadFile,
        ]
      : [],
  };

  const columns: ColumnsType<PackageManageRecord> = [
    { title: label.tableName, dataIndex: 'name', key: 'name', width: 220 },
    {
      title: label.tableType,
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (value: PackageType) => <Tag color={value === 'cloud' ? 'processing' : 'purple'}>{typeText(value)}</Tag>,
    },
    {
      title: label.tableParts,
      dataIndex: 'targetParts',
      key: 'targetParts',
      width: 280,
      render: (items: PackagePartItem[]) => (
        <Space size={[4, 4]} wrap>
          {items.map((item) => (
            <Tag key={`${item.part}-${item.version}`}>{`${item.part} ${item.version}`}</Tag>
          ))}
        </Space>
      ),
    },
    { title: label.tableDescription, dataIndex: 'description', key: 'description', width: 260 },
    { title: label.tableSize, dataIndex: 'size', key: 'size', width: 110 },
    { title: label.tableMd5, dataIndex: 'md5', key: 'md5', width: 280 },
    { title: label.tableUploader, dataIndex: 'uploader', key: 'uploader', width: 110 },
    { title: label.tableUploadTime, dataIndex: 'uploadedAt', key: 'uploadedAt', width: 170 },
    {
      title: label.tableAction,
      key: 'action',
      width: 160,
      fixed: 'right',
      render: (_, record) => (
        <Space size={4}>
          <Button
            type="link"
            icon={<DownloadOutlined />}
            onClick={() => {
              downloadPackage(record);
              messageApi.success(label.downloadDone);
            }}
          >
            {label.actionDownload}
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => {
              setEditingRecord(record);
              setEditingFile(null);
              editForm.setFieldsValue({
                name: record.name,
                type: record.type,
                description: record.description,
                targetPartsRaw: record.targetParts.map((item) => `${item.part}@${item.version}`).join(', '),
              });
            }}
          >
            {label.actionEdit}
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => {
              setTableData((current) => current.filter((item) => item.id !== record.id));
              messageApi.success(label.deleteDone);
            }}
          >
            {label.actionDelete}
          </Button>
        </Space>
      ),
    },
  ];

  const partColumns: ColumnsType<PackagePartItem> = [
    { title: locale === 'en-US' ? 'Component' : '零部件', dataIndex: 'part', key: 'part' },
    { title: locale === 'en-US' ? 'Version' : '版本号', dataIndex: 'version', key: 'version', width: 140 },
  ];

  const resetUploadModal = () => {
    setUploadOpen(false);
    setSelectedFile(null);
    setSelectedType(null);
    setPartList([]);
    form.resetFields();
  };

  const filteredData = useMemo(() => {
    const normalized = keyword.trim().toLowerCase();
    if (!normalized) {
      return tableData;
    }
    return tableData.filter((item) => {
      const partsText = item.targetParts.map((part) => `${part.part} ${part.version}`).join(' ');
      const text = `${item.name} ${typeText(item.type)} ${partsText} ${item.description} ${item.md5} ${item.uploader} ${item.uploadedAt}`.toLowerCase();
      return text.includes(normalized);
    });
  }, [keyword, tableData, typeText]);

  const selectedRows = useMemo(() => {
    const keySet = new Set(selectedRowKeys.map(String));
    return filteredData.filter((item) => keySet.has(item.id));
  }, [selectedRowKeys, filteredData]);

  const downloadSelected = () => {
    if (selectedRows.length === 0) {
      messageApi.warning(label.batchDownloadRequired);
      return;
    }
    selectedRows.forEach((item) => downloadPackage(item));
    messageApi.success(label.batchDownloadDone.replace('{count}', String(selectedRows.length)));
  };

  const parseTargetPartsRaw = (raw: string): PackagePartItem[] =>
    raw
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => {
        const [part, version] = item.split('@').map((value) => value.trim());
        return {
          part: part || 'unknown-part',
          version: version || 'v1.0.0',
        };
      });

  const submitEdit = () => {
    if (!editingRecord) {
      return;
    }
    editForm
      .validateFields()
      .then((values) => {
        setTableData((current) =>
          current.map((item) =>
            item.id === editingRecord.id
              ? {
                  ...item,
                  name: editingFile ? editingFile.name : values.name,
                  type: values.type,
                  description: values.description,
                  targetParts: parseTargetPartsRaw(values.targetPartsRaw),
                  size: editingFile ? formatSize(editingFile.size) : item.size,
                  md5: editingFile ? buildPseudoMd5(editingFile) : item.md5,
                  uploader: editingFile ? getCurrentUser()?.username ?? item.uploader : item.uploader,
                  uploadedAt: editingFile ? nowText() : item.uploadedAt,
                }
              : item,
          ),
        );
        setEditingRecord(null);
        setEditingFile(null);
        editForm.resetFields();
        messageApi.success(label.editDone);
      })
      .catch(() => {});
  };

  const submitUpload = async () => {
    if (!selectedFile) {
      messageApi.warning(label.fileRequired);
      return;
    }
    if (!selectedType) {
      messageApi.warning(label.typeRequired);
      return;
    }
    setUploading(true);
    try {
      const description = form.getFieldValue('description') ?? '';
      const uploader = getCurrentUser()?.username ?? 'admin';
      const next: PackageManageRecord = {
        id: `PKG-${Date.now()}`,
        name: selectedFile.name,
        type: selectedType,
        targetParts: partList,
        description,
        size: formatSize(selectedFile.size),
        md5: buildPseudoMd5(selectedFile),
        uploader,
        uploadedAt: nowText(),
      };
      setTableData((current) => [next, ...current]);
      messageApi.success(label.uploadDone);
      resetUploadModal();
    } finally {
      setUploading(false);
    }
  };

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      {contextHolder}
      <Card>
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Typography.Title level={4} style={{ margin: 0 }}>
            {t('menu.packageManage')}
          </Typography.Title>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder={label.searchPlaceholder}
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button icon={<DownloadOutlined />} onClick={downloadSelected}>
              {label.batchDownload}
            </Button>
            <Button type="primary" icon={<UploadOutlined />} onClick={() => setUploadOpen(true)}>
              {label.upload}
            </Button>
          </Space>
        </Space>
      </Card>

      <Card>
        <Table
          rowKey="id"
          rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
          columns={columns}
          dataSource={filteredData}
          pagination={{ pageSize: 8, showSizeChanger: false }}
          scroll={{ x: 1850 }}
        />
      </Card>

      <Modal title={label.uploadTitle} open={uploadOpen} onCancel={resetUploadModal} footer={null} width={860}>
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <div>
            <Typography.Text strong>{label.fileArea}</Typography.Text>
            <Dragger {...uploadProps} style={{ marginTop: 8 }}>
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">{label.fileHint}</p>
            </Dragger>
          </div>

          <div>
            <Typography.Text strong>{label.typeField}</Typography.Text>
            <Select
              style={{ width: '100%', marginTop: 8 }}
              value={selectedType ?? undefined}
              options={[
                { label: label.typeCloud, value: 'cloud' },
                { label: label.typeRobot, value: 'robot' },
              ]}
              onChange={(value: PackageType) => {
                setSelectedType(value);
                void runExtract(selectedFile, value);
              }}
            />
          </div>

          <div>
            <Typography.Text strong>{label.extractField}</Typography.Text>
            <Table
              style={{ marginTop: 8 }}
              rowKey={(item) => `${item.part}-${item.version}`}
              loading={extracting}
              columns={partColumns}
              dataSource={partList}
              locale={{ emptyText: label.extractEmpty }}
              pagination={false}
              size="small"
            />
          </div>

          <Form form={form} layout="vertical">
            <Form.Item label={label.descriptionField} name="description">
              <Input.TextArea rows={3} placeholder={label.descriptionPlaceholder} />
            </Form.Item>
          </Form>

          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button onClick={resetUploadModal}>{locale === 'en-US' ? 'Cancel' : '取消'}</Button>
            <Button type="primary" loading={uploading} onClick={() => void submitUpload()}>
              {label.submitUpload}
            </Button>
          </Space>
        </Space>
      </Modal>

      <Modal
        title={label.editTitle}
        open={Boolean(editingRecord)}
        onCancel={() => {
          setEditingRecord(null);
          setEditingFile(null);
          editForm.resetFields();
        }}
        onOk={submitEdit}
        okText={locale === 'en-US' ? 'Save' : '保存'}
        cancelText={locale === 'en-US' ? 'Cancel' : '取消'}
      >
        <Form form={editForm} layout="vertical">
          <Form.Item label={label.tableName} name="name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label={label.tableType} name="type" rules={[{ required: true }]}>
            <Select
              options={[
                { label: label.typeCloud, value: 'cloud' },
                { label: label.typeRobot, value: 'robot' },
              ]}
              onChange={(value: PackageType) => {
                if (!editingFile) {
                  return;
                }
                setEditExtracting(true);
                void extractPackageParts(editingFile, value)
                  .then((items) => {
                    editForm.setFieldValue(
                      'targetPartsRaw',
                      items.map((item) => `${item.part}@${item.version}`).join(', '),
                    );
                  })
                  .finally(() => setEditExtracting(false));
              }}
            />
          </Form.Item>
          <Form.Item label={label.tableParts} name="targetPartsRaw" rules={[{ required: true }]} extra={label.partsReadonlyHint}>
            <Input.TextArea rows={2} readOnly />
          </Form.Item>
          <Form.Item label={label.tableDescription} name="description">
            <Input.TextArea rows={3} placeholder={label.descriptionPlaceholder} />
          </Form.Item>
          <Form.Item label={label.reuploadField}>
            <Dragger {...editUploadProps}>
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">{label.reuploadHint}</p>
            </Dragger>
          </Form.Item>
          {editExtracting ? (
            <Typography.Text type="secondary">{locale === 'en-US' ? 'Extracting component info...' : '正在提取部件版本信息...'}</Typography.Text>
          ) : null}
        </Form>
      </Modal>
    </Space>
  );
}

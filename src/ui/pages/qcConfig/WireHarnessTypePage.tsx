import {
  DeleteOutlined,
  EditOutlined,
  ExclamationCircleFilled,
  PlusOutlined,
  SearchOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { Button, Card, Form, Input, Modal, Space, Table, Tag, Typography, Upload, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { MouseEvent } from 'react';
import { useEffect, useState } from 'react';
import { useI18n } from '../../../i18n/I18nProvider';
import { useWireHarnessType } from '../../../logic/qcConfig/useWireHarnessType';
import { loadQcWireHarnessAnnotations, saveQcWireHarnessAnnotations, type QcPoint } from '../../../shared/qcWireHarnessAnnotation';
import type { WireHarnessTypeConfig } from '../../../shared/types/qcConfig';

type FormValues = WireHarnessTypeConfig;

export function WireHarnessTypePage() {
  const [form] = Form.useForm<FormValues>();
  const { t } = useI18n();
  const { filteredList, keyword, setKeyword, createRecord, updateRecord, removeRecord } = useWireHarnessType();
  const [editingRecord, setEditingRecord] = useState<WireHarnessTypeConfig | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [annotationOpen, setAnnotationOpen] = useState(false);
  const [annotationImageUrl, setAnnotationImageUrl] = useState<string | null>(null);
  const [annotationTargetId, setAnnotationTargetId] = useState<string>('__draft__');
  const [draftPoints, setDraftPoints] = useState<QcPoint[]>([]);
  const [pointsByHarnessId, setPointsByHarnessId] = useState<Record<string, QcPoint[]>>(() => loadQcWireHarnessAnnotations().pointsByHarnessId);
  const [imageByHarnessId, setImageByHarnessId] = useState<Record<string, string>>(() => loadQcWireHarnessAnnotations().imageByHarnessId);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [previewPoints, setPreviewPoints] = useState<QcPoint[]>([]);
  const [previewTitle, setPreviewTitle] = useState('');
  const [messageApi, contextHolder] = message.useMessage();

  const openCreate = () => {
    form.resetFields();
    setDraftPoints([]);
    setCreateOpen(true);
  };

  const openEdit = (record: WireHarnessTypeConfig) => {
    form.setFieldsValue(record);
    setDraftPoints(pointsByHarnessId[record.id] ?? []);
    setEditingRecord(record);
  };

  const closeModal = () => {
    setCreateOpen(false);
    setEditingRecord(null);
    form.resetFields();
  };

  const submit = (values: FormValues) => {
    setPointsByHarnessId((prev) => {
      const next = { ...prev };
      const draftPointsValue = next.__draft__;
      if (draftPointsValue?.length) {
        next[values.id] = draftPointsValue;
        delete next.__draft__;
      }
      return next;
    });
    setImageByHarnessId((prev) => {
      const next = { ...prev };
      const draftImage = next.__draft__;
      if (draftImage) {
        next[values.id] = draftImage;
        delete next.__draft__;
      }
      return next;
    });

    if (createOpen) {
      createRecord(values);
      messageApi.success(t('qcConfig.common.created'));
    } else if (editingRecord) {
      updateRecord(values);
      messageApi.success(t('qcConfig.common.updated'));
    }
    closeModal();
  };

  const columns: ColumnsType<WireHarnessTypeConfig> = [
    { title: t('qcConfig.wireHarness.table.id'), dataIndex: 'id', key: 'id', width: 140 },
    { title: t('qcConfig.wireHarness.table.name'), dataIndex: 'name', key: 'name', width: 180 },
    { title: t('qcConfig.wireHarness.table.taskType'), dataIndex: 'taskType', key: 'taskType', width: 180 },
    {
      title: t('qcConfig.wireHarness.table.planarFile'),
      dataIndex: 'planarStructureFile',
      key: 'planarStructureFile',
      width: 220,
      render: (fileName: string, record) => (
        <Space direction="vertical" size={2}>
          <Button
            type="link"
            style={{ padding: 0, height: 'auto' }}
            onClick={() => {
              const previewImage = imageByHarnessId[record.id];
              if (!previewImage) {
                messageApi.warning(t('qcConfig.wireHarness.annotation.previewNoImage'));
                return;
              }
              setPreviewTitle(t('qcConfig.wireHarness.annotation.previewTitle', { name: record.name }));
              setPreviewImageUrl(previewImage);
              setPreviewPoints(pointsByHarnessId[record.id] ?? []);
              setPreviewOpen(true);
            }}
          >
            {fileName}
          </Button>
          <Typography.Text type="secondary">
            {t('qcConfig.wireHarness.annotation.pointCount', { count: pointsByHarnessId[record.id]?.length ?? 0 })}
          </Typography.Text>
        </Space>
      ),
    },
    { title: t('qcConfig.wireHarness.table.threeDFile'), dataIndex: 'threeDStructureFile', key: 'threeDStructureFile', width: 220 },
    {
      title: t('qcConfig.wireHarness.table.logic'),
      key: 'logic',
      width: 280,
      render: () => (
        <Space size={[4, 4]} wrap>
          <Tag color="processing">{t('qcConfig.wireHarness.logic.order')}</Tag>
          <Tag color="processing">{t('qcConfig.wireHarness.logic.node')}</Tag>
          <Tag color="success">{t('qcConfig.wireHarness.logic.db')}</Tag>
          <Tag color="purple">{t('qcConfig.wireHarness.logic.robot')}</Tag>
        </Space>
      ),
    },
    {
      title: t('qcConfig.wireHarness.table.action'),
      key: 'actions',
      width: 170,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => openEdit(record)}>
            {t('qcConfig.common.edit')}
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() =>
              Modal.confirm({
                title: t('qcConfig.common.deleteConfirmTitle'),
                icon: <ExclamationCircleFilled />,
                content: record.id,
                okText: t('qcConfig.common.delete'),
                okButtonProps: { danger: true },
                cancelText: t('qcConfig.common.cancel'),
                onOk: () => removeRecord(record.id),
              })
            }
          >
            {t('qcConfig.common.delete')}
          </Button>
        </Space>
      ),
    },
  ];

  const closeAnnotationModal = () => {
    setAnnotationImageUrl(null);
    setAnnotationOpen(false);
  };

  const saveAnnotation = () => {
    setPointsByHarnessId((prev) => ({
      ...prev,
      [annotationTargetId]: draftPoints,
    }));
    if (annotationImageUrl) {
      setImageByHarnessId((prev) => ({
        ...prev,
        [annotationTargetId]: annotationImageUrl,
      }));
    }
    messageApi.success(t('qcConfig.wireHarness.annotation.saved', { count: draftPoints.length }));
    closeAnnotationModal();
  };

  const handleImageClick = (event: MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;

    setDraftPoints((prev) => [
      ...prev,
      {
        x: Math.max(0, Math.min(100, x)),
        y: Math.max(0, Math.min(100, y)),
        description: '',
      },
    ]);
  };

  const updatePointDescription = (index: number, description: string) => {
    setDraftPoints((prev) => prev.map((point, pointIndex) => (pointIndex === index ? { ...point, description } : point)));
  };

  const loadImageAsDataUrl = (file: File, onReady: (dataUrl: string) => void) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        messageApi.error(t('qcConfig.wireHarness.annotation.readFailed'));
        return;
      }
      onReady(result);
    };
    reader.onerror = () => {
      messageApi.error(t('qcConfig.wireHarness.annotation.readFailed'));
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    saveQcWireHarnessAnnotations({
      pointsByHarnessId,
      imageByHarnessId,
    });
  }, [pointsByHarnessId, imageByHarnessId]);

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      {contextHolder}
      <Card>
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Typography.Title level={4} style={{ margin: 0 }}>
            {t('qcConfig.wireHarness.pageTitle')}
          </Typography.Title>
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder={t('qcConfig.wireHarness.searchPlaceholder')}
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
          />
        </Space>
      </Card>

      <Card>
        <Table rowKey="id" columns={columns} dataSource={filteredList} pagination={{ pageSize: 8, showSizeChanger: false }} scroll={{ x: 1400 }} />
        <Space style={{ marginTop: 16 }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            {t('qcConfig.wireHarness.createButton')}
          </Button>
          <Button onClick={() => messageApi.success(t('qcConfig.common.imported'))}>{t('qcConfig.common.import')}</Button>
          <Button onClick={() => messageApi.success(t('qcConfig.common.exported'))}>{t('qcConfig.common.export')}</Button>
        </Space>
      </Card>

      <Modal
        title={createOpen ? t('qcConfig.wireHarness.createTitle') : t('qcConfig.wireHarness.editTitle')}
        open={createOpen || Boolean(editingRecord)}
        onCancel={closeModal}
        onOk={() => form.submit()}
        okText={t('qcConfig.common.save')}
        cancelText={t('qcConfig.common.cancel')}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={submit}>
          <Form.Item label={t('qcConfig.wireHarness.form.id')} name="id" rules={[{ required: true, message: t('qcConfig.wireHarness.form.idRequired') }]}>
            <Input disabled={Boolean(editingRecord)} />
          </Form.Item>
          <Form.Item label={t('qcConfig.wireHarness.form.name')} name="name" rules={[{ required: true, message: t('qcConfig.wireHarness.form.nameRequired') }]}>
            <Input />
          </Form.Item>
          <Form.Item
            label={t('qcConfig.wireHarness.form.taskType')}
            name="taskType"
            rules={[{ required: true, message: t('qcConfig.wireHarness.form.taskTypeRequired') }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label={t('qcConfig.wireHarness.form.planarFile')}
            name="planarStructureFile"
            rules={[{ required: true, message: t('qcConfig.wireHarness.form.planarFileRequired') }]}
          >
            <Input />
          </Form.Item>
          <Upload
            maxCount={1}
            showUploadList={false}
            beforeUpload={(file) => {
              if (!file.type.startsWith('image/')) {
                messageApi.error(t('qcConfig.wireHarness.annotation.imageOnly'));
                return false;
              }

              const targetId = (form.getFieldValue('id') as string | undefined) || editingRecord?.id || '__draft__';
              form.setFieldValue('planarStructureFile', file.name);
              loadImageAsDataUrl(file as File, (dataUrl) => {
                setAnnotationTargetId(targetId);
                setDraftPoints(pointsByHarnessId[targetId] ?? []);
                setAnnotationImageUrl(dataUrl);
                setAnnotationOpen(true);
              });
              return false;
            }}
          >
            <Button icon={<UploadOutlined />}>{t('qcConfig.wireHarness.form.importPlanar')}</Button>
          </Upload>
          <Typography.Text type="secondary">
            {t('qcConfig.wireHarness.annotation.pointCount', { count: draftPoints.length })}
          </Typography.Text>
          <Form.Item
            label={t('qcConfig.wireHarness.form.threeDFile')}
            name="threeDStructureFile"
            rules={[{ required: true, message: t('qcConfig.wireHarness.form.threeDFileRequired') }]}
            style={{ marginTop: 12 }}
          >
            <Input />
          </Form.Item>
          <Upload
            maxCount={1}
            showUploadList={false}
            beforeUpload={(file) => {
              form.setFieldValue('threeDStructureFile', file.name);
              return false;
            }}
          >
            <Button icon={<UploadOutlined />}>{t('qcConfig.wireHarness.form.importThreeD')}</Button>
          </Upload>
        </Form>
      </Modal>

      <Modal
        title={t('qcConfig.wireHarness.annotation.title')}
        open={annotationOpen}
        onCancel={closeAnnotationModal}
        onOk={saveAnnotation}
        okText={t('qcConfig.common.save')}
        cancelText={t('qcConfig.common.cancel')}
        width={880}
      >
        <Space direction="vertical" style={{ width: '100%' }} size={12}>
          <Typography.Text type="secondary">{t('qcConfig.wireHarness.annotation.hint')}</Typography.Text>
          <Space>
            <Button onClick={() => setDraftPoints((prev) => prev.slice(0, -1))}>{t('qcConfig.wireHarness.annotation.undo')}</Button>
            <Button onClick={() => setDraftPoints([])}>{t('qcConfig.wireHarness.annotation.clear')}</Button>
            <Typography.Text>{t('qcConfig.wireHarness.annotation.pointCount', { count: draftPoints.length })}</Typography.Text>
          </Space>
          {draftPoints.length ? (
            <Space direction="vertical" size={8} style={{ width: '100%', maxHeight: 180, overflowY: 'auto', paddingRight: 6 }}>
              {draftPoints.map((point, index) => (
                <Input
                  key={`point-desc-${point.x}-${point.y}-${index}`}
                  value={point.description}
                  onChange={(event) => updatePointDescription(index, event.target.value)}
                  placeholder={t('qcConfig.wireHarness.annotation.descriptionPlaceholder', { index: index + 1 })}
                  addonBefore={`#${index + 1}`}
                />
              ))}
            </Space>
          ) : null}
          {annotationImageUrl ? (
            <div
              style={{
                width: '100%',
                maxHeight: 520,
                overflow: 'auto',
                border: '1px solid #d9d9d9',
                borderRadius: 8,
              }}
            >
              <div
                onClick={handleImageClick}
                style={{
                  position: 'relative',
                  width: '100%',
                  cursor: 'crosshair',
                }}
              >
                <img src={annotationImageUrl} alt="2d-wire-harness" style={{ width: '100%', display: 'block' }} />
                {draftPoints.map((point, index) => (
                  <div
                    key={`${point.x}-${point.y}-${index}`}
                    title={point.description || t('qcConfig.wireHarness.annotation.noDescription')}
                    style={{
                      position: 'absolute',
                      left: `${point.x}%`,
                      top: `${point.y}%`,
                      transform: 'translate(-50%, -50%)',
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      border: '2px solid #ffffff',
                      background: '#ff4d4f',
                      color: '#ffffff',
                      fontSize: 12,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 600,
                      boxShadow: '0 1px 6px rgba(0, 0, 0, 0.35)',
                    }}
                  >
                    {index + 1}
                  </div>
                ))}
                {draftPoints.map((point, index) =>
                  point.description ? (
                    <div
                      key={`draft-label-${point.x}-${point.y}-${index}`}
                      style={{
                        position: 'absolute',
                        left: `${point.x}%`,
                        top: `${point.y}%`,
                        transform: 'translate(14px, -50%)',
                        background: 'rgba(0, 0, 0, 0.7)',
                        color: '#fff',
                        borderRadius: 4,
                        padding: '2px 6px',
                        fontSize: 12,
                        maxWidth: 180,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {point.description}
                    </div>
                  ) : null,
                )}
              </div>
            </div>
          ) : null}
        </Space>
      </Modal>

      <Modal title={previewTitle} open={previewOpen} onCancel={() => setPreviewOpen(false)} footer={null} width={880}>
        {previewImageUrl ? (
          <div
            style={{
              width: '100%',
              maxHeight: 520,
              overflow: 'auto',
              border: '1px solid #d9d9d9',
              borderRadius: 8,
            }}
          >
            <div style={{ position: 'relative', width: '100%' }}>
              <img src={previewImageUrl} alt="qc-point-preview" style={{ width: '100%', display: 'block' }} />
              {previewPoints.map((point, index) => (
                <div
                  key={`preview-${point.x}-${point.y}-${index}`}
                  title={point.description || t('qcConfig.wireHarness.annotation.noDescription')}
                  style={{
                    position: 'absolute',
                    left: `${point.x}%`,
                    top: `${point.y}%`,
                    transform: 'translate(-50%, -50%)',
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    border: '2px solid #ffffff',
                    background: '#1677ff',
                    color: '#ffffff',
                    fontSize: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 600,
                    boxShadow: '0 1px 6px rgba(0, 0, 0, 0.35)',
                  }}
                >
                  {index + 1}
                </div>
              ))}
              {previewPoints.map((point, index) =>
                point.description ? (
                  <div
                    key={`preview-label-${point.x}-${point.y}-${index}`}
                    style={{
                      position: 'absolute',
                      left: `${point.x}%`,
                      top: `${point.y}%`,
                      transform: 'translate(14px, -50%)',
                      background: 'rgba(0, 0, 0, 0.7)',
                      color: '#fff',
                      borderRadius: 4,
                      padding: '2px 6px',
                      fontSize: 12,
                      maxWidth: 180,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {point.description}
                  </div>
                ) : null,
              )}
            </div>
          </div>
        ) : null}
        <Space direction="vertical" size={6} style={{ marginTop: 12, width: '100%' }}>
          <Typography.Text strong>{t('qcConfig.wireHarness.annotation.descriptionListTitle')}</Typography.Text>
          {previewPoints.length ? (
            previewPoints.map((point, index) => (
              <Typography.Text key={`preview-desc-${point.x}-${point.y}-${index}`}>
                #{index + 1} {point.description || t('qcConfig.wireHarness.annotation.noDescription')}
              </Typography.Text>
            ))
          ) : (
            <Typography.Text type="secondary">{t('qcConfig.wireHarness.annotation.noPoints')}</Typography.Text>
          )}
        </Space>
      </Modal>
    </Space>
  );
}

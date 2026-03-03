import { ArrowDownOutlined, ArrowUpOutlined, DeleteOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons';
import { Button, Card, Col, Grid, Modal, Row, Select, Space, Table, Tag, Typography, Upload, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { UploadProps } from 'antd/es/upload';
import { useMemo, useState } from 'react';
import { useI18n } from '../../../i18n/I18nProvider';
import { useTheme } from '../../../logic/theme/useTheme';
import type { ThemeMode } from '../../../logic/theme/themeStore';

interface LicenseRecord {
  deviceId: string;
  effectiveDate: string;
  expireDate: string;
  robotCount: number;
}

interface LanguageConfigRecord {
  id: string;
  code: string;
  name: string;
  localeCode: string;
  enabled: boolean;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

const INITIAL_LANGUAGE_CONFIGS: LanguageConfigRecord[] = [
  {
    id: 'lang-zh-cn',
    code: 'LANG-001',
    name: '中文',
    localeCode: 'zh-CN',
    enabled: true,
    createdAt: '2026-02-12 09:10:00',
    createdBy: 'admin',
    updatedAt: '2026-03-01 18:20:00',
    updatedBy: 'admin',
  },
  {
    id: 'lang-en-us',
    code: 'LANG-002',
    name: 'English',
    localeCode: 'en-US',
    enabled: true,
    createdAt: '2026-02-12 09:15:00',
    createdBy: 'admin',
    updatedAt: '2026-03-01 18:22:00',
    updatedBy: 'admin',
  },
];

const THEME_OPTIONS = ['light', 'dark', 'system'] as const;

export function SettingPage() {
  const { t, locale, setLocale } = useI18n();
  const { themeMode, setThemeMode } = useTheme();
  const [messageApi, contextHolder] = message.useMessage();
  const screens = Grid.useBreakpoint();
  const isLaptop = !screens.xxl;
  const [licenseRecord, setLicenseRecord] = useState<LicenseRecord | null>(null);
  const [languages, setLanguages] = useState<LanguageConfigRecord[]>(INITIAL_LANGUAGE_CONFIGS);
  const [manageOpen, setManageOpen] = useState(false);

  const languageSelectOptions = useMemo(
    () =>
      languages
        .filter((item) => item.enabled)
        .map((item) => ({
          label: item.localeCode === 'zh-CN' ? t('app.locale.zhCN') : item.localeCode === 'en-US' ? t('app.locale.enUS') : `${item.name} (${item.localeCode})`,
          value: item.localeCode,
        })),
    [languages, t],
  );

  const importLicense: UploadProps['beforeUpload'] = () => {
    const now = new Date();
    const nextEffective = now.toISOString().slice(0, 10);
    const nextExpire = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate()).toISOString().slice(0, 10);
    setLicenseRecord({
      deviceId: 'RB-QC-DEV-20260303',
      effectiveDate: nextEffective,
      expireDate: nextExpire,
      robotCount: 12,
    });
    messageApi.success(t('setting.license.importSuccess'));
    return false;
  };

  const updateLicense = () => {
    if (!licenseRecord) {
      return;
    }
    const expireAt = new Date(licenseRecord.expireDate);
    expireAt.setFullYear(expireAt.getFullYear() + 1);
    setLicenseRecord({
      ...licenseRecord,
      expireDate: expireAt.toISOString().slice(0, 10),
    });
    messageApi.success(t('setting.license.updateSuccess'));
  };

  const removeLicense = () => {
    Modal.confirm({
      title: t('setting.license.deleteConfirmTitle'),
      okText: t('qcConfig.common.delete'),
      okButtonProps: { danger: true },
      cancelText: t('qcConfig.common.cancel'),
      onOk: () => {
        setLicenseRecord(null);
        messageApi.success(t('setting.license.deleteSuccess'));
      },
    });
  };

  const moveLanguage = (id: string, direction: 'up' | 'down') => {
    setLanguages((prev) => {
      const index = prev.findIndex((item) => item.id === id);
      if (index < 0) {
        return prev;
      }
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) {
        return prev;
      }
      const next = [...prev];
      const [current] = next.splice(index, 1);
      next.splice(targetIndex, 0, current);
      return next.map((item) => ({
        ...item,
        updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
        updatedBy: 'admin',
      }));
    });
  };

  const toggleLanguage = (id: string) => {
    setLanguages((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              enabled: !item.enabled,
              updatedAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
              updatedBy: 'admin',
            }
          : item,
      ),
    );
  };

  const importLanguageResource = (name: string) => {
    messageApi.success(t('setting.display.modal.importSuccess', { name }));
  };

  const exportLanguageResource = (item: LanguageConfigRecord) => {
    const header = ['code', 'name', 'localeCode', 'enabled', 'createdAt', 'createdBy', 'updatedAt', 'updatedBy'];
    const row = [item.code, item.name, item.localeCode, item.enabled ? 'enabled' : 'disabled', item.createdAt, item.createdBy, item.updatedAt, item.updatedBy];
    const csv = [header, row].map((cells) => cells.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${item.localeCode}-language-config.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    messageApi.success(t('setting.display.modal.exportSuccess', { name: item.name }));
  };

  const licenseColumns: ColumnsType<LicenseRecord> = [
    { title: t('setting.license.table.deviceId'), dataIndex: 'deviceId', key: 'deviceId' },
    { title: t('setting.license.table.effectiveDate'), dataIndex: 'effectiveDate', key: 'effectiveDate' },
    { title: t('setting.license.table.expireDate'), dataIndex: 'expireDate', key: 'expireDate' },
    { title: t('setting.license.table.robotCount'), dataIndex: 'robotCount', key: 'robotCount' },
    {
      title: t('setting.license.table.action'),
      key: 'action',
      width: 220,
      render: () => (
        <Space>
          <Button type="link" icon={<UploadOutlined />} onClick={updateLicense}>
            {t('setting.license.action.update')}
          </Button>
          <Button type="link" danger icon={<DeleteOutlined />} onClick={removeLicense}>
            {t('setting.license.action.delete')}
          </Button>
        </Space>
      ),
    },
  ];

  const languageColumns: ColumnsType<LanguageConfigRecord> = [
    { title: t('setting.display.modal.table.code'), dataIndex: 'code', key: 'code', width: 130 },
    { title: t('setting.display.modal.table.name'), dataIndex: 'name', key: 'name', width: 120 },
    { title: t('setting.display.modal.table.localeCode'), dataIndex: 'localeCode', key: 'localeCode', width: 120 },
    {
      title: t('setting.display.modal.table.enabled'),
      dataIndex: 'enabled',
      key: 'enabled',
      width: 120,
      render: (enabled: boolean) => <Tag color={enabled ? 'success' : 'default'}>{enabled ? t('qcConfig.common.enabled') : t('qcConfig.common.disabled')}</Tag>,
    },
    { title: t('setting.display.modal.table.createdAt'), dataIndex: 'createdAt', key: 'createdAt', width: 180 },
    { title: t('setting.display.modal.table.createdBy'), dataIndex: 'createdBy', key: 'createdBy', width: 140 },
    { title: t('setting.display.modal.table.updatedAt'), dataIndex: 'updatedAt', key: 'updatedAt', width: 180 },
    { title: t('setting.display.modal.table.updatedBy'), dataIndex: 'updatedBy', key: 'updatedBy', width: 140 },
    {
      title: t('setting.display.modal.table.action'),
      key: 'action',
      width: 320,
      fixed: 'right',
      render: (_, record, index) => (
        <Space wrap>
          <Button type="link" icon={<ArrowUpOutlined />} disabled={index === 0} onClick={() => moveLanguage(record.id, 'up')}>
            {t('setting.display.modal.action.moveUp')}
          </Button>
          <Button type="link" icon={<ArrowDownOutlined />} disabled={index === languages.length - 1} onClick={() => moveLanguage(record.id, 'down')}>
            {t('setting.display.modal.action.moveDown')}
          </Button>
          <Button type="link" onClick={() => toggleLanguage(record.id)}>
            {record.enabled ? t('qcConfig.common.disable') : t('qcConfig.common.enable')}
          </Button>
          <Button type="link" onClick={() => importLanguageResource(record.name)}>
            {t('qcConfig.common.import')}
          </Button>
          <Button type="link" onClick={() => exportLanguageResource(record)}>
            {t('qcConfig.common.export')}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      {contextHolder}
      <Card title={t('setting.license.title')}>
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Row justify="end">
            <Upload accept=".lic,.txt,.json" showUploadList={false} beforeUpload={importLicense}>
              <Button type="primary" icon={<PlusOutlined />}>
                {t('setting.license.import')}
              </Button>
            </Upload>
          </Row>
          <Table
            rowKey="deviceId"
            columns={licenseColumns}
            dataSource={licenseRecord ? [licenseRecord] : []}
            pagination={false}
            locale={{ emptyText: t('setting.license.empty') }}
          />
        </Space>
      </Card>

      <Card title={t('setting.display.title')}>
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} lg={8}>
            <Space>
              <Typography.Text>{t('setting.display.theme')}</Typography.Text>
              <Select
                value={themeMode}
                style={{ width: isLaptop ? 180 : 220 }}
                options={THEME_OPTIONS.map((item) => ({ value: item, label: t(`setting.display.theme.${item}`) }))}
                onChange={(value) => setThemeMode(value as ThemeMode)}
              />
            </Space>
          </Col>
          <Col xs={24} lg={8}>
            <Space>
              <Typography.Text>{t('setting.display.language')}</Typography.Text>
              <Select value={locale} style={{ width: isLaptop ? 180 : 220 }} options={languageSelectOptions} onChange={(value) => setLocale(value)} />
            </Space>
          </Col>
          <Col xs={24} lg={8}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setManageOpen(true)}>{t('setting.display.manage')}</Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Modal
        title={t('setting.display.modal.title')}
        open={manageOpen}
        width={isLaptop ? 'calc(100vw - 48px)' : 1300}
        onCancel={() => setManageOpen(false)}
        footer={[
          <Button key="close" onClick={() => setManageOpen(false)}>
            {t('qcConfig.common.cancel')}
          </Button>,
        ]}
      >
        <Table rowKey="id" columns={languageColumns} dataSource={languages} pagination={{ pageSize: 8, showSizeChanger: false }} scroll={{ x: 'max-content' }} />
      </Modal>
    </Space>
  );
}

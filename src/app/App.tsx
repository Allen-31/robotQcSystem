import { ConfigProvider } from 'antd';
import enUS from 'antd/locale/en_US';
import zhCN from 'antd/locale/zh_CN';
import { AppRouter } from '../infrastructure/router/AppRouter';
import { useI18n } from '../i18n/I18nProvider';

export default function App() {
  const { locale } = useI18n();

  return (
    <ConfigProvider locale={locale === 'zh-CN' ? zhCN : enUS}>
      <AppRouter />
    </ConfigProvider>
  );
}

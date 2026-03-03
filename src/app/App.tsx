import { ConfigProvider } from 'antd';
import { theme as antdTheme } from 'antd';
import enUS from 'antd/locale/en_US';
import zhCN from 'antd/locale/zh_CN';
import { AppRouter } from '../infrastructure/router/AppRouter';
import { useI18n } from '../i18n/I18nProvider';
import { useTheme } from '../logic/theme/useTheme';

export default function App() {
  const { locale } = useI18n();
  const { actualTheme } = useTheme();

  return (
    <ConfigProvider
      locale={locale === 'zh-CN' ? zhCN : enUS}
      theme={{ algorithm: actualTheme === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm }}
    >
      <AppRouter />
    </ConfigProvider>
  );
}

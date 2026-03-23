import { App as AntdApp, ConfigProvider } from 'antd';
import { theme as antdTheme } from 'antd';
import enUS from 'antd/locale/en_US';
import zhCN from 'antd/locale/zh_CN';
import { useEffect } from 'react';
import { AppRouter } from '../infrastructure/router/AppRouter';
import { useI18n } from '../i18n/I18nProvider';
import { useTheme } from '../logic/theme/useTheme';
import { useAppStore } from '../store/appStore';

export default function App() {
  const { locale } = useI18n();
  const { actualTheme } = useTheme();
  const isLaptop = useAppStore((state) => state.isLaptop);
  const setIsLaptop = useAppStore((state) => state.setIsLaptop);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 1440px)');
    const onChange = (event: MediaQueryListEvent) => setIsLaptop(event.matches);
    setIsLaptop(media.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [setIsLaptop]);

  useEffect(() => {
    document.body.classList.toggle('app-laptop', isLaptop);
    return () => document.body.classList.remove('app-laptop');
  }, [isLaptop]);

  return (
    <ConfigProvider
      locale={locale === 'zh-CN' ? zhCN : enUS}
      componentSize={isLaptop ? 'small' : 'middle'}
      theme={{ algorithm: actualTheme === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm }}
    >
      <AntdApp>
        <AppRouter />
      </AntdApp>
    </ConfigProvider>
  );
}


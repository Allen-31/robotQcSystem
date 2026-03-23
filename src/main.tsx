import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'antd/dist/reset.css';
import './app/theme.css';
import App from './app/App';
import { AppProvider } from './app/provider';
import { I18nProvider } from './i18n/I18nProvider';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProvider>
      <I18nProvider>
        <App />
      </I18nProvider>
    </AppProvider>
  </StrictMode>,
);

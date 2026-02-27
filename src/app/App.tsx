import { ConfigProvider } from 'antd';
import { AppRouter } from '../infrastructure/router/AppRouter';

export default function App() {
  return (
    <ConfigProvider>
      <AppRouter />
    </ConfigProvider>
  );
}

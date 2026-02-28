import { Button, Result } from 'antd';
import { Link } from 'react-router-dom';
import { menuList } from '../../data/menuList';
import { useI18n } from '../../i18n/I18nProvider';
import { findFirstLeafPath } from '../../logic/menu/menuRoute';

export function NotFoundPage() {
  const { t } = useI18n();

  return (
    <Result
      status="404"
      title="404"
      subTitle={t('notFound.subtitle')}
      extra={
        <Button type="primary">
          <Link to={findFirstLeafPath(menuList)}>{t('notFound.backHome')}</Link>
        </Button>
      }
    />
  );
}

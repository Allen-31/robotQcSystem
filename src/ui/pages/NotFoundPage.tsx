import { Button, Result } from 'antd';
import { Link } from 'react-router-dom';
import { menuList } from '../../data/menuList';
import { findFirstLeafPath } from '../../logic/menu/menuRoute';

export function NotFoundPage() {
  return (
    <Result
      status="404"
      title="404"
      subTitle="页面不存在"
      extra={
        <Button type="primary">
          <Link to={findFirstLeafPath(menuList)}>返回首页</Link>
        </Button>
      }
    />
  );
}

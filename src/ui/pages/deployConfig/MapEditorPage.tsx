import { ArrowLeftOutlined } from '@ant-design/icons';
import { Button, Space, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

import mapEditImg from '../../../assets/map_edit.png';

export function MapEditorPage() {
  const navigate = useNavigate();

  return (
    <div style={{ height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: 10 }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/deployConfig/scene/mapManage')}>
            返回列表
          </Button>
          <Typography.Text type="secondary">地图编辑（已临时屏蔽）</Typography.Text>
        </Space>
      </div>

      <div style={{ flex: 1, minHeight: 0, border: '1px solid #d9d9d9', background: '#f3f4f6', overflow: 'auto' }}>
        <div style={{ padding: 12 }}>
          <img
            src={mapEditImg}
            alt="地图编辑占位图"
            style={{
              width: '100%',
              height: 'auto',
              display: 'block',
              borderRadius: 8,
              boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
            }}
          />
        </div>
      </div>
    </div>
  );
}

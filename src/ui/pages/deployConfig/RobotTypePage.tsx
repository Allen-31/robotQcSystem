import { DeleteOutlined, EditOutlined, ExclamationCircleFilled, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Card, Col, Input, Modal, Row, Space, Table, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStoredRobotTypes, setStoredRobotTypes, type RobotTypeRecord } from '../../../logic/deployConfig/robotTypeStore';

export function RobotTypePage() {
  const navigate = useNavigate();
  const [list, setList] = useState<RobotTypeRecord[]>(getStoredRobotTypes);
  const [keyword, setKeyword] = useState('');

  const filteredList = useMemo(() => {
    return list.filter((item) => {
      const key = keyword.trim().toLowerCase();
      if (!key) {
        return true;
      }
      return item.typeNo.toLowerCase().includes(key) || item.typeName.toLowerCase().includes(key);
    });
  }, [keyword, list]);

  const removeRecord = (record: RobotTypeRecord) => {
    Modal.confirm({
      title: '确认删除该机器人类型吗？',
      icon: <ExclamationCircleFilled />,
      content: `${record.typeNo} - ${record.typeName}`,
      okText: '删除',
      okButtonProps: { danger: true },
      cancelText: '取消',
      onOk: () => {
        const next = list.filter((item) => item.id !== record.id);
        setList(next);
        setStoredRobotTypes(next);
      },
    });
  };

  const columns: ColumnsType<RobotTypeRecord> = [
    { title: '类型编号', dataIndex: 'typeNo', key: 'typeNo', width: 140 },
    { title: '类型名称', dataIndex: 'typeName', key: 'typeName', width: 240 },
    { title: '二维图', dataIndex: 'image2d', key: 'image2d', width: 200 },
    { title: '零部件数量', dataIndex: 'partsCount', key: 'partsCount', width: 140 },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 180 },
    {
      title: '操作',
      key: 'actions',
      width: 170,
      fixed: 'right',
      render: (_, record) => (
        <Space size={4}>
          <Button type="link" icon={<EditOutlined />} onClick={() => navigate(`/deployConfig/robot/robotType/${record.id}/edit`)}>
            编辑
          </Button>
          <Button type="link" danger icon={<DeleteOutlined />} onClick={() => removeRecord(record)}>
            删除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Card>
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Typography.Title level={4} style={{ margin: 0 }}>
            机器人类型管理
          </Typography.Title>
          <Row gutter={[12, 12]} align="middle">
            <Col xs={24} md={10}>
              <Input
                allowClear
                prefix={<SearchOutlined />}
                placeholder="类型编号/类型名称"
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
              />
            </Col>
            <Col xs={24} md={14}>
              <Space wrap style={{ width: '100%', justifyContent: 'flex-end' }}>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/deployConfig/robot/robotType/new')}>
                  新增
                </Button>
              </Space>
            </Col>
          </Row>
        </Space>
      </Card>

      <Card>
        <Table rowKey="id" columns={columns} dataSource={filteredList} pagination={{ pageSize: 8, showSizeChanger: false }} scroll={{ x: 1200 }} />
      </Card>
    </Space>
  );
}

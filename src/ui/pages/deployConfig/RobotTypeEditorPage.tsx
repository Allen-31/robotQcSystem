import { ArrowLeftOutlined, UploadOutlined } from '@ant-design/icons';
import { Button, Card, Col, Form, Input, Modal, Row, Select, Space, Table, Typography, Upload, message } from 'antd';
import type { MouseEvent as ReactMouseEvent } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ROBOT_PART_STORAGE_KEY,
  ROBOT_PARTS_CHANGED_EVENT,
  getRobotTypeSelectableParts,
  type RobotTypeSelectablePart,
} from '../../../logic/deployConfig/robotPartStore';
import {
  DEFAULT_ROBOT_TYPE_IMAGE_NAME,
  DEFAULT_ROBOT_TYPE_IMAGE_URL,
  getStoredRobotTypes,
  setStoredRobotTypes,
  type AnnotationPoint,
  type RobotTypeRecord,
} from '../../../logic/deployConfig/robotTypeStore';

type TypeFormValues = {
  typeNo: string;
  typeName: string;
  image2d: string;
};

type ImageSize = {
  width: number;
  height: number;
};

function getContainRect(containerWidth: number, containerHeight: number, imageWidth: number, imageHeight: number) {
  if (containerWidth <= 0 || containerHeight <= 0 || imageWidth <= 0 || imageHeight <= 0) {
    return { x: 0, y: 0, width: containerWidth, height: containerHeight };
  }
  const containerRatio = containerWidth / containerHeight;
  const imageRatio = imageWidth / imageHeight;
  if (imageRatio > containerRatio) {
    const width = containerWidth;
    const height = width / imageRatio;
    return { x: 0, y: (containerHeight - height) / 2, width, height };
  }
  const height = containerHeight;
  const width = height * imageRatio;
  return { x: (containerWidth - width) / 2, y: 0, width, height };
}

export function RobotTypeEditorPage() {
  const navigate = useNavigate();
  const { typeId } = useParams<{ typeId: string }>();
  const isCreate = !typeId || typeId === 'new';

  const [form] = Form.useForm<TypeFormValues>();
  const [annotationForm] = Form.useForm<AnnotationPoint>();
  const [messageApi, contextHolder] = message.useMessage();

  const [partsPool, setPartsPool] = useState<RobotTypeSelectablePart[]>(getRobotTypeSelectableParts);
  const [activePart, setActivePart] = useState<RobotTypeSelectablePart | null>(null);
  const [draftPoints, setDraftPoints] = useState<AnnotationPoint[]>([]);

  const [annotationModalOpen, setAnnotationModalOpen] = useState(false);
  const [pendingPointId, setPendingPointId] = useState<string | null>(null);
  const [image2dPreview, setImage2dPreview] = useState('');
  const [imageSize, setImageSize] = useState<ImageSize | null>(null);

  const [canvasScale, setCanvasScale] = useState(1);
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [draggingPointId, setDraggingPointId] = useState<string | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 1200, height: 560 });

  const canvasRef = useRef<HTMLDivElement | null>(null);
  const panStartRef = useRef<{ x: number; y: number } | null>(null);
  const pointPressStartRef = useRef<{ x: number; y: number } | null>(null);
  const pointLongPressTimerRef = useRef<number | null>(null);
  const pointPressedIdRef = useRef<string | null>(null);
  const pointLongPressTriggeredRef = useRef(false);
  const suppressPointClickRef = useRef(false);

  const editingRecord = useMemo(() => {
    if (isCreate) {
      return null;
    }
    return getStoredRobotTypes().find((item) => item.id === typeId) ?? null;
  }, [isCreate, typeId]);

  const readFileAsDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ''));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });

  const readImageSize = (src: string) =>
    new Promise<ImageSize>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
      image.onerror = () => reject(new Error('image load failed'));
      image.src = src;
    });

  useEffect(() => {
    if (!isCreate && !editingRecord) {
      messageApi.error('未找到对应机器人类型');
      navigate('/deployConfig/robot/robotType');
      return;
    }
    if (isCreate) {
      const list = getStoredRobotTypes();
      form.setFieldsValue({
        typeNo: `RT-${String(list.length + 1).padStart(3, '0')}`,
        image2d: DEFAULT_ROBOT_TYPE_IMAGE_NAME,
      });
      setDraftPoints([]);
      setImage2dPreview(DEFAULT_ROBOT_TYPE_IMAGE_URL);
      return;
    }

    form.setFieldsValue({
      typeNo: editingRecord?.typeNo,
      typeName: editingRecord?.typeName,
      image2d: editingRecord?.image2d,
    });
    setDraftPoints(editingRecord?.points ?? []);
    setImage2dPreview(editingRecord?.image2dData ?? DEFAULT_ROBOT_TYPE_IMAGE_URL);
  }, [editingRecord, form, isCreate, messageApi, navigate]);

  useEffect(() => {
    const refreshParts = () => setPartsPool(getRobotTypeSelectableParts());
    const onStorage = (event: StorageEvent) => {
      if (event.key?.includes(ROBOT_PART_STORAGE_KEY)) {
        refreshParts();
      }
    };

    window.addEventListener(ROBOT_PARTS_CHANGED_EVENT, refreshParts);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(ROBOT_PARTS_CHANGED_EVENT, refreshParts);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  useEffect(() => {
    if (!image2dPreview) {
      setImageSize(null);
      return;
    }
    let canceled = false;
    readImageSize(image2dPreview)
      .then((size) => {
        if (!canceled) {
          setImageSize(size);
        }
      })
      .catch(() => {
        if (!canceled) {
          setImageSize(null);
        }
      });
    return () => {
      canceled = true;
    };
  }, [image2dPreview]);

  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }
    const element = canvasRef.current;
    const updateSize = () => {
      setCanvasSize({ width: element.clientWidth || 1200, height: element.clientHeight || 560 });
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    return () => {
      if (pointLongPressTimerRef.current) {
        window.clearTimeout(pointLongPressTimerRef.current);
      }
    };
  }, []);

  const getPointPercentFromClient = useCallback((clientX: number, clientY: number, container: HTMLDivElement) => {
    const rect = container.getBoundingClientRect();
    const contentX = clientX - rect.left - container.clientLeft;
    const contentY = clientY - rect.top - container.clientTop;
    const centerX = container.clientWidth / 2;
    const centerY = container.clientHeight / 2;
    const baseX = centerX + (contentX - centerX - canvasOffset.x) / canvasScale;
    const baseY = centerY + (contentY - centerY - canvasOffset.y) / canvasScale;
    const containRect = getContainRect(
      container.clientWidth,
      container.clientHeight,
      imageSize?.width ?? container.clientWidth,
      imageSize?.height ?? container.clientHeight,
    );
    const imageX = baseX - containRect.x;
    const imageY = baseY - containRect.y;
    const x = Number(((imageX / containRect.width) * 100).toFixed(2));
    const y = Number(((imageY / containRect.height) * 100).toFixed(2));
    if (x < 0 || x > 100 || y < 0 || y > 100) {
      return null;
    }
    return { x, y };
  }, [canvasOffset.x, canvasOffset.y, canvasScale, imageSize?.height, imageSize?.width]);

  const addAnnotationFromCanvas = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (!image2dPreview) {
      messageApi.warning('请先上传二维图再标注');
      return;
    }
    if (!activePart) {
      messageApi.warning('请先选择零部件');
      return;
    }
    const next = getPointPercentFromClient(event.clientX, event.clientY, event.currentTarget);
    if (!next) {
      return;
    }
    const pointId = `point-${Date.now()}`;
    const point: AnnotationPoint = {
      id: pointId,
      partName: activePart.name,
      partPosition: activePart.position,
      x: next.x,
      y: next.y,
      rotation: 0,
      remark: '',
    };
    setDraftPoints((prev) => [...prev, point]);
    setPendingPointId(pointId);
    annotationForm.setFieldsValue(point);
    setAnnotationModalOpen(true);
  };

  const moveAnnotationPoint = useCallback((pointId: string, clientX: number, clientY: number) => {
    const container = canvasRef.current;
    if (!container) {
      return;
    }
    const next = getPointPercentFromClient(clientX, clientY, container);
    if (!next) {
      return;
    }
    setDraftPoints((prev) => prev.map((item) => (item.id === pointId ? { ...item, x: next.x, y: next.y } : item)));
  }, [getPointPercentFromClient]);

  const handlePointMouseDown = (event: ReactMouseEvent<HTMLDivElement>, pointId: string) => {
    event.stopPropagation();
    if (event.button !== 0) {
      return;
    }
    pointPressedIdRef.current = pointId;
    pointPressStartRef.current = { x: event.clientX, y: event.clientY };
    pointLongPressTriggeredRef.current = false;
    if (pointLongPressTimerRef.current) {
      window.clearTimeout(pointLongPressTimerRef.current);
    }
    pointLongPressTimerRef.current = window.setTimeout(() => {
      pointLongPressTriggeredRef.current = true;
      setDraggingPointId(pointId);
      moveAnnotationPoint(pointId, event.clientX, event.clientY);
    }, 300);
  };

  useEffect(() => {
    const handleWindowMouseMove = (event: globalThis.MouseEvent) => {
      const pressedId = pointPressedIdRef.current;
      if (!pressedId) {
        return;
      }
      if (!pointLongPressTriggeredRef.current && pointPressStartRef.current && pointLongPressTimerRef.current) {
        const dx = event.clientX - pointPressStartRef.current.x;
        const dy = event.clientY - pointPressStartRef.current.y;
        if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
          window.clearTimeout(pointLongPressTimerRef.current);
          pointLongPressTimerRef.current = null;
        }
        return;
      }
      if (pointLongPressTriggeredRef.current) {
        moveAnnotationPoint(pressedId, event.clientX, event.clientY);
      }
    };

    const handleWindowMouseUp = () => {
      if (pointLongPressTimerRef.current) {
        window.clearTimeout(pointLongPressTimerRef.current);
        pointLongPressTimerRef.current = null;
      }
      if (pointLongPressTriggeredRef.current) {
        suppressPointClickRef.current = true;
      }
      pointLongPressTriggeredRef.current = false;
      pointPressStartRef.current = null;
      pointPressedIdRef.current = null;
      setDraggingPointId(null);
      setIsPanning(false);
      panStartRef.current = null;
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, [moveAnnotationPoint]);

  const zoomTo = (nextScale: number) => {
    setCanvasScale((prevScale) => {
      const normalizedPrev = Math.max(0.5, Math.min(2, prevScale));
      const normalizedNext = Math.max(0.5, Math.min(2, Number(nextScale.toFixed(2))));
      if (normalizedPrev === normalizedNext) {
        return normalizedPrev;
      }
      const ratio = normalizedNext / normalizedPrev;
      setCanvasOffset((prevOffset) => ({
        x: Number((prevOffset.x * ratio).toFixed(2)),
        y: Number((prevOffset.y * ratio).toFixed(2)),
      }));
      return normalizedNext;
    });
  };

  const handleCanvasMouseDown = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (event.button !== 0) {
      return;
    }
    if (canvasScale > 1 && event.ctrlKey) {
      if (!image2dPreview) {
        return;
      }
      setIsPanning(true);
      panStartRef.current = { x: event.clientX, y: event.clientY };
      return;
    }
    addAnnotationFromCanvas(event);
  };

  const handleCanvasMouseMove = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (!isPanning || !panStartRef.current) {
      return;
    }
    const dx = event.clientX - panStartRef.current.x;
    const dy = event.clientY - panStartRef.current.y;
    panStartRef.current = { x: event.clientX, y: event.clientY };
    setCanvasOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
  };

  const saveAnnotation = async () => {
    const values = await annotationForm.validateFields();
    if (!pendingPointId) {
      setAnnotationModalOpen(false);
      return;
    }
    setDraftPoints((prev) => prev.map((item) => (item.id === pendingPointId ? { ...item, ...values } : item)));
    setAnnotationModalOpen(false);
    setPendingPointId(null);
  };

  const saveRecord = async () => {
    const values = await form.validateFields();
    const list = getStoredRobotTypes();

    if (isCreate) {
      const next: RobotTypeRecord = {
        id: `type-${Date.now()}`,
        typeNo: values.typeNo,
        typeName: values.typeName,
        image2d: values.image2d || DEFAULT_ROBOT_TYPE_IMAGE_NAME,
        image2dData: image2dPreview || DEFAULT_ROBOT_TYPE_IMAGE_URL,
        partsCount: draftPoints.length,
        createdAt: new Date().toLocaleString('zh-CN', { hour12: false }),
        status: '启用',
        points: draftPoints,
      };
      setStoredRobotTypes([next, ...list]);
      messageApi.success('机器人类型已创建');
    } else if (editingRecord) {
      setStoredRobotTypes(
        list.map((item) =>
          item.id === editingRecord.id
            ? {
                ...item,
                ...values,
                image2d: values.image2d || item.image2d || DEFAULT_ROBOT_TYPE_IMAGE_NAME,
                image2dData: image2dPreview || item.image2dData || DEFAULT_ROBOT_TYPE_IMAGE_URL,
                points: draftPoints,
                partsCount: Math.max(item.partsCount, draftPoints.length),
              }
            : item,
        ),
      );
      messageApi.success('机器人类型已更新');
    }
    navigate('/deployConfig/robot/robotType');
  };

  const renderCanvasWidth = canvasRef.current?.clientWidth || canvasSize.width;
  const renderCanvasHeight = canvasRef.current?.clientHeight || canvasSize.height;
  const renderContainRect = getContainRect(
    renderCanvasWidth,
    renderCanvasHeight,
    imageSize?.width ?? renderCanvasWidth,
    imageSize?.height ?? renderCanvasHeight,
  );
  const renderCenterX = renderCanvasWidth / 2;
  const renderCenterY = renderCanvasHeight / 2;
  const transformedImageLeft = renderCenterX + (renderContainRect.x - renderCenterX) * canvasScale + canvasOffset.x;
  const transformedImageTop = renderCenterY + (renderContainRect.y - renderCenterY) * canvasScale + canvasOffset.y;
  const transformedImageWidth = renderContainRect.width * canvasScale;
  const transformedImageHeight = renderContainRect.height * canvasScale;

  return (
    <div style={{ width: '100%', height: 'calc(100vh - 140px)', display: 'flex', flexDirection: 'column', gap: 12, minHeight: 0 }}>
      {contextHolder}

      <Card>
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Space align="center">
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/deployConfig/robot/robotType')}>
              返回列表
            </Button>
            <Typography.Title level={4} style={{ margin: 0 }}>
              {isCreate ? '新增机器人类型' : '编辑机器人类型'}
            </Typography.Title>
          </Space>

          <Form form={form} layout="vertical">
            <Row gutter={12}>
              <Col xs={24} md={8}>
                <Form.Item label="类型编号" name="typeNo" rules={[{ required: true, message: '请输入类型编号' }]}>
                  <Input disabled={!isCreate} />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item label="类型名称" name="typeName" rules={[{ required: true, message: '请输入类型名称' }]}>
                  <Input />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={12}>
              <Col xs={24}>
                <Form.Item label="二维图" name="image2d" rules={[{ required: true, message: '请上传二维图文件' }]}>
                  <Input placeholder="请上传二维图文件" />
                </Form.Item>
                <Upload
                  maxCount={1}
                  showUploadList={false}
                  beforeUpload={async (file) => {
                    form.setFieldValue('image2d', file.name);
                    try {
                      const url = await readFileAsDataUrl(file);
                      setImage2dPreview(url);
                    } catch {
                      messageApi.error('二维图读取失败');
                    }
                    return false;
                  }}
                >
                  <Button icon={<UploadOutlined />}>上传二维图</Button>
                </Upload>
              </Col>
            </Row>
          </Form>
        </Space>
      </Card>

      <Row gutter={12} style={{ flex: 1, minHeight: 0 }}>
        <Col xs={24} lg={17} style={{ display: 'flex', minHeight: 0 }}>
          <Card
            size="small"
            title="结构图标注区"
            style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}
            bodyStyle={{ flex: 1, minHeight: 0 }}
            extra={
              <Space>
                <Button size="small" onClick={() => zoomTo(canvasScale + 0.1)}>
                  放大+
                </Button>
                <Button size="small" onClick={() => zoomTo(canvasScale - 0.1)}>
                  缩小-
                </Button>
                <Button
                  size="small"
                  onClick={() => {
                    setCanvasScale(1);
                    setCanvasOffset({ x: 0, y: 0 });
                  }}
                >
                  缩放重置
                </Button>
                <Button size="small" onClick={() => setDraftPoints((prev) => prev.slice(0, -1))} disabled={!draftPoints.length}>
                  撤销
                </Button>
                <Button size="small" onClick={() => setDraftPoints([])} disabled={!draftPoints.length}>
                  重置标注
                </Button>
              </Space>
            }
          >
            <div
              ref={canvasRef}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              style={{
                height: '100%',
                border: '1px dashed #d9d9d9',
                borderRadius: 8,
                position: 'relative',
                cursor: draggingPointId ? 'grabbing' : isPanning ? 'grabbing' : activePart ? 'crosshair' : 'not-allowed',
                background: '#f5f5f5',
                overflow: 'hidden',
              }}
            >
              {image2dPreview && (
                <img
                  src={image2dPreview}
                  alt="robot-2d"
                  style={{
                    position: 'absolute',
                    left: transformedImageLeft,
                    top: transformedImageTop,
                    width: transformedImageWidth,
                    height: transformedImageHeight,
                    objectFit: 'fill',
                    pointerEvents: 'none',
                  }}
                />
              )}

              {draftPoints.map((point) => {
                const baseX = renderContainRect.x + (renderContainRect.width * point.x) / 100;
                const baseY = renderContainRect.y + (renderContainRect.height * point.y) / 100;
                const screenX = renderCenterX + (baseX - renderCenterX) * canvasScale + canvasOffset.x;
                const screenY = renderCenterY + (baseY - renderCenterY) * canvasScale + canvasOffset.y;
                return (
                  <div
                    key={point.id}
                    onMouseDown={(event) => handlePointMouseDown(event, point.id)}
                    onClick={(event) => {
                      event.stopPropagation();
                      if (suppressPointClickRef.current) {
                        suppressPointClickRef.current = false;
                        return;
                      }
                      setPendingPointId(point.id);
                      annotationForm.setFieldsValue(point);
                      setAnnotationModalOpen(true);
                    }}
                    style={{ position: 'absolute', left: screenX, top: screenY, width: 0, height: 0, cursor: draggingPointId === point.id ? 'grabbing' : 'pointer' }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        transform: 'translate(-50%, -50%)',
                        width: 14,
                        height: 14,
                        borderRadius: '50%',
                        background: '#ff4d4f',
                        border: '2px solid #fff',
                        boxSizing: 'border-box',
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        left: 18,
                        top: 8,
                        padding: '2px 6px',
                        borderRadius: 4,
                        background: 'rgba(0,0,0,0.72)',
                        color: '#fff',
                        fontSize: 12,
                        lineHeight: '16px',
                        whiteSpace: 'nowrap',
                        maxWidth: 240,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {point.partPosition ? `${point.partPosition} / ${point.partName}` : point.partName}
                    </div>
                  </div>
                );
              })}

              <Typography.Text type="secondary" style={{ position: 'absolute', top: 10, left: 10, zIndex: 2 }}>
                点击打点，Ctrl+左键拖动画布，标注点长按可拖拽
              </Typography.Text>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={7} style={{ display: 'flex', minHeight: 0 }}>
          <Card
            size="small"
            title="零部件选择"
            extra={<Typography.Text type="secondary">已标注 {draftPoints.length}</Typography.Text>}
            style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}
            bodyStyle={{ flex: 1, minHeight: 0, overflow: 'auto' }}
          >
            <Table
              rowKey="id"
              size="small"
              pagination={false}
              dataSource={partsPool}
              columns={[
                { title: '名称', dataIndex: 'name', key: 'name' },
                { title: '部位', dataIndex: 'position', key: 'position' },
                {
                  title: '操作',
                  key: 'action',
                  render: (_, record: RobotTypeSelectablePart) => (
                    <Button type={activePart?.id === record.id ? 'primary' : 'link'} size="small" onClick={() => setActivePart(record)}>
                      选择
                    </Button>
                  ),
                },
              ]}
            />
          </Card>
        </Col>
      </Row>

      <div style={{ position: 'sticky', bottom: 0, background: '#fff', borderTop: '1px solid #f0f0f0', padding: '10px 0', zIndex: 5 }}>
        <Space>
          <Button type="primary" onClick={saveRecord}>
            保存
          </Button>
          <Button onClick={() => navigate('/deployConfig/robot/robotType')}>取消</Button>
        </Space>
      </div>

      <Modal
        title="标注信息"
        open={annotationModalOpen}
        onOk={saveAnnotation}
        onCancel={() => setAnnotationModalOpen(false)}
        okText="确认"
        cancelText="取消"
        footer={(_, { OkBtn, CancelBtn }) => (
          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <Button
              danger
              disabled={!pendingPointId}
              onClick={() => {
                if (!pendingPointId) {
                  return;
                }
                setDraftPoints((prev) => prev.filter((item) => item.id !== pendingPointId));
                setPendingPointId(null);
                setAnnotationModalOpen(false);
              }}
            >
              删除标注
            </Button>
            <Space>
              <CancelBtn />
              <OkBtn />
            </Space>
          </Space>
        )}
      >
        <Form form={annotationForm} layout="vertical">
          <Form.Item label="零部件名称" name="partName" rules={[{ required: true, message: '请选择零部件' }]}>
            <Select options={partsPool.map((item) => ({ label: `${item.name} (${item.position})`, value: item.name }))} />
          </Form.Item>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item label="坐标X" name="x" rules={[{ required: true, message: '请输入坐标X' }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="坐标Y" name="y" rules={[{ required: true, message: '请输入坐标Y' }]}>
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="旋转角度" name="rotation" rules={[{ required: true, message: '请输入旋转角度' }]}>
            <Input />
          </Form.Item>
          <Form.Item label="备注" name="remark">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}



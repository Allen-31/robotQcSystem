import { CloseOutlined } from '@ant-design/icons';
import { Breadcrumb, Button, Card, Space, Typography } from 'antd';
import type { ReactNode } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useI18n } from '../../../i18n/I18nProvider';
import task1Img from '../../../assets/task1.png';
import task2Img from '../../../assets/task2.png';
import task3Img from '../../../assets/task3.png';
import task4Img from '../../../assets/task4.png';

const STEP_IMAGES: Record<string, string> = {
  '1': task1Img,
  '2': task2Img,
  '3': task3Img,
  '4': task4Img,
};

const TASK_DESIGN_PATH = '/deployConfig/task/taskDesign';
const TASK_TEMPLATE_PATH = '/deployConfig/task/taskTemplate';
const ACTION_TEMPLATE_PATH = '/deployConfig/task/actionTemplate';

type FromSource = 'taskTemplate' | 'actionTemplate';

export function TaskDesignPage() {
  const { t } = useI18n();
  const { step = '1' } = useParams<{ step: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const from = (location.state as { from?: FromSource } | null)?.from ?? 'taskTemplate';
  const stepNum = step === '1' || step === '2' || step === '3' || step === '4' ? step : '1';
  const imageSrc = STEP_IMAGES[stepNum];
  const closePath = from === 'actionTemplate' ? ACTION_TEMPLATE_PATH : TASK_TEMPLATE_PATH;

  const goNext = () => {
    const next = Number(stepNum) + 1;
    if (next <= 4) {
      navigate(`${TASK_DESIGN_PATH}/${next}`, { state: location.state });
    }
  };

  const breadcrumbItems: { title: ReactNode }[] = [
    { title: t('taskDesign.breadcrumb.deployConfig') },
    { title: t('taskDesign.breadcrumb.task') },
    {
      title: from === 'actionTemplate' ? t('menu.actionTemplate') : t('menu.taskTemplate'),
    },
    { title: t('taskDesign.breadcrumb.design') },
    { title: t('taskDesign.breadcrumb.step', { step: stepNum }) },
  ];

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Card>
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Space style={{ width: '100%', justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <Breadcrumb items={breadcrumbItems} />
            <Button type="primary" icon={<CloseOutlined />} onClick={() => navigate(closePath)}>
              {t('taskDesign.close')}
            </Button>
          </Space>
        </Space>
      </Card>

      <Card>
        
        {imageSrc && (
          <div
            style={{ cursor: Number(stepNum) < 4 ? 'pointer' : 'default', display: 'inline-block', lineHeight: 0 }}
            onClick={goNext}
            role={Number(stepNum) < 4 ? 'button' : undefined}
            onKeyDown={(e) => Number(stepNum) < 4 && (e.key === 'Enter' || e.key === ' ') && goNext()}
            tabIndex={Number(stepNum) < 4 ? 0 : undefined}
          >
            <img src={imageSrc} alt={t('taskDesign.breadcrumb.step', { step: stepNum })} style={{ maxWidth: '100%', height: 'auto', display: 'block' }} />
          </div>
        )}
      </Card>
    </Space>
  );
}

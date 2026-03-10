import { CloseOutlined } from '@ant-design/icons';
import { Breadcrumb, Button, Card, Modal, Space } from 'antd';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
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

const STEP_LABEL_KEYS: Record<string, string> = {
  '1': 'taskDesign.tab.taskTemplate',
  '2': 'taskDesign.tab.actionTemplate',
  '3': 'taskDesign.tab.inspectionPoint',
};

const TASK_DESIGN_PATH = '/deployConfig/task/taskDesign';
const TASK_TEMPLATE_PATH = '/deployConfig/task/taskTemplate';
const ACTION_TEMPLATE_PATH = '/deployConfig/task/actionTemplate';

type FromSource = 'taskTemplate' | 'actionTemplate';

const STEPS = ['1', '2', '3'] as const;

export function TaskDesignPage() {
  const { t } = useI18n();
  const { step = '1' } = useParams<{ step: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const from = (searchParams.get('from') as FromSource) || 'taskTemplate';
  const rawStep = step === '4' ? '3' : step;
  const stepNum = STEPS.includes(rawStep as (typeof STEPS)[number]) ? rawStep : '1';
  const imageSrc = STEP_IMAGES[stepNum];
  const listPath = from === 'actionTemplate' ? ACTION_TEMPLATE_PATH : TASK_TEMPLATE_PATH;
  const [task4ModalOpen, setTask4ModalOpen] = useState(false);

  const goToStep = (s: string) => {
    if (s === stepNum) return;
    navigate(`${TASK_DESIGN_PATH}/${s}?from=${from}`);
  };

  const goNext = () => {
    const next = Number(stepNum) + 1;
    if (next <= 3) {
      navigate(`${TASK_DESIGN_PATH}/${next}?from=${from}`);
    } else if (next === 4) {
      setTask4ModalOpen(true);
    }
  };

  const breadcrumbItems: { title: ReactNode }[] = Array.from({ length: Number(stepNum) }, (_, idx) => {
    const s = String(idx + 1);
    const label = t(STEP_LABEL_KEYS[s] || 'taskDesign.breadcrumb.step');
    const isLast = idx + 1 === Number(stepNum);
    return {
      title: isLast ? (
        label
      ) : (
        <a onClick={() => goToStep(s)} style={{ cursor: 'pointer' }}>
          {label}
        </a>
      ),
    };
  });

  const showNextOnClick = Number(stepNum) < 3 || (stepNum === '3' && true);

  return (
    <div style={{ width: '100%' }}>
      <Card>
        <Space style={{ width: '100%', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <Breadcrumb items={breadcrumbItems.map((item) => ({ title: item.title }))} />
          <Button type="primary" icon={<CloseOutlined />} onClick={() => navigate(listPath)}>
            {t('taskDesign.close')}
          </Button>
        </Space>
      </Card>

      <div style={{ padding: 16 }}>
        {imageSrc && (
          <div
            style={{ cursor: showNextOnClick ? 'pointer' : 'default', display: 'inline-block', lineHeight: 0 }}
            onClick={goNext}
            role={showNextOnClick ? 'button' : undefined}
            onKeyDown={(e) => showNextOnClick && (e.key === 'Enter' || e.key === ' ') && goNext()}
            tabIndex={showNextOnClick ? 0 : undefined}
          >
            <img
              src={imageSrc}
              alt={t(STEP_LABEL_KEYS[stepNum] || 'taskDesign.breadcrumb.step')}
              style={{ maxWidth: '100%', height: 'auto', display: 'block' }}
            />
          </div>
        )}
      </div>

      <Modal
        open={task4ModalOpen}
        onCancel={() => setTask4ModalOpen(false)}
        footer={null}
        width={1040}
        styles={{ body: { padding: 0 } }}
        destroyOnClose
        closable
      >
        <div
          role="button"
          tabIndex={0}
          onClick={() => setTask4ModalOpen(false)}
          onKeyDown={(e) => e.key === 'Enter' && setTask4ModalOpen(false)}
          style={{ cursor: 'pointer', lineHeight: 0 }}
        >
          <img
            src={STEP_IMAGES['4']}
            alt={t('taskDesign.modal.detail')}
            style={{ width: '100%', height: 'auto', display: 'block' }}
          />
        </div>
      </Modal>
    </div>
  );
}

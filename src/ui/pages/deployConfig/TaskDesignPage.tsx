import { FileOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { useMemo } from 'react';
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

const STEP_TAB_KEYS: Record<string, string> = {
  '1': 'taskDesign.tab.taskTemplate',
  '2': 'taskDesign.tab.actionTemplate',
  '3': 'taskDesign.tab.inspectionPoint',
};

const TASK_DESIGN_PATH = '/deployConfig/task/taskDesign';
const TASK_TEMPLATE_PATH = '/deployConfig/task/taskTemplate';
const ACTION_TEMPLATE_PATH = '/deployConfig/task/actionTemplate';

type FromSource = 'taskTemplate' | 'actionTemplate';

const STEPS = ['1', '2', '3', '4'] as const;

export function TaskDesignPage() {
  const { t } = useI18n();
  const { step = '1' } = useParams<{ step: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const from = (searchParams.get('from') as FromSource) || 'taskTemplate';
  const stepNum = STEPS.includes(step as (typeof STEPS)[number]) ? step : '1';
  const imageSrc = STEP_IMAGES[stepNum];
  const listPath = from === 'actionTemplate' ? ACTION_TEMPLATE_PATH : TASK_TEMPLATE_PATH;
  const showTabs = true;

  const goNext = () => {
    const next = Number(stepNum) + 1;
    if (next <= 4) {
      navigate(`${TASK_DESIGN_PATH}/${next}?from=${from}`);
    }
  };

  const goToStep = (s: string) => {
    navigate(`${TASK_DESIGN_PATH}/${s}?from=${from}`);
  };

  const closeTab = (tab: 'list' | string) => {
    if (tab === 'list') {
      navigate(listPath);
      return;
    }
    const n = Number(tab);
    if (n > 1) goToStep(String(n - 1));
    else navigate(listPath);
  };

  const currentStepNum = Number(stepNum);
  const tabs = useMemo(() => {
    const listLabel = from === 'actionTemplate' ? t('menu.actionTemplate') : t('menu.taskTemplate');
    const listIcon = from === 'actionTemplate' ? <ThunderboltOutlined /> : <FileOutlined />;
    const items: { key: string; label: string; icon: React.ReactNode }[] = [
      { key: 'list', label: listLabel, icon: listIcon },
    ];
    for (let i = 1; i <= currentStepNum && i <= 3; i++) {
      items.push({
        key: String(i),
        label: t(STEP_TAB_KEYS[String(i)]),
        icon: null,
      });
    }
    return items;
  }, [from, currentStepNum, t]);

  const showNextOnClick = currentStepNum < 4;

  return (
    <div style={{ width: '100%' }}>
      {showTabs && (
        <div
          style={{
            display: 'flex',
            alignItems: 'stretch',
            borderBottom: '1px solid #d9d9d9',
            background: '#f5f5f5',
            paddingTop: 8,
            paddingLeft: 8,
            gap: 0,
            flexWrap: 'nowrap',
            overflowX: 'auto',
          }}
        >
          {tabs.map((tab) => {
          const isActive = tab.key === stepNum || (stepNum === '4' && tab.key === '3');
          return (
            <div
              key={tab.key}
              role="tab"
              tabIndex={0}
              onClick={() => {
                if (tab.key === 'list') navigate(listPath);
                else if (Number(tab.key) <= currentStepNum) goToStep(tab.key);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  if (tab.key === 'list') navigate(listPath);
                  else if (Number(tab.key) <= currentStepNum) goToStep(tab.key);
                }
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px 8px',
                marginRight: 2,
                background: isActive ? '#fff' : 'transparent',
                border: '1px solid #d9d9d9',
                borderBottom: isActive ? '1px solid #fff' : '1px solid #d9d9d9',
                borderRadius: '6px 6px 0 0',
                cursor: tab.key === 'list' || Number(tab.key) <= currentStepNum ? 'pointer' : 'default',
                minWidth: 80,
                maxWidth: 180,
              }}
            >
              {tab.icon && <span style={{ fontSize: 14, color: '#666' }}>{tab.icon}</span>}
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13 }}>
                {tab.label}
              </span>
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(tab.key);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    closeTab(tab.key);
                  }
                }}
                style={{
                  marginLeft: 4,
                  padding: '0 2px',
                  lineHeight: 1,
                  cursor: 'pointer',
                  color: '#666',
                  fontSize: 12,
                }}
                aria-label={t('taskDesign.close')}
              >
                ×
              </span>
            </div>
          );
        })}
        </div>
      )}

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
              alt={t(STEP_TAB_KEYS[stepNum] || 'taskDesign.breadcrumb.step')}
              style={{ maxWidth: '100%', height: 'auto', display: 'block' }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

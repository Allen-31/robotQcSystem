const CONFIG_TEMPLATE_STORAGE_KEY = 'robot-qc-config-template-list';

export interface ConfigTemplateParamSnapshot {
  id: string;
  name: string;
  value: string;
  defaultValue: string;
  unit: string;
  range: string;
  categoryPath: string;
}

export interface ConfigTemplateSnapshot {
  id: string;
  code: string;
  serialNo: string;
  ip: string;
  robotType: string;
  group: string;
  registeredAt: string;
  params: ConfigTemplateParamSnapshot[];
}

function isParamSnapshot(value: unknown): value is ConfigTemplateParamSnapshot {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const item = value as Record<string, unknown>;
  return (
    typeof item.id === 'string' &&
    typeof item.name === 'string' &&
    typeof item.value === 'string' &&
    typeof item.defaultValue === 'string' &&
    typeof item.unit === 'string' &&
    typeof item.range === 'string' &&
    typeof item.categoryPath === 'string'
  );
}

function isTemplateSnapshot(value: unknown): value is ConfigTemplateSnapshot {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const item = value as Record<string, unknown>;
  return (
    typeof item.id === 'string' &&
    typeof item.code === 'string' &&
    typeof item.serialNo === 'string' &&
    typeof item.ip === 'string' &&
    typeof item.robotType === 'string' &&
    typeof item.group === 'string' &&
    typeof item.registeredAt === 'string' &&
    Array.isArray(item.params) &&
    item.params.every(isParamSnapshot)
  );
}

export function loadConfigTemplateSnapshots(): ConfigTemplateSnapshot[] {
  try {
    const raw = localStorage.getItem(CONFIG_TEMPLATE_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(isTemplateSnapshot);
  } catch {
    return [];
  }
}

export function saveConfigTemplateSnapshots(list: ConfigTemplateSnapshot[]): void {
  localStorage.setItem(CONFIG_TEMPLATE_STORAGE_KEY, JSON.stringify(list));
}


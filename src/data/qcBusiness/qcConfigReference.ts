import { stationConfigList } from '../qcConfig/stationConfigList';
import { wireHarnessTypeList } from '../qcConfig/wireHarnessTypeList';
import { workstationConfigList } from '../qcConfig/workstationConfigList';
import type { Workstation } from '../../shared/types/workstation';

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter((item) => item.trim().length > 0)));
}

export function getHarnessTypeOptions(): string[] {
  const fromConfig = unique(wireHarnessTypeList.map((item) => item.name));
  if (fromConfig.length > 0) {
    return fromConfig;
  }
  return ['Harness-L1', 'Harness-L2', 'Harness-L3'];
}

export function getStationCodeOptions(): string[] {
  const fromConfig = unique(stationConfigList.map((item) => item.stationId));
  if (fromConfig.length > 0) {
    return fromConfig;
  }
  return ['ST-001'];
}

export function normalizeHarnessType(value: string, index = 0): string {
  const options = getHarnessTypeOptions();
  if (options.includes(value)) {
    return value;
  }
  const levelMatch = /L(\d+)/i.exec(value);
  if (levelMatch) {
    const level = Number(levelMatch[1]);
    if (level > 0 && level <= options.length) {
      return options[level - 1];
    }
  }
  return options[index % options.length] ?? value;
}

export function normalizeStationCode(value: string, index = 0): string {
  const options = getStationCodeOptions();
  if (options.includes(value)) {
    return value;
  }
  return options[index % options.length] ?? value;
}

export function buildWorkstationListFromConfig(): Workstation[] {
  const stationMap = new Map<string, string[]>();
  for (const station of stationConfigList) {
    const current = stationMap.get(station.workstationId) ?? [];
    current.push(station.stationId);
    stationMap.set(station.workstationId, current);
  }

  if (workstationConfigList.length === 0) {
    const stationList = getStationCodeOptions();
    return [
      {
        id: 'WS-QC-001',
        name: 'QC Workstation 1',
        factory: 'Plant 1',
        inspectionStationCount: stationList.length,
        location: 'QC Area',
        stationList,
        status: 'running',
      },
    ];
  }

  return workstationConfigList.map((item, index) => {
    const workstationId = String(item.id);
    const stationList = stationMap.get(workstationId) ?? [];
    return {
      id: workstationId,
      name: item.name || `QC Workstation ${index + 1}`,
      factory: `Plant ${index + 1}`,
      inspectionStationCount: stationList.length,
      location: stationList.length > 0 ? `Map ${stationList.join(', ')}` : 'QC Area',
      stationList: stationList.length > 0 ? stationList : [`ST-${String(index + 1).padStart(3, '0')}`],
      status: item.enabled ? 'running' : 'idle',
    };
  });
}

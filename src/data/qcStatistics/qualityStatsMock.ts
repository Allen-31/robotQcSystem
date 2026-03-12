export interface QualityStatRecord {
  date: string;
  factory: string;
  workshop: string;
  workstation: string;
  station: string;
  inspector: string;
  wireHarness: string;
  project?: string;
  inspectionCount: number;
  defectCount: number;
  reinspectionCount: number;
  avgDurationMin: number;
}

interface StationSeed {
  factory: string;
  workshop: string;
  workstation: string;
  station: string;
  inspector: string;
  wireHarness: string;
  baseInspection: number;
}

interface ZoneSeed {
  factory: string;
  workshop: string;
  workstation: string;
  stationPrefix: string;
  baseInspection: number;
}

const zoneSeeds: ZoneSeed[] = [
  { factory: '华东一厂', workshop: '总装一车间', workstation: '质检区A', stationPrefix: 'A', baseInspection: 116 },
  { factory: '华东一厂', workshop: '总装二车间', workstation: '质检区B', stationPrefix: 'B', baseInspection: 108 },
  { factory: '华东一厂', workshop: '总装二车间', workstation: '质检区F', stationPrefix: 'F', baseInspection: 104 },
  { factory: '华南二厂', workshop: '总装三车间', workstation: '质检区C', stationPrefix: 'C', baseInspection: 114 },
  { factory: '华南二厂', workshop: '总装三车间', workstation: '质检区G', stationPrefix: 'G', baseInspection: 109 },
  { factory: '华中三厂', workshop: '总装四车间', workstation: '质检区D', stationPrefix: 'D', baseInspection: 101 },
  { factory: '华中三厂', workshop: '总装四车间', workstation: '质检区H', stationPrefix: 'H', baseInspection: 98 },
  { factory: '华北四厂', workshop: '总装五车间', workstation: '质检区E', stationPrefix: 'E', baseInspection: 103 },
  { factory: '华北四厂', workshop: '总装五车间', workstation: '质检区I', stationPrefix: 'I', baseInspection: 99 },
];

const inspectorNames = ['张凯', '李哲', '吴晨', '王锐', '刘洋', '周扬', '丁波', '姜玲', '陈琳', '赵文', '沈悦', '马志'];
const wireHarnessTypes = ['主驱线束-A', '控制线束-B', '高压线束-C', '低压线束-D'];
const wireHarnessToProject: Record<string, string> = {
  '主驱线束-A': '项目A',
  '控制线束-B': '项目A',
  '高压线束-C': '项目B',
  '低压线束-D': '项目B',
};

const stationSeeds: StationSeed[] = zoneSeeds.flatMap((zone, zoneIndex) =>
  Array.from({ length: 6 }, (_, stationIndex) => {
    const stationNo = String(stationIndex + 1).padStart(2, '0');
    return {
      factory: zone.factory,
      workshop: zone.workshop,
      workstation: zone.workstation,
      station: `ST-${zone.stationPrefix}${stationNo}`,
      inspector: inspectorNames[(zoneIndex * 3 + stationIndex) % inspectorNames.length],
      wireHarness: wireHarnessTypes[stationIndex % wireHarnessTypes.length],
      baseInspection: zone.baseInspection + ((stationIndex % 3) * 4 - 3),
    };
  }),
);

function buildDateList(startDate: string, days: number): string[] {
  const start = new Date(`${startDate}T00:00:00`);
  return Array.from({ length: days }, (_, index) => {
    const current = new Date(start);
    current.setDate(start.getDate() + index);
    const yyyy = current.getFullYear();
    const mm = String(current.getMonth() + 1).padStart(2, '0');
    const dd = String(current.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });
}

function bounded(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

const dates = buildDateList('2026-02-20', 18);

export const qualityStatsMock: QualityStatRecord[] = dates.flatMap((date, dayIndex) =>
  stationSeeds.map((seed, stationIndex) => {
    const swing = ((dayIndex % 5) - 2) * 3 + ((stationIndex % 4) - 1);
    const inspectionCount = bounded(seed.baseInspection + swing + (dayIndex % 2 === 0 ? 4 : -2), 72, 178);
    const defectRateBase = 0.034 + ((stationIndex % 3) * 0.012 + (dayIndex % 4) * 0.003);
    const defectCount = bounded(Math.round(inspectionCount * defectRateBase), 2, 28);
    const reinspectionCount = bounded(defectCount + 2 + ((dayIndex + stationIndex) % 6), 3, 36);
    const avgDurationMin = Number((7.0 + (stationIndex % 5) * 0.45 + (dayIndex % 4) * 0.22).toFixed(2));

    return {
      date,
      factory: seed.factory,
      workshop: seed.workshop,
      workstation: seed.workstation,
      station: seed.station,
      inspector: seed.inspector,
      wireHarness: seed.wireHarness,
      project: wireHarnessToProject[seed.wireHarness] ?? '未分类',
      inspectionCount,
      defectCount,
      reinspectionCount,
      avgDurationMin,
    };
  }),
);

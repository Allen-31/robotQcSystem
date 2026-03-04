export interface QualityStatRecord {
  date: string;
  factory: string;
  workshop: string;
  workstation: string;
  station: string;
  inspector: string;
  wireHarness: string;
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

const stationSeeds: StationSeed[] = [
  { factory: '华东一厂', workshop: '总装一车间', workstation: '质检区A', station: 'ST-A01', inspector: '张凯', wireHarness: '主驱线束-A', baseInspection: 118 },
  { factory: '华东一厂', workshop: '总装一车间', workstation: '质检区A', station: 'ST-A02', inspector: '李倩', wireHarness: '控制线束-B', baseInspection: 108 },
  { factory: '华东一厂', workshop: '总装一车间', workstation: '质检区A', station: 'ST-A03', inspector: '吴晨', wireHarness: '高压线束-C', baseInspection: 106 },
  { factory: '华东一厂', workshop: '总装二车间', workstation: '质检区B', station: 'ST-B01', inspector: '王鑫', wireHarness: '高压线束-C', baseInspection: 102 },
  { factory: '华东一厂', workshop: '总装二车间', workstation: '质检区B', station: 'ST-B02', inspector: '刘洋', wireHarness: '主驱线束-A', baseInspection: 110 },
  { factory: '华东一厂', workshop: '总装二车间', workstation: '质检区B', station: 'ST-B03', inspector: '周扬', wireHarness: '控制线束-B', baseInspection: 107 },
  { factory: '华东一厂', workshop: '总装二车间', workstation: '质检区F', station: 'ST-F01', inspector: '丁波', wireHarness: '主驱线束-A', baseInspection: 109 },
  { factory: '华东一厂', workshop: '总装二车间', workstation: '质检区F', station: 'ST-F02', inspector: '姜琳', wireHarness: '高压线束-C', baseInspection: 103 },
  { factory: '华南二厂', workshop: '总装三车间', workstation: '质检区C', station: 'ST-C01', inspector: '陈琳', wireHarness: '控制线束-B', baseInspection: 114 },
  { factory: '华南二厂', workshop: '总装三车间', workstation: '质检区C', station: 'ST-C02', inspector: '赵文', wireHarness: '主驱线束-A', baseInspection: 120 },
  { factory: '华南二厂', workshop: '总装三车间', workstation: '质检区C', station: 'ST-C03', inspector: '沈悦', wireHarness: '高压线束-C', baseInspection: 112 },
  { factory: '华南二厂', workshop: '总装三车间', workstation: '质检区G', station: 'ST-G01', inspector: '马志', wireHarness: '控制线束-B', baseInspection: 111 },
  { factory: '华南二厂', workshop: '总装三车间', workstation: '质检区G', station: 'ST-G02', inspector: '安琪', wireHarness: '主驱线束-A', baseInspection: 115 },
  { factory: '华中三厂', workshop: '总装四车间', workstation: '质检区D', station: 'ST-D01', inspector: '孙浩', wireHarness: '高压线束-C', baseInspection: 96 },
  { factory: '华中三厂', workshop: '总装四车间', workstation: '质检区D', station: 'ST-D02', inspector: '罗青', wireHarness: '控制线束-B', baseInspection: 104 },
  { factory: '华中三厂', workshop: '总装四车间', workstation: '质检区D', station: 'ST-D03', inspector: '钱峰', wireHarness: '主驱线束-A', baseInspection: 101 },
  { factory: '华中三厂', workshop: '总装四车间', workstation: '质检区H', station: 'ST-H01', inspector: '谢宁', wireHarness: '高压线束-C', baseInspection: 99 },
  { factory: '华中三厂', workshop: '总装四车间', workstation: '质检区H', station: 'ST-H02', inspector: '常悦', wireHarness: '控制线束-B', baseInspection: 103 },
  { factory: '华北四厂', workshop: '总装五车间', workstation: '质检区E', station: 'ST-E01', inspector: '杨锐', wireHarness: '主驱线束-A', baseInspection: 101 },
  { factory: '华北四厂', workshop: '总装五车间', workstation: '质检区E', station: 'ST-E02', inspector: '黄蓉', wireHarness: '高压线束-C', baseInspection: 99 },
  { factory: '华北四厂', workshop: '总装五车间', workstation: '质检区E', station: 'ST-E03', inspector: '石涛', wireHarness: '控制线束-B', baseInspection: 102 },
  { factory: '华北四厂', workshop: '总装五车间', workstation: '质检区I', station: 'ST-I01', inspector: '冯立', wireHarness: '主驱线束-A', baseInspection: 106 },
  { factory: '华北四厂', workshop: '总装五车间', workstation: '质检区I', station: 'ST-I02', inspector: '郭倩', wireHarness: '高压线束-C', baseInspection: 97 },
];

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
    const inspectionCount = bounded(seed.baseInspection + swing + (dayIndex % 2 === 0 ? 4 : -2), 72, 168);
    const defectRateBase = 0.035 + ((stationIndex % 3) * 0.012 + (dayIndex % 4) * 0.003);
    const defectCount = bounded(Math.round(inspectionCount * defectRateBase), 2, 24);
    const reinspectionCount = bounded(defectCount + 2 + ((dayIndex + stationIndex) % 6), 3, 32);
    const avgDurationMin = Number((7.0 + (stationIndex % 5) * 0.45 + (dayIndex % 4) * 0.22).toFixed(2));

    return {
      date,
      factory: seed.factory,
      workshop: seed.workshop,
      workstation: seed.workstation,
      station: seed.station,
      inspector: seed.inspector,
      wireHarness: seed.wireHarness,
      inspectionCount,
      defectCount,
      reinspectionCount,
      avgDurationMin,
    };
  }),
);

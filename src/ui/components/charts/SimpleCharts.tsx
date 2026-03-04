import { Empty, Space, Typography } from 'antd';

interface BarSeriesItem {
  name: string;
  value: number;
}

interface LineSeries {
  name: string;
  color: string;
  values: number[];
}

interface SimpleBarChartProps {
  title?: string;
  unit?: string;
  data: BarSeriesItem[];
  height?: number;
}

interface SimpleLineChartProps {
  title?: string;
  categories: string[];
  series: LineSeries[];
  height?: number;
}

function formatNumber(value: number): string {
  if (value >= 1000) {
    return value.toLocaleString();
  }
  return String(Number(value.toFixed(2)));
}

export function SimpleBarChart({ title, unit, data, height = 260 }: SimpleBarChartProps) {
  if (data.length === 0) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />;
  }

  const width = 900;
  const padding = { top: 24, right: 24, bottom: 58, left: 52 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const maxValue = Math.max(...data.map((item) => item.value), 1);
  const barWidth = chartWidth / data.length - 14;

  return (
    <Space direction="vertical" size={8} style={{ width: '100%' }}>
      {title ? <Typography.Text strong>{title}</Typography.Text> : null}
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height }}>
        <line x1={padding.left} y1={padding.top + chartHeight} x2={padding.left + chartWidth} y2={padding.top + chartHeight} stroke="#cbd5e1" />
        <line x1={padding.left} y1={padding.top} x2={padding.left} y2={padding.top + chartHeight} stroke="#cbd5e1" />
        {data.map((item, index) => {
          const x = padding.left + index * (barWidth + 14) + 7;
          const barHeight = (item.value / maxValue) * (chartHeight - 8);
          const y = padding.top + chartHeight - barHeight;
          return (
            <g key={item.name}>
              <rect x={x} y={y} width={barWidth} height={barHeight} rx={6} fill="#1677ff" />
              <text x={x + barWidth / 2} y={y - 6} textAnchor="middle" fontSize="11" fill="#1e293b">
                {formatNumber(item.value)}
                {unit ?? ''}
              </text>
              <text x={x + barWidth / 2} y={padding.top + chartHeight + 18} textAnchor="middle" fontSize="11" fill="#64748b">
                {item.name}
              </text>
            </g>
          );
        })}
      </svg>
    </Space>
  );
}

export function SimpleLineChart({ title, categories, series, height = 280 }: SimpleLineChartProps) {
  if (categories.length === 0 || series.length === 0) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />;
  }

  const width = 900;
  const padding = { top: 24, right: 30, bottom: 42, left: 48 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const allValues = series.flatMap((item) => item.values);
  const maxValue = Math.max(...allValues, 1);

  const toPoint = (index: number, value: number) => {
    const x = padding.left + (index / Math.max(categories.length - 1, 1)) * chartWidth;
    const y = padding.top + chartHeight - (value / maxValue) * chartHeight;
    return { x, y };
  };

  return (
    <Space direction="vertical" size={8} style={{ width: '100%' }}>
      {title ? <Typography.Text strong>{title}</Typography.Text> : null}
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height }}>
        <line x1={padding.left} y1={padding.top + chartHeight} x2={padding.left + chartWidth} y2={padding.top + chartHeight} stroke="#cbd5e1" />
        <line x1={padding.left} y1={padding.top} x2={padding.left} y2={padding.top + chartHeight} stroke="#cbd5e1" />
        {categories.map((item, index) => {
          const p = toPoint(index, 0);
          return (
            <text key={item} x={p.x} y={padding.top + chartHeight + 18} textAnchor="middle" fontSize="11" fill="#64748b">
              {item}
            </text>
          );
        })}
        {series.map((item) => {
          const points = item.values.map((value, index) => toPoint(index, value));
          const path = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
          return (
            <g key={item.name}>
              <path d={path} fill="none" stroke={item.color} strokeWidth={2.2} />
              {points.map((point, index) => (
                <g key={`${item.name}-${index}`}>
                  <circle cx={point.x} cy={point.y} r={3.5} fill={item.color} />
                </g>
              ))}
            </g>
          );
        })}
      </svg>
      <Space wrap size={12}>
        {series.map((item) => (
          <Space key={item.name} size={6}>
            <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: item.color }} />
            <Typography.Text type="secondary">{item.name}</Typography.Text>
          </Space>
        ))}
      </Space>
    </Space>
  );
}

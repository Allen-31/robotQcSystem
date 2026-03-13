import { Tooltip } from 'antd';

const DEFAULT_MAX_CHARS = 12;

/**
 * 将过长 ID（如 Snowflake）格式化为前几位 + … + 后几位，避免表格溢出。
 * 悬停显示完整值。
 */
function formatLongId(value: string | number | null | undefined, maxChars: number = DEFAULT_MAX_CHARS): string {
  const s = value == null ? '' : String(value).trim();
  if (s.length <= maxChars) return s || '-';
  const head = Math.ceil((maxChars - 1) / 2);
  const tail = Math.floor((maxChars - 1) / 2);
  return `${s.slice(0, head)}…${s.slice(-tail)}`;
}

export interface LongIdTextProps {
  /** 原始 ID（数字或字符串） */
  value: string | number | null | undefined;
  /** 显示的最大字符数（含省略号），超出则截断为 前段…后段 */
  maxChars?: number;
  /** 空值时显示的占位 */
  placeholder?: string;
}

export function LongIdText({ value, maxChars = DEFAULT_MAX_CHARS, placeholder = '-' }: LongIdTextProps) {
  const raw = value == null ? '' : String(value).trim();
  const display = raw.length <= maxChars ? raw : formatLongId(value, maxChars);
  const text = display || placeholder;
  if (raw.length <= maxChars) return <span>{text}</span>;
  return (
    <Tooltip title={raw}>
      <span style={{ cursor: 'default' }}>{text}</span>
    </Tooltip>
  );
}

/** 供表格 render 使用：格式化长 ID 字符串 */
export function formatLongIdForTable(value: string | number | null | undefined, maxChars?: number): string {
  return formatLongId(value, maxChars ?? DEFAULT_MAX_CHARS) || '-';
}

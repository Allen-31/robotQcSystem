/* eslint-disable react-refresh/only-export-components */
import { Tooltip } from 'antd';

const DEFAULT_MAX_CHARS = 12;

/**
 * Format long IDs (for example Snowflake IDs) as: head...tail
 * to avoid table overflow. Full value is shown in tooltip.
 */
function formatLongId(value: string | number | null | undefined, maxChars: number = DEFAULT_MAX_CHARS): string {
  const s = value == null ? '' : String(value).trim();
  if (s.length <= maxChars) return s || '-';
  const head = Math.ceil((maxChars - 1) / 2);
  const tail = Math.floor((maxChars - 1) / 2);
  return `${s.slice(0, head)}...${s.slice(-tail)}`;
}

export interface LongIdTextProps {
  /** Raw ID value */
  value: string | number | null | undefined;
  /** Maximum visible characters including ellipsis */
  maxChars?: number;
  /** Placeholder when value is empty */
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

/** Helper for table render: format long ID string */
export function formatLongIdForTable(value: string | number | null | undefined, maxChars?: number): string {
  return formatLongId(value, maxChars ?? DEFAULT_MAX_CHARS) || '-';
}

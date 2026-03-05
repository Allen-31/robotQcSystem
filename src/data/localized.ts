export type DataLocale = 'zh-CN' | 'en-US';

export interface LocalizedText {
  zh: string;
  en: string;
}

export function resolveLocalizedText(text: LocalizedText, locale: DataLocale): string {
  return locale === 'en-US' ? text.en : text.zh;
}

import en from './en';
import id from './id';

export type Lang = 'en' | 'id';
export type TKey = keyof typeof en;

const dicts: Record<Lang, Record<TKey, string>> = { en, id };

// Fallback chain: active language → en → the key itself, so a missing
// translation degrades to readable text instead of crashing. `params` fills
// {placeholders} in the resolved string.
export const makeT =
  (lang: Lang) =>
  (key: TKey, params?: Record<string, string | number>): string => {
    const s = dicts[lang][key] ?? dicts.en[key] ?? key;
    return params
      ? s.replace(/\{(\w+)\}/g, (_, k: string) => String(params[k] ?? `{${k}}`))
      : s;
  };

// Throws if the en/id dictionaries drift apart. Run via `npm run check:i18n`.
export function validateKeys(): void {
  const enKeys = new Set(Object.keys(en));
  const idKeys = new Set(Object.keys(id));
  const missing = Object.keys(en).filter((k) => !idKeys.has(k));
  const extra = Object.keys(id).filter((k) => !enKeys.has(k));
  if (missing.length || extra.length) {
    throw new Error(
      `[i18n] dictionary mismatch — missing in id: [${missing.join(', ')}]; extra in id: [${extra.join(', ')}]`
    );
  }
}

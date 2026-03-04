import { fr, type TranslationKey } from "./locales/fr.js";
import { en } from "./locales/en.js";

export type Locale = "fr" | "en";
export const DEFAULT_LOCALE: Locale = "fr";
export const SUPPORTED_LOCALES: Locale[] = ["fr", "en"];

const translations: Record<Locale, Record<string, string>> = { fr, en };

export function t(
  locale: Locale,
  key: TranslationKey,
  params?: Record<string, string | number>,
): string {
  const text =
    translations[locale]?.[key] ?? translations[DEFAULT_LOCALE][key] ?? key;
  if (!params) return text;
  return text.replace(
    /\{(\w+)\}/g,
    (_, paramName) => String(params[paramName] ?? `{${paramName}}`),
  );
}

export function mealLabel(locale: Locale, mealKey: string): string {
  return t(locale, `meal.${mealKey}` as TranslationKey) ?? mealKey;
}

export function dayLabel(locale: Locale, dayKey: string): string {
  return t(locale, `day.${dayKey}` as TranslationKey) ?? dayKey;
}

export function hearsKey(key: TranslationKey): RegExp {
  const values = SUPPORTED_LOCALES.map(
    (locale) => translations[locale]?.[key] ?? translations[DEFAULT_LOCALE][key],
  )
    .filter(Boolean)
    .map((v) => v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  return new RegExp(`^(${values.join("|")})$`);
}

export type { TranslationKey };

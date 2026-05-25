/**
 * Currency helpers driven by project_plans.country from Supabase.
 * Country may be a country name (e.g. "Kenya") or an ISO 4217 code (e.g. "KES").
 */

const COUNTRY_TO_CURRENCY: Record<string, string> = {
  kenya: 'KES',
  uganda: 'UGX',
  tanzania: 'TZS',
  rwanda: 'RWF',
  ghana: 'GHS',
  nigeria: 'NGN',
  'south africa': 'ZAR',
  ethiopia: 'ETB',
  zambia: 'ZMW',
  malawi: 'MWK',
  mozambique: 'MZN',
  'democratic republic of the congo': 'CDF',
  drc: 'CDF',
  congo: 'CDF',
  burundi: 'BIF',
  sudan: 'SDG',
  'south sudan': 'SSP',
  somalia: 'SOS',
  egypt: 'EGP',
  morocco: 'MAD',
  tunisia: 'TND',
  algeria: 'DZD',
};

const CURRENCY_LOCALES: Record<string, string> = {
  KES: 'en-KE',
  UGX: 'en-UG',
  TZS: 'en-TZ',
  RWF: 'en-RW',
  GHS: 'en-GH',
  NGN: 'en-NG',
  ZAR: 'en-ZA',
};

const DEFAULT_CURRENCY = 'KES';

export function getCurrencyCodeFromCountry(country: string | null | undefined): string {
  if (!country?.trim()) return DEFAULT_CURRENCY;

  const trimmed = country.trim();
  if (/^[A-Za-z]{3}$/.test(trimmed)) {
    return trimmed.toUpperCase();
  }

  return COUNTRY_TO_CURRENCY[trimmed.toLowerCase()] ?? DEFAULT_CURRENCY;
}

/** Matches existing UI: `KES 1,234.56` */
export function formatCurrencySimple(amount: number, currencyCode: string): string {
  return `${currencyCode} ${amount.toLocaleString()}`;
}

export function formatCurrencyAmount(amount: number, currencyCode: string): string {
  try {
    const locale = CURRENCY_LOCALES[currencyCode] ?? 'en';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return formatCurrencySimple(amount, currencyCode);
  }
}

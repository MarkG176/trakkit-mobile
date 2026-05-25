import { useMemo, useCallback } from 'react';
import { useWorkspace } from '@/hooks/useWorkspace';
import {
  getCurrencyCodeFromCountry,
  formatCurrencySimple,
  formatCurrencyAmount,
} from '@/utils/currency';

export function useProjectCurrency() {
  const { currentProjectCountry } = useWorkspace();

  const currencyCode = useMemo(
    () => getCurrencyCodeFromCountry(currentProjectCountry),
    [currentProjectCountry],
  );

  const formatAmount = useCallback(
    (amount: number) => formatCurrencySimple(amount, currencyCode),
    [currencyCode],
  );

  const format = useCallback(
    (amount: number) => formatCurrencyAmount(amount, currencyCode),
    [currencyCode],
  );

  return {
    currencyCode,
    country: currentProjectCountry,
    formatAmount,
    format,
  };
}

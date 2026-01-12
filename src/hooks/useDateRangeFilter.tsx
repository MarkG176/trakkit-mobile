import { useState, useMemo } from "react";
import { format, startOfDay, endOfDay, subDays, startOfWeek, startOfMonth } from "date-fns";

export type DatePreset = 'today' | 'yesterday' | 'week' | 'month' | 'all' | 'custom';

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

interface UseDateRangeFilterReturn {
  dateRange: DateRange;
  preset: DatePreset;
  setPreset: (preset: DatePreset) => void;
  setCustomRange: (range: DateRange) => void;
  startISO: string | undefined;
  endISO: string | undefined;
  dateLabel: string;
}

export const useDateRangeFilter = (initialPreset: DatePreset = 'today'): UseDateRangeFilterReturn => {
  const [preset, setPresetState] = useState<DatePreset>(initialPreset);
  const [customRange, setCustomRangeState] = useState<DateRange>({ from: undefined, to: undefined });

  const dateRange = useMemo((): DateRange => {
    const today = new Date();
    
    switch (preset) {
      case 'today':
        return { from: startOfDay(today), to: endOfDay(today) };
      case 'yesterday':
        const yesterday = subDays(today, 1);
        return { from: startOfDay(yesterday), to: endOfDay(yesterday) };
      case 'week':
        return { from: startOfWeek(today, { weekStartsOn: 1 }), to: endOfDay(today) };
      case 'month':
        return { from: startOfMonth(today), to: endOfDay(today) };
      case 'all':
        return { from: undefined, to: undefined };
      case 'custom':
        return customRange;
      default:
        return { from: startOfDay(today), to: endOfDay(today) };
    }
  }, [preset, customRange]);

  const startISO = dateRange.from?.toISOString();
  const endISO = dateRange.to?.toISOString();

  const dateLabel = useMemo(() => {
    switch (preset) {
      case 'today':
        return 'Today';
      case 'yesterday':
        return 'Yesterday';
      case 'week':
        return 'This Week';
      case 'month':
        return 'This Month';
      case 'all':
        return 'All Time';
      case 'custom':
        if (dateRange.from && dateRange.to) {
          return `${format(dateRange.from, 'MMM d')} - ${format(dateRange.to, 'MMM d')}`;
        }
        return 'Custom Range';
      default:
        return 'Today';
    }
  }, [preset, dateRange]);

  const setPreset = (newPreset: DatePreset) => {
    setPresetState(newPreset);
  };

  const setCustomRange = (range: DateRange) => {
    setCustomRangeState(range);
    setPresetState('custom');
  };

  return {
    dateRange,
    preset,
    setPreset,
    setCustomRange,
    startISO,
    endISO,
    dateLabel,
  };
};

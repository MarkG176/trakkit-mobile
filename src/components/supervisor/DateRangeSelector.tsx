import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { DatePreset } from "@/hooks/useDateRangeFilter";
import { format } from "date-fns";

interface DateRangeSelectorProps {
  preset: DatePreset;
  setPreset: (preset: DatePreset) => void;
  setCustomRange: (range: { from: Date | undefined; to: Date | undefined }) => void;
  dateRange: { from: Date | undefined; to: Date | undefined };
  dateLabel: string;
}

export const DateRangeSelector = ({
  preset,
  setPreset,
  setCustomRange,
  dateRange,
  dateLabel,
}: DateRangeSelectorProps) => {
  const presets: { key: DatePreset; label: string }[] = [
    { key: 'today', label: 'Today' },
    { key: 'yesterday', label: 'Yesterday' },
    { key: 'week', label: 'This Week' },
    { key: 'month', label: 'This Month' },
    { key: 'all', label: 'All Time' },
  ];

  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {presets.map(({ key, label }) => (
        <Button
          key={key}
          variant={preset === key ? "default" : "outline"}
          size="sm"
          onClick={() => setPreset(key)}
          className="text-xs shrink-0"
        >
          {label}
        </Button>
      ))}
      
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={preset === 'custom' ? "default" : "outline"}
            size="sm"
            className="text-xs shrink-0"
          >
            <CalendarIcon className="h-3 w-3 mr-1" />
            {preset === 'custom' ? dateLabel : 'Custom'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="range"
            selected={{ from: dateRange.from, to: dateRange.to }}
            onSelect={(range) => setCustomRange({ from: range?.from, to: range?.to })}
            numberOfMonths={1}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};

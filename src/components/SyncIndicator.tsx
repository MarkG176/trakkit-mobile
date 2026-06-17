import { Cloud, CloudOff, Loader2, AlertTriangle } from 'lucide-react';
import { useSync } from '@/hooks/useSync';
import { Button } from './ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover';

const OPERATION_LABELS: Record<string, string> = {
  sale_batch: 'Sale',
  giveaway: 'Giveaway',
  stock_report: 'Stock report',
  price_report: 'Price report',
  inventory_assign: 'Inventory',
  field_note: 'Field note',
  report_images: 'Report images',
  survey_response: 'Survey',
  store_create: 'New store',
};

export const SyncIndicator = () => {
  const {
    online,
    pendingCount,
    failedCount,
    blockedCount,
    isFlushing,
    flush,
    activeItems,
  } = useSync();

  const total = pendingCount + failedCount + blockedCount;
  if (total === 0 && online) return null;

  const label = !online
    ? 'Offline'
    : isFlushing
      ? 'Syncing…'
      : total > 0
        ? `${total} pending`
        : 'Synced';

  const Icon = !online ? CloudOff : failedCount + blockedCount > 0 ? AlertTriangle : isFlushing ? Loader2 : Cloud;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
          aria-label={`Sync status: ${label}`}
        >
          <Icon size={14} className={isFlushing ? 'animate-spin' : undefined} />
          <span>{label}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="end">
        <div className="space-y-2 text-sm">
          <p className="font-medium">Sync status</p>
          <p className="text-muted-foreground">
            {online
              ? 'Connected — field actions upload automatically.'
              : 'Offline — actions are saved on this device.'}
          </p>
          {pendingCount > 0 && <p>{pendingCount} waiting to upload</p>}
          {failedCount > 0 && <p className="text-destructive">{failedCount} failed (tap Retry)</p>}
          {blockedCount > 0 && (
            <p className="text-amber-600">{blockedCount} blocked (insufficient stock)</p>
          )}
          {activeItems.length > 0 && (
            <ul className="max-h-32 overflow-y-auto text-xs text-muted-foreground">
              {activeItems.slice(0, 5).map((item) => (
                <li key={item.id}>
                  {OPERATION_LABELS[item.type] ?? item.type} — {item.status}
                  {item.lastError ? `: ${item.lastError.slice(0, 40)}` : ''}
                </li>
              ))}
            </ul>
          )}
          {online && total > 0 && (
            <Button size="sm" className="w-full" onClick={() => void flush()} disabled={isFlushing}>
              Retry sync
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

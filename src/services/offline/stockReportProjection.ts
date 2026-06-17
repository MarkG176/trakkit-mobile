import { listActiveOutbox } from './outboxStore';
import type { OutboxItem, SaleBatchPayload, StockReportPayload } from './types';

/** Morning opening_stock from queued/synced count reports for today */
export async function getProjectedMorningOpeningStock(
  workspaceId: string,
  workDate: string,
  storeId?: string | null
): Promise<Record<string, number>> {
  const items = await listActiveOutbox(workspaceId);
  const map: Record<string, number> = {};

  for (const item of items) {
    if (item.type !== 'stock_report' || item.status === 'done') continue;
    const payload = item.payload as StockReportPayload;
    if (payload.workDate !== workDate) continue;
    if (payload.reportType !== 'morning' || payload.reportKind !== 'count') continue;
    if (storeId && payload.storeId !== storeId) continue;

    for (const row of payload.rows) {
      if (row.opening_stock != null) {
        map[row.product_variant_id] = row.opening_stock;
      }
    }
  }

  return map;
}

/** Evening sales qty from pending sale_batch outbox for today */
export async function getProjectedDailySales(
  workspaceId: string
): Promise<Record<string, number>> {
  const items = await listActiveOutbox(workspaceId);
  const map: Record<string, number> = {};

  for (const item of items) {
    if (item.type !== 'sale_batch' || item.status === 'done') continue;
    const payload = item.payload as SaleBatchPayload;
    for (const line of payload.items) {
      map[line.productVariantId] = (map[line.productVariantId] ?? 0) + line.quantity;
    }
  }

  return map;
}

export async function listPendingStores(
  workspaceId: string
): Promise<Array<{ clientStoreId: string; storeName: string; createdAt: number }>> {
  const items = await listActiveOutbox(workspaceId);
  return items
    .filter((i) => i.type === 'store_create' && i.status !== 'done')
    .map((i) => ({
      clientStoreId: i.id,
      storeName: (i.payload as { storeName: string }).storeName,
      createdAt: i.createdAt,
    }));
}

export function isClientStoreId(storeId: string, pendingStores: { clientStoreId: string }[]): boolean {
  return pendingStores.some((p) => p.clientStoreId === storeId);
}

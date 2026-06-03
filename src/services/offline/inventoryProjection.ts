import { listActiveOutbox } from './outboxStore';
import type {
  GiveawayPayload,
  OutboxItem,
  SaleBatchPayload,
} from './types';

/** Sum quantities reserved by pending/failed outbound operations per variant */
export async function getPendingOutboundByVariant(
  workspaceId: string
): Promise<Record<string, number>> {
  const items = await listActiveOutbox(workspaceId);
  const totals: Record<string, number> = {};

  for (const item of items) {
    if (item.status === 'done') continue;
    addOutboundFromItem(item, totals);
  }

  return totals;
}

function addOutboundFromItem(item: OutboxItem, totals: Record<string, number>): void {
  if (item.type === 'sale_batch') {
    const payload = item.payload as SaleBatchPayload;
    for (const line of payload.items) {
      totals[line.productVariantId] =
        (totals[line.productVariantId] ?? 0) + line.quantity;
    }
  } else if (item.type === 'giveaway') {
    const payload = item.payload as GiveawayPayload;
    for (const p of payload.productsGiven) {
      const id = p.product_variant_id;
      totals[id] = (totals[id] ?? 0) + p.quantity;
    }
  }
}

export async function getAvailableQuantity(
  workspaceId: string,
  productVariantId: string,
  serverAmountIssued: number
): Promise<number> {
  const pending = await getPendingOutboundByVariant(workspaceId);
  return Math.max(0, serverAmountIssued - (pending[productVariantId] ?? 0));
}

import { idbPut, idbGet, STORES } from './indexedDb';
import type { InventorySnapshot, InventorySnapshotItem } from './types';
import type { InventoryItem } from '@/hooks/useInventory';

const snapshotKey = (workspaceId: string) => workspaceId;

export async function saveInventorySnapshot(
  workspaceId: string,
  agentId: string,
  items: InventoryItem[]
): Promise<void> {
  const snapshot: InventorySnapshot = {
    workspaceId,
    agentId,
    items: items.map((i) => ({
      product_variant_id: i.product_variant_id,
      name: i.name,
      amount_issued: i.amount_issued,
      price: i.price,
      sku: i.sku,
    })),
    updatedAt: Date.now(),
  };
  await idbPut(STORES.inventorySnapshots, snapshot);
}

export async function getInventorySnapshot(
  workspaceId: string
): Promise<InventorySnapshot | undefined> {
  return idbGet<InventorySnapshot>(STORES.inventorySnapshots, snapshotKey(workspaceId));
}

export async function getProjectedInventoryItems(
  workspaceId: string
): Promise<InventorySnapshotItem[]> {
  const snapshot = await getInventorySnapshot(workspaceId);
  if (!snapshot) return [];

  const { getPendingOutboundByVariant } = await import('./inventoryProjection');
  const pending = await getPendingOutboundByVariant(workspaceId);

  return snapshot.items.map((item) => {
    const outbound = pending[item.product_variant_id] ?? 0;
    return {
      ...item,
      amount_issued: Math.max(0, item.amount_issued - outbound),
    };
  });
}

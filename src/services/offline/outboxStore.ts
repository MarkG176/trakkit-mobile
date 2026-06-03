import { idbDelete, idbGetAll, idbPut, idbGetByIndex, STORES } from './indexedDb';
import type { OutboxItem, OutboxOperationType, OutboxPayload, OutboxStatus } from './types';

export async function enqueueOutboxItem(
  item: Omit<OutboxItem, 'status' | 'attempts' | 'createdAt'> & {
    status?: OutboxStatus;
    attempts?: number;
    createdAt?: number;
  }
): Promise<OutboxItem> {
  const record: OutboxItem = {
    ...item,
    status: item.status ?? 'pending',
    attempts: item.attempts ?? 0,
    createdAt: item.createdAt ?? Date.now(),
  };
  await idbPut(STORES.outbox, record);
  return record;
}

export async function getOutboxItem(id: string): Promise<OutboxItem | undefined> {
  const all = await idbGetAll<OutboxItem>(STORES.outbox);
  return all.find((i) => i.id === id);
}

export async function updateOutboxItem(
  id: string,
  patch: Partial<Pick<OutboxItem, 'status' | 'attempts' | 'lastError'>>
): Promise<void> {
  const item = await getOutboxItem(id);
  if (!item) return;
  await idbPut(STORES.outbox, { ...item, ...patch });
}

export async function removeOutboxItem(id: string): Promise<void> {
  await idbDelete(STORES.outbox, id);
}

export async function listPendingOutbox(workspaceId?: string): Promise<OutboxItem[]> {
  const pending = await idbGetByIndex<OutboxItem>(STORES.outbox, 'status', 'pending');
  const failed = await idbGetByIndex<OutboxItem>(STORES.outbox, 'status', 'failed');
  const blocked = await idbGetByIndex<OutboxItem>(STORES.outbox, 'status', 'blocked');
  const combined = [...pending, ...failed, ...blocked].sort((a, b) => a.createdAt - b.createdAt);
  if (!workspaceId) return combined;
  return combined.filter((i) => i.workspaceId === workspaceId);
}

export async function listActiveOutbox(workspaceId?: string): Promise<OutboxItem[]> {
  const all = await idbGetAll<OutboxItem>(STORES.outbox);
  const active = all.filter((i) => i.status !== 'done');
  if (!workspaceId) return active.sort((a, b) => a.createdAt - b.createdAt);
  return active
    .filter((i) => i.workspaceId === workspaceId)
    .sort((a, b) => a.createdAt - b.createdAt);
}

export async function getOutboxCounts(workspaceId?: string): Promise<{
  pending: number;
  failed: number;
  blocked: number;
  total: number;
}> {
  const active = await listActiveOutbox(workspaceId);
  return {
    pending: active.filter((i) => i.status === 'pending').length,
    failed: active.filter((i) => i.status === 'failed').length,
    blocked: active.filter((i) => i.status === 'blocked').length,
    total: active.length,
  };
}

export function createOutboxId(): string {
  return crypto.randomUUID();
}

export async function enqueueOperation(params: {
  type: OutboxOperationType;
  payload: OutboxPayload;
  workspaceId: string;
  agentId: string;
  id?: string;
}): Promise<OutboxItem> {
  return enqueueOutboxItem({
    id: params.id ?? createOutboxId(),
    type: params.type,
    payload: params.payload,
    workspaceId: params.workspaceId,
    agentId: params.agentId,
  });
}

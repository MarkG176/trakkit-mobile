import { idbGet, idbPut, idbGetAll } from './indexedDb';
import { STORES } from './indexedDb';
import type { EntityAlias } from './types';

export async function saveEntityAlias(
  clientId: string,
  serverId: string,
  entityType: EntityAlias['entityType'] = 'store'
): Promise<void> {
  await idbPut<EntityAlias>(STORES.entityAliases, {
    clientId,
    serverId,
    entityType,
    createdAt: Date.now(),
  });
}

export async function getServerId(clientId: string): Promise<string | undefined> {
  const alias = await idbGet<EntityAlias>(STORES.entityAliases, clientId);
  return alias?.serverId;
}

export async function resolveStoreId(storeId: string | null | undefined): Promise<string | null> {
  if (!storeId) return null;
  const serverId = await getServerId(storeId);
  return serverId ?? storeId;
}

export async function listEntityAliases(): Promise<EntityAlias[]> {
  return idbGetAll<EntityAlias>(STORES.entityAliases);
}

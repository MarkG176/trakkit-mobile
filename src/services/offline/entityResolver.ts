import type {
  GiveawayPayload,
  OutboxItem,
  OutboxPayload,
  PriceReportPayload,
  SaleBatchPayload,
  StockReportPayload,
  SurveyResponsePayload,
} from './types';
import { resolveStoreId } from './entityAliasStore';

async function resolveStoreInPayload(payload: OutboxPayload): Promise<OutboxPayload> {
  if (!('storeId' in payload) || payload.storeId === undefined) {
    return payload;
  }
  const resolved = await resolveStoreId(payload.storeId as string | null);
  return { ...payload, storeId: resolved };
}

export async function resolveOutboxItemPayload(item: OutboxItem): Promise<OutboxItem> {
  const resolvedPayload = await resolveStoreInPayload(item.payload);
  return { ...item, payload: resolvedPayload };
}

export type { SaleBatchPayload, GiveawayPayload, StockReportPayload, PriceReportPayload, SurveyResponsePayload };

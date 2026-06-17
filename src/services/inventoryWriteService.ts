import { submitOutboxOperation, type SubmitResult } from '@/services/offline/submitOperation';
import type {
  GiveawayPayload,
  InventoryAssignPayload,
  PriceReportPayload,
  SaleBatchPayload,
  StockReportPayload,
} from '@/services/offline/types';

export type { SubmitResult };

export async function submitSaleBatch(params: {
  workspaceId: string;
  agentId: string;
  payload: SaleBatchPayload;
}): Promise<SubmitResult> {
  return submitOutboxOperation({
    type: 'sale_batch',
    payload: params.payload,
    workspaceId: params.workspaceId,
    agentId: params.agentId,
  });
}

export async function submitGiveaway(params: {
  workspaceId: string;
  agentId: string;
  payload: GiveawayPayload;
}): Promise<SubmitResult> {
  return submitOutboxOperation({
    type: 'giveaway',
    payload: params.payload,
    workspaceId: params.workspaceId,
    agentId: params.agentId,
  });
}

export async function submitStockReport(params: {
  workspaceId: string;
  agentId: string;
  payload: StockReportPayload;
}): Promise<SubmitResult> {
  return submitOutboxOperation({
    type: 'stock_report',
    payload: params.payload,
    workspaceId: params.workspaceId,
    agentId: params.agentId,
  });
}

export async function submitPriceReport(params: {
  workspaceId: string;
  agentId: string;
  payload: PriceReportPayload;
}): Promise<SubmitResult> {
  return submitOutboxOperation({
    type: 'price_report',
    payload: params.payload,
    workspaceId: params.workspaceId,
    agentId: params.agentId,
  });
}

export async function submitInventoryAssign(params: {
  workspaceId: string;
  agentId: string;
  payload: InventoryAssignPayload;
}): Promise<SubmitResult> {
  return submitOutboxOperation({
    type: 'inventory_assign',
    payload: params.payload,
    workspaceId: params.workspaceId,
    agentId: params.agentId,
  });
}

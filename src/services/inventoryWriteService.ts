import { enqueueOperation, createOutboxId } from '@/services/offline/outboxStore';
import { enqueueAndMaybeFlush } from '@/services/offline/flushOutbox';
import { isOnline } from '@/services/offline/connectivity';
import type {
  GiveawayPayload,
  InventoryAssignPayload,
  SaleBatchPayload,
  StockReportPayload,
} from '@/services/offline/types';

export type SubmitResult = {
  success: boolean;
  queued: boolean;
  operationId: string;
  message: string;
};

async function submitOperation<T extends SaleBatchPayload | GiveawayPayload | StockReportPayload | InventoryAssignPayload>(params: {
  type: 'sale_batch' | 'giveaway' | 'stock_report' | 'inventory_assign';
  payload: T;
  workspaceId: string;
  agentId: string;
  operationId?: string;
}): Promise<SubmitResult> {
  const operationId = params.operationId ?? createOutboxId();

  await enqueueOperation({
    id: operationId,
    type: params.type,
    payload: params.payload,
    workspaceId: params.workspaceId,
    agentId: params.agentId,
  });

  const online = isOnline();
  await enqueueAndMaybeFlush(params.workspaceId);

  const queued = !online;
  return {
    success: true,
    queued,
    operationId,
    message: queued
      ? 'Saved on device — will sync when online'
      : 'Saved successfully',
  };
}

export async function submitSaleBatch(params: {
  workspaceId: string;
  agentId: string;
  payload: SaleBatchPayload;
}): Promise<SubmitResult> {
  return submitOperation({
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
  return submitOperation({
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
  return submitOperation({
    type: 'stock_report',
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
  return submitOperation({
    type: 'inventory_assign',
    payload: params.payload,
    workspaceId: params.workspaceId,
    agentId: params.agentId,
  });
}

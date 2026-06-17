import { enqueueOperation, createOutboxId } from './outboxStore';
import { enqueueAndMaybeFlush } from './flushOutbox';
import { isOnline } from './connectivity';
import type { OutboxOperationType, OutboxPayload } from './types';

export type SubmitResult = {
  success: boolean;
  queued: boolean;
  operationId: string;
  message: string;
};

export async function submitOutboxOperation(params: {
  type: OutboxOperationType;
  payload: OutboxPayload;
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

  return {
    success: true,
    queued: !online,
    operationId,
    message: !online
      ? 'Saved on device — will sync when online'
      : 'Saved successfully',
  };
}

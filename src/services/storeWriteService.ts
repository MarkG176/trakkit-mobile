import { submitOutboxOperation, type SubmitResult } from '@/services/offline/submitOperation';
import type { StoreCreatePayload } from '@/services/offline/types';

export type { SubmitResult };

/** operationId doubles as client_store_id for entity alias mapping */
export async function submitStoreCreate(params: {
  workspaceId: string;
  agentId: string;
  payload: Omit<StoreCreatePayload, 'county' | 'country'> & {
    county?: string | null;
    country?: string | null;
  };
  operationId?: string;
}): Promise<SubmitResult & { clientStoreId: string }> {
  const result = await submitOutboxOperation({
    type: 'store_create',
    payload: params.payload,
    workspaceId: params.workspaceId,
    agentId: params.agentId,
    operationId: params.operationId,
  });

  return {
    ...result,
    clientStoreId: result.operationId,
  };
}

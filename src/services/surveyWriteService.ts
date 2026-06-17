import { submitOutboxOperation, type SubmitResult } from '@/services/offline/submitOperation';
import type { SurveyResponsePayload } from '@/services/offline/types';

export type { SubmitResult };

export async function submitSurveyResponse(params: {
  workspaceId: string;
  agentId: string;
  payload: SurveyResponsePayload;
}): Promise<SubmitResult> {
  return submitOutboxOperation({
    type: 'survey_response',
    payload: params.payload,
    workspaceId: params.workspaceId,
    agentId: params.agentId,
  });
}

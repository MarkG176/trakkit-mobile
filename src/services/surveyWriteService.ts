import { submitOutboxOperation, type SubmitResult } from '@/services/offline/submitOperation';
import { isOnline } from '@/services/offline/connectivity';
import { supabase } from '@/integrations/supabase/client';
import type { SurveyResponsePayload } from '@/services/offline/types';

export type { SubmitResult };

/** Optional pending task link — skipped offline to avoid blocking local queue. */
export async function resolvePendingTaskId(agentId: string): Promise<string | null> {
  if (!isOnline()) return null;

  try {
    const { data, error } = await supabase
      .from('agent_tasks')
      .select('id')
      .eq('agent_id', agentId)
      .eq('status', 'pending')
      .maybeSingle();

    if (error) {
      console.warn('Pending task lookup failed:', error.message);
      return null;
    }
    return data?.id ?? null;
  } catch (error) {
    console.warn('Pending task lookup skipped:', error);
    return null;
  }
}

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

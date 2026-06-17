import { idbGet, idbPut, idbGetByIndex } from './indexedDb';
import { STORES } from './indexedDb';
import type { CachedSurveyTemplate } from './types';

export async function cacheSurveyTemplates(
  workspaceId: string,
  templates: Omit<CachedSurveyTemplate, 'cachedAt' | 'workspaceId'>[]
): Promise<void> {
  const now = Date.now();
  for (const t of templates) {
    await idbPut<CachedSurveyTemplate>(STORES.surveyTemplates, {
      ...t,
      workspaceId,
      cachedAt: now,
    });
  }
}

export async function getCachedSurveyTemplate(id: string): Promise<CachedSurveyTemplate | undefined> {
  return idbGet<CachedSurveyTemplate>(STORES.surveyTemplates, id);
}

export async function getCachedSurveyTemplatesForWorkspace(
  workspaceId: string
): Promise<CachedSurveyTemplate[]> {
  return idbGetByIndex<CachedSurveyTemplate>(STORES.surveyTemplates, 'workspaceId', workspaceId);
}

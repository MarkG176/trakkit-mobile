import { submitOutboxOperation, type SubmitResult } from '@/services/offline/submitOperation';
import { saveFileAsAttachment } from '@/services/offline/attachmentStore';
import type { FieldNotePayload, ReportImagesPayload } from '@/services/offline/types';

export type { SubmitResult };

export async function submitFieldNote(params: {
  workspaceId: string;
  agentId: string;
  payload: FieldNotePayload;
}): Promise<SubmitResult> {
  return submitOutboxOperation({
    type: 'field_note',
    payload: params.payload,
    workspaceId: params.workspaceId,
    agentId: params.agentId,
  });
}

export async function submitReportImages(params: {
  workspaceId: string;
  agentId: string;
  files: File[];
  folder: string;
  bucket?: string;
}): Promise<SubmitResult> {
  const attachmentIds: string[] = [];
  for (const file of params.files) {
    attachmentIds.push(await saveFileAsAttachment(file));
  }

  const payload: ReportImagesPayload = {
    attachmentIds,
    bucket: params.bucket ?? 'store_images',
    folder: params.folder,
  };

  return submitOutboxOperation({
    type: 'report_images',
    payload,
    workspaceId: params.workspaceId,
    agentId: params.agentId,
  });
}

export async function submitReportImageFile(params: {
  workspaceId: string;
  agentId: string;
  file: File;
  folder: string;
  bucket?: string;
}): Promise<SubmitResult> {
  return submitReportImages({
    workspaceId: params.workspaceId,
    agentId: params.agentId,
    files: [params.file],
    folder: params.folder,
    bucket: params.bucket,
  });
}

const STOCK_LEVELS_KEY = 'reports_stock_levels';

export function saveReportsStockLevels(workspaceId: string, levels: Record<string, string>): void {
  try {
    localStorage.setItem(`${STOCK_LEVELS_KEY}_${workspaceId}`, JSON.stringify(levels));
  } catch {
    // ignore
  }
}

export function loadReportsStockLevels(workspaceId: string): Record<string, string> {
  try {
    const raw = localStorage.getItem(`${STOCK_LEVELS_KEY}_${workspaceId}`);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

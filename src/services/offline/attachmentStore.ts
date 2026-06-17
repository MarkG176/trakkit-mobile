import { idbDelete, idbGet, idbPut } from './indexedDb';
import { STORES } from './indexedDb';
import type { AttachmentRecord } from './types';

export function createAttachmentId(): string {
  return crypto.randomUUID();
}

export async function saveAttachment(
  blob: Blob,
  fileName: string,
  mimeType?: string
): Promise<string> {
  const id = createAttachmentId();
  const record: AttachmentRecord = {
    id,
    blob,
    mimeType: mimeType || blob.type || 'application/octet-stream',
    fileName,
    createdAt: Date.now(),
  };
  await idbPut(STORES.attachments, record);
  return id;
}

export async function getAttachment(id: string): Promise<AttachmentRecord | undefined> {
  return idbGet<AttachmentRecord>(STORES.attachments, id);
}

export async function deleteAttachment(id: string): Promise<void> {
  await idbDelete(STORES.attachments, id);
}

export async function saveFileAsAttachment(file: File): Promise<string> {
  return saveAttachment(file, file.name, file.type);
}

import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { randomBytes } from 'node:crypto';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

export const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
]);

export const MAX_BYTES = 5 * 1024 * 1024; // 5MB

export function extFromMime(mime: string): string {
  return ({
    'image/jpeg': '.jpg',
    'image/png':  '.png',
    'image/webp': '.webp',
    'image/gif':  '.gif',
    'application/pdf': '.pdf',
  } as Record<string, string>)[mime] ?? '.bin';
}

export interface SavedFile {
  url: string;       // public URL like /uploads/<estId>/<random>.<ext>
  fileName: string;  // original
  size: number;
  type: string;
}

export async function saveUpload(file: File, establishmentId: string): Promise<SavedFile> {
  if (!ALLOWED_MIME.has(file.type)) {
    throw new Error(`نوع غير مسموح: ${file.type || 'غير معروف'}`);
  }
  if (file.size > MAX_BYTES) {
    throw new Error(`الملف كبير (${(file.size / 1024 / 1024).toFixed(1)}MB). الحد ${(MAX_BYTES / 1024 / 1024).toFixed(0)}MB.`);
  }
  const dir = path.join(UPLOAD_DIR, establishmentId);
  await mkdir(dir, { recursive: true });

  const random = randomBytes(8).toString('hex');
  const ext = extFromMime(file.type);
  const filename = `${Date.now().toString(36)}_${random}${ext}`;
  const fullPath = path.join(dir, filename);

  const buf = Buffer.from(await file.arrayBuffer());
  await writeFile(fullPath, buf);

  return {
    url: `/uploads/${establishmentId}/${filename}`,
    fileName: file.name,
    size: file.size,
    type: file.type,
  };
}

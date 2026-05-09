'use client';

import { useState, useRef } from 'react';
import { Upload, X, FileText, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface UploadedFile {
  url: string;
  fileName: string;
  size: number;
  type: string;
}

/**
 * Generic single-file uploader. Calls onUploaded with the saved file metadata.
 * Display: drop zone + button. Shows progress + error state.
 */
export function FileUpload({
  onUploaded,
  accept = 'image/*,application/pdf',
  label = 'اختر ملف',
  className,
}: {
  onUploaded: (file: UploadedFile) => void | Promise<void>;
  accept?: string;
  label?: string;
  className?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? `HTTP ${res.status}`);
        }
        const saved = (await res.json()) as UploadedFile;
        await onUploaded(saved);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل الرفع.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div className={cn('space-y-2', className)}>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className={cn(
          'inline-flex items-center justify-center gap-2 px-4 h-10 rounded-md font-semibold text-sm',
          'bg-white border border-border text-ink-700 hover:bg-slate-50 transition-colors',
          'disabled:opacity-50'
        )}
      >
        {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
        <span>{uploading ? 'جارٍ الرفع…' : label}</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      {error && <p className="text-xs text-critical">{error}</p>}
    </div>
  );
}

/**
 * Single-image uploader with click-to-replace + preview.
 * Used for profile photos and brand logos.
 */
export function ImageUploadField({
  value,
  onChange,
  size = 96,
  shape = 'circle',
}: {
  value: string | null;
  onChange: (url: string | null) => void | Promise<void>;
  size?: number;
  shape?: 'circle' | 'square';
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  async function handleFile(files: FileList | null) {
    if (!files || files.length === 0) return;
    const file = files[0];
    setError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      const saved = (await res.json()) as UploadedFile;
      await onChange(saved.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل الرفع.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  const dim = `${size}px`;
  const radius = shape === 'circle' ? 'rounded-full' : 'rounded-md';

  return (
    <div className="inline-flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className={cn(
          radius,
          'relative overflow-hidden border-2 border-dashed border-border bg-slate-50 grid place-items-center',
          'hover:border-primary-500 hover:bg-primary-50 transition-colors disabled:opacity-50'
        )}
        style={{ width: dim, height: dim }}
      >
        {value ? (
          <img src={value} alt="" className="w-full h-full object-cover" />
        ) : (
          <Upload size={20} className="text-ink-400" />
        )}
        {uploading && (
          <div className="absolute inset-0 grid place-items-center bg-white/70">
            <Loader2 size={20} className="animate-spin text-primary-700" />
          </div>
        )}
      </button>
      {value && !uploading && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="flex items-center gap-1 text-xs text-critical hover:bg-red-50 px-2 py-1 rounded"
        >
          <X size={12} /> إزالة
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files)}
      />
      {error && <p className="text-xs text-critical">{error}</p>}
    </div>
  );
}

/**
 * Render a single attachment thumbnail (image preview or file card).
 * Click opens in new tab.
 */
export function AttachmentThumb({
  url,
  fileName,
  type,
  onRemove,
}: {
  url: string;
  fileName?: string;
  type?: string;
  onRemove?: () => void;
}) {
  const isImage = type ? type.startsWith('image/') : /\.(png|jpe?g|gif|webp)$/i.test(url);

  return (
    <div className="relative group">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          'block w-24 h-24 rounded-md overflow-hidden border border-border bg-slate-50',
          'hover:border-primary-500 transition-colors'
        )}
      >
        {isImage ? (
          <img src={url} alt={fileName ?? 'مرفق'} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full grid place-items-center text-ink-500">
            <FileText size={24} />
            <span className="text-[10px] mt-1 px-1 truncate w-full text-center">
              {fileName ?? 'PDF'}
            </span>
          </div>
        )}
      </a>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="absolute -top-1 -end-1 w-6 h-6 grid place-items-center rounded-full bg-critical text-white opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="إزالة"
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
}

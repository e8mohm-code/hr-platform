'use client';

import { useState, useTransition } from 'react';
import { Camera, FileText as FileIcon, X, Trash2, ImagePlus } from 'lucide-react';
import { Card, CardBody, CardTitle } from '@/components/ui/Card';
import { ImageUploadField, FileUpload } from '@/components/ui/FileUpload';
import { setEmployeePhoto, addEmployeeDocument, removeEmployeeDocument } from '../document-actions';

const DOC_TYPES: Array<{ key: string; label: string; emoji: string }> = [
  { key: 'IQAMA',       label: 'صورة الإقامة',     emoji: '🆔' },
  { key: 'PASSPORT',    label: 'صورة الجواز',      emoji: '📘' },
  { key: 'CONTRACT',    label: 'صورة العقد',       emoji: '📄' },
  { key: 'HEALTH_CARD', label: 'صورة الكرت الصحي', emoji: '🩺' },
  { key: 'OTHER',       label: 'أخرى',             emoji: '📎' },
];

interface DocImage {
  id: string;
  type: string;
  url: string;
  fileName: string | null;
}

export function EmployeePhotos({
  employeeId,
  photoUrl,
  documents,
}: {
  employeeId: string;
  photoUrl: string | null;
  documents: DocImage[];
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handlePhoto = (url: string | null) => {
    startTransition(async () => {
      const r = await setEmployeePhoto(employeeId, url);
      if (!r.ok) setError(r.error);
    });
  };

  const docsByType = (type: string) => documents.filter((d) => d.type === type);

  const handleAdd = (type: string) => async (saved: { url: string; fileName: string; type: string }) => {
    setError(null);
    const r = await addEmployeeDocument(employeeId, type, saved.url, saved.fileName);
    if (!r.ok) setError(r.error);
  };

  const handleRemove = (id: string) => {
    if (!confirm('حذف هذا المرفق؟')) return;
    startTransition(async () => {
      const r = await removeEmployeeDocument(employeeId, id);
      if (!r.ok) setError(r.error);
    });
  };

  return (
    <>
      {error && (
        <div className="p-3 mb-3 rounded-md bg-red-50 border border-red-200 text-critical text-sm">
          {error}
        </div>
      )}

      {/* Profile photo */}
      <Card>
        <CardBody>
          <div className="flex items-center gap-2 text-ink-700 mb-4">
            <span className="w-8 h-8 rounded-md bg-primary-50 text-primary-700 grid place-items-center">
              <Camera size={18} />
            </span>
            <CardTitle>الصورة الشخصية</CardTitle>
          </div>
          <div className="flex justify-center">
            <ImageUploadField value={photoUrl} onChange={handlePhoto} size={140} shape="circle" />
          </div>
          <p className="text-xs text-ink-500 text-center mt-3">
            تظهر هذه الصورة في القائمة وفي الداشبورد ومع كل إجراء.
          </p>
        </CardBody>
      </Card>

      {/* Document images */}
      <Card>
        <CardBody>
          <div className="flex items-center gap-2 text-ink-700 mb-4">
            <span className="w-8 h-8 rounded-md bg-primary-50 text-primary-700 grid place-items-center">
              <FileIcon size={18} />
            </span>
            <CardTitle>صور الوثائق</CardTitle>
          </div>

          <div className="space-y-5">
            {DOC_TYPES.map((dt) => (
              <div key={dt.key}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-bold text-ink-700">
                    <span className="me-1">{dt.emoji}</span> {dt.label}
                  </h4>
                  <FileUpload
                    label={
                      docsByType(dt.key).length === 0
                        ? 'إضافة صورة'
                        : 'إضافة المزيد'
                    }
                    accept="image/*,.pdf"
                    onUploaded={handleAdd(dt.key)}
                  />
                </div>
                {docsByType(dt.key).length === 0 ? (
                  <div className="border border-dashed border-border rounded-md p-4 text-center text-sm text-ink-400">
                    لم تُرفع صور بعد.
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                    {docsByType(dt.key).map((d) => (
                      <DocCard key={d.id} doc={d} onRemove={() => handleRemove(d.id)} pending={isPending} />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </>
  );
}

function DocCard({ doc, onRemove, pending }: { doc: DocImage; onRemove: () => void; pending: boolean }) {
  const isImage = /\.(png|jpe?g|gif|webp)$/i.test(doc.url);
  return (
    <div className="relative group">
      <a
        href={doc.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block aspect-square rounded-md overflow-hidden border border-border bg-slate-50 hover:border-primary-500 transition-colors"
      >
        {isImage ? (
          <img src={doc.url} alt={doc.fileName ?? ''} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full grid place-items-center text-ink-500">
            <FileIcon size={28} />
            <span className="text-[10px] mt-1 px-1 truncate w-full text-center">
              {doc.fileName ?? 'PDF'}
            </span>
          </div>
        )}
      </a>
      <button
        type="button"
        onClick={onRemove}
        disabled={pending}
        className="absolute top-1 end-1 w-6 h-6 grid place-items-center rounded-full bg-critical text-white opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-30"
        aria-label="حذف"
      >
        <X size={12} />
      </button>
    </div>
  );
}

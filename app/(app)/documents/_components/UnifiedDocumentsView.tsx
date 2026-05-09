'use client';

import { useState, useTransition, useMemo } from 'react';
import {
  Plus, Pencil, Trash2, RefreshCw, Archive, ArrowRightLeft,
  Paperclip, Search, FileText as FileIcon, ArchiveRestore,
} from 'lucide-react';
import { Card, CardBody } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Pill } from '@/components/ui/Pill';
import { EmptyState } from '@/components/ui/EmptyState';
import { Select } from '@/components/ui/Select';
import { FileUpload, AttachmentThumb } from '@/components/ui/FileUpload';
import { fmtShortDate, cn } from '@/lib/utils';
import { tierFromDate } from '@/lib/alerts';
import { RegistrationDialog, type RegistrationData } from './RegistrationDialog';
import { LicenseDialog, type LicenseData } from './LicenseDialog';
import {
  deleteRegistration, deleteLicense,
  renewRegistrationOneYear, renewLicenseOneYear,
  archiveRegistration, archiveLicense,
  transferLicense,
  addRegistrationAttachment, removeRegistrationAttachment,
  addLicenseAttachment, removeLicenseAttachment,
} from '../actions';

type Kind = 'registration' | 'license';

export interface UnifiedDoc {
  id: string;
  kind: Kind;
  type: string;
  number: string;
  authority: string | null;
  branchId: string | null;
  branchName: string | null;
  brandName: string | null;
  brandLogoUrl: string | null;
  issueDate: Date | null;
  expiryDate: Date;
  archived: boolean;
  attachments: Array<{ url: string; fileName: string; type: string; uploadedAt: string }>;
}

interface Branch { id: string; name: string; brand: string | null; }

const KIND_FILTER = [
  { key: 'all', label: 'الكل' },
  { key: 'registration', label: 'سجلات تجارية' },
  { key: 'license', label: 'تراخيص' },
];

export function UnifiedDocumentsView({
  docs,
  branches,
}: {
  docs: UnifiedDoc[];
  branches: Branch[];
}) {
  const [search, setSearch] = useState('');
  const [kindFilter, setKindFilter] = useState<string>('all');
  const [showArchived, setShowArchived] = useState(false);
  const [regDialog, setRegDialog] = useState<{ mode: 'create' | 'edit'; data?: RegistrationData } | null>(null);
  const [licDialog, setLicDialog] = useState<{ mode: 'create' | 'edit'; data?: LicenseData } | null>(null);
  const [transferTarget, setTransferTarget] = useState<UnifiedDoc | null>(null);
  const [attachmentTarget, setAttachmentTarget] = useState<UnifiedDoc | null>(null);
  const [, startTransition] = useTransition();

  const filtered = useMemo(() => {
    let list = docs;
    if (!showArchived) list = list.filter((d) => !d.archived);
    if (kindFilter !== 'all') list = list.filter((d) => d.kind === kindFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((d) =>
        [d.type, d.number, d.authority, d.branchName].some(
          (v) => v && v.toLowerCase().includes(q)
        )
      );
    }
    return list;
  }, [docs, kindFilter, search, showArchived]);

  const archivedCount = docs.filter((d) => d.archived).length;

  const handleDelete = (doc: UnifiedDoc) => {
    if (!confirm(`حذف "${doc.type} ${doc.number}" نهائياً؟`)) return;
    startTransition(async () => {
      const r = doc.kind === 'registration'
        ? await deleteRegistration(doc.id)
        : await deleteLicense(doc.id);
      if (!r.ok) alert(r.error);
    });
  };

  const handleRenew = (doc: UnifiedDoc) => {
    startTransition(async () => {
      const r = doc.kind === 'registration'
        ? await renewRegistrationOneYear(doc.id)
        : await renewLicenseOneYear(doc.id);
      if (!r.ok) alert(r.error);
    });
  };

  const handleArchive = (doc: UnifiedDoc) => {
    const action = doc.archived ? 'إعادة التفعيل' : 'الشطب';
    if (!confirm(`${action} "${doc.type} ${doc.number}"؟`)) return;
    startTransition(async () => {
      const r = doc.kind === 'registration'
        ? await archiveRegistration(doc.id)
        : await archiveLicense(doc.id);
      if (!r.ok) alert(r.error);
    });
  };

  const handleEdit = (doc: UnifiedDoc) => {
    if (doc.kind === 'registration') {
      setRegDialog({
        mode: 'edit',
        data: {
          id: doc.id,
          type: doc.type,
          number: doc.number,
          issueDate: doc.issueDate?.toISOString().slice(0, 10) ?? null,
          expiryDate: doc.expiryDate.toISOString().slice(0, 10),
        },
      });
    } else {
      setLicDialog({
        mode: 'edit',
        data: {
          id: doc.id,
          branchId: doc.branchId ?? '',
          type: doc.type,
          authority: doc.authority,
          number: doc.number,
          issueDate: doc.issueDate?.toISOString().slice(0, 10) ?? null,
          expiryDate: doc.expiryDate.toISOString().slice(0, 10),
        },
      });
    }
  };

  return (
    <>
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap bg-white border border-border rounded-md p-3">
        <div className="flex items-center gap-3 flex-wrap flex-1">
          <div className="flex-1 min-w-60 max-w-md">
            <Input
              type="search"
              placeholder="ابحث بالنوع، الرقم، الجهة، أو الفرع…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search size={16} />}
            />
          </div>
          <Select value={kindFilter} onChange={(e) => setKindFilter(e.target.value)} className="max-w-44">
            {KIND_FILTER.map((k) => <option key={k.key} value={k.key}>{k.label}</option>)}
          </Select>
          {archivedCount > 0 && (
            <label className="flex items-center gap-2 text-sm text-ink-700 cursor-pointer">
              <input
                type="checkbox"
                checked={showArchived}
                onChange={(e) => setShowArchived(e.target.checked)}
                className="w-4 h-4 rounded border-border accent-primary-600"
              />
              <span>إظهار المشطوبة ({archivedCount})</span>
            </label>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" leftIcon={<Plus size={16} />} onClick={() => setRegDialog({ mode: 'create' })}>
            سجل تجاري
          </Button>
          <Button leftIcon={<Plus size={16} />} onClick={() => setLicDialog({ mode: 'create' })}>
            ترخيص
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<FileIcon size={20} />}
          title="لا توجد وثائق"
          description="ابدأ بإضافة سجل تجاري أو ترخيص."
        />
      ) : (
        <Card>
          <CardBody className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-border text-xs font-bold uppercase tracking-wider text-ink-500">
                    <th className="text-start px-4 py-3">النوع/الرقم</th>
                    <th className="text-start px-4 py-3">الفرع/الجهة</th>
                    <th className="text-start px-4 py-3">الانتهاء</th>
                    <th className="text-start px-4 py-3">الحالة</th>
                    <th className="text-start px-4 py-3">المرفقات</th>
                    <th className="text-start px-4 py-3 w-44">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((doc) => {
                    const tier = tierFromDate(doc.expiryDate);
                    return (
                      <tr key={doc.id} className={cn(
                        'border-b border-border last:border-0 transition-colors',
                        doc.archived ? 'opacity-50 bg-slate-50' : 'hover:bg-slate-50'
                      )}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-ink-900">{doc.type}</span>
                            <Pill variant={doc.kind === 'registration' ? 'primary' : 'neutral'}>
                              {doc.kind === 'registration' ? 'سجل' : 'ترخيص'}
                            </Pill>
                          </div>
                          <div className="text-xs text-ink-500 mt-0.5" dir="ltr">{doc.number}</div>
                        </td>
                        <td className="px-4 py-3">
                          {doc.branchName ? (
                            <div className="flex items-center gap-2">
                              {doc.brandLogoUrl && (
                                <img src={doc.brandLogoUrl} alt="" className="w-6 h-6 rounded object-cover" />
                              )}
                              <div>
                                <div className="text-ink-700">{doc.branchName}</div>
                                {doc.authority && <div className="text-xs text-ink-500">{doc.authority}</div>}
                              </div>
                            </div>
                          ) : (
                            <span className="text-ink-700">{doc.authority ?? 'مستوى المنشأة'}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-ink-700">{fmtShortDate(doc.expiryDate)}</td>
                        <td className="px-4 py-3">
                          {doc.archived ? (
                            <Pill variant="neutral">مشطوب</Pill>
                          ) : (
                            <Pill variant={tierToVariant(tier.key)}>{tier.label}</Pill>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {doc.attachments.length > 0 ? (
                            <button
                              onClick={() => setAttachmentTarget(doc)}
                              className="inline-flex items-center gap-1 text-sm text-primary-700 hover:underline"
                            >
                              <Paperclip size={14} />
                              <span>{doc.attachments.length}</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => setAttachmentTarget(doc)}
                              className="inline-flex items-center gap-1 text-xs text-ink-400 hover:text-primary-700"
                            >
                              <Paperclip size={12} />
                              <span>إضافة</span>
                            </button>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <ActionBtn
                              title="تجديد سنوي"
                              icon={<RefreshCw size={14} />}
                              variant="primary"
                              onClick={() => handleRenew(doc)}
                              disabled={doc.archived}
                            />
                            {doc.kind === 'license' && (
                              <ActionBtn
                                title="نقل ملكية"
                                icon={<ArrowRightLeft size={14} />}
                                variant="secondary"
                                onClick={() => setTransferTarget(doc)}
                                disabled={doc.archived}
                              />
                            )}
                            <ActionBtn
                              title={doc.archived ? 'إعادة تفعيل' : 'شطب'}
                              icon={doc.archived ? <ArchiveRestore size={14} /> : <Archive size={14} />}
                              variant="secondary"
                              onClick={() => handleArchive(doc)}
                            />
                            <ActionBtn
                              title="تعديل"
                              icon={<Pencil size={14} />}
                              variant="secondary"
                              onClick={() => handleEdit(doc)}
                            />
                            <ActionBtn
                              title="حذف"
                              icon={<Trash2 size={14} />}
                              variant="danger"
                              onClick={() => handleDelete(doc)}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      )}

      {regDialog && (
        <RegistrationDialog
          mode={regDialog.mode}
          data={regDialog.data}
          onClose={() => setRegDialog(null)}
        />
      )}

      {licDialog && (
        <LicenseDialog
          mode={licDialog.mode}
          branches={branches}
          data={licDialog.data}
          onClose={() => setLicDialog(null)}
        />
      )}

      {transferTarget && (
        <TransferDialog
          doc={transferTarget}
          branches={branches}
          onClose={() => setTransferTarget(null)}
        />
      )}

      {attachmentTarget && (
        <AttachmentDialog
          doc={attachmentTarget}
          onClose={() => setAttachmentTarget(null)}
        />
      )}
    </>
  );
}

function ActionBtn({
  title, icon, variant, onClick, disabled,
}: {
  title: string;
  icon: React.ReactNode;
  variant: 'primary' | 'secondary' | 'danger';
  onClick: () => void;
  disabled?: boolean;
}) {
  const styles = {
    primary: 'text-primary-700 hover:bg-primary-50',
    secondary: 'text-ink-700 hover:bg-slate-200',
    danger: 'text-ink-500 hover:bg-red-50 hover:text-critical',
  }[variant];
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        'w-8 h-8 grid place-items-center rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed',
        styles
      )}
    >
      {icon}
    </button>
  );
}

function tierToVariant(tier: string): 'critical' | 'warning' | 'safe' | 'neutral' {
  if (tier === 'expired' || tier === 'critical') return 'critical';
  if (tier === 'warning') return 'warning';
  if (tier === 'safe') return 'safe';
  return 'neutral';
}

function TransferDialog({
  doc, branches, onClose,
}: {
  doc: UnifiedDoc;
  branches: Branch[];
  onClose: () => void;
}) {
  const [newBranchId, setNewBranchId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = () => {
    if (!newBranchId) { setError('اختر فرعاً.'); return; }
    setError(null);
    startTransition(async () => {
      const r = await transferLicense(doc.id, newBranchId);
      if (!r.ok) { setError(r.error); return; }
      onClose();
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-ink-900/50 grid place-items-center p-4 animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-slide-up">
        <div className="p-5 border-b border-border">
          <h3 className="text-lg font-bold text-ink-900">نقل ملكية الترخيص</h3>
          <p className="text-sm text-ink-500 mt-1">{doc.type} — {doc.number}</p>
          <p className="text-xs text-ink-500 mt-1">من: <span className="font-semibold">{doc.branchName}</span></p>
        </div>
        <div className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-md bg-red-50 border border-red-200 text-critical text-sm">{error}</div>
          )}
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1.5">الفرع الجديد *</label>
            <Select value={newBranchId} onChange={(e) => setNewBranchId(e.target.value)} required>
              <option value="">— اختر فرعاً —</option>
              {branches.filter((b) => b.id !== doc.branchId).map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </Select>
          </div>
        </div>
        <div className="p-5 border-t border-border flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>إلغاء</Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? 'جارٍ النقل…' : 'نقل'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function AttachmentDialog({ doc, onClose }: { doc: UnifiedDoc; onClose: () => void }) {
  const [, startTransition] = useTransition();

  const handleAdd = async (saved: { url: string; fileName: string; type: string }) => {
    const r = doc.kind === 'registration'
      ? await addRegistrationAttachment(doc.id, saved)
      : await addLicenseAttachment(doc.id, saved);
    if (!r.ok) alert(r.error);
  };

  const handleRemove = (url: string) => {
    if (!confirm('حذف هذا المرفق؟')) return;
    startTransition(async () => {
      const r = doc.kind === 'registration'
        ? await removeRegistrationAttachment(doc.id, url)
        : await removeLicenseAttachment(doc.id, url);
      if (!r.ok) alert(r.error);
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-ink-900/50 grid place-items-center p-4 animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-auto animate-slide-up">
        <div className="p-5 border-b border-border">
          <h3 className="text-lg font-bold text-ink-900">مرفقات الوثيقة</h3>
          <p className="text-sm text-ink-500 mt-1">{doc.type} — {doc.number}</p>
        </div>
        <div className="p-5 space-y-4">
          <FileUpload
            label="إضافة صورة أو PDF"
            accept="image/*,.pdf"
            onUploaded={handleAdd}
          />

          {doc.attachments.length === 0 ? (
            <p className="text-sm text-ink-500 text-center py-8">لا توجد مرفقات بعد.</p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {doc.attachments.map((a) => (
                <AttachmentThumb
                  key={a.url}
                  url={a.url}
                  fileName={a.fileName}
                  type={a.type}
                  onRemove={() => handleRemove(a.url)}
                />
              ))}
            </div>
          )}
        </div>
        <div className="p-5 border-t border-border flex justify-end">
          <Button variant="ghost" onClick={onClose}>إغلاق</Button>
        </div>
      </div>
    </div>
  );
}

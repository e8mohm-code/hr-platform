'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { Plus, X, Check, Clock, StickyNote, ArrowLeft } from 'lucide-react';
import { Card, CardBody, CardTitle, CardSub } from '@/components/ui/Card';
import { Input, Label } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { fmtShortDate, daysUntil, cn } from '@/lib/utils';
import { createReminder, toggleReminder, deleteReminder } from '@/app/(app)/reminders/actions';

interface Reminder {
  id: string;
  title: string;
  body: string | null;
  dueDate: Date | null;
  completed: boolean;
  employee: { id: string; fullName: string; photoUrl: string | null } | null;
}

export function RemindersWidget({ reminders }: { reminders: Reminder[] }) {
  const [adding, setAdding] = useState(false);
  const [, startTransition] = useTransition();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const due = reminders.filter((r) => {
    if (!r.dueDate) return false;
    const d = new Date(r.dueDate);
    d.setHours(0, 0, 0, 0);
    return d.getTime() <= today.getTime();
  });

  const handleToggle = (id: string) => {
    startTransition(async () => {
      const r = await toggleReminder(id);
      if (!r.ok) alert(r.error);
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm('حذف هذا التذكير؟')) return;
    startTransition(async () => {
      const r = await deleteReminder(id);
      if (!r.ok) alert(r.error);
    });
  };

  return (
    <Card>
      <CardBody>
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-md bg-amber-50 text-warning grid place-items-center">
              <StickyNote size={18} />
            </span>
            <div>
              <CardTitle>المذكرة والتذكيرات</CardTitle>
              <CardSub>
                {due.length > 0
                  ? `${due.length} تذكير مستحق اليوم`
                  : 'تذكيرات نشطة'}
              </CardSub>
            </div>
          </div>
          <button
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1 text-sm font-semibold text-primary-700 hover:bg-primary-50 px-2 py-1 rounded"
          >
            <Plus size={14} /> إضافة
          </button>
        </div>

        {adding && (
          <ReminderForm onClose={() => setAdding(false)} />
        )}

        {reminders.length === 0 ? (
          <div className="text-center py-6 text-sm text-ink-500">
            لا توجد تذكيرات. أضف مهام أو ملاحظات تذكيرية.
          </div>
        ) : (
          <ul className="space-y-2 max-h-[320px] overflow-y-auto scrollbar-thin pe-1">
            {reminders.map((r) => {
              const days = r.dueDate ? daysUntil(r.dueDate) : null;
              const isOverdue = days !== null && days < 0;
              const isDueSoon = days !== null && days >= 0 && days <= 3;
              return (
                <li
                  key={r.id}
                  className={cn(
                    'group flex items-start gap-3 p-3 rounded-md border transition-colors',
                    isOverdue ? 'bg-red-50 border-red-200' :
                    isDueSoon ? 'bg-amber-50 border-amber-200' :
                    'bg-slate-50 border-slate-200'
                  )}
                >
                  <button
                    onClick={() => handleToggle(r.id)}
                    className={cn(
                      'w-5 h-5 mt-0.5 rounded border grid place-items-center shrink-0 transition-colors',
                      'hover:border-primary-500'
                    )}
                  >
                    {r.completed && <Check size={12} className="text-safe" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-ink-900 text-sm">{r.title}</span>
                      {r.employee && (
                        <Link
                          href={`/employees/${r.employee.id}`}
                          className="inline-flex items-center gap-1 text-xs text-primary-700 hover:underline"
                        >
                          {r.employee.photoUrl && (
                            <img src={r.employee.photoUrl} alt="" className="w-4 h-4 rounded-full object-cover" />
                          )}
                          {r.employee.fullName}
                        </Link>
                      )}
                    </div>
                    {r.body && <p className="text-xs text-ink-700 mt-1">{r.body}</p>}
                    {r.dueDate && (
                      <div className="flex items-center gap-1 mt-1 text-xs">
                        <Clock size={11} className="text-ink-500" />
                        <span className={cn(
                          isOverdue ? 'text-critical font-bold' :
                          isDueSoon ? 'text-warning font-semibold' :
                          'text-ink-500'
                        )}>
                          {fmtShortDate(r.dueDate)}
                          {days !== null && (
                            <span className="ms-1">
                              {days < 0 ? `(متأخر ${Math.abs(days)} يوم)` :
                               days === 0 ? '(اليوم)' :
                               `(${days} يوم)`}
                            </span>
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(r.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 grid place-items-center text-ink-400 hover:text-critical hover:bg-red-100 rounded"
                    aria-label="حذف"
                  >
                    <X size={14} />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}

function ReminderForm({
  onClose,
  employeeId,
}: {
  onClose: () => void;
  employeeId?: string | null;
}) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const submit = () => {
    if (!title.trim()) { setError('العنوان مطلوب.'); return; }
    setError(null);
    startTransition(async () => {
      const r = await createReminder({
        title: title.trim(),
        body: body.trim() || null,
        dueDate: dueDate || null,
        employeeId: employeeId ?? null,
      });
      if (!r.ok) { setError(r.error); return; }
      setTitle(''); setBody(''); setDueDate('');
      onClose();
    });
  };

  return (
    <div className="border border-primary-100 rounded-md bg-primary-50/50 p-3 mb-3 space-y-2">
      {error && <p className="text-xs text-critical">{error}</p>}
      <Input
        placeholder="العنوان (مثلاً: تجديد إقامة فيصل)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        autoFocus
      />
      <Textarea
        placeholder="ملاحظات (اختياري)"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={2}
      />
      <div className="flex items-center gap-2">
        <Input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="flex-1"
        />
        <Button size="sm" onClick={submit} disabled={isPending}>
          {isPending ? 'جارٍ الحفظ…' : 'حفظ'}
        </Button>
        <Button size="sm" variant="ghost" onClick={onClose}>إلغاء</Button>
      </div>
    </div>
  );
}

export { ReminderForm };

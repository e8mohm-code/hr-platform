import {
  IdCard, FileText, HeartPulse, Plane, ArrowRightLeft, LogOut,
  AlertTriangle, CalendarOff, Sparkles, Archive,
} from 'lucide-react';
import { Card, CardBody, CardTitle } from '@/components/ui/Card';
import { Pill } from '@/components/ui/Pill';
import { fmtDate } from '@/lib/utils';

interface Entry {
  id: string;
  ts: Date;
  channel: string;
  actionType: string | null;
  subject: string;
  body: string | null;
  status: string;
}

const ICONS: Record<string, { icon: React.ElementType; bg: string; fg: string }> = {
  renew_iqama:       { icon: IdCard,          bg: 'bg-primary-50',  fg: 'text-primary-700' },
  renew_contract:    { icon: FileText,        bg: 'bg-primary-50',  fg: 'text-primary-700' },
  renew_health:      { icon: HeartPulse,      bg: 'bg-green-50',    fg: 'text-safe' },
  exit_reentry_visa: { icon: Plane,           bg: 'bg-blue-50',     fg: 'text-blue-700' },
  transfer_branch:   { icon: ArrowRightLeft,  bg: 'bg-amber-50',    fg: 'text-amber-700' },
  resignation:       { icon: LogOut,          bg: 'bg-amber-50',    fg: 'text-warning' },
  final_exit:        { icon: LogOut,          bg: 'bg-red-50',      fg: 'text-critical' },
  warning:           { icon: AlertTriangle,   bg: 'bg-red-50',      fg: 'text-critical' },
  vacation:          { icon: CalendarOff,     bg: 'bg-blue-50',     fg: 'text-blue-700' },
};

const DEFAULT_ICON = { icon: Sparkles, bg: 'bg-slate-100', fg: 'text-ink-500' };

export function EmployeeArchive({ entries }: { entries: Entry[] }) {
  return (
    <Card>
      <CardBody>
        <div className="flex items-center gap-2 text-ink-700 mb-4">
          <span className="w-8 h-8 rounded-md bg-primary-50 text-primary-700 grid place-items-center">
            <Archive size={18} />
          </span>
          <CardTitle>أرشيف الإجراءات</CardTitle>
          <span className="text-xs text-ink-500 me-auto">{entries.length} سجل</span>
        </div>

        {entries.length === 0 ? (
          <p className="text-sm text-ink-500 py-6 text-center">
            لا توجد إجراءات مسجّلة بعد. ابدأ من لوحة الإجراءات في الأعلى.
          </p>
        ) : (
          <ol className="space-y-3 max-h-[560px] overflow-y-auto scrollbar-thin pe-2">
            {entries.map((e) => {
              const meta = (e.actionType && ICONS[e.actionType]) || DEFAULT_ICON;
              const Icon = meta.icon;
              return (
                <li key={e.id} className="flex gap-3 items-start">
                  <span className={`w-9 h-9 shrink-0 rounded-md grid place-items-center ${meta.bg} ${meta.fg}`}>
                    <Icon size={16} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-ink-900 text-sm">{e.subject}</span>
                      {e.status === 'warning' && <Pill variant="critical">{e.status}</Pill>}
                    </div>
                    {e.body && <p className="text-sm text-ink-700 mt-0.5">{e.body}</p>}
                    <div className="text-xs text-ink-400 mt-1" dir="ltr">
                      {new Date(e.ts).toLocaleString('ar-SA', { dateStyle: 'medium', timeStyle: 'short' })}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </CardBody>
    </Card>
  );
}

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Building2,
  Tag,
  FileText,
  Wallet,
  BarChart3,
  Settings,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/dashboard',  label: 'لوحة التحكم',  icon: LayoutDashboard },
  { href: '/employees',  label: 'العمالة',       icon: Users },
  { href: '/brands',     label: 'البراندات',      icon: Tag },
  { href: '/branches',   label: 'الفروع',         icon: Building2 },
  { href: '/documents',  label: 'التراخيص',       icon: FileText },
  { href: '/payroll',    label: 'الرواتب',       icon: Wallet },
  { href: '/reports',    label: 'التقارير',      icon: BarChart3 },
  { href: '/settings',   label: 'الإعدادات',     icon: Settings },
];

export function Sidebar({ userName, userEmail }: { userName?: string; userEmail?: string }) {
  const pathname = usePathname();

  return (
    <aside
      className="hidden lg:flex flex-col shrink-0 bg-surface border-l border-border h-screen sticky top-0"
      style={{ width: 260 }}
    >
      {/* Brand */}
      <div className="px-6 py-5 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md bg-primary-600 grid place-items-center text-white font-bold text-body">
            HR
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-gray-900 text-body truncate">
              منصة الموارد البشرية
            </div>
            <div className="text-small text-gray-500">إدارة الامتثال</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-md text-body font-medium',
                'transition-colors duration-200 ease-out-soft',
                isActive
                  ? 'bg-primary-50 text-primary-600'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="border-t border-border p-3">
        <div className="flex items-center gap-3 px-2 py-2 mb-1">
          <div className="w-9 h-9 rounded-full bg-primary-50 grid place-items-center text-primary-600 font-semibold text-body shrink-0">
            {(userName ?? userEmail ?? '?').charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-gray-900 text-body font-medium truncate">
              {userName ?? '—'}
            </div>
            <div className="text-small text-gray-500 truncate">
              {userEmail ?? ''}
            </div>
          </div>
        </div>
        <form action="/api/auth/signout" method="POST">
          <button
            type="submit"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-body font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors duration-200 ease-out-soft"
          >
            <LogOut size={18} />
            <span>تسجيل الخروج</span>
          </button>
        </form>
      </div>
    </aside>
  );
}

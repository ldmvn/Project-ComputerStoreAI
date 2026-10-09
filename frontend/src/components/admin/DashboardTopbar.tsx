'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Home, Menu, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import AdminUserMenu from './AdminUserMenu';

type DashboardTopbarProps = {
  collapsed: boolean;
  onToggleSidebar: () => void;
  onOpenMobileSidebar: () => void;
};

export default function DashboardTopbar({ collapsed, onToggleSidebar, onOpenMobileSidebar }: DashboardTopbarProps) {
  const user = useAuthStore((state) => state.user);

  return (
    <header className="site-header h-[var(--header-main-height)] shrink-0 border-b">
      <div className="flex h-full w-full items-center gap-3 px-4 sm:px-6 lg:px-8">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          className="ui-header-action inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-600 transition-colors duration-200 hover:bg-slate-100 hover:text-slate-900 lg:hidden"
          aria-label="Mở menu dashboard"
          title="Mở menu dashboard"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={onToggleSidebar}
          className="ui-header-action hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-600 transition-colors duration-200 hover:bg-slate-100 hover:text-slate-900 lg:inline-flex"
          aria-label={collapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
          title={collapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
        >
          {collapsed ? <PanelLeftOpen className="h-5 w-5" aria-hidden="true" /> : <PanelLeftClose className="h-5 w-5" aria-hidden="true" />}
        </button>
        <Link href="/admin/dashboard" className="shrink-0" aria-label="Trang chủ quản trị">
          <Image src="/logo.png" alt="DUCMANH PC" width={120} height={52} className="h-9 w-auto object-contain" priority />
        </Link>
      </div>
      <div className="ml-auto flex shrink-0 items-center justify-end gap-2 sm:gap-4">
        <Link
          href="/"
          className="ui-header-action inline-flex h-10 items-center gap-2 rounded-xl px-2.5 text-sm font-medium text-slate-600 transition-colors duration-200 hover:bg-slate-100 hover:text-slate-900 sm:px-3"
          title="Xem cửa hàng"
        >
          <Home className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Xem cửa hàng</span>
          <span className="sr-only sm:hidden">Xem cửa hàng</span>
        </Link>
        <div className="hidden h-7 w-px bg-slate-200 sm:block" aria-hidden="true" />
        {user && <AdminUserMenu user={user} />}
      </div>
      </div>
    </header>
  );
}

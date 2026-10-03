'use client';

import Link from 'next/link';
import { Home, Menu, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { dashboardMenuItems } from './menu.config';
import AdminUserMenu from './AdminUserMenu';

type DashboardTopbarProps = {
  collapsed: boolean;
  onToggleSidebar: () => void;
  onOpenMobileSidebar: () => void;
};

export default function DashboardTopbar({ collapsed, onToggleSidebar, onOpenMobileSidebar }: DashboardTopbarProps) {
  const user = useAuthStore((state) => state.user);
  const pathname = usePathname();
  const page = dashboardMenuItems.find((item) => item.path === pathname);

  return (
    <header className="site-header h-[var(--header-main-height)] shrink-0 border-b">
      <div className="flex h-full w-full items-center gap-4 px-4 sm:px-6 lg:px-8">
      <div className="flex min-w-0 flex-1 items-center gap-2.5 sm:gap-4">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          className="ui-header-action inline-flex h-10 w-10 items-center justify-center rounded-xl text-white transition-colors duration-200 hover:bg-white/15 hover:text-white lg:hidden"
          aria-label="Mở menu dashboard"
          title="Mở menu dashboard"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={onToggleSidebar}
          className="ui-header-action hidden h-10 w-10 items-center justify-center rounded-xl text-white transition-colors duration-200 hover:bg-white/15 hover:text-white lg:inline-flex"
          aria-label={collapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
          title={collapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
        >
          {collapsed ? <PanelLeftOpen className="h-5 w-5" aria-hidden="true" /> : <PanelLeftClose className="h-5 w-5" aria-hidden="true" />}
        </button>
        <div className="min-w-0 py-0.5">
          <p className="truncate text-base font-semibold leading-5 tracking-tight text-white sm:text-[17px]">DUCMANH PC</p>
          <p className="hidden truncate pt-0.5 text-xs leading-4 text-white/75 sm:block">Quản trị / {page?.label || 'Tổng quan'}</p>
        </div>
      </div>
      <div className="ml-auto flex shrink-0 items-center justify-end gap-2 sm:gap-4">
        <Link
          href="/"
          className="ui-header-action inline-flex h-10 items-center gap-2 rounded-xl px-2.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-white/15 hover:text-white sm:px-3"
          title="Xem cửa hàng"
          aria-label="Về trang chủ"
        >
          <Home className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Xem cửa hàng</span>
        </Link>
        <div className="hidden h-7 w-px bg-white/25 sm:block" aria-hidden="true" />
        {user && <AdminUserMenu user={user} />}
      </div>
      </div>
    </header>
  );
}

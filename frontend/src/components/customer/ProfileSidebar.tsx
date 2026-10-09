'use client';
/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ClipboardList, Lock, MapPin, Star, User, LogOut } from 'lucide-react';
import { mediaUrl } from '@/services/http.client';
import { useAuthStore } from '@/store/auth.store';
import type { AuthUser } from '@/types/user.type';

const navItems = [
  { href: '/customer/profile',           label: 'Thông tin tài khoản', icon: User,             exact: true },
  { href: '/customer/profile/orders',    label: 'Đơn hàng của tôi',    icon: ClipboardList                 },
  { href: '/customer/profile/addresses', label: 'Sổ địa chỉ',          icon: MapPin                        },
  { href: '/customer/profile/reviews',   label: 'Đánh giá của tôi',    icon: Star                          },
  { href: '/customer/profile/password',  label: 'Bảo mật tài khoản',   icon: Lock                          },
];

function getInitials(name: string) {
  return name.trim().split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

export default function ProfileSidebar({ user }: { user: AuthUser }) {
  const pathname  = usePathname();
  const router    = useRouter();
  const { logout } = useAuthStore();

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <>
      {/* ── Mobile: horizontal scrollable nav ── */}
      <nav aria-label="Menu tài khoản" className="lg:hidden">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {navItems.map(({ href, label, icon: Icon, exact }) => {
            const active = isActive(href, exact);
            return (
              <Link
                key={href}
                href={href}
                title={label}
                className={`flex shrink-0 flex-col items-center gap-1 rounded-xl px-3 py-2 text-[11px] transition-colors ${active ? 'bg-primary-50 font-medium text-primary-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}
              >
                <Icon size={20} aria-hidden="true" />
                <span className="whitespace-nowrap">{label}</span>
              </Link>
            );
          })}
          <button
            onClick={handleLogout}
            className="flex shrink-0 flex-col items-center gap-1 rounded-xl px-3 py-2 text-[11px] text-slate-500 transition-colors hover:bg-slate-50 hover:text-red-600"
          >
            <LogOut size={20} aria-hidden="true" />
            <span className="whitespace-nowrap">Đăng xuất</span>
          </button>
        </div>
      </nav>

      {/* ── Desktop: vertical sidebar ── */}
      <aside className="hidden w-60 shrink-0 lg:block">
        <div className="mb-3 flex items-center gap-3 border-b border-slate-200 pb-4">
          {user.avatarUrl
            ? <img src={mediaUrl(user.avatarUrl)} alt={user.fullName} className="h-12 w-12 rounded-full object-cover ring-2 ring-primary-100" />
            : <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700">{getInitials(user.fullName)}</div>}
          <div className="min-w-0">
            <p className="truncate font-semibold text-slate-800">{user.fullName}</p>
            <p className="text-sm text-slate-400">{user.phone || 'Chưa có SĐT'}</p>
          </div>
        </div>
        <nav aria-label="Menu tài khoản">
          <ul className="space-y-0.5">
            {navItems.map(({ href, label, icon: Icon, exact }) => {
              const active = isActive(href, exact);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${active ? 'bg-primary-50 font-medium text-primary-600' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'}`}
                  >
                    <Icon size={17} className={active ? 'text-primary-500' : 'text-slate-400'} aria-hidden="true" />
                    <span className="flex-1">{label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="mt-3 border-t border-slate-200 pt-3">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-600 transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <LogOut size={17} className="text-slate-400" aria-hidden="true" />
            Đăng xuất
          </button>
        </div>
      </aside>
    </>
  );
}

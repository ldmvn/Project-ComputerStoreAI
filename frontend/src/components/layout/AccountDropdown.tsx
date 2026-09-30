'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';
import { ChevronDown, LogOut, ShoppingBag, User } from 'lucide-react';
import type { AuthUser } from '@/services/auth.service';
import { useAuthStore } from '@/store/auth.store';

export default function AccountDropdown({ user }: { user: AuthUser }) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const pathname = usePathname();
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const itemClass = 'flex min-h-12 w-full items-center gap-3 px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50 focus-visible:-outline-offset-2 dark:text-slate-200 dark:hover:bg-slate-800';

  return (
    <div
      ref={wrapperRef}
      className="relative"
      onBlur={(event) => {
        if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget as Node)) setOpen(false);
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={`Tài khoản: ${user.fullName}`}
        aria-expanded={open}
        aria-controls={panelId}
        className="header-action"
      >
        <User className="h-5 w-5" aria-hidden="true" />
        <span className="hidden max-w-16 truncate lg:inline xl:max-w-32">{user.fullName}</span>
        <ChevronDown aria-hidden="true" className={`hidden h-4 w-4 transition-transform motion-reduce:transition-none lg:block ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div id={panelId} className="absolute right-0 top-full z-50 mt-2 w-[260px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-slate-200 bg-white text-left shadow-lg shadow-slate-900/10 dark:border-slate-700 dark:bg-slate-900 dark:shadow-black/20">
          <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-700">
            <p className="break-words text-sm font-semibold text-slate-900 dark:text-white">{user.fullName}</p>
            <p className="mt-1 break-all text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
          </div>
          <nav aria-label="Menu tài khoản" className="divide-y divide-slate-100 dark:divide-slate-700">
            <Link href="/account" onClick={() => setOpen(false)} className={itemClass}>
              <User className="h-4 w-4" aria-hidden="true" /> Tài khoản của tôi
            </Link>
            <Link href="/orders" onClick={() => setOpen(false)} className={itemClass}>
              <ShoppingBag className="h-4 w-4" aria-hidden="true" /> Đơn hàng của tôi
            </Link>
            <button type="button" onClick={() => { setOpen(false); logout(); }} className={`${itemClass} hover:text-red-600 dark:hover:text-red-400`}>
              <LogOut className="h-4 w-4" aria-hidden="true" /> Đăng xuất
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}

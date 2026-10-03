'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { ChevronDown, LogOut } from 'lucide-react';
import type { AuthUser } from '@/types/user.type';
import { useAuthStore } from '@/store/auth.store';

export default function AdminUserMenu({ user }: { user: AuthUser }) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    if (!open) return;
    const closeOnPointerDown = (event: PointerEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', closeOnPointerDown);
    document.addEventListener('keydown', closeOnKeyDown);
    return () => {
      document.removeEventListener('pointerdown', closeOnPointerDown);
      document.removeEventListener('keydown', closeOnKeyDown);
    };
  }, [open]);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="ui-header-action inline-flex min-h-10 max-w-[min(42vw,220px)] items-center gap-2 rounded-xl px-1.5 text-left text-white transition-colors duration-200 hover:bg-white/15 sm:px-2"
        aria-label={`Tài khoản: ${user.fullName}`}
        aria-expanded={open}
        aria-controls={panelId}
      >
        <span className="ui-avatar flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-sm font-semibold ring-1 ring-white/25">
          {user.fullName.charAt(0).toUpperCase()}
        </span>
        <span className="hidden min-w-0 max-w-32 truncate text-sm font-medium lg:inline xl:max-w-44">{user.fullName}</span>
        <ChevronDown className={`hidden h-4 w-4 transition-transform lg:block ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      {open && (
        <div id={panelId} className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white text-left shadow-lg shadow-slate-900/10">
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="break-words text-sm font-semibold text-slate-900">{user.fullName}</p>
            <p className="mt-1 break-all text-xs text-slate-500">{user.email}</p>
          </div>
          <button type="button" onClick={() => { setOpen(false); logout(); }} className="ui-menu-item flex min-h-11 w-full items-center gap-3 px-4 py-3 text-sm text-slate-700 transition-colors hover:bg-red-50 hover:text-red-700">
            <LogOut className="h-4 w-4" aria-hidden="true" /> Đăng xuất
          </button>
        </div>
      )}
    </div>
  );
}

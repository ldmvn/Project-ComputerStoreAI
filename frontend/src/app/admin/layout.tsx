'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardShell from '@/components/admin/DashboardShell';
import { useAuthStore } from '@/store/auth.store';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const hydrate = useAuthStore((state) => state.hydrate);
  const isAdmin = Boolean(token) && user?.role === 'ADMIN';

  useEffect(() => {
    if (!isHydrated) void hydrate();
  }, [hydrate, isHydrated]);

  useEffect(() => {
    if (isHydrated && !isAdmin) router.replace('/');
  }, [isHydrated, isAdmin, router]);

  // Never render dashboard content while auth is pending or access is denied.
  // Future admin APIs must also enforce authorization on the server.
  if (!isHydrated || !isAdmin) {
    return (
      <p role="status" className="px-4 py-12 text-center text-slate-600">
        Đang kiểm tra quyền truy cập…
      </p>
    );
  }

  return <DashboardShell>{children}</DashboardShell>;
}

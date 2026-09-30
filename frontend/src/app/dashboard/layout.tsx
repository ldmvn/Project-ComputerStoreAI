'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
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
    if (isHydrated && !isAdmin) router.replace('/home');
  }, [isHydrated, isAdmin, router]);

  // Never render dashboard content while auth is pending or access is denied.
  // Future admin APIs must also enforce authorization on the server.
  if (!isHydrated || !isAdmin) {
    return (
      <p role="status" className="px-4 py-12 text-center text-slate-600 dark:text-slate-400">
        Đang kiểm tra quyền truy cập…
      </p>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="container mx-auto flex-1 px-4 py-12">{children}</main>
      <Footer />
    </div>
  );
}

'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import ProfileSidebar from '@/components/customer/ProfileSidebar';

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  const { user, isHydrated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isHydrated && !user) router.replace('/login');
  }, [isHydrated, user, router]);

  if (!isHydrated || !user) return null;

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-8">
      {/* Sidebar: horizontal scroll trên mobile, vertical list trên desktop */}
      <ProfileSidebar user={user} />
      {/* Content */}
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

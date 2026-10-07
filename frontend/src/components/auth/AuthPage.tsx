'use client';

import { useRouter } from 'next/navigation';
import LoginModal from '@/components/layout/LoginModal';

export default function AuthPage({ initialMode = 'login' }: { initialMode?: 'login' | 'forgot' }) {
  const router = useRouter();
  return <main className="min-h-screen bg-slate-50"><LoginModal isOpen initialMode={initialMode} onClose={() => router.push('/')} /></main>;
}

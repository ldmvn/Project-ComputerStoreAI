import Link from 'next/link';
import { LayoutDashboard } from 'lucide-react';

export default function DashboardPage() {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
      <h1 className="flex items-center gap-3 text-2xl font-semibold">
        <LayoutDashboard className="h-7 w-7 text-primary-600 dark:text-primary-400" aria-hidden="true" />
        Dashboard
      </h1>
      <p className="mt-3 text-slate-600 dark:text-slate-400">
        Trang quản trị đang được chuẩn bị.
      </p>
      <Link href="/home" className="mt-6 inline-flex rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
        Về trang chủ
      </Link>
    </section>
  );
}

import Link from 'next/link';

export default function AccountPage() {
  return (
    <section>
      <h1 className="text-2xl font-semibold">Tài khoản của tôi</h1>
      <p className="mt-3 text-slate-600 dark:text-slate-400">Trang thông tin tài khoản đang được chuẩn bị.</p>
      <Link href="/home" className="mt-6 inline-flex text-primary-600 hover:underline dark:text-primary-400">Về trang chủ</Link>
    </section>
  );
}

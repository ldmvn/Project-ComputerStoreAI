import Link from 'next/link';

export default function OrdersPage() {
  return (
    <section>
      <h1 className="text-2xl font-semibold">Đơn hàng của tôi</h1>
      <p className="mt-3 text-slate-600">Trang đơn hàng của bạn đang được chuẩn bị.</p>
      <Link href="/" className="ui-link mt-6 inline-flex text-primary-600 hover:underline">Về trang chủ</Link>
    </section>
  );
}

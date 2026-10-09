'use client';
import Link from 'next/link';
import { formatProductPrice } from '@/lib/product';

interface CartSummaryProps {
  total: number;
  itemCount: number;
  checkout?: boolean;
}

export default function CartSummary({ total, itemCount, checkout = false }: CartSummaryProps) {
  return (
    <aside className="rounded-2xl border border-slate-200 bg-white p-5 lg:sticky lg:top-24">
      <h2 className="font-semibold text-slate-900">{checkout ? 'Sản phẩm đã chọn' : 'Tổng giỏ hàng'}</h2>

      <dl className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <dt className="text-slate-500">Số lượng</dt>
          <dd className="tabular-nums text-slate-700">{itemCount} sản phẩm</dd>
        </div>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <dt className="text-slate-500">Tạm tính</dt>
          <dd className="text-xl font-bold tabular-nums text-primary-700">{formatProductPrice(total)}</dd>
        </div>
      </dl>

      {checkout ? (
        <>
          <p className="mt-4 text-sm leading-6 text-slate-500">
            Bạn đang xem lại sản phẩm. Cửa hàng chưa hỗ trợ gửi đơn và thanh toán trực tuyến tại đây.
          </p>
          <Link
            href="/customer/cart"
            className="mt-4 block rounded-xl border border-slate-200 px-4 py-3 text-center text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            Quay lại giỏ hàng
          </Link>
        </>
      ) : (
        <>
          <Link
            href="/customer/checkout"
            className="mt-4 block rounded-xl bg-primary-600 px-4 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-primary-700"
          >
            Tiếp tục
          </Link>
          <p className="mt-3 text-xs leading-5 text-slate-500">
            Phí vận chuyển và khuyến mãi (nếu có) chưa được tính vào tạm tính.
          </p>
        </>
      )}
    </aside>
  );
}

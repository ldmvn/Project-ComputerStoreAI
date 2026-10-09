'use client';
import Link from 'next/link';
import { formatProductPrice } from '@/lib/product';

interface CartSummaryProps {
  total: number;
  itemCount: number;
  onCheckout?: () => void;
}

export default function CartSummary({ total, itemCount, onCheckout }: CartSummaryProps) {
  return (
    <aside className="rounded-2xl border border-slate-200 bg-white p-5 lg:sticky lg:top-24">
      <h2 className="font-semibold text-slate-900">Tổng giỏ hàng</h2>

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

      {onCheckout ? (
        <>
          <button
            type="button"
            onClick={onCheckout}
            disabled={itemCount === 0}
            className="mt-4 block w-full rounded-xl bg-primary-600 px-4 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Tiếp tục đặt hàng
          </button>
          <p className="mt-3 text-xs leading-5 text-slate-500">
            Phí vận chuyển và khuyến mãi (nếu có) chưa được tính vào tạm tính.
          </p>
        </>
      ) : (
        <Link
          href="/customer/cart"
          className="mt-4 block rounded-xl border border-slate-200 px-4 py-3 text-center text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
        >
          Quay lại giỏ hàng
        </Link>
      )}
    </aside>
  );
}

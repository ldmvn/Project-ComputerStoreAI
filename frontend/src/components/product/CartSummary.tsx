'use client';
/* eslint-disable @next/next/no-img-element */
import { useEffect } from 'react';
import Link from 'next/link';
import { PackageOpen, Trash2 } from 'lucide-react';
import { useCartStore } from '@/store/cart.store';
import { formatProductPrice, productDetailHref } from '@/lib/product';
import { mediaUrl } from '@/services/http.client';
import { useToast } from '@/components/ui/Toast';

export default function CartSummary({ checkout = false, selectedSlug }: { checkout?: boolean; selectedSlug?: string }) {
  const { items, hydrate, hydrated, setQuantity, removeItem } = useCartStore();
  const toast = useToast();
  useEffect(() => { hydrate(); }, [hydrate]);
  const selectedItems = checkout && selectedSlug ? items.filter(item => item.slug === selectedSlug) : items;
  const total = selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  if (!hydrated) return <p role="status">Đang tải giỏ hàng...</p>;
  return <section>
    <h1 className="mb-6 text-2xl font-semibold">{checkout ? 'Thanh toán' : 'Giỏ hàng'}</h1>
    {!selectedItems.length ? <div className="rounded-2xl border bg-white p-8 text-center"><PackageOpen className="mx-auto mb-4 text-slate-300" size={44} aria-hidden="true" /><p className="mb-4 text-slate-500">Chưa có sản phẩm trong giỏ hàng.</p><Link href="/customer/products" className="text-sm font-semibold text-orange-700">Khám phá sản phẩm</Link></div> : <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <ul className="min-w-0 divide-y rounded-2xl border bg-white px-4">{selectedItems.map(item => <li key={item.id} className="flex flex-wrap items-center gap-4 py-5">
        <Link href={productDetailHref(item.slug)} className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-slate-50 p-2">{item.primaryImage ? <img src={mediaUrl(item.primaryImage)} alt={item.name} className="h-full w-full object-contain" /> : <PackageOpen size={28} aria-hidden="true" />}</Link>
        <div className="min-w-0 flex-1"><Link href={productDetailHref(item.slug)} className="block break-words font-medium text-slate-800 hover:text-orange-700">{item.name}</Link><p className="mt-2 text-sm font-semibold text-orange-700">{formatProductPrice(item.price)}</p></div>
        {checkout ? <span className="text-sm text-slate-500">Số lượng: {item.quantity}</span> : <div className="flex items-center gap-3"><label className="sr-only" htmlFor={`cart-quantity-${item.id}`}>Số lượng {item.name}</label><input id={`cart-quantity-${item.id}`} type="number" min={1} max={item.stockQuantity} value={item.quantity} onChange={event => { if (!setQuantity(item.id, Number(event.target.value))) toast.error('Cập nhật thất bại', 'Số lượng vượt quá tồn kho hoặc không thể lưu giỏ hàng.'); }} className="w-16 rounded-lg border p-2 text-sm" /><button type="button" aria-label={`Xóa ${item.name}`} onClick={() => { if (!removeItem(item.id)) toast.error('Có lỗi xảy ra', 'Không thể lưu giỏ hàng.'); else toast.success('Đã xóa sản phẩm khỏi giỏ hàng', item.name); }} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={18} /></button></div>}
      </li>)}</ul>
      <aside className="space-y-4 rounded-2xl border bg-white p-5"><h2 className="font-semibold">{checkout ? 'Sản phẩm đã chọn' : 'Tổng giỏ hàng'}</h2><div className="flex flex-wrap justify-between gap-2 border-t pt-4"><span className="text-sm text-slate-500">Tạm tính</span><strong className="text-xl text-orange-700">{formatProductPrice(total)}</strong></div>{checkout ? <><p className="text-sm leading-6 text-slate-500">Bạn đang xem lại sản phẩm. Cửa hàng chưa hỗ trợ gửi đơn và thanh toán trực tuyến tại đây.</p><Link href="/customer/cart" className="block rounded-xl border px-4 py-3 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50">Quay lại giỏ hàng</Link></> : <Link href="/customer/checkout" className="block rounded-xl bg-orange-600 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-orange-700">Tiếp tục</Link>}</aside>
    </div>}
  </section>;
}

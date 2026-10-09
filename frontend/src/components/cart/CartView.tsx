'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import { PackageOpen, SearchX } from 'lucide-react';
import { useCartStore, type CartItem } from '@/store/cart.store';
import { useToast } from '@/components/ui/Toast';
import EmptyState from '@/components/ui/EmptyState';
import CartItemsList from './CartItemsList';
import CartSummary from './CartSummary';

function CartSkeleton() {
  return (
    <div className="animate-pulse divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white px-4" aria-busy="true" aria-label="Đang tải giỏ hàng">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-5">
          <div className="h-[72px] w-[72px] shrink-0 rounded-lg bg-slate-100 sm:h-20 sm:w-20" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-4 w-3/4 rounded bg-slate-100" />
            <div className="h-3 w-1/3 rounded bg-slate-100" />
          </div>
          <div className="h-9 w-28 shrink-0 rounded-lg bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

export default function CartView({ checkout = false, selectedSlug }: { checkout?: boolean; selectedSlug?: string }) {
  const items = useCartStore(state => state.items);
  const hydrated = useCartStore(state => state.hydrated);
  const hydrate = useCartStore(state => state.hydrate);
  const setQuantity = useCartStore(state => state.setQuantity);
  const removeItem = useCartStore(state => state.removeItem);
  const toast = useToast();

  useEffect(() => { hydrate(); }, [hydrate]);

  // Checkout reviews a single product chosen from the detail page; the cart shows everything.
  const visibleItems = checkout && selectedSlug ? items.filter(item => item.slug === selectedSlug) : items;
  const total = visibleItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemCount = visibleItems.reduce((count, item) => count + item.quantity, 0);

  const handleQuantityChange = (id: number, quantity: number) => {
    if (!Number.isSafeInteger(quantity) || quantity < 1) return;
    if (!setQuantity(id, quantity)) {
      toast.error('Cập nhật thất bại', 'Số lượng vượt quá tồn kho hoặc không thể lưu giỏ hàng.');
    }
  };

  const handleRemove = (item: CartItem) => {
    if (removeItem(item.id)) toast.success('Đã xóa sản phẩm khỏi giỏ hàng', item.name);
    else toast.error('Có lỗi xảy ra', 'Không thể lưu giỏ hàng.');
  };

  const heading = checkout ? 'Thanh toán' : 'Giỏ hàng';

  return (
    <section>
      <h1 className="mb-6 text-2xl font-semibold text-slate-900">{heading}</h1>

      {!hydrated ? (
        <CartSkeleton />
      ) : visibleItems.length === 0 ? (
        // The two empty causes are different: nothing saved at all, vs. a checkout link
        // pointing at a product that is no longer in the cart.
        checkout && selectedSlug ? (
          <EmptyState
            icon={SearchX}
            title="Sản phẩm này không còn trong giỏ hàng."
            description="Sản phẩm có thể đã được xóa hoặc giỏ hàng đã thay đổi."
            action={<Link href="/customer/cart" className="text-sm font-semibold text-primary-700">Quay lại giỏ hàng</Link>}
          />
        ) : (
          <EmptyState
            icon={PackageOpen}
            title="Chưa có sản phẩm trong giỏ hàng."
            description="Thêm sản phẩm bạn muốn mua để tiếp tục."
            action={<Link href="/customer/products" className="text-sm font-semibold text-primary-700">Khám phá sản phẩm</Link>}
          />
        )
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <CartItemsList
            items={visibleItems}
            readOnly={checkout}
            onQuantityChange={handleQuantityChange}
            onRemove={handleRemove}
          />
          <CartSummary total={total} itemCount={itemCount} checkout={checkout} />
        </div>
      )}
    </section>
  );
}

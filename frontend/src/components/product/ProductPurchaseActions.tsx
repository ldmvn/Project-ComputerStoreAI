'use client';
import { useRouter } from 'next/navigation';
import { ArrowRight, ShoppingCart } from 'lucide-react';
import type { Product } from '@/types/product.type';
import { useCartStore } from '@/store/cart.store';
import { useToast } from '@/components/ui/Toast';
import { useAuthModal } from '@/store/authModal.store';
import WishlistButton from './WishlistButton';

export default function ProductPurchaseActions({ product }: { product: Product }) {
  const router = useRouter();
  const addItem = useCartStore(state => state.addItem);
  const toast = useToast();
  const openAuthModal = useAuthModal(state => state.open);
  const unavailable = product.stockQuantity <= 0 || !product.isActive || product.isDeleted;
  const purchase = (buyNow: boolean) => {
    if (!addItem(product, buyNow)) {
      toast.error('Không thể thêm sản phẩm', 'Kiểm tra số lượng trong giỏ và quyền lưu dữ liệu của trình duyệt.');
      return;
    }
    if (buyNow) {
      toast.success('Đã thêm vào giỏ hàng', 'Đang chuyển đến thanh toán...');
      router.push(`/customer/checkout?product=${encodeURIComponent(product.slug)}`);
    } else {
      toast.success('Đã thêm sản phẩm vào giỏ hàng', product.name);
    }
  };
  const buttonClass = 'inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500';
  const actionRowClass = 'grid grid-cols-2 gap-3';
  return <div className="space-y-3">
    <div className={actionRowClass}>
      <button type="button" onClick={() => purchase(false)} disabled={unavailable} className={`${buttonClass} border border-primary-300 bg-primary-50 text-primary-700 hover:bg-primary-100`}><ShoppingCart size={18} aria-hidden="true" />Thêm vào giỏ hàng</button>
      <WishlistButton productId={product.id} productName={product.name} onRequireLogin={openAuthModal} />
    </div>
    <button type="button" onClick={() => purchase(true)} disabled={unavailable} className={`${buttonClass} bg-primary-600 text-white hover:bg-primary-700`}>Mua ngay<ArrowRight size={18} aria-hidden="true" /></button>
  </div>;
}
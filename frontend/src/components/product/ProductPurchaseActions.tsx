'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Heart, ShoppingCart } from 'lucide-react';
import type { Product } from '@/types/product.type';
import { useCartStore } from '@/store/cart.store';
import { useToast } from '@/components/ui/Toast';

const FAVORITE_STORAGE_KEY = 'cs_favorite_product_ids';

function readFavorites(): number[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(FAVORITE_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((value): value is number => typeof value === 'number') : [];
  } catch {
    return [];
  }
}

function writeFavorites(ids: number[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(FAVORITE_STORAGE_KEY, JSON.stringify(ids));
    window.dispatchEvent(new CustomEvent('cs:favorites-changed', { detail: { ids } }));
  } catch {
    // ignore quota errors
  }
}

export default function ProductPurchaseActions({ product }: { product: Product }) {
  const router = useRouter();
  const addItem = useCartStore(state => state.addItem);
  const toast = useToast();
  const [favorited, setFavorited] = useState(false);
  useEffect(() => {
    setFavorited(readFavorites().includes(product.id));
    const sync = () => setFavorited(readFavorites().includes(product.id));
    window.addEventListener('cs:favorites-changed', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('cs:favorites-changed', sync);
      window.removeEventListener('storage', sync);
    };
  }, [product.id]);
  const toggleFavorite = () => {
    const current = readFavorites();
    const exists = current.includes(product.id);
    const next = exists ? current.filter(id => id !== product.id) : [...current, product.id];
    writeFavorites(next);
    setFavorited(next.includes(product.id));
    if (exists) toast.info('Đã bỏ khỏi danh sách yêu thích', product.name);
    else toast.success('Sản phẩm đã có trong danh sách yêu thích', product.name);
  };
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
  const buttonClass = 'inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500';
  const actionRowClass = 'grid grid-cols-2 gap-3';
  const favoriteClass = favorited
    ? 'border border-orange-300 bg-orange-50 text-orange-700 hover:bg-orange-100'
    : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50';
  return <div className="space-y-3">
    <div className={actionRowClass}>
      <button type="button" onClick={() => purchase(false)} disabled={unavailable} className={`${buttonClass} border border-orange-300 bg-orange-50 text-orange-700 hover:bg-orange-100`}><ShoppingCart size={18} aria-hidden="true" />Thêm vào giỏ hàng</button>
      <button type="button" onClick={toggleFavorite} disabled={unavailable} aria-pressed={favorited} aria-label={favorited ? 'Bỏ yêu thích' : 'Yêu thích'} className={`${buttonClass} ${favoriteClass}`}>
        <Heart size={18} aria-hidden="true" fill={favorited ? 'currentColor' : 'none'} strokeWidth={2} />
        <span className="hidden sm:inline">{favorited ? 'Đã yêu thích' : 'Yêu thích'}</span>
        <span className="sr-only">{favorited ? 'Đã yêu thích' : 'Yêu thích'}</span>
      </button>
    </div>
    <button type="button" onClick={() => purchase(true)} disabled={unavailable} className={`${buttonClass} bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600`}>Mua ngay<ArrowRight size={18} aria-hidden="true" /></button>
  </div>;
}
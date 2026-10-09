'use client';
import { Eye, MessageCircle, Star } from 'lucide-react';
import type { Product } from '@/types/product.type';

export default function ProductStatistics({ product }: { product: Product }) {
  const reviewCount = product.reviewCount ?? 0;
  const average = reviewCount > 0 ? product.ratingAverage : null;
  const scrollTo = (id: string) => {
    const section = document.getElementById(id);
    if (!section) return;
    section.focus({ preventScroll: true });
    section.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  };

  return (
    <dl data-testid="product-statistics" aria-label="Thống kê sản phẩm" className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-slate-500 xl:flex-nowrap">
      <div className="flex shrink-0 items-center gap-1">
        <dt className="font-medium text-slate-600">Mã SP:</dt>
        <dd className="whitespace-nowrap font-medium text-slate-700">{product.sku}</dd>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <span className="hidden text-slate-300 lg:inline" aria-hidden="true">|</span>
        <dt className="sr-only">Đánh giá</dt>
        <dd>
          <button type="button" aria-label={average == null ? 'Xem 0 đánh giá sản phẩm' : `Xem ${reviewCount} đánh giá, điểm ${average.toFixed(1)} trên 5`} onClick={() => scrollTo('product-reviews')} className="flex items-center gap-1 whitespace-nowrap rounded-sm text-left hover:text-primary-600">
            <Star size={16} className="shrink-0 text-slate-400" aria-hidden="true" />
            <span>{reviewCount.toLocaleString('vi-VN')} đánh giá</span>
            {average != null && <span>({average.toLocaleString('vi-VN', { maximumFractionDigits: 1 })}/5)</span>}
          </button>
        </dd>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <span className="hidden text-slate-300 lg:inline" aria-hidden="true">|</span>
        <dt className="sr-only">Bình luận</dt>
        <dd className="flex items-center gap-1 whitespace-nowrap"><MessageCircle size={16} className="shrink-0 text-slate-400" aria-hidden="true" /><span>{(product.commentCount ?? 0).toLocaleString('vi-VN')} Bình luận</span></dd>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <span className="hidden text-slate-300 lg:inline" aria-hidden="true">|</span>
        <dt className="sr-only">Lượt xem</dt>
        <dd className="flex items-center gap-1 whitespace-nowrap"><Eye size={16} className="shrink-0 text-slate-400" aria-hidden="true" /><span>{(product.viewCount ?? 0).toLocaleString('vi-VN')} Lượt xem</span></dd>
      </div>
    </dl>
  );
}

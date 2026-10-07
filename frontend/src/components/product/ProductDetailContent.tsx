'use client';
import type { Product } from '@/types/product.type';

// The product detail layout now hosts "Nhận xét và Đánh giá" in the left
// column of the main grid (see ProductDetail.tsx). This component is kept for
// backwards compatibility with imports and renders nothing.
export default function ProductDetailContent({ product: _product }: { product: Product }) {
  return null;
}

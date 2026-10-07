'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { getPublicProducts, type ProductListQuery } from '@/services/product.service';
import type { ProductListResponse } from '@/types/product.type';
import ProductCard from '@/components/home/product-section/ProductCard';

import { useToast } from '@/components/ui/Toast';

export default function ProductCatalog() {
  const search = useSearchParams();
  const router = useRouter();
  const key = search.toString();
  const [result, setResult] = useState<Pick<ProductListResponse, 'products' | 'meta' | 'filters'> | null>(null);
  const [resultKey, setResultKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const toast = useToast();
  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams(key);
    const query: ProductListQuery = {};
    for (const field of ['search', 'category', 'brand', 'attribute', 'attributeValue', 'sort'] as const) { const value = params.get(field); if (value) query[field] = value; }
    for (const field of ['minPrice', 'maxPrice', 'page', 'brandId'] as const) { const value = params.get(field); if (value !== null && value !== '') query[field] = Number(value); }
    setLoading(true); setError('');
    getPublicProducts(query, controller.signal).then(data => { if (!controller.signal.aborted) { setResult(data); setResultKey(key); } }).catch(e => { if (!controller.signal.aborted) { setError(e.message); setResult(null); setResultKey(key); toast.error('Không tải được danh sách sản phẩm', e.message); } }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [key, toast]);
  const navigate = (changes: Record<string, string>) => { const params = new URLSearchParams(key); for (const [field, value] of Object.entries(changes)) params.set(field, value); router.push(`/customer/products?${params}`); };
  const labels: Record<string, string> = { category: 'Danh mục', minPrice: 'Giá từ', maxPrice: 'Giá đến', attribute: 'Thuộc tính', attributeValue: 'Giá trị', search: 'Tìm kiếm' };
  const hasBrandFilter = search.has('brand') || search.has('brandId');
  const resolvedBrand = resultKey === key ? result?.filters?.brand : null;
  return <section>
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><h1 className="text-2xl font-semibold">Sản phẩm</h1><label className="flex items-center gap-2 text-sm">Sắp xếp<select className="rounded-lg border bg-white p-2" value={search.get('sort') || 'newest'} onChange={e => navigate({ sort: e.target.value, page: '1' })}><option value="newest">Mới nhất</option><option value="priceAsc">Giá tăng dần</option><option value="priceDesc">Giá giảm dần</option><option value="nameAsc">Tên A–Z</option></select></label></div>
    <div className="mb-5 flex flex-wrap gap-2">{Object.entries(labels).filter(([field]) => search.has(field)).map(([field, label]) => <span key={field} className="rounded-full bg-orange-50 px-3 py-1 text-sm text-orange-800">{label}: {search.get(field)}</span>)}{hasBrandFilter && <span data-testid="brand-filter-badge" className="rounded-full bg-orange-50 px-3 py-1 text-sm text-orange-800">Thương hiệu: {resolvedBrand?.name || (resultKey !== key ? 'Đang tải…' : 'Không khả dụng')}</span>}{(hasBrandFilter || Object.keys(labels).some(field => search.has(field))) && <Link href="/customer/products" className="px-3 py-1 text-sm underline">Xóa bộ lọc</Link>}</div>
    {loading ? <p role="status">Đang tải sản phẩm...</p> : error ? <p role="alert" className="rounded-lg bg-red-50 p-4 text-red-700">{error}</p> : result && <>
      <p role="status" className="mb-4 text-sm text-slate-500">{result.meta.total} sản phẩm</p>
      {!result.products.length && <p className="rounded-xl border bg-white p-8 text-center text-slate-500">Không có sản phẩm phù hợp với bộ lọc.</p>}
      <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{result.products.map(product => <ProductCard key={product.id} product={product} />)}</div>
      {result.meta.totalPages > 1 && <nav aria-label="Phân trang sản phẩm" className="mt-6 flex items-center justify-center gap-4"><button className="rounded-lg border px-4 py-2 disabled:opacity-40" disabled={result.meta.page <= 1} onClick={() => navigate({ page: String(result.meta.page - 1) })}>Trang trước</button><span>{result.meta.page}/{result.meta.totalPages}</span><button className="rounded-lg border px-4 py-2 disabled:opacity-40" disabled={result.meta.page >= result.meta.totalPages} onClick={() => navigate({ page: String(result.meta.page + 1) })}>Trang sau</button></nav>}
    </>}
  </section>;
}

'use client';
/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Check, ChevronRight, PackageX, RefreshCw } from 'lucide-react';
import { getPublicProduct, recordProductView } from '@/services/product.service';
import { ApiRequestError, mediaUrl } from '@/services/http.client';
import type { Product } from '@/types/product.type';
import { formatProductPrice } from '@/lib/product';
import { ProductDetailSkeleton } from '@/components/ui/Skeleton';
import ProductGallery from './ProductGallery';
import { HighlightedSpecifications } from './ProductSpecifications';
import ProductSpecifications from './ProductSpecifications';
import ProductDetailNavigation from './ProductDetailNavigation';
import ProductDetailContent from './ProductDetailContent';
import ProductPurchaseActions from './ProductPurchaseActions';
import ProductStatistics from './ProductStatistics';
import ProductDescription from './ProductDescription';
import ProductReviews from './ProductReviews';

type DetailState = { slug: string; status: 'loading' | 'ready' | 'missing' | 'error'; product?: Product; message?: string };
export default function ProductDetail({ slug }: { slug: string }) {
  const [state, setState] = useState<DetailState>({ slug, status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const viewEvent = useRef<{ slug: string; id: string } | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    setState({ slug, status: 'loading' });
    getPublicProduct(slug, controller.signal).then(({ product }) => {
      if (controller.signal.aborted) return;
      setState({ slug, status: 'ready', product });
      if (viewEvent.current?.slug !== slug) viewEvent.current = { slug, id: crypto.randomUUID() };
      void recordProductView(slug, viewEvent.current.id, controller.signal).then(({ viewCount }) => {
        if (!controller.signal.aborted) setState(current => current.slug === slug && current.product?.id === product.id ? { ...current, product: { ...current.product, viewCount } } : current);
      }).catch(() => { /* Keep the last stored count if view recording is unavailable. */ });
    }).catch(error => {
      if (!controller.signal.aborted) setState({ slug, status: error instanceof ApiRequestError && error.status === 404 ? 'missing' : 'error', message: error.message });
    });
    return () => controller.abort();
  }, [slug, attempt]);
  const product = state.slug === slug ? state.product : undefined;
  if (state.slug !== slug || state.status === 'loading') return <ProductDetailSkeleton />;
  if (!product) return <section className="rounded-2xl border border-slate-200 bg-white px-5 py-16 text-center" aria-labelledby="product-error-title">
    <PackageX size={44} className="mx-auto mb-4 text-slate-300" aria-hidden="true" />
    <h1 id="product-error-title" className="text-xl font-semibold text-slate-900">{state.status === 'missing' ? 'Không tìm thấy sản phẩm' : 'Không tải được sản phẩm'}</h1>
    <p role={state.status === 'error' ? 'alert' : undefined} className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">{state.status === 'missing' ? 'Sản phẩm không tồn tại hoặc hiện chưa được bán.' : state.message || 'Vui lòng thử lại sau.'}</p>
    <div className="mt-6 flex flex-wrap justify-center gap-3">{state.status === 'error' && <button type="button" onClick={() => setAttempt(value => value + 1)} className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-5 py-3 text-sm font-semibold text-white hover:bg-orange-700"><RefreshCw size={16} aria-hidden="true" />Thử lại</button>}<Link href="/customer/products" className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50">Xem sản phẩm khác</Link></div>
  </section>;
  const category = product.categoryInfo;
  const categoryName = category?.name || product.category;
  const categoryHref = category ? `/customer/products?category=${encodeURIComponent(category.slug)}` : '/customer/products';
  const brandName = product.brandInfo?.name || product.brand;
  const brandHref = product.brandInfo ? `/customer/products?brand=${encodeURIComponent(product.brandInfo.slug)}` : null;
  const discounted = typeof product.originalPrice === 'number' && product.originalPrice > product.price;
  const discount = discounted ? Math.round((product.originalPrice! - product.price) / product.originalPrice! * 100) : 0;
  const available = product.stockQuantity > 0;
  const highlightSpecs = (product.highlightSpecs || []).filter(spec => spec.content.trim()).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  return <article className="min-w-0" data-testid="product-detail">
    <nav aria-label="Breadcrumb" className="mb-4 text-sm text-slate-500 sm:mb-5"><ol className="flex flex-wrap items-center gap-x-2 gap-y-1"><li><Link href="/" className="hover:text-orange-700">Trang chủ</Link></li>{categoryName && <><li aria-hidden="true"><ChevronRight size={14} /></li><li><Link href={categoryHref} className="hover:text-orange-700">{categoryName}</Link></li></>}<li aria-hidden="true"><ChevronRight size={14} /></li><li aria-current="page" className="min-w-0 break-words text-slate-700">{product.name}</li></ol></nav>
    <div className="grid min-w-0 items-start gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <div className="flex min-w-0 flex-col gap-3 sm:gap-4">
        <div id="product-gallery" tabIndex={-1} aria-label="Gallery hình ảnh sản phẩm" className="scroll-mt-36 rounded-2xl">
          <ProductGallery key={product.id} name={product.name} images={product.images || []} primaryImage={product.primaryImage} />
        </div>
        <p className="text-center text-[11px] italic leading-5 text-slate-500 sm:text-xs">Hình ảnh mang tính chất minh họa / tham khảo !</p>
        <ProductDetailNavigation key={product.id} product={product} />
        <ProductDescription key={product.id} description={product.description} />
        <ProductReviews key={product.id} slug={product.slug} productId={product.id} initialSummary={product.ratingAverage !== undefined || product.reviewCount !== undefined ? { ratingAverage: product.ratingAverage ?? null, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } } : null} />
      </div>
      <div className="flex min-w-0 flex-col gap-3 sm:gap-4">
        <div className="flex min-w-0 flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:gap-4 sm:p-5">
          <div><h1 className="break-words text-2xl font-bold leading-snug tracking-tight text-slate-900 sm:text-3xl">{product.name}</h1><ProductStatistics product={product} /></div>
          <HighlightedSpecifications highlightSpecs={highlightSpecs} />
          <dl className="space-y-2 border-y border-slate-100 py-3 text-sm">
            <div className="flex flex-wrap items-center gap-2"><dt className="text-slate-500">Thương hiệu:</dt><dd data-testid="product-brand" className="flex min-w-0 items-center gap-2 font-medium text-slate-800">{product.brandInfo?.logoUrl && <img src={mediaUrl(product.brandInfo.logoUrl)} alt="" className="h-6 w-16 object-contain" />}{brandHref ? <Link href={brandHref} className="break-words hover:text-orange-700">{brandName}</Link> : brandName || 'Đang cập nhật'}</dd></div>
            <div className="flex flex-wrap gap-2"><dt className="text-slate-500">Danh mục:</dt><dd data-testid="product-category" className="min-w-0 break-words font-medium text-slate-800">{categoryName ? <Link href={categoryHref} className="hover:text-orange-700">{categoryName}</Link> : 'Đang cập nhật'}</dd></div>
            <div className="flex items-center gap-2"><dt className="text-slate-500">Tình trạng:</dt><dd className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${available ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{available ? <Check size={14} aria-hidden="true" /> : <PackageX size={14} aria-hidden="true" />}{available ? 'Còn hàng' : 'Hết hàng'}</dd></div>
          </dl>
          {discounted ? (
            <div
              data-testid="product-pricing"
              className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-700 via-fuchsia-600 to-rose-600 p-3.5 text-white shadow-lg shadow-rose-600/20 sm:p-4"
            >
              <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
              <div aria-hidden="true" className="pointer-events-none absolute -bottom-12 -left-8 h-28 w-28 rounded-full bg-white/10 blur-2xl" />
              <div className="relative">
                <p className="text-xs font-medium uppercase tracking-wider text-white/80 sm:text-sm">Giá khuyến mãi:</p>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 sm:gap-x-4">
                  <p
                    className="order-1 text-3xl font-extrabold tracking-tight text-white drop-shadow-sm sm:text-4xl"
                    aria-label={`Giá bán ${formatProductPrice(product.price)}`}
                  >
                    {formatProductPrice(product.price)}
                  </p>
                  <del
                    className="order-2 text-base font-medium text-white/70 sm:text-lg"
                    aria-label={`Giá gốc ${formatProductPrice(product.originalPrice!)}`}
                  >
                    {formatProductPrice(product.originalPrice!)}
                  </del>
                  <span className="order-3 inline-flex shrink-0 items-center rounded-full bg-white/20 px-2.5 py-1 text-xs font-semibold text-white ring-1 ring-white/30">
                    -{discount}%
                  </span>
                  <span
                    className="order-4 text-sm font-semibold text-white/90 sm:text-base"
                    aria-label={`Tiết kiệm ${formatProductPrice(product.originalPrice! - product.price)}`}
                  >
                    Tiết kiệm {formatProductPrice(product.originalPrice! - product.price)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div data-testid="product-pricing">
              <p className="mb-1 text-sm text-slate-500">Giá bán</p>
              <p className="break-words text-3xl font-bold tracking-tight text-orange-600 sm:text-4xl">{formatProductPrice(product.price)}</p>
            </div>
          )}
          <ProductPurchaseActions key={`${product.id}-${product.stockQuantity}`} product={product} />
        </div>
        <ProductSpecifications key={product.id} specifications={product.specifications || []} />
      </div>
    </div>
    <ProductDetailContent key={product.id} product={product} />
  </article>;
}

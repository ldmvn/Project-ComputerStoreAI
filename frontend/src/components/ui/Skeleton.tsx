import type { HTMLAttributes } from 'react';

type SkeletonProps = HTMLAttributes<HTMLSpanElement> & {
  width?: string;
  height?: string;
};

export function Skeleton({ className = '', width, height, style, ...props }: SkeletonProps) {
  return (
    <span
      aria-hidden="true"
      className={`skeleton-shimmer block ${className}`}
      style={{ width, height, ...style }}
      {...props}
    />
  );
}

export function ProductCardSkeleton() {
  return (
    <article className="overflow-hidden rounded-xl border border-slate-200 bg-white p-4">
      <Skeleton className="aspect-square w-full rounded-lg" />
      <div className="mt-4 space-y-3">
        <Skeleton className="h-4 w-11/12 rounded" />
        <Skeleton className="h-4 w-3/4 rounded" />
        <Skeleton className="h-5 w-2/5 rounded" />
        <Skeleton className="h-4 w-1/2 rounded" />
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>
    </article>
  );
}

type ProductGridSkeletonProps = {
  count?: number;
};

export function ProductGridSkeleton({ count = 8 }: ProductGridSkeletonProps) {
  return (
    <div
      aria-busy="true"
      aria-label="Đang tải danh sách sản phẩm"
      className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    >
      {Array.from({ length: count }, (_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
}

export function ProductDetailSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Đang tải chi tiết sản phẩm"
      role="status"
      className="space-y-6"
    >
      <Skeleton className="h-5 w-3/4 max-w-lg rounded" />
      <div className="grid items-start gap-6 lg:grid-cols-2 lg:gap-8">
        <div className="min-w-0"><Skeleton className="aspect-square w-full rounded-2xl" /><div className="mt-3 flex gap-3">{[0, 1, 2].map(index => <Skeleton key={index} className="h-20 w-20 shrink-0 rounded-xl" />)}</div></div>
        <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <Skeleton className="h-16 w-full rounded" />
          <Skeleton className="h-4 w-2/5 rounded" />
          <div className="space-y-4 border-y border-slate-200 py-4"><Skeleton className="h-5 w-2/3 rounded" /><Skeleton className="h-5 w-1/2 rounded" /><Skeleton className="h-5 w-1/3 rounded" /></div>
          <Skeleton className="h-12 w-1/2 rounded" />
          <div className="grid gap-3 sm:grid-cols-2"><Skeleton className="h-12 w-full rounded-xl" /><Skeleton className="h-12 w-full rounded-xl" /></div>
          <div className="space-y-3 rounded-xl bg-slate-50 p-5"><Skeleton className="h-5 w-1/2 rounded" />{[0, 1, 2, 3, 4, 5].map(index => <Skeleton key={index} className="h-5 w-full rounded" />)}</div>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-2"><Skeleton className="h-64 w-full rounded-2xl" /><Skeleton className="h-64 w-full rounded-2xl" /></div>
    </div>
  );
}

export function MegaMenuSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Đang tải danh mục"
      className="grid min-h-[260px] w-[min(760px,calc(100vw-19.5rem))] grid-cols-2 gap-5 rounded-r-lg border-y border-r border-slate-200 bg-white p-6"
    >
      {Array.from({ length: 8 }, (_, index) => (
        <div key={index} className="space-y-2">
          <Skeleton className="h-4 w-3/4 rounded" />
          <Skeleton className="h-3 w-1/2 rounded" />
        </div>
      ))}
    </div>
  );
}

export function CartSkeleton() {
  return (
    <div aria-busy="true" aria-label="Đang tải giỏ hàng" className="space-y-4">
      {Array.from({ length: 3 }, (_, index) => (
        <div key={index} className="flex items-center gap-4 border-b border-slate-200 pb-4">
          <Skeleton className="h-20 w-20 shrink-0 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4 rounded" />
            <Skeleton className="h-3 w-1/2 rounded" />
          </div>
          <Skeleton className="h-5 w-24 rounded" />
        </div>
      ))}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <main aria-busy="true" aria-label="Đang tải nội dung trang" className="container mx-auto px-4 py-12">
      <Skeleton className="h-12 w-2/3 max-w-xl rounded-lg" />
      <Skeleton className="mt-4 h-5 w-full max-w-2xl rounded" />
      <div className="mt-10">
        <ProductGridSkeleton />
      </div>
    </main>
  );
}

'use client';
import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const COLLAPSED_MAX_HEIGHT = 'max-h-[360px]';

export default function ProductDescription({ description }: { description?: string | null }) {
  const [expanded, setExpanded] = useState(false);
  const text = description?.trim() || '';
  if (!text) {
    return (
      <section
        id="product-description"
        aria-labelledby="product-description-heading"
        className="min-w-0 scroll-mt-36 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5"
      >
        <h2 id="product-description-heading" className="mb-3 text-lg font-semibold text-slate-900">
          Mô tả sản phẩm
        </h2>
        <p className="text-sm text-slate-500">Mô tả sản phẩm đang được cập nhật.</p>
      </section>
    );
  }

  return (
    <section
      id="product-description"
      aria-labelledby="product-description-heading"
      className="relative min-w-0 scroll-mt-36 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5"
    >
      <h2 id="product-description-heading" className="mb-3 text-lg font-semibold text-slate-900">
        Mô tả sản phẩm
      </h2>
      <div className={`relative overflow-hidden transition-[max-height] duration-300 ease-out ${expanded ? 'max-h-none' : COLLAPSED_MAX_HEIGHT}`}>
        <div
          id="product-description-content"
          className="whitespace-pre-wrap break-words text-sm leading-7 text-slate-600"
        >
          {text}
        </div>
        {!expanded && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-b from-transparent to-white"
          />
        )}
      </div>
      <button
        type="button"
        onClick={() => setExpanded(value => !value)}
        aria-expanded={expanded}
        aria-controls="product-description-content"
        aria-label={expanded ? 'Thu gọn mô tả' : 'Xem thêm mô tả'}
        title={expanded ? 'Thu gọn mô tả' : 'Xem thêm mô tả'}
        className="absolute left-1/2 -translate-x-1/2 -bottom-3 inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition-all duration-200 hover:border-slate-300 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500"
      >
        {expanded ? <ChevronUp size={16} aria-hidden="true" /> : <ChevronDown size={16} aria-hidden="true" />}
      </button>
    </section>
  );
}
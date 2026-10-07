'use client';
import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { ProductHighlightSpec, ProductSpecification } from '@/types/product.type';

const HIGHLIGHT_PREVIEW = 5;

export function HighlightedSpecifications({ highlightSpecs }: { highlightSpecs: ProductHighlightSpec[] }) {
  const items = (highlightSpecs || []).filter(spec => spec.content.trim()).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  const [expanded, setExpanded] = useState(false);
  if (!items.length) return null;
  const canCollapse = items.length > HIGHLIGHT_PREVIEW;
  const visibleItems = canCollapse && !expanded ? items.slice(0, HIGHLIGHT_PREVIEW) : items;
  return <section aria-labelledby="product-highlights" className="relative rounded-xl border border-slate-200 bg-slate-50/70 p-4">
    <h2 id="product-highlights" className="mb-3 text-base font-semibold text-slate-900">Thông số nổi bật</h2>
    <div
      className={`relative overflow-hidden transition-[max-height] duration-300 ease-out ${canCollapse ? (expanded ? 'max-h-[2000px]' : 'max-h-[260px]') : 'max-h-none'}`}
    >
      <ul
        id="product-highlights-list"
        aria-hidden={!expanded && canCollapse}
        className="space-y-2.5 text-sm"
      >
        {visibleItems.map((spec, index) => <li key={spec.id ?? index} className="flex items-start gap-2 text-slate-700"><span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500" aria-hidden="true" /><span className="break-words font-medium text-slate-800">{spec.content}</span></li>)}
      </ul>
      {canCollapse && !expanded && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-b from-transparent to-slate-50/95" />
      )}
    </div>
    {canCollapse && (
      <button
        type="button"
        onClick={() => setExpanded(value => !value)}
        aria-expanded={expanded}
        aria-controls="product-highlights-list"
        aria-label={expanded ? 'Thu gọn' : 'Xem thêm'}
        title={expanded ? 'Thu gọn' : 'Xem thêm'}
        className="absolute left-1/2 -translate-x-1/2 -bottom-3 inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition-all duration-200 hover:border-slate-300 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500"
      >
        {expanded ? <ChevronUp size={16} aria-hidden="true" /> : <ChevronDown size={16} aria-hidden="true" />}
      </button>
    )}
  </section>;
}

export default function ProductSpecifications({ specifications }: { specifications: ProductSpecification[] }) {
  const rows = specifications.filter(spec => spec.name.trim() && spec.value.trim()).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  return <section id="product-specifications" tabIndex={-1} aria-labelledby="product-specifications-heading" className="min-w-0 scroll-mt-36 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
    <h2 id="product-specifications-heading" className="mb-3 text-lg font-semibold text-slate-900">Thông số kỹ thuật</h2>
    {rows.length ? <table className="w-full table-fixed text-left text-sm"><caption className="sr-only">Thông số kỹ thuật của sản phẩm</caption><tbody>{rows.map((spec, index) => <tr key={spec.id ?? index} className={`border-b border-slate-100 ${index % 2 === 0 ? 'bg-slate-50' : ''}`}><th scope="row" className="w-[40%] whitespace-pre-wrap break-words px-3 py-2.5 align-top font-medium text-slate-600">{spec.name}</th><td className="whitespace-pre-wrap break-words px-3 py-2.5 align-top text-slate-800">{spec.value}</td></tr>)}</tbody></table> : <p className="text-sm text-slate-500">Thông số kỹ thuật đang được cập nhật.</p>}
  </section>;
}
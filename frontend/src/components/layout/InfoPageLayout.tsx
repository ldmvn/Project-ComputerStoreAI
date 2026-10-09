import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export interface Breadcrumb { label: string; href?: string }
export interface TocItem   { id: string; label: string }

interface InfoPageLayoutProps {
  breadcrumbs: Breadcrumb[];
  title: string;
  description?: string;
  toc?: TocItem[];
  badge?: string;
  children: React.ReactNode;
}

export default function InfoPageLayout({ breadcrumbs, title, description, toc, badge, children }: InfoPageLayoutProps) {
  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-1 text-sm text-slate-500">
        {breadcrumbs.map((crumb, i) => (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
            {crumb.href
              ? <Link href={crumb.href} className="hover:text-primary-600 transition-colors">{crumb.label}</Link>
              : <span className="text-slate-800 font-medium">{crumb.label}</span>}
          </span>
        ))}
      </nav>

      {/* Header */}
      <div className="mb-8 border-b border-slate-200 pb-6">
        {badge && (
          <span className="mb-3 inline-block rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary-700">
            {badge}
          </span>
        )}
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{title}</h1>
        {description && <p className="mt-2 text-slate-600 leading-relaxed max-w-2xl">{description}</p>}
      </div>

      {toc && toc.length > 0 ? (
        <div className="grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
          {/* TOC Sidebar */}
          <aside className="order-2 lg:order-1">
            <div className="sticky top-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Mục lục</p>
              <nav>
                <ul className="space-y-1">
                  {toc.map(item => (
                    <li key={item.id}>
                      <a
                        href={`#${item.id}`}
                        className="block rounded-lg px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-white hover:text-primary-700"
                      >
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          </aside>

          {/* Content */}
          <div className="order-1 min-w-0 lg:order-2">
            {children}
          </div>
        </div>
      ) : (
        <div>{children}</div>
      )}
    </div>
  );
}

/* Reusable prose section with anchor */
export function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mb-10 scroll-mt-6">
      <h2 className="mb-4 text-lg font-semibold text-slate-900">{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed text-slate-700">{children}</div>
    </section>
  );
}

/* Pending-approval notice for unconfirmed policy content */
export function PendingNotice() {
  return (
    <div className="mb-8 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
      <strong className="font-semibold">⚠ Nội dung đang chờ xác nhận.</strong>{' '}
      Các chính sách trên trang này chưa được chủ cửa hàng phê duyệt chính thức. Vui lòng liên hệ{' '}
      <a href="mailto:luuducmanh.main@gmail.com" className="underline">luuducmanh.main@gmail.com</a> để biết thông tin chính xác.
    </div>
  );
}

/* Placeholder block for unconfirmed specifics */
export function Placeholder({ label }: { label: string }) {
  return (
    <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-800">
      [CẦN XÁC NHẬN: {label}]
    </span>
  );
}

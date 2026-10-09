import type { Metadata } from 'next';
import { Newspaper } from 'lucide-react';
import CustomerShell from '@/components/layout/CustomerShell';
import InfoPageLayout from '@/components/layout/InfoPageLayout';

export const metadata: Metadata = {
  title: 'Tin tức công nghệ — DUCMANH PC',
  description: 'Cập nhật tin tức, đánh giá sản phẩm và xu hướng công nghệ mới nhất từ DUCMANH PC.',
};

export default function BlogPage() {
  return (
    <CustomerShell>
      <InfoPageLayout
        breadcrumbs={[{ label: 'Trang chủ', href: '/' }, { label: 'Tin tức công nghệ' }]}
        title="Tin tức công nghệ"
        description="Cập nhật đánh giá sản phẩm, xu hướng công nghệ và tin tức mới nhất từ DUCMANH PC."
      >
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 py-16 text-center">
          <Newspaper className="mb-4 h-10 w-10 text-slate-300" />
          <p className="font-semibold text-slate-700">Chức năng đang phát triển</p>
          <p className="mt-2 max-w-sm text-sm text-slate-500">
            Mục tin tức công nghệ đang được xây dựng. Chúng tôi sẽ sớm đăng tải các bài đánh giá sản phẩm, hướng dẫn kỹ thuật và tin tức mới nhất.
          </p>
          <p className="mt-4 text-xs text-slate-400">
            Theo dõi fanpage Facebook <a href="https://www.facebook.com/ldmahz/" target="_blank" rel="noopener noreferrer" className="text-primary-700 hover:underline">@ldmahz</a> để cập nhật sớm nhất.
          </p>
        </div>
      </InfoPageLayout>
    </CustomerShell>
  );
}

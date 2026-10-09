import type { Metadata } from 'next';
import { Briefcase, Mail } from 'lucide-react';
import CustomerShell from '@/components/layout/CustomerShell';
import InfoPageLayout from '@/components/layout/InfoPageLayout';

export const metadata: Metadata = {
  title: 'Tuyển dụng — DUCMANH PC',
  description: 'Cơ hội nghề nghiệp tại DUCMANH PC.',
};

export default function CareersPage() {
  return (
    <CustomerShell>
      <InfoPageLayout
        breadcrumbs={[{ label: 'Trang chủ', href: '/' }, { label: 'Tuyển dụng' }]}
        title="Tuyển dụng"
        description="Gia nhập đội ngũ DUCMANH PC — môi trường trẻ trung, năng động và đam mê công nghệ."
      >
        {/* Culture */}
        <section className="mb-8">
          <h2 className="mb-3 text-base font-semibold text-slate-900">Tại sao chọn DUCMANH PC?</h2>
          <div className="grid gap-3 sm:grid-cols-3 text-sm">
            {[
              { title: 'Môi trường thực tế', desc: 'Tiếp xúc với sản phẩm công nghệ thực tế, xây dựng kỹ năng chuyên môn nhanh.' },
              { title: 'Đội ngũ trẻ', desc: 'Làm việc cùng những người trẻ năng động, chia sẻ đam mê công nghệ.' },
              { title: 'Phát triển nghề nghiệp', desc: 'Cơ hội thăng tiến rõ ràng dựa trên năng lực và kết quả công việc.' },
            ].map(({ title, desc }) => (
              <div key={title} className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="font-semibold text-slate-800">{title}</p>
                <p className="mt-1 text-slate-600 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Openings */}
        <section className="mb-8">
          <h2 className="mb-3 text-base font-semibold text-slate-900">Vị trí đang tuyển</h2>
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 py-10 text-center">
            <Briefcase className="mb-3 h-8 w-8 text-slate-300" />
            <p className="font-medium text-slate-600">Chưa có vị trí tuyển dụng công khai</p>
            <p className="mt-1 text-sm text-slate-500 max-w-xs">Hiện tại chưa có vị trí tuyển dụng. Bạn vẫn có thể gửi CV để ứng tuyển tự do — chúng tôi sẽ liên hệ khi có vị trí phù hợp.</p>
          </div>
        </section>

        {/* Apply */}
        <div className="rounded-xl border border-primary-200 bg-primary-50 p-5 text-sm">
          <div className="flex items-center gap-2 mb-2">
            <Mail className="h-4 w-4 text-primary-700" />
            <p className="font-semibold text-primary-900">Gửi CV ứng tuyển tự do</p>
          </div>
          <p className="text-primary-800">Email CV và thư giới thiệu về <a href="mailto:luuducmanh.main@gmail.com" className="font-medium underline hover:no-underline">luuducmanh.main@gmail.com</a> với tiêu đề: <strong>[CV] Họ tên — Vị trí ứng tuyển</strong>.</p>
        </div>
      </InfoPageLayout>
    </CustomerShell>
  );
}

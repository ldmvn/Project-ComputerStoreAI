import type { Metadata } from 'next';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import CustomerShell from '@/components/layout/CustomerShell';
import InfoPageLayout from '@/components/layout/InfoPageLayout';

export const metadata: Metadata = {
  title: 'Hệ thống cửa hàng — DUCMANH PC',
  description: 'Địa chỉ và thông tin liên hệ các cửa hàng DUCMANH PC.',
};

export default function StoresPage() {
  return (
    <CustomerShell>
      <InfoPageLayout
        breadcrumbs={[{ label: 'Trang chủ', href: '/' }, { label: 'Hệ thống cửa hàng' }]}
        title="Hệ thống cửa hàng"
        description="Ghé thăm DUCMANH PC để được tư vấn trực tiếp, trải nghiệm sản phẩm và nhận hỗ trợ kỹ thuật tại chỗ."
      >
        {/* Store card */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
            {/* Map placeholder */}
            <div className="flex h-48 items-center justify-center bg-slate-100 text-slate-400">
              <div className="text-center">
                <MapPin className="mx-auto h-8 w-8 text-slate-300" />
                <p className="mt-2 text-sm">5 Lê Duẩn, Phường Xuân Hòa</p>
                <p className="text-xs">Tỉnh Phú Thọ</p>
                <a
                  href="https://maps.google.com/?q=5+Le+Duan+Xuan+Hoa+Phu+Tho"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-xs text-primary-700 hover:underline"
                >
                  Mở Google Maps →
                </a>
              </div>
            </div>
            <div className="p-5 space-y-3 text-sm">
              <h2 className="font-semibold text-slate-900 text-base">DUCMANH PC — Chi nhánh Phú Thọ</h2>
              <div className="flex items-start gap-2.5 text-slate-700">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" />
                <span>5 Lê Duẩn, Phường Xuân Hòa, Tỉnh Phú Thọ</span>
              </div>
              <div className="flex items-center gap-2.5 text-slate-700">
                <Phone className="h-4 w-4 shrink-0 text-primary-600" />
                <a href="tel:0386220065" className="hover:text-primary-700 hover:underline">0386220065</a>
              </div>
              <div className="flex items-center gap-2.5 text-slate-700">
                <Mail className="h-4 w-4 shrink-0 text-primary-600" />
                <a href="mailto:luuducmanh.main@gmail.com" className="break-all hover:text-primary-700 hover:underline">luuducmanh.main@gmail.com</a>
              </div>
              <div className="flex items-start gap-2.5 text-slate-700">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" />
                <div>
                  <p>Thứ 2 – Thứ 7: 8:00 – 18:00</p>
                  <p className="text-slate-500">Chủ nhật: 8:00 – 12:00</p>
                </div>
              </div>
            </div>
          </div>

          {/* More stores placeholder */}
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
            <MapPin className="mb-3 h-8 w-8 text-slate-300" />
            <p className="font-medium text-slate-600">Thêm chi nhánh</p>
            <p className="mt-1 text-slate-400">Thông tin các chi nhánh mới sẽ được cập nhật tại đây.</p>
          </div>
        </div>

        {/* Note */}
        <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          <p>💡 <strong>Gợi ý:</strong> Bạn có thể đặt hàng trực tuyến tại website và chọn nhận tại cửa hàng để tiết kiệm phí vận chuyển. Gọi hotline trước khi đến để đảm bảo sản phẩm có sẵn.</p>
        </div>
      </InfoPageLayout>
    </CustomerShell>
  );
}

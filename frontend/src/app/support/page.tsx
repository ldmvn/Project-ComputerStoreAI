'use client';

import { useState } from 'react';
import { Phone, Mail, MapPin, MessageSquare, Clock } from 'lucide-react';
import CustomerShell from '@/components/layout/CustomerShell';
import InfoPageLayout from '@/components/layout/InfoPageLayout';

const CATEGORIES = ['Lỗi kỹ thuật sản phẩm', 'Cài đặt & Phần mềm', 'Kết nối & Mạng', 'Linh kiện & Nâng cấp', 'Khác'];

export default function SupportPage() {
  const [form, setForm] = useState({ name: '', phone: '', email: '', category: '', detail: '' });
  const [sent, setSent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Vui lòng nhập họ tên.';
    if (!form.phone.trim()) e.phone = 'Vui lòng nhập số điện thoại.';
    if (!form.category) e.category = 'Vui lòng chọn loại hỗ trợ.';
    if (!form.detail.trim()) e.detail = 'Vui lòng mô tả vấn đề.';
    return e;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    // TODO: Gọi API khi backend hỗ trợ ticket kỹ thuật
    setSent(true);
  }

  const field = (id: keyof typeof form, label: string, el: React.ReactNode) => (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>
      {el}
      {errors[id] && <p className="mt-1 text-xs text-red-600">{errors[id]}</p>}
    </div>
  );

  const inputCls = (id: string) =>
    `w-full rounded-xl border px-4 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-300 ${errors[id] ? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-200' : 'border-slate-200 bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20'}`;

  return (
    <CustomerShell>
      <InfoPageLayout
        breadcrumbs={[{ label: 'Trang chủ', href: '/' }, { label: 'Hỗ trợ kỹ thuật' }]}
        title="Hỗ trợ kỹ thuật"
        description="Đội ngũ kỹ thuật DUCMANH PC sẵn sàng hỗ trợ bạn qua điện thoại, email hoặc phiếu hỗ trợ trực tuyến."
      >
        <div className="grid gap-8 md:grid-cols-[1fr_280px]">
          {/* Form */}
          <div>
            <h2 className="mb-4 text-base font-semibold text-slate-900">Gửi yêu cầu hỗ trợ</h2>

            {sent ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
                <p className="text-2xl">✓</p>
                <p className="mt-2 font-semibold text-emerald-800">Yêu cầu đã được gửi thành công!</p>
                <p className="mt-1 text-sm text-emerald-700">Đội ngũ kỹ thuật sẽ liên hệ với bạn trong thời gian sớm nhất.</p>
                <button
                  type="button"
                  className="mt-4 text-sm text-primary-700 hover:underline"
                  onClick={() => { setSent(false); setForm({ name: '', phone: '', email: '', category: '', detail: '' }); }}
                >
                  Gửi yêu cầu khác
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                {field('name', 'Họ và tên *', (
                  <input id="name" type="text" value={form.name} placeholder="Nguyễn Văn A"
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className={inputCls('name')} />
                ))}
                <div className="grid gap-4 sm:grid-cols-2">
                  {field('phone', 'Số điện thoại *', (
                    <input id="phone" type="tel" value={form.phone} placeholder="09xxxxxxxx"
                      onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                      className={inputCls('phone')} />
                  ))}
                  {field('email', 'Email (không bắt buộc)', (
                    <input id="email" type="email" value={form.email} placeholder="email@example.com"
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      className={inputCls('email')} />
                  ))}
                </div>
                {field('category', 'Loại hỗ trợ *', (
                  <select id="category" value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className={inputCls('category')}>
                    <option value="">-- Chọn loại hỗ trợ --</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                ))}
                {field('detail', 'Mô tả vấn đề *', (
                  <textarea id="detail" rows={4} value={form.detail}
                    placeholder="Mô tả chi tiết vấn đề bạn đang gặp phải..."
                    onChange={e => setForm(f => ({ ...f, detail: e.target.value }))}
                    className={inputCls('detail')} />
                ))}
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  ⚠ Chức năng gửi yêu cầu trực tuyến đang được phát triển. Hiện tại vui lòng liên hệ trực tiếp qua hotline hoặc email bên phải.
                </p>
                <button type="submit"
                  className="rounded-xl bg-primary-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700">
                  Gửi yêu cầu
                </button>
              </form>
            )}
          </div>

          {/* Contact info */}
          <aside className="space-y-4">
            <h2 className="text-base font-semibold text-slate-900">Liên hệ trực tiếp</h2>
            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" />
                <div>
                  <p className="font-medium text-slate-700">Hotline hỗ trợ</p>
                  <a href="tel:0386220065" className="text-primary-700 hover:underline">0386220065</a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" />
                <div>
                  <p className="font-medium text-slate-700">Email</p>
                  <a href="mailto:luuducmanh.main@gmail.com" className="break-all text-primary-700 hover:underline">luuducmanh.main@gmail.com</a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" />
                <div>
                  <p className="font-medium text-slate-700">Cửa hàng</p>
                  <p className="text-slate-600">5 Lê Duẩn, Phường Xuân Hòa, Tỉnh Phú Thọ</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" />
                <div>
                  <p className="font-medium text-slate-700">Giờ làm việc</p>
                  <p className="text-slate-600">Thứ 2 – Thứ 7: 8:00 – 18:00</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-slate-500" />
                <p className="font-medium text-slate-700">Chat Facebook</p>
              </div>
              <a href="https://www.facebook.com/ldmahz/" target="_blank" rel="noopener noreferrer"
                className="mt-2 block text-primary-700 hover:underline">
                facebook.com/ldmahz
              </a>
            </div>
          </aside>
        </div>
      </InfoPageLayout>
    </CustomerShell>
  );
}

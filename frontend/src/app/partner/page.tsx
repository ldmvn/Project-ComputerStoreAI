'use client';

import { useState } from 'react';
import { Handshake } from 'lucide-react';
import CustomerShell from '@/components/layout/CustomerShell';
import InfoPageLayout from '@/components/layout/InfoPageLayout';

const TYPES = ['Nhà cung cấp / Nhà phân phối', 'Đối tác vận chuyển', 'Đối tác thanh toán', 'Đơn vị truyền thông / Marketing', 'Khác'];

export default function PartnerPage() {
  const [form, setForm] = useState({ company: '', contact: '', phone: '', email: '', type: '', message: '' });
  const [sent, setSent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!form.company.trim()) e.company = 'Vui lòng nhập tên công ty.';
    if (!form.contact.trim()) e.contact = 'Vui lòng nhập người liên hệ.';
    if (!form.phone.trim()) e.phone = 'Vui lòng nhập số điện thoại.';
    if (!form.email.trim()) e.email = 'Vui lòng nhập email.';
    if (!form.type) e.type = 'Vui lòng chọn loại hợp tác.';
    if (!form.message.trim()) e.message = 'Vui lòng mô tả yêu cầu hợp tác.';
    return e;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    // TODO: Gọi API khi backend sẵn sàng
    setSent(true);
  }

  const inputCls = (id: string) =>
    `w-full rounded-xl border px-4 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-300 ${errors[id] ? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-200' : 'border-slate-200 bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20'}`;

  const field = (id: keyof typeof form, label: string, el: React.ReactNode) => (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>
      {el}
      {errors[id] && <p className="mt-1 text-xs text-red-600">{errors[id]}</p>}
    </div>
  );

  return (
    <CustomerShell>
      <InfoPageLayout
        breadcrumbs={[{ label: 'Trang chủ', href: '/' }, { label: 'Liên hệ hợp tác' }]}
        title="Liên hệ hợp tác"
        description="DUCMANH PC luôn chào đón các cơ hội hợp tác với nhà cung cấp, đối tác phân phối và đơn vị truyền thông."
      >
        <div className="grid gap-8 md:grid-cols-[1fr_240px]">
          {/* Form */}
          <div>
            {sent ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center">
                <Handshake className="mx-auto h-8 w-8 text-emerald-600" />
                <p className="mt-3 font-semibold text-emerald-800">Yêu cầu hợp tác đã gửi!</p>
                <p className="mt-1 text-sm text-emerald-700">Chúng tôi sẽ phản hồi qua email trong vòng 2–3 ngày làm việc.</p>
                <button
                  type="button"
                  className="mt-4 text-sm text-primary-700 hover:underline"
                  onClick={() => { setSent(false); setForm({ company: '', contact: '', phone: '', email: '', type: '', message: '' }); }}
                >
                  Gửi yêu cầu khác
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  {field('company', 'Tên công ty / Tổ chức *', (
                    <input id="company" type="text" value={form.company} placeholder="Công ty ABC"
                      onChange={e => setForm(f => ({ ...f, company: e.target.value }))} className={inputCls('company')} />
                  ))}
                  {field('contact', 'Người liên hệ *', (
                    <input id="contact" type="text" value={form.contact} placeholder="Nguyễn Văn A"
                      onChange={e => setForm(f => ({ ...f, contact: e.target.value }))} className={inputCls('contact')} />
                  ))}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {field('phone', 'Số điện thoại *', (
                    <input id="phone" type="tel" value={form.phone} placeholder="09xxxxxxxx"
                      onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className={inputCls('phone')} />
                  ))}
                  {field('email', 'Email *', (
                    <input id="email" type="email" value={form.email} placeholder="contact@company.com"
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className={inputCls('email')} />
                  ))}
                </div>
                {field('type', 'Loại hợp tác *', (
                  <select id="type" value={form.type}
                    onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className={inputCls('type')}>
                    <option value="">-- Chọn loại hợp tác --</option>
                    {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                ))}
                {field('message', 'Nội dung hợp tác *', (
                  <textarea id="message" rows={4} value={form.message}
                    placeholder="Mô tả ngắn gọn về đề xuất hợp tác của bạn..."
                    onChange={e => setForm(f => ({ ...f, message: e.target.value }))} className={inputCls('message')} />
                ))}
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  ⚠ Form gửi yêu cầu đang ở chế độ UI. Vui lòng liên hệ trực tiếp qua email nếu cần phản hồi ngay.
                </p>
                <button type="submit"
                  className="rounded-xl bg-primary-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700">
                  Gửi yêu cầu hợp tác
                </button>
              </form>
            )}
          </div>

          {/* Info */}
          <aside className="space-y-4 text-sm">
            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
              <p className="font-semibold text-slate-800">Liên hệ trực tiếp</p>
              <p className="text-slate-600">📧 <a href="mailto:luuducmanh.main@gmail.com" className="text-primary-700 hover:underline break-all">luuducmanh.main@gmail.com</a></p>
              <p className="text-slate-600">📞 <a href="tel:0386220065" className="text-primary-700 hover:underline">0386220065</a></p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-1">
              <p className="font-semibold text-slate-800">Thời gian phản hồi</p>
              <p className="text-slate-600">2–3 ngày làm việc qua email.</p>
            </div>
          </aside>
        </div>
      </InfoPageLayout>
    </CustomerShell>
  );
}

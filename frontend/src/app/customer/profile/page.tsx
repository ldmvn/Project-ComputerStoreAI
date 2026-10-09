'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { updateProfile, AuthRequestError } from '@/services/auth.service';

const genderOptions = [
  { value: '', label: 'Giới tính' },
  { value: 'male', label: 'Nam' },
  { value: 'female', label: 'Nữ' },
  { value: 'other', label: 'Khác' },
];

export default function AccountPage() {
  const { user, token, setUser } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ fullName: '', phone: '', gender: '' });

  if (!user) return null;

  const startEdit = () => {
    setForm({ fullName: user.fullName, phone: user.phone ?? '', gender: '' });
    setError('');
    setEditing(true);
  };

  const cancelEdit = () => { setEditing(false); setError(''); };

  const handleSave = async () => {
    if (!token) return;
    if (!form.fullName.trim()) { setError('Họ và tên không được để trống.'); return; }
    setSaving(true);
    setError('');
    try {
      const updated = await updateProfile(token, {
        fullName: form.fullName.trim(),
        phone: form.phone.trim() || undefined,
      });
      setUser(updated);
      setEditing(false);
    } catch (err) {
      setError(err instanceof AuthRequestError ? err.message : 'Không thể lưu thông tin. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  const inputCls = (editable: boolean) =>
    `w-full rounded-lg border px-4 py-3 text-sm transition-colors focus:outline-none ${
      editable
        ? 'border-slate-300 bg-white text-slate-800 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20'
        : 'border-slate-200 bg-white text-slate-700'
    }`;

  return (
    <div>
      <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 text-sm text-slate-500">
        <Link href="/" className="hover:text-primary-600">Trang chủ</Link>
        <ChevronRight size={14} aria-hidden="true" />
        <span className="text-slate-700">Tài khoản</span>
      </nav>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
        <h1 className="mb-6 text-xl font-semibold text-primary-600">Thông tin tài khoản</h1>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs text-slate-500">Họ và tên</label>
            <input
              type="text"
              value={editing ? form.fullName : user.fullName}
              onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
              readOnly={!editing}
              placeholder="Nhập họ và tên"
              className={inputCls(editing)}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-slate-500">Số điện thoại</label>
            <input
              type="tel"
              value={editing ? form.phone : (user.phone ?? '')}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              readOnly={!editing}
              placeholder="Nhập số điện thoại"
              className={inputCls(editing)}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-slate-500">Email</label>
            <input
              type="email"
              value={user.email}
              readOnly
              className={`${inputCls(false)} cursor-not-allowed text-slate-400`}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-slate-500">Giới tính</label>
            <select
              value={form.gender}
              onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}
              disabled={!editing}
              className={`${inputCls(editing)} appearance-none`}
            >
              {genderOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        <div className="mt-6 flex justify-end gap-3">
          {editing && (
            <button type="button" onClick={cancelEdit} disabled={saving} className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50">
              Hủy
            </button>
          )}
          <button
            type="button"
            onClick={editing ? handleSave : startEdit}
            disabled={saving}
            className="rounded-lg bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 active:bg-primary-800 disabled:opacity-60"
          >
            {saving ? 'Đang lưu...' : editing ? 'Lưu thông tin' : 'Chỉnh sửa thông tin'}
          </button>
        </div>
      </div>
    </div>
  );
}

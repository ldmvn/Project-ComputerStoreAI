'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, Shield } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// ─── password strength ────────────────────────────────────────────────────────

function getStrength(pw: string): { score: number; label: string; color: string } {
  if (!pw) return { score: 0, label: '', color: '' };
  let score = 0;
  if (pw.length >= 8)  score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { score, label: 'Yếu',       color: 'bg-red-500' };
  if (score <= 2) return { score, label: 'Trung bình', color: 'bg-amber-400' };
  if (score <= 3) return { score, label: 'Khá',        color: 'bg-yellow-400' };
  if (score <= 4) return { score, label: 'Mạnh',       color: 'bg-green-500' };
  return { score, label: 'Rất mạnh', color: 'bg-emerald-500' };
}

// ─── password field ───────────────────────────────────────────────────────────

function PasswordField({
  id, label, value, onChange, error, placeholder,
}: {
  id: string; label: string; value: string;
  onChange: (v: string) => void; error?: string; placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>
      <div className="relative">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={id === 'currentPassword' ? 'current-password' : 'new-password'}
          className={`w-full rounded-xl border px-4 py-3 pr-11 text-sm text-slate-800 outline-none transition placeholder:text-slate-300
            ${error ? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-200' : 'border-slate-200 bg-white focus:border-primary-600 focus:ring-2 focus:ring-primary-100'}`}
        />
        <button
          type="button"
          onClick={() => setShow(v => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          tabIndex={-1}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {error && <p className="mt-1.5 flex items-center gap-1 text-xs text-red-600"><AlertCircle className="h-3 w-3 shrink-0" />{error}</p>}
    </div>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────

export default function PasswordPage() {
  const { user, token } = useAuthStore();

  const [current,  setCurrent]  = useState('');
  const [next,     setNext]     = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [errors,   setErrors]   = useState<Record<string, string>>({});
  const [loading,  setLoading]  = useState(false);
  const [success,  setSuccess]  = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const strength = getStrength(next);

  function validate() {
    const e: Record<string, string> = {};
    if (!current) e.current = 'Vui lòng nhập mật khẩu hiện tại.';
    if (!next)    e.next    = 'Vui lòng nhập mật khẩu mới.';
    else if (next.length < 8) e.next = 'Mật khẩu mới phải có ít nhất 8 ký tự.';
    else if (next === current) e.next = 'Mật khẩu mới phải khác mật khẩu hiện tại.';
    if (!confirm)           e.confirm = 'Vui lòng xác nhận mật khẩu mới.';
    else if (confirm !== next) e.confirm = 'Mật khẩu xác nhận không khớp.';
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    setApiError(null);
    try {
      const res = await fetch(`${API}/auth/password`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.field === 'currentPassword') setErrors({ current: data.message });
        else if (data.field === 'newPassword') setErrors({ next: data.message });
        else setApiError(data.message || 'Đã xảy ra lỗi. Vui lòng thử lại.');
        return;
      }
      setSuccess(true);
      setCurrent(''); setNext(''); setConfirm('');
      setErrors({});
    } catch {
      setApiError('Không thể kết nối máy chủ. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  }

  if (!user) return null;

  return (
    <>
      {/* Breadcrumb */}
      <nav className="mb-4 flex items-center gap-1.5 text-sm text-slate-500">
        <Link href="/" className="hover:text-primary-600">Trang chủ</Link>
        <ChevronRight size={14} />
        <Link href="/customer/profile" className="hover:text-primary-600">Tài khoản</Link>
        <ChevronRight size={14} />
        <span className="text-slate-700">Bảo mật tài khoản</span>
      </nav>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-primary-600">
            <Lock className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-lg font-bold text-slate-800">Bảo mật tài khoản</h1>
            <p className="text-sm text-slate-500">Cập nhật mật khẩu để bảo vệ tài khoản của bạn</p>
          </div>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-2 border-y border-slate-200">
          {[
            { icon: Shield, label: 'Trạng thái', value: 'Đang hoạt động', green: true },
            { icon: Lock,   label: 'Xác thực',  value: 'Mật khẩu', green: false },
          ].map((s, i) => (
            <div key={s.label} className={`flex items-center gap-3 px-5 py-4 ${i === 0 ? 'border-r border-slate-200' : ''}`}>
              <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${s.green ? 'bg-green-50' : 'bg-slate-50'}`}>
                <s.icon className={`h-4 w-4 ${s.green ? 'text-green-600' : 'text-slate-500'}`} />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-800">{s.value}</p>
                <p className="text-xs text-slate-500">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Form */}
        <div className="px-5 py-6">
          {success && (
            <div className="mb-5 flex items-center gap-2.5 rounded-xl bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              Đổi mật khẩu thành công! Vui lòng dùng mật khẩu mới cho lần đăng nhập tiếp theo.
            </div>
          )}

          {apiError && (
            <div className="mb-5 flex items-center gap-2.5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" /> {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <PasswordField
              id="currentPassword"
              label="Mật khẩu hiện tại"
              value={current}
              onChange={v => { setCurrent(v); setErrors(e => ({ ...e, current: '' })); setSuccess(false); }}
              error={errors.current}
              placeholder="Nhập mật khẩu hiện tại"
            />

            <div className="h-px bg-slate-100" />

            <PasswordField
              id="newPassword"
              label="Mật khẩu mới"
              value={next}
              onChange={v => { setNext(v); setErrors(e => ({ ...e, next: '' })); setSuccess(false); }}
              error={errors.next}
              placeholder="Tối thiểu 8 ký tự"
            />

            {/* Strength bar */}
            {next.length > 0 && (
              <div className="-mt-2">
                <div className="flex gap-1">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= strength.score ? strength.color : 'bg-slate-100'}`} />
                  ))}
                </div>
                <p className="mt-1 text-xs text-slate-500">Độ mạnh: <span className="font-medium text-slate-700">{strength.label}</span></p>
              </div>
            )}

            <PasswordField
              id="confirmPassword"
              label="Xác nhận mật khẩu mới"
              value={confirm}
              onChange={v => { setConfirm(v); setErrors(e => ({ ...e, confirm: '' })); setSuccess(false); }}
              error={errors.confirm}
              placeholder="Nhập lại mật khẩu mới"
            />

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Đang cập nhật…
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4" />
                    Đổi mật khẩu
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

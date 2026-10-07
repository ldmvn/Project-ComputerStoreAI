'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Eye, EyeOff, Loader2, LockKeyhole, Mail } from 'lucide-react';
import { AuthRequestError, completePasswordReset, requestPasswordReset, verifyResetOtp } from '@/services/auth.service';
import { useToast } from '@/components/ui/Toast';

export type RecoveryMode = 'forgot' | 'verify-otp' | 'reset-password';
type Props = {
  mode: RecoveryMode;
  initialEmail: string;
  onModeChange: (mode: RecoveryMode) => void;
  onBack: () => void;
  onSuccess: () => void;
};

const inputClass = 'h-[52px] w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 disabled:bg-slate-50';

export default function ForgotPasswordForm({ mode, initialEmail, onModeChange, onBack, onSuccess }: Props) {
  const toast = useToast();
  const [email, setEmail] = useState(initialEmail.includes('@') ? initialEmail : '');
  const [otp, setOtp] = useState('');
  const [challengeId, setChallengeId] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [resendAt, setResendAt] = useState(0);
  const [expiresAt, setExpiresAt] = useState(0);
  const [now, setNow] = useState(Date.now());
  const active = useRef(false);
  const pending = useRef(false);

  useEffect(() => {
    active.current = true;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => { active.current = false; window.clearInterval(timer); };
  }, []);

  const wait = Math.max(0, Math.ceil((resendAt - now) / 1000));
  const remaining = Math.max(0, Math.ceil((expiresAt - now) / 1000));

  async function sendCode() {
    const response = await requestPasswordReset(email.trim().toLowerCase());
    if (!active.current) return;
    setEmail(email.trim().toLowerCase()); setChallengeId(response.challengeId);
    setOtp(''); setResetToken(''); setPassword(''); setConfirmation('');
    setResendAt(Date.now() + response.resendAfter * 1000);
    const validityMs = response.expiresAt && response.serverTime
      ? Date.parse(response.expiresAt) - Date.parse(response.serverTime)
      : response.expiresIn * 1000;
    setExpiresAt(Date.now() + Math.max(0, validityMs));
    setNow(Date.now());
    toast.info(response.message, email.trim());
    onModeChange('verify-otp');
  }

  async function perform(action: () => Promise<void>) {
    if (pending.current) return;
    pending.current = true;
    setBusy(true); setError('');
    try { await action(); }
    catch (err) {
      if (active.current) {
        const message = err instanceof AuthRequestError ? err.message : 'Đã xảy ra lỗi. Vui lòng thử lại.';
        setError(message);
        toast.error(message);
      }
    } finally {
      pending.current = false;
      if (active.current) setBusy(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mode === 'forgot') {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || email.trim().length > 191) { setError('Vui lòng nhập email hợp lệ.'); return; }
      await perform(sendCode);
    } else if (mode === 'verify-otp') {
      if (!/^\d{6}$/.test(otp)) { setError('Mã OTP phải gồm 6 chữ số.'); return; }
      await perform(async () => {
        const response = await verifyResetOtp(email, challengeId, otp);
        if (!active.current) return;
        setResetToken(response.resetToken); setOtp('');
        setExpiresAt(Date.now() + response.expiresIn * 1000); setNow(Date.now());
        onModeChange('reset-password');
        toast.success('Mã OTP hợp lệ', 'Vui lòng đặt mật khẩu mới.');
      });
    } else {
      if (password.length < 8 || password.length > 128 || new TextEncoder().encode(password).length > 72) { setError('Mật khẩu phải từ 8 đến 128 ký tự và tối đa 72 byte UTF-8.'); return; }
      if (password !== confirmation) { setError('Mật khẩu xác nhận không khớp.'); return; }
      await perform(async () => {
        await completePasswordReset(email, resetToken, password, confirmation);
        if (!active.current) return;
        setPassword(''); setConfirmation(''); setResetToken('');
        toast.success('Đổi mật khẩu thành công', 'Vui lòng đăng nhập.');
        onSuccess();
      });
    }
  }

  return <form key={mode} onSubmit={submit} noValidate className="auth-form-enter mx-auto mt-6 max-w-md space-y-5" aria-busy={busy}>
    <fieldset disabled={busy} className="space-y-5">
      {mode === 'forgot' && <div>
        <label htmlFor="reset-email" className="mb-2 block text-sm font-semibold text-slate-700">Email</label>
        <div className="relative"><Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input id="reset-email" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} maxLength={191} placeholder="example@gmail.com" className={inputClass} required /></div>
      </div>}
      {mode === 'verify-otp' && <div>
        <label htmlFor="reset-otp" className="mb-2 block text-sm font-semibold text-slate-700">Mã OTP</label>
        <input id="reset-otp" inputMode="numeric" autoComplete="one-time-code" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} maxLength={6} placeholder="000000" className={inputClass + ' pl-4 text-center text-xl tracking-[0.5em]'} required />
        <p className="mt-2 break-all text-xs text-slate-500">Email: {email}</p>
        <p className="mt-2 text-xs text-slate-500">{remaining ? 'Mã hết hạn sau ' + String(Math.floor(remaining / 60)).padStart(2, '0') + ':' + String(remaining % 60).padStart(2, '0') + '. Tối đa 5 lần nhập sai.' : 'Mã đã hết hạn. Vui lòng gửi lại mã.'}</p>
      </div>}
      {mode === 'reset-password' && <>
        {[{ id: 'new-password', label: 'Mật khẩu mới', value: password, setter: setPassword, show: showPassword, toggle: setShowPassword }, { id: 'confirm-password', label: 'Xác nhận mật khẩu', value: confirmation, setter: setConfirmation, show: showConfirmation, toggle: setShowConfirmation }].map(field => <div key={field.id}>
          <label htmlFor={field.id} className="mb-2 block text-sm font-semibold text-slate-700">{field.label}</label>
          <div className="relative"><LockKeyhole className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input id={field.id} type={field.show ? 'text' : 'password'} autoComplete="new-password" value={field.value} onChange={e => field.setter(e.target.value)} minLength={8} maxLength={128} className={inputClass + ' pr-11'} required /><button type="button" aria-label={(field.show ? 'Ẩn' : 'Hiện') + ' ' + field.label.toLowerCase()} aria-pressed={field.show} onClick={() => field.toggle(!field.show)} className="ui-button absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-400 hover:bg-slate-100">{field.show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div>
        </div>)}
        <p className="text-xs text-slate-500">Mật khẩu có ít nhất 8 ký tự, tối đa 72 byte UTF-8.</p>
        {!remaining && <p role="alert" className="text-sm text-red-600">Phiên đổi mật khẩu đã hết hạn. Vui lòng yêu cầu mã mới.</p>}
      </>}
    </fieldset>
    {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-3 text-sm text-red-700">{error}</p>}
    <button type="submit" disabled={busy || (mode !== 'forgot' && !remaining)} className="ui-button flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary-600 to-primary-700 text-sm font-semibold text-white transition hover:from-primary-700 hover:to-primary-900 focus:outline-none focus:ring-2 focus:ring-primary-500/30 disabled:cursor-not-allowed disabled:opacity-60">{busy ? <><Loader2 className="h-4 w-4 animate-spin" />Đang xử lý...</> : { forgot: 'Gửi mã xác nhận', 'verify-otp': 'Xác nhận', 'reset-password': 'Đổi mật khẩu' }[mode]}</button>
    {mode === 'verify-otp' && <button type="button" disabled={busy || wait > 0} onClick={() => void perform(sendCode)} className="ui-link block w-full text-center text-sm font-semibold text-primary-600 disabled:cursor-not-allowed disabled:text-slate-400">{wait ? 'Gửi lại mã sau ' + wait + 's' : 'Gửi lại mã'}</button>}
    {mode === 'reset-password' && !remaining && <button type="button" disabled={busy} onClick={() => { setError(''); setResetToken(''); setPassword(''); setConfirmation(''); onModeChange('forgot'); }} className="ui-link block w-full text-center text-sm font-semibold text-primary-600">Yêu cầu mã mới</button>}
    <button type="button" onClick={onBack} className="ui-link flex w-full items-center justify-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700"><ArrowLeft className="h-4 w-4" />Quay lại đăng nhập</button>
  </form>;
}
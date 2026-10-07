import AuthPage from '@/components/auth/AuthPage';

export const metadata = { title: 'Quên mật khẩu | DUCMANH PC' };
export default function ForgotPasswordPage() {
  return <AuthPage initialMode="forgot" />;
}

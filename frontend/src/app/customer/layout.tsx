import CustomerShell from '@/components/layout/CustomerShell';

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return <CustomerShell contentClassName="container mx-auto flex-1 px-4 py-12">{children}</CustomerShell>;
}

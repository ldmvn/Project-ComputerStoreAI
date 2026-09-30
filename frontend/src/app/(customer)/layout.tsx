import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="container mx-auto flex-1 px-4 py-12">{children}</main>
      <Footer />
    </div>
  );
}

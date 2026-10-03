import Header from './Header';
import Footer from './Footer';

export default function CustomerShell({ children, contentClassName = 'flex-1', fillViewport = true }: {
  children: React.ReactNode;
  contentClassName?: string;
  fillViewport?: boolean;
}) {
  return (
    <div className={`flex flex-col ${fillViewport ? 'min-h-screen' : ''}`}>
      <Header />
      <main className={contentClassName}>{children}</main>
      <Footer />
    </div>
  );
}

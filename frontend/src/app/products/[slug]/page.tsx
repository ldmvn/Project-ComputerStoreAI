import CustomerShell from '@/components/layout/CustomerShell';
import ProductDetail from '@/components/product/ProductDetail';

export default function ProductPage({ params }: { params: { slug: string } }) {
  return <CustomerShell contentClassName="container mx-auto min-w-0 flex-1 px-4 py-6 sm:py-8"><ProductDetail slug={params.slug} /></CustomerShell>;
}

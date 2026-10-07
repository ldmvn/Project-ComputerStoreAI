import CartSummary from '@/components/product/CartSummary';
export default function Page({ searchParams }: { searchParams: { product?: string } }) { return <CartSummary checkout selectedSlug={searchParams.product} />; }

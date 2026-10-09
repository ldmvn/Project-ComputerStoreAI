import CartView from '@/components/cart/CartView';
export default function Page({ searchParams }: { searchParams: { product?: string } }) { return <CartView checkout selectedSlug={searchParams.product} />; }

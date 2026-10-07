import CustomerShell from '@/components/layout/CustomerShell';
import { ProductDetailSkeleton } from '@/components/ui/Skeleton';
export default function Loading() { return <CustomerShell compactFooter contentClassName="container mx-auto flex-1 px-4 py-6 sm:py-8"><ProductDetailSkeleton /></CustomerShell>; }

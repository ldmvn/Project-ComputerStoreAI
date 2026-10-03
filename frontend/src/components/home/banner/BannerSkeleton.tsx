import { Skeleton } from '@/components/ui/Skeleton';

export default function BannerSkeleton({ label }: { label: string }) {
  return (
    <div className="absolute inset-0" role="img" aria-label={`${label}: đang tải banner`}>
      <Skeleton className="h-full w-full rounded-xl" />
    </div>
  );
}

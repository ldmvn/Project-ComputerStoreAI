import type { Banner } from '@/types/banner.type';
import Modal from '@/components/ui/Modal';
import BannerMedia from '@/components/home/banner/BannerMedia';
import { positionLabel } from '@/lib/banner';
import { useBannerAspectRatio } from '@/hooks/useBannerAspectRatio';

export default function BannerPreview({ banner, onClose }: { banner: Banner; onClose: () => void }) {
  const ratio = useBannerAspectRatio(banner.position);
  return <Modal title={`Xem trước: ${banner.name}`} onClose={onClose}>
    <p className="mb-3 text-sm text-slate-500">{banner.group === 'MAIN' ? 'Banner chính' : 'Banner phụ'} · {positionLabel(banner.position)}</p>
    <div className="relative mx-auto w-full overflow-hidden rounded-xl bg-slate-100" style={{ aspectRatio: ratio, maxWidth: Math.min(680, ratio * 420) }}><BannerMedia banner={banner} preview /></div>
    <p className="mt-3 break-all text-sm text-slate-500">{banner.targetUrl || 'Không có link điều hướng'}</p>
  </Modal>;
}

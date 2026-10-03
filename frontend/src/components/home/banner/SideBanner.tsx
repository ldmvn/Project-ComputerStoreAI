import type { Banner } from '@/types/banner.type';
import MainBannerSlider from './MainBannerSlider';

export default function SideBanner({ banners, label }: { banners: Banner[]; label: string }) {
  if (!banners.length) return null;
  return <MainBannerSlider key={banners.map(banner => `${banner.id}-${banner.updatedAt}`).join(',')} banners={banners} label={label} compact />;
}

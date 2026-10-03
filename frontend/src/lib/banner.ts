import type { BannerGroup, BannerPosition } from '@/types/banner.type';

export const BANNER_POSITIONS: { position: BannerPosition; group: BannerGroup; label: string }[] = [
  { position: 'MAIN_HERO', group: 'MAIN', label: 'Banner chính giữa' },
  { position: 'SIDE_LEFT', group: 'SIDE', label: 'Banner dọc bên trái' },
  { position: 'SIDE_RIGHT_TOP', group: 'SIDE', label: 'Banner phải trên' },
  { position: 'SIDE_RIGHT_MIDDLE', group: 'SIDE', label: 'Banner phải giữa' },
  { position: 'SIDE_RIGHT_BOTTOM', group: 'SIDE', label: 'Banner phải dưới' },
  { position: 'BOTTOM_LEFT', group: 'SIDE', label: 'Banner dưới trái' },
  { position: 'BOTTOM_RIGHT', group: 'SIDE', label: 'Banner dưới phải' },
];
export const positionLabel = (position: BannerPosition) => BANNER_POSITIONS.find(item => item.position === position)?.label || position;
export const IMAGE_LIMIT = 10 * 1024 * 1024;
export const VIDEO_LIMIT = 50 * 1024 * 1024;
export const AUTO_SIDE_ORDER: BannerPosition[] = ['BOTTOM_LEFT', 'BOTTOM_RIGHT', 'SIDE_RIGHT_TOP', 'SIDE_RIGHT_MIDDLE', 'SIDE_RIGHT_BOTTOM', 'SIDE_LEFT'];

// Recommended full-layout ratios; optional slots expand when their neighbours are absent.
export function bannerAspectRatio(position: BannerPosition, viewportWidth: number) {
  if (position === 'MAIN_HERO') return 2;
  if (position.startsWith('BOTTOM')) return 8 / 3;
  if (viewportWidth <= 768) return position === 'SIDE_LEFT' ? 3 / 5 : 5 / 3;
  const containerWidth = viewportWidth >= 1536 ? 1536 : viewportWidth >= 1280 ? 1280 : viewportWidth >= 1024 ? 1024 : 768;
  const gap = viewportWidth >= 1024 ? 16 : 12;
  const usable = containerWidth - (viewportWidth >= 1024 ? 32 : 24) - 2 * gap;
  const heroWidth = usable * 0.54;
  const height = heroWidth / 2 + gap + (heroWidth - 10) / 2 / (8 / 3);
  return position === 'SIDE_LEFT' ? usable * 0.19 / height : usable * 0.27 / ((height - 2 * gap) / 3);
}

export const bannerRecommendation = (position: BannerPosition, ratio: number) => {
  const width = position.startsWith('MAIN') ? 1600 : 800;
  return `Kích thước khuyến nghị: ${width} × ${Math.round(width / ratio)} px hoặc cùng tỉ lệ. Media khác tỉ lệ sẽ được crop ở giữa.`;
};
export const dateLabel = (date: string) => new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Asia/Bangkok' }).format(new Date(date));

export function safeBannerTarget(value: string | null) {
  if (!value || /[\s\\\u0000-\u001f\u007f]/.test(value)) return null;
  if (value.startsWith('/') && !value.startsWith('//')) return value;
  try { return ['http:', 'https:'].includes(new URL(value).protocol) ? value : null; } catch { return null; }
}

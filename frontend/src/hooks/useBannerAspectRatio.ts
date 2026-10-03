'use client';

import { useEffect, useState } from 'react';
import type { BannerPosition } from '@/types/banner.type';
import { bannerAspectRatio } from '@/lib/banner';

export function useBannerAspectRatio(position: BannerPosition) {
  const [width, setWidth] = useState(1024);
  useEffect(() => {
    const update = () => setWidth(window.innerWidth);
    update(); window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  return bannerAspectRatio(position, width);
}

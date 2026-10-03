'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Banner } from '@/types/banner.type';
import { safeBannerTarget } from '@/lib/banner';
import BannerMedia from './BannerMedia';
import styles from './MainBannerSlider.module.css';

export default function MainBannerSlider({ banners, label, compact = false }: { banners: Banner[]; label: string; compact?: boolean }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touching, setTouching] = useState(false);
  const gesture = useRef<{ x: number; y: number; pointerId: number } | null>(null);
  const suppressClick = useRef(false);
  const safeIndex = banners.length ? Math.min(currentIndex, banners.length - 1) : 0;
  const active = banners[safeIndex];
  const multiple = banners.length > 1;

  useEffect(() => {
    if (currentIndex >= banners.length) setCurrentIndex(0);
  }, [banners.length, currentIndex]);

  useEffect(() => {
    if (!multiple) return;
    const delay = active.autoplayInterval || 4500;
    const timer = window.setInterval(() => {
      setCurrentIndex(value => (value + 1) % banners.length);
    }, delay);
    return () => window.clearInterval(timer);
  }, [active.autoplayInterval, banners.length, multiple, safeIndex]);

  if (!active) return null;

  const target = safeBannerTarget(active.targetUrl);
  const media = <BannerMedia key={active.mediaUrl} banner={active} priority={label === 'Giữa - Trên'} />;
  return (
    <div className={`absolute inset-0 ${styles.touchSlider} ${compact ? styles.compact : ''}`} role="region" aria-roledescription="carousel" aria-label={label}
      onPointerDown={event => {
        suppressClick.current = false;
        if (!multiple || event.pointerType !== 'touch' || window.innerWidth >= 1024 || (event.target as HTMLElement).closest('button')) return;
        if (gesture.current) { gesture.current = null; setTouching(false); return; }
        gesture.current = { x: event.clientX, y: event.clientY, pointerId: event.pointerId };
        setTouching(true);
      }}
      onPointerUp={event => {
        const start = gesture.current;
        if (!start || start.pointerId !== event.pointerId) return;
        gesture.current = null; setTouching(false);
        const dx = event.clientX - start.x;
        const dy = event.clientY - start.y;
        if (Math.abs(dx) < 40 || Math.abs(dx) <= Math.abs(dy) * 1.2) return;
        suppressClick.current = true;
        setCurrentIndex(value => (value + (dx < 0 ? 1 : -1) + banners.length) % banners.length);
      }}
      onPointerCancel={() => { gesture.current = null; setTouching(false); }}
      onClickCapture={event => { if (suppressClick.current) { event.preventDefault(); event.stopPropagation(); suppressClick.current = false; } }}>
      <div key={active.id} className={`absolute inset-0 ${multiple ? styles.slide : ''}`} role="group" aria-roledescription="slide" aria-label={`${safeIndex + 1} / ${banners.length}: ${active.name}`}>
        {target ? <Link href={target} className="absolute inset-0" aria-label={active.altText || active.name}>{media}</Link> : media}
      </div>
      {multiple && <>
        <button type="button" aria-label={`${label}: banner trước`} onClick={() => setCurrentIndex(value => (value - 1 + banners.length) % banners.length)} className={`absolute left-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-slate-950/50 text-white hover:bg-slate-950/70 ${styles.arrow}`}><ChevronLeft className="h-5 w-5" /></button>
        <button type="button" aria-label={`${label}: banner tiếp theo`} onClick={() => setCurrentIndex(value => (value + 1) % banners.length)} className={`absolute right-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-slate-950/50 text-white hover:bg-slate-950/70 ${styles.arrow}`}><ChevronRight className="h-5 w-5" /></button>
        <div className={`absolute bottom-3 left-1/2 z-10 flex max-w-[70%] -translate-x-1/2 items-center gap-1 overflow-x-auto rounded-full bg-slate-950/50 px-2 py-1 ${styles.pagination}`}>
          {banners.map((banner, slide) => <button key={banner.id} type="button" onClick={() => setCurrentIndex(slide)} aria-label={`${label}: chọn banner ${slide + 1}`} aria-current={slide === safeIndex ? 'true' : undefined} className={`flex h-6 w-6 shrink-0 items-center justify-center ${styles.dotButton}`}><span className={`h-2 rounded-full transition-all ${slide === safeIndex ? 'w-5 bg-white' : 'w-2 bg-white/50'}`} /></button>)}
        </div>
      </>}
    </div>
  );
}

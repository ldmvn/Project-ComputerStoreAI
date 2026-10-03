'use client';

import { useEffect, useRef, useState } from 'react';
import type { Banner } from '@/types/banner.type';
import { mediaUrl } from '@/services/http.client';

export default function BannerMedia({ banner, preview = false, thumbnail = false, priority = false, onDimensions, onInvalid }: {
  banner: Pick<Banner, 'name' | 'mediaType' | 'mediaUrl' | 'altText'>;
  preview?: boolean; thumbnail?: boolean; priority?: boolean;
  onDimensions?: (width: number, height: number) => void;
  onInvalid?: () => void;
}) {
  const frame = useRef<HTMLDivElement>(null);
  const [nearby, setNearby] = useState(priority || preview);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (nearby || !frame.current) return;
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { setNearby(true); observer.disconnect(); }
    }, { rootMargin: '200px' });
    observer.observe(frame.current);
    return () => observer.disconnect();
  }, [nearby]);
  const fail = () => { setFailed(true); onInvalid?.(); };
  const className = `absolute inset-0 block h-full w-full object-cover object-center transition-opacity duration-300 motion-reduce:transition-none ${ready ? 'opacity-100' : 'opacity-0'}`;
  return <div ref={frame} className="absolute inset-0 overflow-hidden" aria-busy={!ready && !failed}>
    {failed && preview && <p role="status" className="flex h-full items-center justify-center px-3 text-center text-sm text-slate-500">Không thể tải media này.</p>}
    {nearby && !failed && (banner.mediaType === 'VIDEO' ?
      <video src={mediaUrl(banner.mediaUrl)} className={className} autoPlay={!preview && !thumbnail} controls={preview} muted loop playsInline preload="metadata"
        onLoadedMetadata={event => onDimensions?.(event.currentTarget.videoWidth, event.currentTarget.videoHeight)}
        onLoadedData={() => setReady(true)} onCanPlay={() => setReady(true)} onError={fail} aria-label={banner.altText || banner.name} /> :
      // Backend optimizes uploaded images to WebP; reserved slots avoid intrinsic-size shifts.
      // eslint-disable-next-line @next/next/no-img-element
      <img src={mediaUrl(banner.mediaUrl)} className={className} alt={banner.altText || banner.name} loading={priority || preview ? 'eager' : 'lazy'} fetchPriority={priority ? 'high' : 'auto'} decoding="async"
        onLoad={event => { setReady(true); onDimensions?.(event.currentTarget.naturalWidth, event.currentTarget.naturalHeight); }} onError={fail} />)}
  </div>;
}

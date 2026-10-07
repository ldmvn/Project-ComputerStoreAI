'use client';
/* eslint-disable @next/next/no-img-element */
import { useState } from 'react';
import { ImageOff, PackageOpen } from 'lucide-react';
import type { ProductImage } from '@/types/product.type';
import { mediaUrl } from '@/services/http.client';

function GalleryImage({ url, alt, className }: { url: string; alt: string; className: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <span className="flex h-full w-full items-center justify-center text-slate-300" role="img" aria-label="Ảnh không khả dụng"><ImageOff size={32} aria-hidden="true" /></span>;
  return <img src={mediaUrl(url)} alt={alt} className={className} onError={() => setFailed(true)} decoding="async" />;
}

export default function ProductGallery({ name, images, primaryImage }: { name: string; images: ProductImage[]; primaryImage: string | null }) {
  const photos = [...images].sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || a.sortOrder - b.sortOrder || a.id - b.id);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const selected = photos.find(image => image.id === selectedId) || photos[0];
  const url = selected?.imageUrl || primaryImage;
  return <section aria-label="Ảnh sản phẩm" className="min-w-0">
    <div className="relative aspect-[4/3] max-h-[520px] w-full overflow-hidden rounded-2xl border border-slate-200 bg-white" data-testid="product-main-image">
      <div className="absolute inset-0 flex items-center justify-center p-5 sm:p-8">
        {url ? <GalleryImage key={url} url={url} alt={selected?.altText || name} className="h-full w-full object-contain" /> : <div className="flex flex-col items-center gap-3 text-slate-400"><PackageOpen size={64} strokeWidth={1} aria-hidden="true" /><p className="text-sm">Chưa có ảnh sản phẩm</p></div>}
      </div>
    </div>
    {photos.length > 1 && <div className="mt-2 flex gap-2 overflow-x-auto pb-1" aria-label="Chọn ảnh sản phẩm">{photos.map((image, index) => <button key={image.id} type="button" aria-label={`Xem ảnh ${index + 1}`} aria-pressed={selected?.id === image.id} onClick={() => setSelectedId(image.id)} className={`flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 bg-white p-2 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-500 ${selected?.id === image.id ? 'border-orange-500' : 'border-slate-200 hover:border-orange-300'}`}><GalleryImage url={image.imageUrl} alt="" className="h-full w-full object-contain" /></button>)}</div>}
  </section>;
}

'use client';
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from 'react';
import { ImagePlus } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import type { Brand } from '@/services/brand.service';
import { mediaUrl } from '@/services/http.client';

function slugify(value: string) { return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''); }

export default function BrandForm({ brand, busy, error, onClose, onSave }: { brand: Brand | null; busy: boolean; error: string; onClose: () => void; onSave: (body: FormData) => void }) {
  const [name, setName] = useState(brand?.name || '');
  const [slug, setSlug] = useState(brand?.slug || '');
  const [slugTouched, setSlugTouched] = useState(Boolean(brand));
  const [websiteUrl, setWebsiteUrl] = useState(brand?.websiteUrl || '');
  const [description, setDescription] = useState(brand?.description || '');
  const [sortOrder, setSortOrder] = useState(String(brand?.sortOrder ?? 0));
  const [isActive, setIsActive] = useState(brand?.isActive ?? true);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState('');
  const [preview, setPreview] = useState('');

  useEffect(() => { if (!slugTouched) setSlug(slugify(name)); }, [name, slugTouched]);
  useEffect(() => {
    if (!file) { setPreview(''); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const inputClass = 'mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-orange-100';
  const selectLogo = (event: React.ChangeEvent<HTMLInputElement>) => {
    const next = event.target.files?.[0] || null;
    event.target.value = '';
    if (!next) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(next.type) || !/\.(jpe?g|png|webp)$/i.test(next.name)) { setFileError('Chỉ chấp nhận ảnh JPG, PNG hoặc WEBP.'); return; }
    if (next.size > 5 * 1024 * 1024) { setFileError('Logo tối đa 5 MB.'); return; }
    setFileError('');
    setFile(next);
  };

  return <Modal title={brand ? 'Sửa thương hiệu' : 'Thêm thương hiệu'} onClose={onClose} busy={busy}>
    <form onSubmit={event => {
      event.preventDefault();
      const body = new FormData();
      Object.entries({ name: name.trim(), slug: slug.trim(), websiteUrl: websiteUrl.trim(), description: description.trim(), sortOrder, isActive: String(isActive) }).forEach(([key, value]) => body.append(key, value));
      if (file) body.append('logo', file);
      onSave(body);
    }} className="space-y-5">
      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium text-slate-700">Tên thương hiệu *<input required maxLength={191} value={name} onChange={event => setName(event.target.value)} className={inputClass} /></label>
        <label className="text-sm font-medium text-slate-700">Đường dẫn thân thiện *<input required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" maxLength={191} value={slug} onChange={event => { setSlugTouched(true); setSlug(event.target.value); }} className={inputClass} /></label>
        <label className="text-sm font-medium text-slate-700">Website<input type="url" maxLength={1000} placeholder="https://example.com" value={websiteUrl} onChange={event => setWebsiteUrl(event.target.value)} className={inputClass} /></label>
        <label className="text-sm font-medium text-slate-700">Thứ tự hiển thị<input required type="number" min="0" step="1" value={sortOrder} onChange={event => setSortOrder(event.target.value)} className={inputClass} /></label>
      </div>
      <div>
        <p className="mb-2 text-sm font-medium text-slate-700">Logo</p>
        {fileError && <p role="alert" className="mb-2 text-sm text-red-600">{fileError}</p>}
        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-slate-300 px-4 py-3 text-sm text-slate-600 hover:bg-slate-50"><ImagePlus className="h-5 w-5" />Chọn ảnh JPG, PNG hoặc WEBP<input type="file" accept="image/jpeg,image/png,image/webp" onChange={selectLogo} className="sr-only" /></label>
        <div className="mt-3 flex min-h-24 items-center gap-4 rounded-lg border border-slate-100 bg-slate-50 p-3">
          {preview || brand?.logoUrl ? <img src={preview || mediaUrl(brand!.logoUrl!)} alt="Xem trước logo" className="h-20 w-28 rounded-md border border-slate-200 bg-white object-contain p-2" /> : <div className="flex h-20 w-28 items-center justify-center rounded-md border border-slate-200 bg-white text-xs text-slate-400">Chưa có logo</div>}
          <span className="text-sm text-slate-500">{file ? file.name : brand?.logoUrl ? 'Logo hiện tại' : 'Logo sẽ được lưu cùng thương hiệu'}</span>
        </div>
      </div>
      <label className="block text-sm font-medium text-slate-700">Mô tả<textarea maxLength={10000} rows={3} value={description} onChange={event => setDescription(event.target.value)} className={inputClass} /></label>
      <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-slate-700"><input type="checkbox" checked={isActive} onChange={event => setIsActive(event.target.checked)} className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500" />Đang hoạt động</label>
      <div className="flex justify-end gap-3 border-t border-slate-100 pt-4"><button type="button" onClick={onClose} disabled={busy} className="ui-button ui-button--neutral rounded-lg border border-slate-200 px-4 py-2.5 text-sm">Hủy</button><button type="submit" disabled={busy} className="ui-button ui-button--primary rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Đang lưu...' : 'Lưu thương hiệu'}</button></div>
    </form>
  </Modal>;
}
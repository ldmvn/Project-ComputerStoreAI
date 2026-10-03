'use client';

import { useEffect, useState } from 'react';
import Modal from '@/components/ui/Modal';
import type { ProductSection, ProductSectionInput } from '@/types/productSection.type';

function slugify(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export default function ProductSectionForm({ section, busy, onClose, onSave }: {
  section?: ProductSection;
  busy: boolean;
  onClose: () => void;
  onSave: (input: ProductSectionInput) => void;
}) {
  const [name, setName] = useState(section?.name || '');
  const [slug, setSlug] = useState(section?.slug || '');
  const [subtitle, setSubtitle] = useState(section?.subtitle || '');
  const [viewAllUrl, setViewAllUrl] = useState(section?.viewAllUrl || '');
  const [sortOrder, setSortOrder] = useState(String(section?.sortOrder || 0));
  const [isActive, setIsActive] = useState(section?.isActive ?? true);
  const [slugTouched, setSlugTouched] = useState(Boolean(section));

  useEffect(() => {
    if (!slugTouched) setSlug(slugify(name));
  }, [name, slugTouched]);

  return (
    <Modal title={section ? 'Sửa khối sản phẩm' : 'Tạo khối sản phẩm'} onClose={onClose} busy={busy}>
      <form onSubmit={event => { event.preventDefault(); onSave({ name, slug, subtitle, viewAllUrl, sortOrder: Number(sortOrder) || 0, isActive }); }} className="space-y-4">
        <label className="block text-sm font-medium text-slate-700">Tên khối<input required value={name} onChange={event => setName(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5" placeholder="PC bán chạy" /></label>
        <label className="block text-sm font-medium text-slate-700">Slug<input required value={slug} onChange={event => { setSlugTouched(true); setSlug(event.target.value); }} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5" placeholder="pc-ban-chay" /></label>
        <label className="block text-sm font-medium text-slate-700">Tiêu đề phụ<input value={subtitle} onChange={event => setSubtitle(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5" placeholder="Tặng màn hình 240Hz" /></label>
        <label className="block text-sm font-medium text-slate-700">Link Xem tất cả<input value={viewAllUrl} onChange={event => setViewAllUrl(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5" placeholder="Mặc định theo slug" /></label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-slate-700">Thứ tự hiển thị<input type="number" min="0" value={sortOrder} onChange={event => setSortOrder(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5" /></label>
          <label className="flex items-center gap-3 self-end rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700"><input type="checkbox" checked={isActive} onChange={event => setIsActive(event.target.checked)} className="h-4 w-4" /> Active trên Home</label>
        </div>
        <div className="flex justify-end gap-3 pt-2"><button type="button" onClick={onClose} disabled={busy} className="ui-button ui-button--neutral rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium">Hủy</button><button type="submit" disabled={busy} className="ui-button ui-button--primary rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Đang lưu...' : 'Lưu khối'}</button></div>
      </form>
    </Modal>
  );
}

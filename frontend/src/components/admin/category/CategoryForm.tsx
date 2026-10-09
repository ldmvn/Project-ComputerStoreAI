'use client';

import { useEffect, useState } from 'react';
import { slugifyCategory } from '@/components/admin/category/category-slug';
import CategoryIcon from '@/components/category/CategoryIcon';
import Modal from '@/components/ui/Modal';
import type { Category, CategoryInput } from '@/services/category.service';
import CategoryIconPicker from './CategoryIconPicker';

export default function CategoryForm({ category, categories, busy, error, onClose, onSave }: {
  category: Category | null;
  categories: Category[];
  busy: boolean;
  error: string;
  onClose: () => void;
  onSave: (data: CategoryInput) => void;
}) {
  const [name, setName] = useState(category?.name || '');
  const [slug, setSlug] = useState(category?.slug || '');
  const [slugTouched, setSlugTouched] = useState(Boolean(category));
  const [description, setDescription] = useState(category?.description || '');
  const [parentId, setParentId] = useState(category?.parentId ? String(category.parentId) : '');
  const [icon, setIcon] = useState(category?.icon || 'FolderTree');
  const [sortOrder, setSortOrder] = useState(String(category?.sortOrder ?? 0));
  const [isActive, setIsActive] = useState(category?.isActive ?? true);

  useEffect(() => { if (!slugTouched) setSlug(slugifyCategory(name)); }, [name, slugTouched]);

  const descendants = new Set<number>();
  if (category) {
    const pending = [category.id];
    while (pending.length) {
      const current = pending.pop()!;
      categories.filter(item => item.parentId === current).forEach(item => { descendants.add(item.id); pending.push(item.id); });
    }
  }
  const inputClass = 'mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100';

  return (
    <Modal title={category ? 'Sửa danh mục' : 'Thêm danh mục'} onClose={onClose} busy={busy}>
      <form onSubmit={event => {
        event.preventDefault();
        onSave({ name: name.trim(), slug: slug.trim(), description: description.trim() || null, parentId: parentId ? Number(parentId) : null, icon: icon || null, sortOrder: Number(sortOrder), isActive });
      }} className="space-y-5">
        {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-slate-700">Tên danh mục *<input required maxLength={191} value={name} onChange={event => setName(event.target.value)} className={inputClass} /></label>
          <label className="text-sm font-medium text-slate-700">Đường dẫn thân thiện *<input required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" maxLength={191} value={slug} onChange={event => { setSlugTouched(true); setSlug(event.target.value); }} className={inputClass} /></label>
          <label className="text-sm font-medium text-slate-700">Danh mục cha<select value={parentId} onChange={event => setParentId(event.target.value)} className={inputClass}><option value="">Không có</option>{categories.filter(item => item.id !== category?.id && !descendants.has(item.id)).map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <label className="text-sm font-medium text-slate-700">Thứ tự hiển thị<input required type="number" min="0" step="1" value={sortOrder} onChange={event => setSortOrder(event.target.value)} className={inputClass} /></label>
        </div>
        <CategoryIconPicker value={icon} onChange={setIcon} />
        <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm"><span className="flex h-8 w-8 items-center justify-center rounded-md bg-white text-primary-600"><CategoryIcon name={icon} /></span><span className="font-medium text-slate-700">{icon}</span><span className="text-slate-500">{name || 'Xem trước danh mục'}</span></div>
        <label className="block text-sm font-medium text-slate-700">Mô tả<textarea maxLength={10000} rows={3} value={description} onChange={event => setDescription(event.target.value)} className={inputClass} /></label>
        <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-slate-700"><input type="checkbox" checked={isActive} onChange={event => setIsActive(event.target.checked)} className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500" />Hiển thị ngoài website</label>
        <div className="flex justify-end gap-3 border-t border-slate-100 pt-4"><button type="button" onClick={onClose} disabled={busy} className="ui-button ui-button--neutral rounded-lg border border-slate-200 px-4 py-2.5 text-sm">Hủy</button><button type="submit" disabled={busy} className="ui-button ui-button--primary rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Đang lưu...' : 'Lưu danh mục'}</button></div>
      </form>
    </Modal>
  );
}
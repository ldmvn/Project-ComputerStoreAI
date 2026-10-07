'use client';
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from 'react';
import { ImagePlus, Trash2 } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import type { Product } from '@/types/product.type';
import type { Category } from '@/services/category.service';
import type { Brand } from '@/services/brand.service';
import { mediaUrl } from '@/services/http.client';

function slugify(value: string) { return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''); }

export default function ProductForm({ product, categories, brands, busy, error, onClose, onSave }: { product?: Product; categories: Category[]; brands: Brand[]; busy: boolean; error?: string; onClose: () => void; onSave: (data: FormData) => void }) {
  const [name, setName] = useState(product?.name || '');
  const [slug, setSlug] = useState(product?.slug || '');
  const [sku, setSku] = useState(product?.sku || '');
  const [category, setCategory] = useState(product?.categoryId ? String(product.categoryId) : product?.category ? `legacy:${product.category}` : '');
  const [brandId, setBrandId] = useState(product?.brandId ? String(product.brandId) : '');
  const [highlightText, setHighlightText] = useState((product?.highlightSpecs || []).map(item => item.content).join('\n'));
  const [description, setDescription] = useState(product?.description || '');
  const [price, setPrice] = useState(String(product?.price ?? ''));
  const [originalPrice, setOriginalPrice] = useState(String(product?.originalPrice ?? ''));
  const [costPrice, setCostPrice] = useState(String(product?.costPrice ?? ''));
  const [stockQuantity, setStockQuantity] = useState(String(product?.stockQuantity ?? 0));
  const [lowStockThreshold, setLowStockThreshold] = useState(String(product?.lowStockThreshold ?? 5));
  const [isActive, setIsActive] = useState(product?.isActive ?? true);
  const [slugTouched, setSlugTouched] = useState(Boolean(product));
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState('');
  const [previews, setPreviews] = useState<{ file: File; url: string }[]>([]);
  const [removedImageIds, setRemovedImageIds] = useState<number[]>([]);
  const [imageOrder, setImageOrder] = useState<number[]>((product?.images || []).map(image => image.id));
  const [specifications, setSpecifications] = useState((product?.specifications || []).map(item => ({ name: item.name, value: item.value })));

  useEffect(() => { if (!slugTouched) setSlug(slugify(name)); }, [name, slugTouched]);
  useEffect(() => {
    if (product?.categoryId || !product?.category) return;
    const existingCategory = categories.find(item => item.name === product.category);
    if (existingCategory) setCategory(String(existingCategory.id));
  }, [categories, product?.category, product?.categoryId]);
  useEffect(() => {
    const next = files.map(file => ({ file, url: URL.createObjectURL(file) }));
    setPreviews(next);
    return () => next.forEach(item => URL.revokeObjectURL(item.url));
  }, [files]);
  const keptImageOrder = imageOrder.filter(id => !removedImageIds.includes(id));
  const inputClass = 'mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm';
  const addFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files || []);
    event.target.value = '';
    if (!selected.length) return;
    if (selected.some(file => !['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || !/\.(jpe?g|png|webp)$/i.test(file.name))) { setFileError('Chỉ chấp nhận ảnh JPG, PNG hoặc WEBP với MIME đúng.'); return; }
    if (selected.some(file => file.size > 10 * 1024 * 1024)) { setFileError('Ảnh sản phẩm tối đa 10 MB.'); return; }
    if (files.length + selected.length > 10) { setFileError('Mỗi lần lưu chỉ được upload tối đa 10 ảnh mới.'); return; }
    setFileError('');
    setFiles(current => [...current, ...selected]);
  };
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const body = new FormData();
    const selectedCategory = categories.find(item => String(item.id) === category);
    const legacyCategory = category.startsWith('legacy:') ? category.slice('legacy:'.length) : '';
    const keptImageIds = imageOrder.filter(id => !removedImageIds.includes(id));
    Object.entries({ name, slug, sku, category: selectedCategory?.name || legacyCategory || '', categoryId: selectedCategory?.id || '', brandId, description, price, originalPrice, costPrice, stockQuantity, lowStockThreshold, isActive: String(isActive), specifications: JSON.stringify(specifications.filter(item => item.name.trim() && item.value.trim())), highlightSpecs: JSON.stringify(highlightText.split('\n').map(line => line.trim()).filter(Boolean).map((content, sortOrder) => ({ content, sortOrder }))), keepImageIds: JSON.stringify(keptImageIds), imageOrderIds: JSON.stringify(keptImageIds) }).forEach(([key, value]) => body.append(key, String(value)));
    files.forEach(file => body.append('images', file));
    onSave(body);
  };
  return <Modal title={product ? 'Sửa sản phẩm' : 'Thêm sản phẩm'} onClose={onClose} busy={busy}>
    <form onSubmit={submit} className="space-y-6">
      {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <section>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-primary-600">Thông tin cơ bản</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium sm:col-span-2">Tên sản phẩm *<input required value={name} onChange={event => setName(event.target.value)} className={inputClass} /></label>
          <label className="text-sm font-medium">Slug<input required value={slug} onChange={event => { setSlugTouched(true); setSlug(event.target.value); }} className={inputClass} /></label>
          <label className="text-sm font-medium">SKU *<input required value={sku} onChange={event => setSku(event.target.value)} className={inputClass} /></label>
          <label className="text-sm font-medium">Danh mục<select value={category} onChange={event => setCategory(event.target.value)} className={inputClass}><option value="">Chưa phân loại</option>{product?.category && !categories.some(item => item.name === product.category) && <option value={`legacy:${product.category}`}>{product.category} (dữ liệu hiện có)</option>}{categories.map(item => <option key={item.id} value={String(item.id)}>{item.name}{item.isActive ? '' : ' (đang ẩn)'}</option>)}</select></label>
          <label className="text-sm font-medium">Thương hiệu<select value={brandId} onChange={event => setBrandId(event.target.value)} className={inputClass}><option value="">Chưa chọn thương hiệu</option>{brands.map(item => <option key={item.id} value={String(item.id)}>{item.name}{item.isActive ? '' : ' (đang ẩn)'}</option>)}</select></label>
          <label className="text-sm font-medium sm:col-span-2">Mô tả chi tiết<textarea value={description} onChange={event => setDescription(event.target.value)} rows={4} className={inputClass} /></label>
        </div>
      </section>
      <section><div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-semibold uppercase tracking-wide text-primary-600">Thông số nổi bật</h3><span className="text-xs text-slate-500">{highlightText.split('\n').map(line => line.trim()).filter(Boolean).length}/12 dòng</span></div><p className="mb-3 text-xs text-slate-500">Mỗi dòng là một nội dung ngắn gọn (nhấn <kbd className="rounded border border-slate-300 bg-white px-1.5 py-0.5 text-[10px]">Enter</kbd> để xuống dòng mới). Ví dụ: <em>CPU: Intel Core i5-12400F</em>, <em>RAM: 16GB DDR4</em>. Thứ tự hiển thị theo đúng thứ tự dòng. Hiển thị ở khu thông tin bên phải Product Detail và trên các card sản phẩm.</p><textarea value={highlightText} onChange={event => setHighlightText(event.target.value)} rows={8} placeholder={'CPU: Intel Core i5-12400F\nRAM: 16GB DDR4\nSSD: 512GB NVMe\nGPU: RTX 3050 8GB'} className="w-full resize-y rounded-lg border border-slate-200 px-3 py-2.5 font-mono text-sm leading-relaxed" /></section>
      <section><h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-primary-600">Giá và tồn kho</h3><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><label className="text-sm font-medium">Giá bán *<input required type="number" min="0" value={price} onChange={event => setPrice(event.target.value)} className={inputClass} /></label><label className="text-sm font-medium">Giá gốc<input type="number" min="0" value={originalPrice} onChange={event => setOriginalPrice(event.target.value)} className={inputClass} /></label><label className="text-sm font-medium">Giá nhập<input type="number" min="0" value={costPrice} onChange={event => setCostPrice(event.target.value)} className={inputClass} /></label><label className="text-sm font-medium">Tồn kho *<input required type="number" min="0" value={stockQuantity} onChange={event => setStockQuantity(event.target.value)} className={inputClass} /></label><label className="text-sm font-medium">Ngưỡng sắp hết<input type="number" min="0" value={lowStockThreshold} onChange={event => setLowStockThreshold(event.target.value)} className={inputClass} /></label><label className="flex items-center gap-3 self-end rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-medium"><input type="checkbox" checked={isActive} onChange={event => setIsActive(event.target.checked)} className="h-4 w-4" /> Active</label></div></section>
      <section><h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-primary-600">Ảnh sản phẩm</h3>{fileError && <p role="alert" className="mb-3 text-sm text-red-600">{fileError}</p>}<label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-slate-300 px-4 py-3 text-sm text-slate-600 hover:bg-slate-50"><ImagePlus className="h-5 w-5" />Thêm ảnh JPG, PNG, WEBP<input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={addFiles} className="sr-only" /></label><div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-5">{keptImageOrder.map((imageId, index) => { const image = product?.images?.find(item => item.id === imageId); if (!image || removedImageIds.includes(image.id)) return null; return <div key={image.id} className="relative aspect-square overflow-hidden rounded-lg border"><img src={mediaUrl(image.imageUrl)} alt={image.altText || product?.name} className="h-full w-full object-cover" /><span className="absolute bottom-1 left-1 rounded bg-white/90 px-1.5 py-0.5 text-[10px] font-semibold">{index === 0 ? 'Ảnh chính' : `Ảnh ${index + 1}`}</span><div className="absolute right-1 top-1 flex gap-1"><button type="button" disabled={index === 0} onClick={() => setImageOrder(current => { const next = current.filter(id => !removedImageIds.includes(id)); [next[index - 1], next[index]] = [next[index], next[index - 1]]; return next; })} className="ui-button rounded bg-white/90 px-1 text-xs disabled:opacity-30" aria-label="Đưa ảnh lên">↑</button><button type="button" disabled={index === keptImageOrder.length - 1} onClick={() => setImageOrder(current => { const next = current.filter(id => !removedImageIds.includes(id)); [next[index + 1], next[index]] = [next[index], next[index + 1]]; return next; })} className="ui-button rounded bg-white/90 px-1 text-xs disabled:opacity-30" aria-label="Đưa ảnh xuống">↓</button><button type="button" onClick={() => setRemovedImageIds(current => [...current, image.id])} className="ui-button rounded bg-white/90 p-1 text-red-600" aria-label={`Xóa ảnh ${image.id}`}><Trash2 className="h-3.5 w-3.5" /></button></div></div>; })}{previews.map(item => <div key={item.url} className="relative aspect-square overflow-hidden rounded-lg border"><img src={item.url} alt="Ảnh mới" className="h-full w-full object-cover" /><button type="button" onClick={() => setFiles(current => current.filter(file => file !== item.file))} className="ui-button absolute right-1 top-1 rounded bg-white/90 p-1 text-red-600" aria-label={`Bỏ ảnh mới ${item.file.name}`}><Trash2 className="h-3.5 w-3.5" /></button></div>)}</div></section>
      <section><div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-semibold uppercase tracking-wide text-primary-600">Thông số kỹ thuật</h3><button type="button" onClick={() => setSpecifications(current => [...current, { name: '', value: '' }])} className="ui-link text-sm font-semibold text-primary-600">+ Thêm thông số</button></div><div className="space-y-2">{specifications.map((spec, index) => <div key={index} className="flex gap-2"><input value={spec.name} onChange={event => setSpecifications(current => current.map((item, i) => i === index ? { ...item, name: event.target.value } : item))} placeholder="Tên thông số" className="w-2/5 rounded-lg border border-slate-200 px-3 py-2 text-sm" /><input value={spec.value} onChange={event => setSpecifications(current => current.map((item, i) => i === index ? { ...item, value: event.target.value } : item))} placeholder="Giá trị" className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm" /><button type="button" onClick={() => setSpecifications(current => current.filter((_, i) => i !== index))} className="ui-button rounded-lg p-2 text-red-600" aria-label="Xóa thông số"><Trash2 className="h-4 w-4" /></button></div>)}</div></section>
      <div className="flex justify-end gap-3"><button type="button" onClick={onClose} disabled={busy} className="ui-button ui-button--neutral rounded-lg border px-4 py-2.5 text-sm">Hủy</button><button type="submit" disabled={busy} className="ui-button ui-button--primary rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Đang lưu...' : 'Lưu sản phẩm'}</button></div>
    </form>
  </Modal>;
}

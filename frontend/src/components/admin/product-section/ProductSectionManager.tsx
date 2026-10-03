'use client';

import { useCallback, useEffect, useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowUp, Edit3, Plus, Trash2 } from 'lucide-react';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import Modal from '@/components/ui/Modal';
import { useAuthStore } from '@/store/auth.store';
import type { ProductSection, ProductSectionInput } from '@/types/productSection.type';
import {
  addProductsToSection,
  createProductSection,
  deleteProductSection,
  getProductSections,
  removeProductFromSection,
  reorderProductSections,
  reorderSectionProducts,
  setProductSectionStatus,
  updateProductSection,
} from '@/services/productSection.service';
import ProductPicker from './ProductPicker';
import ProductSectionForm from './ProductSectionForm';

const buttonClass = 'ui-button ui-button--neutral inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-40';
function sectionVisibility(section: ProductSection) {
  if (!section.isActive) return { label: 'Đang ẩn', className: 'text-slate-500' };
  if (!section.products.length) return { label: 'Chưa hiển thị - chưa có sản phẩm', className: 'text-amber-700' };
  return { label: 'Đang hiển thị trên trang chủ', className: 'text-green-700' };
}

export default function ProductSectionManager() {
  const token = useAuthStore(state => state.token);
  const [sections, setSections] = useState<ProductSection[]>([]);
  const [selected, setSelected] = useState<ProductSection | null>(null);
  const [editor, setEditor] = useState<ProductSection | null | undefined>(undefined);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [deleting, setDeleting] = useState<ProductSection | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true); setError('');
    try {
      const result = await getProductSections(token);
      setSections(result.sections);
      setSelected(current => current ? result.sections.find(item => item.id === current.id) || null : null);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Không tải được khối sản phẩm.'); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { if (!message) return; const timer = window.setTimeout(() => setMessage(''), 4000); return () => window.clearTimeout(timer); }, [message]);

  const action = async (work: () => Promise<unknown>, success: string) => {
    if (!token || busy) return;
    setBusy(true); setError('');
    try { await work(); setMessage(success); await load(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Thao tác không thành công.'); }
    finally { setBusy(false); }
  };

  const save = (input: ProductSectionInput) => void action(async () => {
    if (editor) await updateProductSection(token!, editor.id, input);
    else await createProductSection(token!, input);
    setEditor(undefined);
  }, editor ? 'Đã cập nhật khối sản phẩm.' : 'Đã tạo khối sản phẩm.');

  const moveSection = (section: ProductSection, direction: -1 | 1) => {
    const index = sections.findIndex(item => item.id === section.id);
    const next = index + direction;
    if (index < 0 || next < 0 || next >= sections.length) return;
    const ids = sections.map(item => item.id);
    [ids[index], ids[next]] = [ids[next], ids[index]];
    void action(() => reorderProductSections(token!, ids), 'Đã lưu thứ tự khối.');
  };

  const moveProduct = (productId: number, direction: -1 | 1) => {
    if (!selected) return;
    const ids = selected.products.map(item => item.id);
    const index = ids.indexOf(productId); const next = index + direction;
    if (index < 0 || next < 0 || next >= ids.length) return;
    [ids[index], ids[next]] = [ids[next], ids[index]];
    void action(async () => { const result = await reorderSectionProducts(token!, selected.id, ids); setSelected(result.section); }, 'Đã lưu thứ tự sản phẩm.');
  };

  if (!token) return null;
  return <section>
    <AdminPageHeader title="Khối sản phẩm" description="Tạo và sắp xếp các nhóm sản phẩm hiển thị trên trang Home." action={<button type="button" onClick={() => setEditor(null)} className="ui-button ui-button--primary inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-700"><Plus className="h-4 w-4" />Tạo khối sản phẩm</button>} />
    {message && <p role="status" className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{message}</p>}
    {error && <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
    {selected ? <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-900/[0.03] sm:p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3"><div><button type="button" onClick={() => setSelected(null)} className="ui-link ui-link--back mb-3 inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700"><ArrowLeft className="h-4 w-4" />Tất cả khối</button><h2 className="text-xl font-semibold text-slate-900">{selected.name}</h2><div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm"><span className={selected.isActive ? 'font-semibold text-green-700' : 'font-semibold text-slate-500'}>{selected.isActive ? 'Active' : 'Inactive'}</span><span className="text-slate-500">{selected.products.length} sản phẩm</span><span className={sectionVisibility(selected).className}>{sectionVisibility(selected).label}</span></div>{selected.subtitle && <p className="mt-1 text-sm text-slate-500">{selected.subtitle}</p>}</div><button type="button" onClick={() => setPickerOpen(true)} className="ui-button ui-button--primary inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white"><Plus className="h-4 w-4" />Thêm sản phẩm</button></div>
      {!selected.products.length ? <p className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">Khối chưa có sản phẩm. Khối trống sẽ không hiển thị trên Home.</p> : <div className="space-y-2">{selected.products.map((product, index) => <div key={product.id} className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-3"><span className="w-6 text-center text-sm font-semibold text-slate-400">{index + 1}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-slate-800">{product.name}</p><p className="text-xs text-slate-500">{product.price.toLocaleString('vi-VN')}đ</p></div><button type="button" className={buttonClass} disabled={busy || index === 0} onClick={() => moveProduct(product.id, -1)} aria-label={`Đưa ${product.name} lên`}><ArrowUp className="h-4 w-4" /></button><button type="button" className={buttonClass} disabled={busy || index === selected.products.length - 1} onClick={() => moveProduct(product.id, 1)} aria-label={`Đưa ${product.name} xuống`}><ArrowDown className="h-4 w-4" /></button><button type="button" className={`${buttonClass} text-red-600`} disabled={busy} onClick={() => void action(async () => { const result = await removeProductFromSection(token!, selected.id, product.id); setSelected(result.section); }, 'Đã xóa sản phẩm khỏi khối.')} aria-label={`Xóa ${product.name} khỏi khối`}><Trash2 className="h-4 w-4" /></button></div>)}</div>}
    </section> : <>
      {loading ? <div className="rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-500">Đang tải khối sản phẩm...</div> : !sections.length ? <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">Chưa có khối sản phẩm.</div> : <div className="space-y-3">{sections.map((section, index) => <article key={section.id} className="ui-card flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/[0.03] sm:p-5"><div className="min-w-0 flex-1"><button type="button" onClick={() => setSelected(section)} className="ui-link truncate text-left font-semibold text-slate-900 hover:text-primary-600">{section.name}</button><p className="mt-1 text-sm text-slate-500">{section.products.length} sản phẩm · Thứ tự {section.sortOrder} · <span className={section.isActive ? 'text-green-700' : 'text-slate-400'}>{section.isActive ? 'Active' : 'Inactive'}</span></p><p className={`mt-1 text-xs font-medium ${sectionVisibility(section).className}`}>{sectionVisibility(section).label}</p></div><div className="flex flex-wrap gap-2"><button type="button" className={buttonClass} onClick={() => setSelected(section)}>Chi tiết</button><button type="button" className={buttonClass} onClick={() => setEditor(section)}><Edit3 className="h-3.5 w-3.5" />Sửa</button><button type="button" className={buttonClass} disabled={busy} onClick={() => void action(() => setProductSectionStatus(token!, section.id, !section.isActive), section.isActive ? 'Đã tắt khối sản phẩm.' : 'Đã bật khối sản phẩm.')}>{section.isActive ? 'Tắt' : 'Bật'}</button><button type="button" className={`${buttonClass} text-red-600`} disabled={busy} onClick={() => setDeleting(section)}><Trash2 className="h-3.5 w-3.5" />Xóa</button><button type="button" className={buttonClass} disabled={busy || index === 0} onClick={() => moveSection(section, -1)} aria-label={`Đưa ${section.name} lên`}><ArrowUp className="h-3.5 w-3.5" /></button><button type="button" className={buttonClass} disabled={busy || index === sections.length - 1} onClick={() => moveSection(section, 1)} aria-label={`Đưa ${section.name} xuống`}><ArrowDown className="h-3.5 w-3.5" /></button></div></article>)}</div>}
    </>}
    {editor !== undefined && <ProductSectionForm section={editor || undefined} busy={busy} onClose={() => setEditor(undefined)} onSave={save} />}
    {pickerOpen && selected && <ProductPicker token={token} existingIds={selected.products.map(product => product.id)} busy={busy} onClose={() => setPickerOpen(false)} onAdd={ids => void action(async () => { const result = await addProductsToSection(token!, selected.id, ids); setSelected(result.section); setPickerOpen(false); }, 'Đã thêm sản phẩm vào khối.')} />}
    {deleting && <Modal title="Xóa khối sản phẩm" onClose={() => setDeleting(null)} busy={busy}><p className="text-slate-600">Xóa “{deleting.name}”? Sản phẩm gốc sẽ không bị xóa.</p><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setDeleting(null)} className="ui-button ui-button--neutral rounded-lg border px-4 py-2.5">Hủy</button><button type="button" onClick={() => void action(async () => { await deleteProductSection(token!, deleting.id); setDeleting(null); }, 'Đã xóa khối sản phẩm.')} className="ui-button ui-button--danger rounded-lg bg-red-600 px-4 py-2.5 font-semibold text-white">Xóa khối</button></div></Modal>}
  </section>;
}

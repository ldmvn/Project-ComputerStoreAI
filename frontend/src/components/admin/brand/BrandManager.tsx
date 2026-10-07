'use client';
/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useState } from 'react';
import { Badge, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import { useAuthStore } from '@/store/auth.store';
import { createBrand, deleteBrand, getAdminBrands, setBrandStatus, updateBrand, type Brand } from '@/services/brand.service';
import { mediaUrl } from '@/services/http.client';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import BrandForm from './BrandForm';

export default function BrandManager() {
  const token = useAuthStore(state => state.token);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [editor, setEditor] = useState<Brand | null | undefined>(undefined);
  const toast = useToast();
  const confirm = useConfirm();

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try { setBrands((await getAdminBrands(token)).brands); setError(''); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Không tải được thương hiệu.'); }
    finally { setLoading(false); }
  }, [token]);
  useEffect(() => { void load(); }, [load]);

  const perform = async (work: () => Promise<unknown>, success: string) => {
    if (!token || busy) return;
    setBusy(true); setError(''); setMessage('');
    try { await work(); setMessage(success); await load(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Thao tác không thành công.'); }
    finally { setBusy(false); }
  };
  const save = (body: FormData) => void perform(async () => {
    if (editor) await updateBrand(token!, editor.id, body);
    else await createBrand(token!, body);
    setEditor(undefined);
  }, editor ? 'Đã cập nhật thương hiệu.' : 'Đã tạo thương hiệu.');
  const toggle = (brand: Brand) => void perform(() => setBrandStatus(token!, brand.id, !brand.isActive), brand.isActive ? 'Đã ẩn thương hiệu.' : 'Đã hiển thị thương hiệu.');
  const remove = async (brand: Brand) => {
    const accepted = await confirm({
      title: `Xóa thương hiệu “${brand.name}”?`,
      description: 'Thao tác này không thể hoàn tác. Vui lòng chuyển các sản phẩm sang thương hiệu khác trước khi xóa.',
      confirmLabel: 'Xóa thương hiệu',
      destructive: true,
    });
    if (!accepted) return;
    void perform(() => deleteBrand(token!, brand.id), 'Đã xóa thương hiệu.');
  };

  const filtered = brands.filter(brand => {
    const query = search.trim().toLocaleLowerCase('vi');
    if (query && !brand.name.toLocaleLowerCase('vi').includes(query) && !brand.slug.toLocaleLowerCase('vi').includes(query)) return false;
    if (status === 'active' && !brand.isActive) return false;
    if (status === 'inactive' && brand.isActive) return false;
    return true;
  });
  const actionClass = 'ui-button inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-40';

  if (!token) return null;
  return <section>
    <AdminPageHeader title="Thương hiệu" description="Quản lý thương hiệu và các sản phẩm đang sử dụng." action={<button type="button" onClick={() => setEditor(null)} className="ui-button ui-button--primary inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white"><Plus className="h-4 w-4" />Thêm thương hiệu</button>} />
    {message && <p role="status" className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{message}</p>}
    {error && <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
    <div className="mb-4 grid gap-3 rounded-xl border border-slate-200 bg-white p-3 sm:grid-cols-[minmax(220px,1fr)_200px] sm:p-4">
      <input aria-label="Tìm kiếm thương hiệu" value={search} onChange={event => setSearch(event.target.value)} placeholder="Tìm tên hoặc đường dẫn..." className="min-w-0 rounded-lg border border-slate-200 px-3 py-2.5 text-sm" />
      <select aria-label="Lọc trạng thái thương hiệu" value={status} onChange={event => setStatus(event.target.value)} className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm"><option value="">Tất cả trạng thái</option><option value="active">Đang hoạt động</option><option value="inactive">Đang ẩn</option></select>
    </div>
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-900/[0.03]">
      {loading ? <div role="status" className="space-y-3 p-5">{[0, 1, 2].map(item => <div key={item} className="h-12 animate-pulse rounded-lg bg-slate-100" />)}</div>
        : filtered.length === 0 ? <div className="flex min-h-52 flex-col items-center justify-center px-5 py-10 text-center"><Badge className="mb-3 h-8 w-8 text-slate-300" aria-hidden="true" /><p className="text-sm text-slate-600">{brands.length ? 'Không tìm thấy thương hiệu phù hợp.' : 'Chưa có thương hiệu nào.'}</p>{brands.length === 0 && <button type="button" onClick={() => setEditor(null)} className="ui-button ui-button--primary mt-4 inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white"><Plus className="h-4 w-4" />Tạo thương hiệu đầu tiên</button>}</div>
          : <div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left text-sm"><thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">Logo</th><th className="px-4 py-3">Thương hiệu</th><th className="px-4 py-3">Website</th><th className="px-4 py-3">Sản phẩm</th><th className="px-4 py-3">Thứ tự</th><th className="px-4 py-3">Trạng thái</th><th className="px-4 py-3">Thao tác</th></tr></thead><tbody className="divide-y divide-slate-100">{filtered.map(brand => <tr key={brand.id} className="hover:bg-slate-50/70"><td className="px-4 py-3">{brand.logoUrl ? <img src={mediaUrl(brand.logoUrl)} alt={`Logo ${brand.name}`} className="h-11 w-16 rounded-md border border-slate-100 bg-white object-contain p-1" /> : <div className="flex h-11 w-16 items-center justify-center rounded-md bg-slate-100 text-xs text-slate-400">Không có</div>}</td><td className="px-4 py-3"><p className="font-medium text-slate-800">{brand.name}</p><p className="font-mono text-xs text-slate-500">/{brand.slug}</p></td><td className="px-4 py-3">{brand.websiteUrl ? <a href={brand.websiteUrl} target="_blank" rel="noreferrer" className="max-w-52 truncate text-primary-700 hover:underline">{brand.websiteUrl}</a> : <span className="text-slate-400">—</span>}</td><td className="px-4 py-3 tabular-nums text-slate-700">{brand.productCount}</td><td className="px-4 py-3 tabular-nums text-slate-700">{brand.sortOrder}</td><td className="px-4 py-3"><button type="button" onClick={() => toggle(brand)} disabled={busy} className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium disabled:opacity-40 ${brand.isActive ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-600'}`}>{brand.isActive ? 'Đang hoạt động' : 'Đang ẩn'}</button></td><td className="px-4 py-3"><div className="flex gap-2"><button type="button" onClick={() => setEditor(brand)} disabled={busy} className={actionClass} aria-label={`Sửa ${brand.name}`} title="Sửa"><Pencil className="h-4 w-4" /></button><button type="button" onClick={() => remove(brand)} disabled={busy || brand.productCount > 0} className={actionClass} aria-label={`Xóa ${brand.name}`} title={brand.productCount > 0 ? 'Chuyển sản phẩm sang thương hiệu khác trước khi xóa' : 'Xóa'}><Trash2 className="h-4 w-4" /></button></div></td></tr>)}</tbody></table></div>}
    </div>
    {!loading && brands.length > 0 && <button type="button" onClick={() => void load()} className="ui-button mt-3 inline-flex items-center gap-2 text-sm text-slate-600"><RefreshCw className="h-4 w-4" />Tải lại</button>}
    {editor !== undefined && <BrandForm brand={editor} busy={busy} error={error} onClose={() => { if (!busy) { setEditor(undefined); setError(''); } }} onSave={save} />}
  </section>;
}
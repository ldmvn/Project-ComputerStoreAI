'use client';
/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useState } from 'react';
import { Edit3, Eye, Plus, Trash2 } from 'lucide-react';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import Modal from '@/components/ui/Modal';
import { useAuthStore } from '@/store/auth.store';
import type { Product } from '@/types/product.type';
import { mediaUrl } from '@/services/http.client';
import { createProduct, deleteProduct, getAdminProduct, getAdminProducts, setProductStatus, updateProduct, type ProductListQuery } from '@/services/product.service';
import { getAdminCategories, type Category } from '@/services/category.service';
import { getAdminBrands, type Brand } from '@/services/brand.service';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import ProductDetail from './ProductDetail';
import ProductForm from './ProductForm';

const emptyQuery: ProductListQuery = { page: 1, limit: 20, sort: 'newest' };
const actionClass = 'ui-button ui-button--neutral inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40';

export default function ProductManager() {
  const token = useAuthStore(state => state.token);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, outOfStock: 0, inactive: 0 });
  const [query, setQuery] = useState<ProductListQuery>(emptyQuery);
  const [search, setSearch] = useState('');
  const [meta, setMeta] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [editor, setEditor] = useState<Product | null | undefined>(undefined);
  const [detail, setDetail] = useState<Product | null>(null);
  const confirm = useConfirm();

  const load = useCallback(async (nextQuery: ProductListQuery) => {
    if (!token) return;
    setLoading(true); setError('');
    try { const result = await getAdminProducts(token, nextQuery); setProducts(result.products); setMeta(result.meta); setStats(result.stats); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Không tải được sản phẩm.'); }
    finally { setLoading(false); }
  }, [token]);
  useEffect(() => { const timer = window.setTimeout(() => setQuery(current => ({ ...current, search, page: 1 })), 350); return () => window.clearTimeout(timer); }, [search]);
  useEffect(() => { void load(query); }, [load, query]);
  useEffect(() => {
    if (!token) return;
    getAdminCategories(token).then(result => setCategories(result.categories)).catch(() => {});
    getAdminBrands(token).then(result => setBrands(result.brands)).catch(() => {});
  }, [token]);

  const action = async (work: () => Promise<unknown>, success: string) => { if (!token || busy) return; setBusy(true); setError(''); try { await work(); setMessage(success); await load(query); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Thao tác không thành công.'); } finally { setBusy(false); } };
  const save = (body: FormData) => void action(async () => { if (editor) await updateProduct(token!, editor.id, body); else await createProduct(token!, body); setEditor(undefined); }, editor ? 'Đã cập nhật sản phẩm.' : 'Đã tạo sản phẩm.');
  const openDetail = async (product: Product) => { try { setDetail((await getAdminProduct(token!, product.id)).product); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Không tải được chi tiết.'); } };
  const removeProduct = async (product: Product) => {
    const accepted = await confirm({
      title: `Xóa sản phẩm “${product.name}”?`,
      description: 'Thao tác này không thể hoàn tác. Sản phẩm sẽ bị ẩn khỏi gian hàng.',
      confirmLabel: 'Xóa sản phẩm',
      destructive: true,
    });
    if (!accepted) return;
    void action(() => deleteProduct(token!, product.id), 'Đã ẩn sản phẩm.');
  };
  if (!token) return null;
  return <section>
    <AdminPageHeader title="Quản lý sản phẩm" description="Quản lý dữ liệu sản phẩm gốc, giá, tồn kho, ảnh và thông số kỹ thuật." action={<button type="button" onClick={() => setEditor(null)} className="ui-button ui-button--primary inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white"><Plus className="h-4 w-4" />Thêm sản phẩm</button>} />
    {message && <p role="status" className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{message}</p>}{error && <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
    <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[['Tổng sản phẩm', stats.total, 'text-slate-900'], ['Đang bán', stats.active, 'text-green-700'], ['Hết hàng', stats.outOfStock, 'text-red-600'], ['Đang ẩn', stats.inactive, 'text-slate-500']].map(([label, value, color]) => <div key={String(label)} className="ui-card rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/[0.03]"><p className="text-sm text-slate-500">{label}</p><p className={`mt-1 text-2xl font-semibold ${color}`}>{value}</p></div>)}</div>
    <div className="mb-4 flex flex-wrap gap-3 rounded-xl border border-slate-200 bg-white p-4"><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Tìm tên, SKU, slug..." className="min-w-[220px] flex-1 rounded-lg border border-slate-200 px-3 py-2.5 text-sm" /><select value={query.category || ''} onChange={event => setQuery(current => ({ ...current, category: event.target.value, page: 1 }))} className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm"><option value="">Tất cả danh mục</option>{categories.map(category => <option key={category.id} value={category.slug}>{category.name}</option>)}</select><select value={query.status || ''} onChange={event => setQuery(current => ({ ...current, status: event.target.value, page: 1 }))} className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm"><option value="">Tất cả trạng thái</option><option value="active">Active</option><option value="inactive">Inactive</option><option value="outOfStock">Hết hàng</option></select><select value={query.stock || ''} onChange={event => setQuery(current => ({ ...current, stock: event.target.value, page: 1 }))} className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm"><option value="">Tất cả tồn kho</option><option value="low">Sắp hết</option><option value="out">Hết hàng</option></select><select value={query.sort || 'newest'} onChange={event => setQuery(current => ({ ...current, sort: event.target.value, page: 1 }))} className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm"><option value="newest">Mới nhất</option><option value="oldest">Cũ nhất</option><option value="priceAsc">Giá tăng dần</option><option value="priceDesc">Giá giảm dần</option><option value="nameAsc">Tên A-Z</option><option value="nameDesc">Tên Z-A</option><option value="stockAsc">Tồn kho tăng</option><option value="stockDesc">Tồn kho giảm</option></select></div>
    <div className="mb-4 flex flex-wrap gap-3 rounded-xl border border-slate-200 bg-white p-4"><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Tìm tên, SKU, slug..." className="min-w-[220px] flex-1 rounded-lg border border-slate-200 px-3 py-2.5 text-sm" /><select value={query.category || ''} onChange={event => setQuery(current => ({ ...current, category: event.target.value, page: 1 }))} className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm"><option value="">Tất cả danh mục</option>{categories.map(category => <option key={category.id} value={category.slug}>{category.name}</option>)}</select><select value={query.status || ''} onChange={event => setQuery(current => ({ ...current, status: event.target.value, page: 1 }))} className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm"><option value="">Tất cả trạng thái</option><option value="active">Active</option><option value="inactive">Inactive</option><option value="outOfStock">Hết hàng</option></select><select value={query.stock || ''} onChange={event => setQuery(current => ({ ...current, stock: event.target.value, page: 1 }))} className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm"><option value="">Tất cả tồn kho</option><option value="low">Sắp hết</option><option value="out">Hết hàng</option></select><select value={query.sort || 'newest'} onChange={event => setQuery(current => ({ ...current, sort: event.target.value, page: 1 }))} className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm"><option value="newest">Mới nhất</option><option value="oldest">Cũ nhất</option><option value="priceAsc">Giá tăng dần</option><option value="priceDesc">Giá giảm dần</option><option value="nameAsc">Tên A-Z</option><option value="nameDesc">Tên Z-A</option><option value="stockAsc">Tồn kho tăng</option><option value="stockDesc">Tồn kho giảm</option></select></div>
    <div className="mb-4 flex justify-end"><select aria-label="Lọc theo thương hiệu" value={query.brand || ''} onChange={event => setQuery(current => ({ ...current, brand: event.target.value, page: 1 }))} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm sm:w-64"><option value="">Tất cả thương hiệu</option>{brands.map(brand => <option key={brand.id} value={brand.slug}>{brand.name}</option>)}</select></div>
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-900/[0.03]"><div className="overflow-x-auto">{loading ? <p className="p-8 text-sm text-slate-500">Đang tải sản phẩm...</p> : <table className="w-full min-w-[900px] text-left text-sm"><thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">Ảnh</th><th className="px-4 py-3">Sản phẩm</th><th className="px-4 py-3">SKU</th><th className="px-4 py-3">Danh mục</th><th className="px-4 py-3">Giá bán</th><th className="px-4 py-3">Kho</th><th className="px-4 py-3">Trạng thái</th><th className="px-4 py-3">Thao tác</th></tr></thead><tbody className="divide-y divide-slate-100">{products.map(product => <tr key={product.id} className="hover:bg-slate-50"><td className="px-4 py-3">{product.primaryImage ? <img src={mediaUrl(product.primaryImage)} alt={product.name} className="h-12 w-12 rounded-lg object-cover" /> : <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-xs text-slate-400">N/A</div>}</td><td className="max-w-[220px] px-4 py-3"><p className="truncate font-medium text-slate-800">{product.name}</p><p className="truncate text-xs text-slate-500">{product.slug}</p></td><td className="px-4 py-3 font-mono text-xs">{product.sku}</td><td className="px-4 py-3 text-slate-600">{product.category || '-'}</td><td className="px-4 py-3 font-semibold text-primary-600">{product.price.toLocaleString('vi-VN')}đ</td><td className="px-4 py-3">{product.stockQuantity}</td><td className="px-4 py-3"><span className={product.isActive ? 'text-green-700' : 'text-slate-500'}>{product.isActive ? 'Active' : 'Inactive'}</span><p className="text-xs text-slate-500">{product.stockStatus === 'OUT_OF_STOCK' ? 'Hết hàng' : product.stockStatus === 'LOW_STOCK' ? 'Sắp hết' : 'Còn hàng'}</p></td><td className="px-4 py-3"><div className="flex flex-wrap gap-1.5"><button type="button" className={actionClass} onClick={() => void openDetail(product)}><Eye className="h-3.5 w-3.5" />Xem</button><button type="button" className={actionClass} onClick={async () => setEditor((await getAdminProduct(token!, product.id)).product)}><Edit3 className="h-3.5 w-3.5" />Sửa</button><button type="button" className={actionClass} disabled={busy} onClick={() => void action(() => setProductStatus(token!, product.id, !product.isActive), product.isActive ? 'Đã ẩn sản phẩm.' : 'Đã bật sản phẩm.')}>{product.isActive ? 'Ẩn' : 'Hiện'}</button><button type="button" className={`${actionClass} text-red-600`} disabled={busy} onClick={() => void removeProduct(product)}><Trash2 className="h-3.5 w-3.5" />Xóa</button></div></td></tr>)}</tbody></table>}</div>{!loading && <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-sm text-slate-500"><span>{meta.total} sản phẩm</span><div className="flex gap-2"><button type="button" disabled={meta.page <= 1} onClick={() => setQuery(current => ({ ...current, page: current.page! - 1 }))} className={actionClass}>Trước</button><span className="px-2 py-2">{meta.totalPages ? `${meta.page}/${meta.totalPages}` : '0/0'}</span><button type="button" disabled={meta.page >= meta.totalPages} onClick={() => setQuery(current => ({ ...current, page: current.page! + 1 }))} className={actionClass}>Sau</button></div></div>}</div>
    {editor !== undefined && <ProductForm product={editor || undefined} categories={categories} brands={brands} busy={busy} error={error} onClose={() => setEditor(undefined)} onSave={save} />}{detail && <ProductDetail product={detail} onClose={() => setDetail(null)} onEdit={() => { setEditor(detail); setDetail(null); }} />}
  </section>;
}

'use client';
import { useCallback, useEffect, useState } from 'react';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import { adminActionButtonClass } from '@/components/admin/adminActionStyles';
import Modal from '@/components/ui/Modal';
import { useAuthStore } from '@/store/auth.store';
import { getAdminCategories, type Category } from '@/services/category.service';
import { getAdminBrands, type Brand } from '@/services/brand.service';
import { getAdminMenu, getMenuOptions, saveMenu, saveGroup, deleteGroup, saveItem, deleteItem, invalidateMenuCache, type AdminMenu, type MenuGroup, type MenuItem, type MenuItemInput, type GroupInput, type ItemType, type AttributeOption } from '@/services/megaMenu.service';
import { useConfirm } from '@/components/ui/ConfirmDialog';

const inputClass = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm';
const buttonClass = adminActionButtonClass;
const types: Record<ItemType, string> = { CATEGORY: 'Danh mục', BRAND: 'Thương hiệu', PRICE_FILTER: 'Khoảng giá', ATTRIBUTE_FILTER: 'Thuộc tính', CUSTOM_URL: 'URL tùy chỉnh' };
const emptyGroup: GroupInput = { title: '', sortOrder: 0, columnSpan: 1, isActive: true };
const emptyItem: MenuItemInput = { label: '', type: 'CATEGORY', sortOrder: 0, isActive: true };

export default function MegaMenuManager() {
  const token = useAuthStore(s => s.token);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [attributes, setAttributes] = useState<AttributeOption[]>([]);
  const [categoryId, setCategoryId] = useState(0);
  const [menu, setMenu] = useState<AdminMenu | null>(null);
  const [enabled, setEnabled] = useState(true);
  const [brandIds, setBrandIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [groupEditor, setGroupEditor] = useState<{ id: number | null; data: GroupInput } | null>(null);
  const [itemEditor, setItemEditor] = useState<{ groupId: number; id: number | null; data: MenuItemInput } | null>(null);
  const confirm = useConfirm();
  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    Promise.all([getAdminCategories(token, controller.signal), getAdminBrands(token, controller.signal), getMenuOptions(token, controller.signal)])
      .then(([c, b, a]) => { setCategories(c.categories); setBrands(b.brands); setAttributes(a.attributes); setCategoryId(c.categories.find(c => c.parentId === null)?.id || 0); })
      .catch(e => { if (!controller.signal.aborted) setError(e.message); });
    return () => controller.abort();
  }, [token]);
  const load = useCallback(async (signal?: AbortSignal) => {
    if (!token || !categoryId) return;
    setLoading(true);
    try { const result = await getAdminMenu(token, categoryId, signal); if (signal?.aborted) return; setMenu(result.menu); setEnabled(result.menu?.isActive ?? true); setBrandIds(result.menu?.brands.map(b => b.brandId) || []); }
    catch (e) { if (!signal?.aborted) setError(e instanceof Error ? e.message : 'Không tải được menu.'); }
    finally { if (!signal?.aborted) setLoading(false); }
  }, [token, categoryId]);
  useEffect(() => { const controller = new AbortController(); setMenu(null); setError(''); void load(controller.signal); return () => controller.abort(); }, [load]);
  const perform = async (work: () => Promise<unknown>) => {
    if (busy || !token) return;
    setBusy(true); setError(''); setMessage('');
    try { await work(); invalidateMenuCache(); setMessage('Đã lưu thay đổi.'); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Không lưu được thay đổi.'); }
    finally { setBusy(false); }
  };
  const editGroup = (group?: MenuGroup) => setGroupEditor({ id: group?.id || null, data: group ? { title: group.title, sortOrder: group.sortOrder, columnSpan: group.columnSpan, isActive: group.isActive } : { ...emptyGroup, sortOrder: (menu?.groups.length || 0) * 10 } });
  const editItem = (group: MenuGroup, item?: MenuItem) => setItemEditor({ groupId: group.id, id: item?.id || null, data: item ? { ...item } : { ...emptyItem, sortOrder: group.items.length * 10 } });
  const patchItem = (patch: Partial<MenuItemInput>) => setItemEditor(e => e ? { ...e, data: { ...e.data, ...patch } } : e);
  const patchGroup = (patch: Partial<GroupInput>) => setGroupEditor(e => e ? { ...e, data: { ...e.data, ...patch } } : e);
  if (!token) return null;
  return <section>
    <AdminPageHeader title="Mega Menu" description="Cấu hình nhóm hiển thị và liên kết tới dữ liệu sản phẩm hiện có." />
    {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-red-700">{error}</p>}
    {message && <p role="status" className="mb-4 rounded-lg bg-green-50 p-3 text-green-800">{message}</p>}
    <div className="mb-5 space-y-4 rounded-xl border bg-white p-5">
      <label className="block space-y-2"><span>Danh mục cấp chính</span><select aria-label="Danh mục cấp chính" className={inputClass} value={categoryId} disabled={busy} onChange={e => { setCategoryId(Number(e.target.value)); setMessage(''); }}><option value={0}>Chọn danh mục</option>{categories.filter(c => c.parentId === null).map(c => <option key={c.id} value={c.id}>{c.name}{!c.isActive ? ' (đang ẩn)' : ''}</option>)}</select></label>
      {!categories.some(c => c.parentId === null) && <p className="text-sm text-slate-500">Tạo danh mục cấp chính trong module Danh mục trước.</p>}
      {categoryId > 0 && !loading && <>
        <label className="flex gap-2"><input type="checkbox" checked={enabled} disabled={busy} onChange={e => setEnabled(e.target.checked)} />Bật Mega Menu</label>
        <fieldset><legend className="mb-2 font-medium">Thương hiệu nổi bật</legend><div className="flex flex-wrap gap-4">{brands.map(b => <label key={b.id} className="flex gap-2 text-sm"><input type="checkbox" disabled={busy} checked={brandIds.includes(b.id)} onChange={e => setBrandIds(ids => e.target.checked ? [...ids, b.id] : ids.filter(id => id !== b.id))} />{b.name}{!b.isActive ? ' (đang ẩn)' : ''}</label>)}</div></fieldset>
        <button className={buttonClass} disabled={busy} onClick={() => void perform(() => saveMenu(token, categoryId, enabled, brandIds))}>Lưu cấu hình</button>
      </>}
    </div>
    {loading && <p role="status">Đang tải...</p>}
    {!loading && menu && <><div className="mb-4 flex justify-between"><h2 className="text-lg font-semibold">Nhóm hiển thị</h2><button className={buttonClass} disabled={busy} onClick={() => editGroup()}>Thêm nhóm</button></div>
      {menu.groups.length === 0 && <p className="text-slate-500">Chưa có nhóm. Thêm nhóm rồi chọn các liên kết từ Category, Brand hoặc bộ lọc.</p>}
      <div className="space-y-4">{menu.groups.map(group => <article key={group.id} className="rounded-xl border bg-white p-4" data-testid={`group-${group.id}`}>
        <div className="mb-3 flex flex-wrap items-center gap-2"><h3 className="mr-auto font-semibold">{group.title} <span className="text-xs font-normal text-slate-500">#{group.sortOrder} · {group.columnSpan} cột · {group.isActive ? 'Hiển thị' : 'Đang ẩn'}</span></h3>
          <button className={buttonClass} disabled={busy} onClick={() => void perform(() => saveGroup(token, categoryId, group.id, { title: group.title, columnSpan: group.columnSpan, sortOrder: group.sortOrder, isActive: !group.isActive }))}>{group.isActive ? 'Ẩn' : 'Hiện'} nhóm {group.title}</button>
          <button className={buttonClass} disabled={busy} onClick={() => editGroup(group)}>Sửa nhóm {group.title}</button>
          <button className={buttonClass} disabled={busy} onClick={async () => { const accepted = await confirm({ title: `Xóa nhóm “${group.title}” và các mục bên trong?`, confirmLabel: 'Xóa nhóm', destructive: true }); if (accepted) void perform(() => deleteGroup(token, group.id)); }}>Xóa nhóm {group.title}</button>
        </div>
        <ul className="divide-y">{group.items.map(item => <li key={item.id} className="flex flex-wrap items-center gap-2 py-3"><span className="mr-auto">{item.label} <small className="text-slate-500">{types[item.type]} · #{item.sortOrder}{item.type === 'ATTRIBUTE_FILTER' && ` · ${item.productCount || 0} sản phẩm`}{!item.isActive && ' · Đang ẩn'}</small>{item.invalid && <span className="ml-2 text-xs text-red-600">Tham chiếu đã bị xóa/ẩn hoặc không còn hợp lệ</span>}</span><button className={buttonClass} disabled={busy} onClick={() => editItem(group, item)}>Sửa {item.label}</button><button className={buttonClass} disabled={busy} onClick={async () => { const accepted = await confirm({ title: `Xóa mục “${item.label}”?`, confirmLabel: 'Xóa mục', destructive: true }); if (accepted) void perform(() => deleteItem(token, item.id)); }}>Xóa {item.label}</button></li>)}</ul>
        <button className={`${buttonClass} mt-3`} disabled={busy} onClick={() => editItem(group)}>Thêm mục vào {group.title}</button>
      </article>)}</div>
    </>}
    {groupEditor && <Modal title={groupEditor.id ? 'Sửa nhóm' : 'Thêm nhóm'} busy={busy} onClose={() => setGroupEditor(null)}><form className="space-y-4" onSubmit={e => { e.preventDefault(); void perform(async () => { await saveGroup(token, categoryId, groupEditor.id, groupEditor.data); setGroupEditor(null); }); }}>
      <label className="block">Tên nhóm<input autoFocus required maxLength={191} className={inputClass} value={groupEditor.data.title} onChange={e => patchGroup({ title: e.target.value })} /></label>
      <label className="block">Thứ tự nhóm<input required type="number" min={0} max={2147483647} className={inputClass} value={groupEditor.data.sortOrder} onChange={e => patchGroup({ sortOrder: Number(e.target.value) })} /></label>
      <label className="block">Column span<input required type="number" min={1} max={4} className={inputClass} value={groupEditor.data.columnSpan} onChange={e => patchGroup({ columnSpan: Number(e.target.value) })} /></label>
      <label className="flex gap-2"><input type="checkbox" checked={groupEditor.data.isActive} onChange={e => patchGroup({ isActive: e.target.checked })} />Hiển thị nhóm</label>
      {error && <p role="alert" className="text-red-600">{error}</p>}<button className={buttonClass} disabled={busy}>Lưu nhóm</button>
    </form></Modal>}
    {itemEditor && <Modal title={itemEditor.id ? 'Sửa mục' : 'Thêm mục'} busy={busy} onClose={() => setItemEditor(null)}><form className="space-y-4" onSubmit={e => { e.preventDefault(); void perform(async () => { await saveItem(token, itemEditor.groupId, itemEditor.id, itemEditor.data); setItemEditor(null); }); }}>
      <label className="block">Tên hiển thị<input autoFocus required maxLength={191} className={inputClass} value={itemEditor.data.label} onChange={e => patchItem({ label: e.target.value })} /></label>
      <label className="block">Loại<select className={inputClass} value={itemEditor.data.type} onChange={e => patchItem({ type: e.target.value as ItemType, categoryId: null, brandId: null, attributeId: null, attributeValueId: null, attributeName: null, attributeValue: null, minPrice: null, maxPrice: null, customUrl: null })}>{Object.entries(types).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      {itemEditor.data.type === 'CATEGORY' && <label className="block">Danh mục liên kết<select required className={inputClass} value={itemEditor.data.categoryId || ''} onChange={e => patchItem({ categoryId: Number(e.target.value) })}><option value="">Chọn danh mục</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}{!c.isActive ? ' (đang ẩn)' : ''}</option>)}</select></label>}
      {itemEditor.data.type === 'BRAND' && <label className="block">Thương hiệu liên kết<select required className={inputClass} value={itemEditor.data.brandId || ''} onChange={e => patchItem({ brandId: Number(e.target.value) })}><option value="">Chọn thương hiệu</option>{brands.map(b => <option key={b.id} value={b.id}>{b.name}{!b.isActive ? ' (đang ẩn)' : ''}</option>)}</select></label>}
      {itemEditor.data.type === 'PRICE_FILTER' && <div className="grid grid-cols-2 gap-3">{(['minPrice', 'maxPrice'] as const).map(field => <label key={field}>{field === 'minPrice' ? 'Giá tối thiểu' : 'Giá tối đa'}<input type="number" min={0} max={2147483647} className={inputClass} value={itemEditor.data[field] ?? ''} onChange={e => patchItem({ [field]: e.target.value === '' ? null : Number(e.target.value) })} /></label>)}</div>}
      {itemEditor.data.type === 'ATTRIBUTE_FILTER' && <><label className="block">Thuộc tính<select required className={inputClass} value={itemEditor.data.attributeId || ''} onChange={e => patchItem({ attributeId: Number(e.target.value) || null, attributeValueId: null })}><option value="">Chọn thuộc tính</option>{attributes.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></label><label className="block">Giá trị thuộc tính<select required className={inputClass} value={itemEditor.data.attributeValueId || ''} onChange={e => patchItem({ attributeValueId: Number(e.target.value) || null })}><option value="">Chọn giá trị</option>{attributes.find(a => a.id === itemEditor.data.attributeId)?.values.map(v => <option key={v.id} value={v.id}>{v.value}</option>)}</select></label>{!attributes.length && <p className="text-sm text-slate-500">Hãy tạo và bật giá trị thuộc tính trong module Thuộc tính trước.</p>}</>}
      {itemEditor.data.type === 'CUSTOM_URL' && <label className="block">URL<input required maxLength={1000} placeholder="/customer/products hoặc https://..." className={inputClass} value={itemEditor.data.customUrl || ''} onChange={e => patchItem({ customUrl: e.target.value })} /></label>}
      <label className="block">Thứ tự mục<input required type="number" min={0} max={2147483647} className={inputClass} value={itemEditor.data.sortOrder} onChange={e => patchItem({ sortOrder: Number(e.target.value) })} /></label>
      <label className="flex gap-2"><input type="checkbox" checked={itemEditor.data.isActive} onChange={e => patchItem({ isActive: e.target.checked })} />Hiển thị mục</label>
      {error && <p role="alert" className="text-red-600">{error}</p>}<button className={buttonClass} disabled={busy}>Lưu mục</button>
    </form></Modal>}
  </section>;
}

'use client';

import { useCallback, useEffect, useState } from 'react';
import { ChevronDown, Eye, EyeOff, Pencil, Plus, Tags, Trash2 } from 'lucide-react';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminFeedback from '@/components/admin/AdminFeedback';
import AdminFilterBar from '@/components/admin/AdminFilterBar';
import { adminActionButtonClass } from '@/components/admin/adminActionStyles';
import EmptyState from '@/components/ui/EmptyState';
import Modal from '@/components/ui/Modal';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { useAuthStore } from '@/store/auth.store';
import { getAdminCategories, type Category } from '@/services/category.service';
import { createAttribute, createAttributeValue, deleteAttribute, deleteAttributeValue, getAttributes, setAttributeCategories, setAttributeOrder, setAttributeStatus, setAttributeValueStatus, updateAttribute, updateAttributeValue, type Attribute, type AttributeInput, type AttributeType, type AttributeValue } from '@/services/attribute.service';

const types: Record<AttributeType, string> = { SELECT: 'Chọn một', MULTI_SELECT: 'Chọn nhiều', TEXT: 'Văn bản', NUMBER: 'Số', BOOLEAN: 'Có/Không' };
const inputClass = 'mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm';
const actionClass = adminActionButtonClass;
const slugify = (value: string) => value.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const emptyAttribute: AttributeInput = { name: '', slug: '', type: 'SELECT', sortOrder: 0, isActive: true };
const CHIP_LIMIT = 4;

export default function AttributeManager() {
  const token = useAuthStore(state => state.token);
  const confirm = useConfirm();
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [editor, setEditor] = useState<{ id: number | null; data: AttributeInput } | null>(null);
  const [valueEditor, setValueEditor] = useState<{ attribute: Attribute; value: AttributeValue | null; data: { value: string; sortOrder: number; isActive: boolean } } | null>(null);
  const [categoryEditor, setCategoryEditor] = useState<Attribute | null>(null);
  const [categoryIds, setCategoryIds] = useState<number[]>([]);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try { const [a, c] = await Promise.all([getAttributes(token), getAdminCategories(token)]); setAttributes(a.attributes); setCategories(c.categories); setError(''); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Không tải được thuộc tính.'); }
    finally { setLoading(false); }
  }, [token]);
  useEffect(() => { void load(); }, [load]);

  const perform = async (work: () => Promise<unknown>, success: string, close?: () => void) => {
    if (!token || busy) return;
    setBusy(true); setError(''); setMessage('');
    try { await work(); close?.(); setMessage(success); await load(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Thao tác không thành công.'); }
    finally { setBusy(false); }
  };
  const edit = (attribute?: Attribute) => setEditor({ id: attribute?.id || null, data: attribute ? { name: attribute.name, slug: attribute.slug, type: attribute.type, sortOrder: attribute.sortOrder, isActive: attribute.isActive } : { ...emptyAttribute, sortOrder: attributes.length * 10 } });
  const remove = async (attribute: Attribute) => { const accepted = await confirm({ title: `Xóa thuộc tính "${attribute.name}"?`, description: 'Không thể xóa nếu thuộc tính đang được sản phẩm sử dụng.', confirmLabel: 'Xóa thuộc tính', destructive: true }); if (accepted) void perform(() => deleteAttribute(token!, attribute.id), 'Đã xóa thuộc tính.'); };
  const removeValue = async (value: AttributeValue) => { const accepted = await confirm({ title: `Xóa giá trị "${value.value}"?`, description: 'Không thể xóa nếu giá trị đang được sản phẩm sử dụng.', confirmLabel: 'Xóa giá trị', destructive: true }); if (accepted) void perform(() => deleteAttributeValue(token!, value.id), 'Đã xóa giá trị.'); };

  if (!token) return null;
  return (
    <section>
      <AdminPageHeader title="Thuộc tính" />
      <AdminFeedback message={message} error={error} />
      <AdminFilterBar className="flex items-center justify-end p-3">
        <button type="button" className="ui-button ui-button--primary inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-primary-600 px-3.5 py-2 text-sm font-semibold text-white" onClick={() => edit()}><Plus className="h-4 w-4" />Thêm thuộc tính</button>
      </AdminFilterBar>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-900/[0.03]">
        {loading ? (
          <p role="status" className="p-6 text-sm text-slate-500">Đang tải thuộc tính...</p>
        ) : attributes.length === 0 ? (
          <EmptyState variant="inline" icon={Tags} title="Chưa có thuộc tính nào." description="Thuộc tính chuẩn hóa được dùng cho bộ lọc gian hàng và Mega Menu." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2.5">Thuộc tính</th>
                  <th className="px-3 py-2.5">Loại</th>
                  <th className="px-3 py-2.5">Giá trị</th>
                  <th className="px-3 py-2.5">Danh mục</th>
                  <th className="px-3 py-2.5">Thứ tự</th>
                  <th className="px-3 py-2.5">Trạng thái</th>
                  <th className="px-3 py-2.5">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {attributes.map(attribute => {
                  const hasValues = ['SELECT', 'MULTI_SELECT'].includes(attribute.type);
                  const isExpanded = expandedId === attribute.id;
                  const visibleValues = attribute.values.slice(0, CHIP_LIMIT);
                  const hiddenCount = attribute.values.length - CHIP_LIMIT;
                  return (
                    <>
                      <tr key={attribute.id} className={`hover:bg-slate-50/70 ${isExpanded ? 'bg-primary-50/30' : ''}`}>
                        <td className="px-3 py-2">
                          <p className="font-medium text-slate-800">{attribute.name}</p>
                          <p className="font-mono text-xs text-slate-500">/{attribute.slug}</p>
                        </td>
                        <td className="px-3 py-2 text-slate-600">{types[attribute.type]}</td>
                        <td className="px-3 py-2">
                          {hasValues ? (
                            <div className="flex flex-wrap items-center gap-1">
                              {visibleValues.map(v => (
                                <span key={v.id} className={`inline-flex rounded-md border bg-white px-1.5 py-0.5 text-xs ${v.isActive ? 'text-slate-700' : 'text-slate-400 line-through'}`}>{v.value}</span>
                              ))}
                              {hiddenCount > 0 && (
                                <button type="button" onClick={() => setExpandedId(isExpanded ? null : attribute.id)} className="inline-flex items-center rounded-md bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600 hover:bg-slate-200">+{hiddenCount}</button>
                              )}
                              {attribute.values.length === 0 && <span className="text-xs text-slate-400">Chưa có</span>}
                              <button type="button" onClick={() => setExpandedId(isExpanded ? null : attribute.id)} className={`ml-0.5 inline-flex h-5 w-5 items-center justify-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-600 ${isExpanded ? 'rotate-180' : ''}`} aria-label={isExpanded ? 'Thu gọn' : 'Mở rộng giá trị'} title={isExpanded ? 'Thu gọn' : 'Quản lý giá trị'}><ChevronDown className="h-3.5 w-3.5" /></button>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <button type="button" onClick={() => { setCategoryEditor(attribute); setCategoryIds(attribute.categories?.map(c => c.id) || []); }} className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-0.5 text-xs text-slate-600 hover:bg-slate-50">
                            {attribute.categories?.length || 0} danh mục
                          </button>
                        </td>
                        <td className="px-3 py-2">
                          <input aria-label={`Thứ tự ${attribute.name}`} type="number" min={0} defaultValue={attribute.sortOrder} onBlur={event => { const v = Number(event.target.value); if (Number.isSafeInteger(v) && v >= 0 && v !== attribute.sortOrder) void perform(() => setAttributeOrder(token, attribute.id, v), 'Đã cập nhật thứ tự.'); }} className="w-16 rounded-md border border-slate-200 px-2 py-1 text-sm" />
                        </td>
                        <td className="px-3 py-2">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${attribute.isActive ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{attribute.isActive ? 'Đang bật' : 'Đang tắt'}</span>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex flex-wrap gap-1">
                            <button type="button" aria-label={`Sửa ${attribute.name}`} onClick={() => edit(attribute)} className={actionClass}><Pencil className="h-3.5 w-3.5" />Sửa</button>
                            <button type="button" aria-label={`${attribute.isActive ? 'Ẩn' : 'Hiện'} ${attribute.name}`} disabled={busy} onClick={() => void perform(() => setAttributeStatus(token, attribute.id, !attribute.isActive), 'Đã cập nhật trạng thái.')} className={actionClass}>{attribute.isActive ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}{attribute.isActive ? 'Ẩn' : 'Hiện'}</button>
                            <button type="button" aria-label={`Xóa ${attribute.name}`} disabled={busy} onClick={() => void remove(attribute)} className={`${actionClass} text-red-600 hover:border-red-200 hover:bg-red-50`}><Trash2 className="h-3.5 w-3.5" />Xóa</button>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && hasValues && (
                        <tr key={`${attribute.id}-expand`}>
                          <td colSpan={7} className="bg-slate-50/60 px-4 py-3">
                            <div className="flex items-center justify-between pb-2">
                              <p className="text-xs font-semibold text-slate-600">Giá trị — {attribute.name}</p>
                              <button type="button" className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50" onClick={() => setValueEditor({ attribute, value: null, data: { value: '', sortOrder: attribute.values.length * 10, isActive: true } })}><Plus className="h-3 w-3" />Thêm giá trị</button>
                            </div>
                            {attribute.values.length === 0 ? (
                              <p className="text-xs text-slate-400">Chưa có giá trị nào.</p>
                            ) : (
                              <div className="flex flex-wrap gap-1.5">
                                {attribute.values.map(v => (
                                  <span key={v.id} className={`inline-flex items-center gap-1.5 rounded-lg border bg-white px-2 py-1 text-xs ${v.isActive ? 'text-slate-700' : 'opacity-50'}`}>
                                    <span>{v.value}</span>
                                    <span className="text-slate-400">#{v.sortOrder}</span>
                                    <button type="button" aria-label={`Bật tắt ${v.value}`} onClick={() => void perform(() => setAttributeValueStatus(token, v.id, !v.isActive), 'Đã cập nhật giá trị.')} className="text-slate-400 hover:text-slate-700">{v.isActive ? '●' : '○'}</button>
                                    <button type="button" aria-label={`Sửa ${v.value}`} onClick={() => setValueEditor({ attribute, value: v, data: { value: v.value, sortOrder: v.sortOrder, isActive: v.isActive } })} className="text-slate-400 hover:text-primary-600"><Pencil className="h-3 w-3" /></button>
                                    <button type="button" aria-label={`Xóa ${v.value}`} onClick={() => void removeValue(v)} className="text-slate-400 hover:text-red-600"><Trash2 className="h-3 w-3" /></button>
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editor && <Modal title={editor.id ? 'Sửa thuộc tính' : 'Thêm thuộc tính'} busy={busy} onClose={() => setEditor(null)}><form className="space-y-4" onSubmit={event => { event.preventDefault(); void perform(() => editor.id ? updateAttribute(token, editor.id, editor.data) : createAttribute(token, editor.data), editor.id ? 'Đã cập nhật thuộc tính.' : 'Đã tạo thuộc tính.', () => setEditor(null)); }}><label className="block text-sm font-medium">Tên<input autoFocus required maxLength={191} className={inputClass} value={editor.data.name} onChange={event => setEditor(current => current && ({ ...current, data: { ...current.data, name: event.target.value, ...(!current.id ? { slug: slugify(event.target.value) } : {}) } }))} /></label><label className="block text-sm font-medium">Slug<input required className={inputClass} value={editor.data.slug} onChange={event => setEditor(current => current && ({ ...current, data: { ...current.data, slug: event.target.value } }))} /></label><label className="block text-sm font-medium">Loại<select className={inputClass} value={editor.data.type} onChange={event => setEditor(current => current && ({ ...current, data: { ...current.data, type: event.target.value as AttributeType } }))}>{Object.entries(types).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="block text-sm font-medium">Thứ tự<input type="number" min={0} className={inputClass} value={editor.data.sortOrder} onChange={event => setEditor(current => current && ({ ...current, data: { ...current.data, sortOrder: Number(event.target.value) } }))} /></label><label className="flex gap-2 text-sm"><input type="checkbox" checked={editor.data.isActive} onChange={event => setEditor(current => current && ({ ...current, data: { ...current.data, isActive: event.target.checked } }))} />Đang hoạt động</label><button disabled={busy} className="ui-button ui-button--primary rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white">Lưu thuộc tính</button></form></Modal>}
      {valueEditor && <Modal title={valueEditor.value ? 'Sửa giá trị' : `Thêm giá trị cho ${valueEditor.attribute.name}`} busy={busy} onClose={() => setValueEditor(null)}><form className="space-y-4" onSubmit={event => { event.preventDefault(); void perform(() => valueEditor.value ? updateAttributeValue(token, valueEditor.value.id, valueEditor.data) : createAttributeValue(token, valueEditor.attribute.id, valueEditor.data), 'Đã lưu giá trị.', () => setValueEditor(null)); }}><label className="block text-sm font-medium">Giá trị<input autoFocus required maxLength={500} className={inputClass} value={valueEditor.data.value} onChange={event => setValueEditor(current => current && ({ ...current, data: { ...current.data, value: event.target.value } }))} /></label><label className="block text-sm font-medium">Thứ tự<input type="number" min={0} className={inputClass} value={valueEditor.data.sortOrder} onChange={event => setValueEditor(current => current && ({ ...current, data: { ...current.data, sortOrder: Number(event.target.value) } }))} /></label><label className="flex gap-2 text-sm"><input type="checkbox" checked={valueEditor.data.isActive} onChange={event => setValueEditor(current => current && ({ ...current, data: { ...current.data, isActive: event.target.checked } }))} />Đang hoạt động</label><button disabled={busy} className="ui-button ui-button--primary rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white">Lưu giá trị</button></form></Modal>}
      {categoryEditor && <Modal title={`Danh mục dùng ${categoryEditor.name}`} busy={busy} onClose={() => setCategoryEditor(null)}><form onSubmit={event => { event.preventDefault(); void perform(() => setAttributeCategories(token, categoryEditor.id, categoryIds), 'Đã cập nhật danh mục.', () => setCategoryEditor(null)); }}><div className="max-h-80 space-y-2 overflow-y-auto">{categories.map(category => <label key={category.id} className="flex gap-2 rounded-lg border p-2 text-sm"><input type="checkbox" checked={categoryIds.includes(category.id)} onChange={event => setCategoryIds(current => event.target.checked ? [...current, category.id] : current.filter(id => id !== category.id))} />{category.name}</label>)}</div><button disabled={busy} className="ui-button ui-button--primary mt-4 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white">Lưu liên kết</button></form></Modal>}
    </section>
  );
}

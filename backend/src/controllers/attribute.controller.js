import * as service from '../services/attribute.service.js';
import { parseAttribute, parseCategoryIds, parseOrder, parseStatus, parseValue, positiveId } from '../validators/attribute.validator.js';

const wrap = handler => (req, res, next) => Promise.resolve(handler(req, res)).catch(next);
export const list = wrap(async (_req, res) => res.json({ attributes: await service.listAttributes() }));
export const byCategory = wrap(async (req, res) => res.json({ attributes: await service.categoryAttributes(positiveId(req.params.categoryId, 'Danh mục')) }));
export const publicByCategory = wrap(async (req, res) => res.json({ attributes: await service.categoryAttributesBySlug(String(req.params.slug || '').trim()) }));
export const create = wrap(async (req, res) => res.status(201).json({ attribute: await service.createAttribute(parseAttribute(req.body)), message: 'Đã tạo thuộc tính.' }));
export const update = wrap(async (req, res) => res.json({ attribute: await service.updateAttribute(positiveId(req.params.id), parseAttribute(req.body)), message: 'Đã cập nhật thuộc tính.' }));
export const remove = wrap(async (req, res) => { await service.deleteAttribute(positiveId(req.params.id)); res.json({ message: 'Đã xóa thuộc tính.' }); });
export const status = wrap(async (req, res) => res.json({ attribute: await service.setAttributeStatus(positiveId(req.params.id), parseStatus(req.body?.isActive)), message: 'Đã cập nhật trạng thái.' }));
export const order = wrap(async (req, res) => res.json({ attribute: await service.setAttributeOrder(positiveId(req.params.id), parseOrder(req.body?.sortOrder)), message: 'Đã cập nhật thứ tự.' }));
export const categories = wrap(async (req, res) => res.json({ attribute: await service.saveCategories(positiveId(req.params.id), parseCategoryIds(req.body)), message: 'Đã cập nhật danh mục.' }));
export const createValue = wrap(async (req, res) => res.status(201).json({ value: await service.createValue(positiveId(req.params.id), parseValue(req.body)), message: 'Đã thêm giá trị.' }));
export const updateValue = wrap(async (req, res) => res.json({ value: await service.updateValue(positiveId(req.params.valueId), parseValue(req.body)), message: 'Đã cập nhật giá trị.' }));
export const valueStatus = wrap(async (req, res) => res.json({ value: await service.updateValue(positiveId(req.params.valueId), { isActive: parseStatus(req.body?.isActive) }), message: 'Đã cập nhật trạng thái.' }));
export const valueOrder = wrap(async (req, res) => res.json({ value: await service.updateValue(positiveId(req.params.valueId), { sortOrder: parseOrder(req.body?.sortOrder) }), message: 'Đã cập nhật thứ tự.' }));
export const removeValue = wrap(async (req, res) => { await service.deleteValue(positiveId(req.params.valueId)); res.json({ message: 'Đã xóa giá trị.' }); });

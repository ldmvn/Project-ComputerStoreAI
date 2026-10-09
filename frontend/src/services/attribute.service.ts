import { apiRequest } from './http.client';

export type AttributeType = 'SELECT' | 'MULTI_SELECT' | 'TEXT' | 'NUMBER' | 'BOOLEAN';
export type AttributeValue = { id: number; attributeId: number; value: string; sortOrder: number; isActive: boolean };
export type Attribute = {
  id: number; name: string; slug: string; type: AttributeType; sortOrder: number; isActive: boolean;
  values: AttributeValue[];
  categories?: { id: number; name: string; slug: string; sortOrder: number }[];
  _count?: { productValues: number; menuItems: number };
};
export type AttributeInput = Pick<Attribute, 'name' | 'slug' | 'type' | 'sortOrder' | 'isActive'>;

const root = '/admin/attributes';
export const getAttributes = (token: string, signal?: AbortSignal) => apiRequest<{ attributes: Attribute[] }>(root, { signal }, token);
export const getCategoryAttributes = (token: string, categoryId: number, signal?: AbortSignal) => apiRequest<{ attributes: Attribute[] }>(`${root}/category/${categoryId}`, { signal }, token);
export const getPublicCategoryAttributes = (categorySlug: string, signal?: AbortSignal) => apiRequest<{ attributes: Attribute[] }>(`/attributes/category/${encodeURIComponent(categorySlug)}`, { signal });
export const createAttribute = (token: string, body: AttributeInput) => apiRequest(`${root}`, { method: 'POST', body: JSON.stringify(body) }, token);
export const updateAttribute = (token: string, id: number, body: AttributeInput) => apiRequest(`${root}/${id}`, { method: 'PUT', body: JSON.stringify(body) }, token);
export const deleteAttribute = (token: string, id: number) => apiRequest(`${root}/${id}`, { method: 'DELETE' }, token);
export const setAttributeStatus = (token: string, id: number, isActive: boolean) => apiRequest(`${root}/${id}/status`, { method: 'PATCH', body: JSON.stringify({ isActive }) }, token);
export const setAttributeOrder = (token: string, id: number, sortOrder: number) => apiRequest(`${root}/${id}/order`, { method: 'PATCH', body: JSON.stringify({ sortOrder }) }, token);
export const setAttributeCategories = (token: string, id: number, categoryIds: number[]) => apiRequest(`${root}/${id}/categories`, { method: 'PUT', body: JSON.stringify({ categoryIds }) }, token);
export const createAttributeValue = (token: string, id: number, body: Omit<AttributeValue, 'id' | 'attributeId'>) => apiRequest(`${root}/${id}/values`, { method: 'POST', body: JSON.stringify(body) }, token);
export const updateAttributeValue = (token: string, id: number, body: Omit<AttributeValue, 'id' | 'attributeId'>) => apiRequest(`${root}/values/${id}`, { method: 'PUT', body: JSON.stringify(body) }, token);
export const deleteAttributeValue = (token: string, id: number) => apiRequest(`${root}/values/${id}`, { method: 'DELETE' }, token);
export const setAttributeValueStatus = (token: string, id: number, isActive: boolean) => apiRequest(`${root}/values/${id}/status`, { method: 'PATCH', body: JSON.stringify({ isActive }) }, token);

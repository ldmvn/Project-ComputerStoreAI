import type { Product, ProductListResponse } from '@/types/product.type';
import { apiRequest } from './http.client';

export type ProductListQuery = { page?: number; limit?: number; search?: string; category?: string; status?: string; stock?: string; sort?: string };

function queryString(query: ProductListQuery) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => { if (value !== undefined && value !== '') params.set(key, String(value)); });
  return params.toString();
}

export const getAdminProducts = (token: string, query: ProductListQuery = {}, signal?: AbortSignal) => apiRequest<ProductListResponse>(`/admin/products?${queryString(query)}`, { signal }, token);
export const getAdminProduct = (token: string, id: number, signal?: AbortSignal) => apiRequest<{ product: Product }>(`/admin/products/${id}`, { signal }, token);
export const getProductCategories = (token: string, signal?: AbortSignal) => apiRequest<{ categories: string[] }>('/admin/products/categories', { signal }, token);
export const createProduct = (token: string, body: FormData) => apiRequest<{ product: Product; message: string }>('/admin/products', { method: 'POST', body }, token);
export const updateProduct = (token: string, id: number, body: FormData) => apiRequest<{ product: Product; message: string }>(`/admin/products/${id}`, { method: 'PUT', body }, token);
export const setProductStatus = (token: string, id: number, isActive: boolean) => apiRequest<{ product: Product; message: string }>(`/admin/products/${id}/status`, { method: 'PATCH', body: JSON.stringify({ isActive }) }, token);
export const deleteProduct = (token: string, id: number) => apiRequest<{ message: string }>(`/admin/products/${id}`, { method: 'DELETE' }, token);
export const deleteProductImage = (token: string, productId: number, imageId: number) => apiRequest<{ product: Product; message: string }>(`/admin/products/${productId}/images/${imageId}`, { method: 'DELETE' }, token);

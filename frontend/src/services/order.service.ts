import type { Order, OrderListResponse, OrderStats } from '@/types/order.type';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export class OrderRequestError extends Error {
  status: number;
  constructor(message: string, status = 500) {
    super(message);
    this.name = 'OrderRequestError';
    this.status = status;
  }
}

async function request<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...init?.headers },
    });
  } catch {
    throw new OrderRequestError('Không thể kết nối máy chủ.', 0);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new OrderRequestError(data.message || 'Yêu cầu không thành công.', res.status);
  return data as T;
}

export type OrderFilters = {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
};

export function getMyOrders(token: string, filters: OrderFilters = {}): Promise<OrderListResponse> {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.search) params.set('search', filters.search);
  if (filters.page) params.set('page', String(filters.page));
  params.set('limit', String(filters.limit ?? 10));
  return request<OrderListResponse>(`/orders/me?${params}`, token);
}

export function getOrderStats(token: string): Promise<OrderStats> {
  return request<OrderStats>('/orders/me/stats', token);
}

export function cancelOrder(token: string, orderId: number): Promise<{ order: Order }> {
  return request<{ order: Order }>(`/orders/${orderId}/cancel`, token, { method: 'POST' });
}

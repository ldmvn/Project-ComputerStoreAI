export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'SHIPPING' | 'DELIVERED' | 'CANCELLED';

export type OrderItem = {
  id: number;
  productId: number;
  productName: string;
  productSlug?: string;
  productImage?: string | null;
  variant?: string | null;
  quantity: number;
  unitPrice: number;
};

export type Order = {
  id: number;
  orderCode: string;
  status: OrderStatus;
  totalAmount: number;
  note?: string | null;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
};

export type OrderStats = {
  total: number;
  waitingPickup: number;
  completed: number;
  totalValue: number;
};

export type OrderListResponse = {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
};

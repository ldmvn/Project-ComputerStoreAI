import { create } from 'zustand';
import type { Product } from '@/types/product.type';

export type CartItem = Pick<Product, 'id' | 'slug' | 'name' | 'price' | 'primaryImage' | 'stockQuantity'> & { quantity: number };
const storageKey = 'ducmanhpc-cart';

function persist(items: CartItem[]) {
  try { localStorage.setItem(storageKey, JSON.stringify(items)); return true; } catch { return false; }
}
function validItem(item: CartItem) {
  return item && Number.isSafeInteger(item.id) && item.id > 0 && typeof item.slug === 'string' && typeof item.name === 'string'
    && Number.isSafeInteger(item.price) && item.price >= 0 && Number.isSafeInteger(item.stockQuantity) && item.stockQuantity > 0
    && Number.isSafeInteger(item.quantity) && item.quantity > 0 && item.quantity <= item.stockQuantity
    && (item.primaryImage === null || typeof item.primaryImage === 'string');
}

type CartState = {
  items: CartItem[];
  hydrated: boolean;
  hydrate: () => void;
  addItem: (product: Product, buyNow?: boolean) => boolean;
  setQuantity: (id: number, quantity: number) => boolean;
  removeItem: (id: number) => boolean;
};
export const useCartStore = create<CartState>((set, get) => ({
  items: [], hydrated: false,
  hydrate: () => {
    if (get().hydrated) return;
    try {
      const stored = JSON.parse(localStorage.getItem(storageKey) || '[]');
      const seen = new Set<number>();
      const items: CartItem[] = Array.isArray(stored) ? stored.filter(item => {
        if (!validItem(item) || seen.has(item.id)) return false;
        seen.add(item.id); return true;
      }).slice(0, 100) : [];
      set({ items, hydrated: true });
    } catch { set({ items: [], hydrated: true }); }
  },
  addItem: (product, buyNow = false) => {
    get().hydrate();
    if (!product.isActive || product.isDeleted || product.stockQuantity <= 0) return false;
    const existing = get().items.find(item => item.id === product.id);
    const quantity = buyNow ? Math.min(existing?.quantity || 1, product.stockQuantity) : (existing?.quantity || 0) + 1;
    if (quantity > product.stockQuantity) return false;
    const item: CartItem = { id: product.id, name: product.name, slug: product.slug, price: product.price, primaryImage: product.primaryImage, stockQuantity: product.stockQuantity, quantity };
    const items = [...get().items.filter(row => row.id !== product.id), item];
    if (!persist(items)) return false;
    set({ items }); return true;
  },
  setQuantity: (id, quantity) => {
    const item = get().items.find(item => item.id === id);
    if (!item || !Number.isSafeInteger(quantity) || quantity < 1 || quantity > item.stockQuantity) return false;
    const items = get().items.map(item => item.id === id ? { ...item, quantity } : item);
    if (!persist(items)) return false;
    set({ items }); return true;
  },
  removeItem: id => {
    const items = get().items.filter(item => item.id !== id);
    if (!persist(items)) return false;
    set({ items }); return true;
  },
}));

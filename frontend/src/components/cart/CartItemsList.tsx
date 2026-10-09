'use client';
import type { CartItem as CartItemData } from '@/store/cart.store';
import CartItem from './CartItem';

interface CartItemsListProps {
  items: CartItemData[];
  readOnly?: boolean;
  onQuantityChange?: (id: number, quantity: number) => void;
  onRemove?: (item: CartItemData) => void;
}

export default function CartItemsList({ items, readOnly, onQuantityChange, onRemove }: CartItemsListProps) {
  return (
    <ul data-testid="cart-items" className="min-w-0 divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white px-4">
      {items.map(item => (
        <CartItem
          key={item.id}
          item={item}
          readOnly={readOnly}
          onQuantityChange={quantity => onQuantityChange?.(item.id, quantity)}
          onRemove={() => onRemove?.(item)}
        />
      ))}
    </ul>
  );
}

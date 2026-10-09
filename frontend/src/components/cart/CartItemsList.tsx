'use client';
import type { CartItem as CartItemData } from '@/store/cart.store';
import CartItem from './CartItem';

interface CartItemsListProps {
  items: CartItemData[];
  selectedIds: Set<number>;
  readOnly?: boolean;
  onToggle: (id: number) => void;
  onToggleAll: () => void;
  onQuantityChange?: (id: number, quantity: number) => void;
  onRemove?: (item: CartItemData) => void;
}

export default function CartItemsList({ items, selectedIds, readOnly, onToggle, onToggleAll, onQuantityChange, onRemove }: CartItemsListProps) {
  const allSelected = items.length > 0 && items.every(i => selectedIds.has(i.id));

  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white">
      {/* Select all header */}
      {!readOnly && (
        <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
          <button
            type="button"
            role="checkbox"
            aria-checked={allSelected}
            onClick={onToggleAll}
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors"
            style={{ borderColor: allSelected ? '#C4480A' : '#cbd5e1', backgroundColor: allSelected ? '#C4480A' : 'white' }}
          >
            {allSelected && (
              <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none">
                <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
          <span className="text-sm text-slate-600">
            Chọn tất cả (<span className="font-medium tabular-nums">{selectedIds.size}/{items.length}</span>)
          </span>
        </div>
      )}

      <ul data-testid="cart-items" className="divide-y divide-slate-100 px-4">
        {items.map(item => (
          <CartItem
            key={item.id}
            item={item}
            readOnly={readOnly}
            checked={selectedIds.has(item.id)}
            onToggle={() => onToggle(item.id)}
            onQuantityChange={quantity => onQuantityChange?.(item.id, quantity)}
            onRemove={() => onRemove?.(item)}
          />
        ))}
      </ul>
    </div>
  );
}

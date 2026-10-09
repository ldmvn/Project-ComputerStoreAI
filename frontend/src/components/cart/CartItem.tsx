'use client';
/* eslint-disable @next/next/no-img-element */
import Link from 'next/link';
import { Minus, PackageOpen, Plus, Trash2 } from 'lucide-react';
import type { CartItem as CartItemData } from '@/store/cart.store';
import { formatProductPrice, productDetailHref } from '@/lib/product';
import { mediaUrl } from '@/services/http.client';

interface CartItemProps {
  item: CartItemData;
  readOnly?: boolean;
  onQuantityChange?: (quantity: number) => void;
  onRemove?: () => void;
}

export default function CartItem({ item, readOnly = false, onQuantityChange, onRemove }: CartItemProps) {
  const lineTotal = item.price * item.quantity;
  const atMax = item.quantity >= item.stockQuantity;
  const stepClass = 'flex h-9 w-9 items-center justify-center text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-transparent';

  return (
    <li className="grid grid-cols-[72px_minmax(0,1fr)] items-start gap-x-3 gap-y-3 py-4 sm:grid-cols-[80px_minmax(0,1fr)_auto] sm:gap-x-4 sm:items-center">
      <Link
        href={productDetailHref(item.slug)}
        className="flex h-[72px] w-[72px] items-center justify-center rounded-lg bg-slate-50 p-2 sm:h-20 sm:w-20"
        tabIndex={-1}
        aria-hidden="true"
      >
        {item.primaryImage
          ? <img src={mediaUrl(item.primaryImage)} alt="" className="h-full w-full object-contain" loading="lazy" />
          : <PackageOpen className="h-7 w-7 text-slate-300" aria-hidden="true" />}
      </Link>

      <div className="min-w-0">
        <Link
          href={productDetailHref(item.slug)}
          className="block break-words text-sm font-medium leading-snug text-slate-800 hover:text-primary-700 sm:text-base"
        >
          {item.name}
        </Link>
        <p className="mt-1 text-sm text-slate-500">
          {formatProductPrice(item.price)}
          <span className="text-slate-400"> / sản phẩm</span>
        </p>
        {atMax && !readOnly && (
          <p className="mt-1 text-xs text-amber-700">Đã đạt số lượng tối đa trong kho ({item.stockQuantity}).</p>
        )}
      </div>

      {/* Quantity + line total: own row on mobile, trailing column from sm up */}
      <div className="col-span-2 flex items-center justify-between gap-3 sm:col-span-1 sm:w-auto sm:justify-end">
        {readOnly ? (
          <span className="text-sm text-slate-500">Số lượng: <span className="font-medium tabular-nums text-slate-700">{item.quantity}</span></span>
        ) : (
          <div className="flex items-center overflow-hidden rounded-lg border border-slate-200">
            <button
              type="button"
              className={stepClass}
              disabled={item.quantity <= 1}
              onClick={() => onQuantityChange?.(item.quantity - 1)}
              aria-label={`Giảm số lượng ${item.name}`}
            >
              <Minus className="h-4 w-4" aria-hidden="true" />
            </button>
            <label className="sr-only" htmlFor={`cart-quantity-${item.id}`}>Số lượng {item.name}</label>
            <input
              id={`cart-quantity-${item.id}`}
              type="number"
              inputMode="numeric"
              min={1}
              max={item.stockQuantity}
              value={item.quantity}
              onChange={event => onQuantityChange?.(Number(event.target.value))}
              className="h-9 w-12 border-x border-slate-200 text-center text-sm tabular-nums focus:outline-none focus:ring-1 focus:ring-inset focus:ring-primary-300"
            />
            <button
              type="button"
              className={stepClass}
              disabled={atMax}
              onClick={() => onQuantityChange?.(item.quantity + 1)}
              aria-label={`Tăng số lượng ${item.name}`}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        )}

        <div className="flex items-center gap-2 sm:min-w-[9rem] sm:justify-end">
          <div className="text-right">
            <span className="sr-only">Thành tiền: </span>
            <span className="text-sm font-semibold tabular-nums text-primary-700 sm:text-base">{formatProductPrice(lineTotal)}</span>
          </div>
          {!readOnly && (
            <button
              type="button"
              onClick={onRemove}
              aria-label={`Xóa ${item.name} khỏi giỏ hàng`}
              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 className="h-[18px] w-[18px]" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </li>
  );
}

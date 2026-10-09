import { create } from 'zustand';
import type { CartItem } from './cart.store';

export type CheckoutSource = 'cart' | 'buynow';

export type CheckoutSession = {
  source: CheckoutSource;
  items: CartItem[];
};

type CheckoutState = {
  session: CheckoutSession | null;
  prepare: (source: CheckoutSource, items: CartItem[]) => void;
  clear: () => void;
};

const SESSION_KEY = 'ducmanhpc-checkout';

function loadSession(): CheckoutSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CheckoutSession;
    if (!parsed.source || !Array.isArray(parsed.items) || parsed.items.length === 0) return null;
    return parsed;
  } catch { return null; }
}

export const useCheckoutStore = create<CheckoutState>((set) => ({
  session: typeof window !== 'undefined' ? loadSession() : null,

  prepare: (source, items) => {
    const session: CheckoutSession = { source, items };
    try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(session)); } catch {}
    set({ session });
  },

  clear: () => {
    try { sessionStorage.removeItem(SESSION_KEY); } catch {}
    set({ session: null });
  },
}));

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  adminProductId?: string;
  image?: string;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  totalItems: number;
  decrementItem: (id: string) => void;
}

const CartContext = createContext<CartState | null>(null);

const STORAGE_KEY = "ekama-cart-v1";
const MAX_CART_ITEM_QUANTITY = 10;

const sanitizeQuantity = (quantity: unknown) => {
  const parsed = typeof quantity === "number" ? quantity : Number(quantity);
  if (!Number.isFinite(parsed) || parsed < 1) return 1;
  return Math.min(MAX_CART_ITEM_QUANTITY, Math.floor(parsed));
};

const loadCart = (): CartItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item) => ({
      ...item,
      quantity: sanitizeQuantity(item?.quantity),
    }));
  } catch {
    return [];
  }
};

const saveCart = (items: CartItem[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    /* ignore */
  }
};

export const CartProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => loadCart());

  useEffect(() => {
    saveCart(items);
  }, [items]);

  const addItem = useCallback((item: Omit<CartItem, "quantity"> & { quantity?: number }) => {
    const incomingQuantity = sanitizeQuantity(item.quantity);
    setItems((prev) => {
      const existing = prev.find((p) => p.id === item.id);
      if (existing) {
        return prev.map((p) =>
          p.id === item.id
            ? { ...p, quantity: Math.min(MAX_CART_ITEM_QUANTITY, p.quantity + incomingQuantity) }
            : p
        );
      }
      return [...prev, { ...item, quantity: incomingQuantity }];
    });
  }, []);

  const decrementItem = useCallback((id: string) => {
    setItems(prev => prev.flatMap(p => {
      if (p.id !== id) return [p];
      if (p.quantity === 1) return [];
      return [{ ...p, quantity: p.quantity - 1 }];
    }));
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const value: CartState = {
    items,
    addItem,
    removeItem,
    clearCart,
    decrementItem,
    totalItems: items.reduce((sum, it) => sum + it.quantity, 0),
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

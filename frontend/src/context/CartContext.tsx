import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { CartLine, MenuItem } from "../types";

interface CartContextValue {
  cart: CartLine[];
  totalItems: number;
  add: (item: MenuItem, optionIds: number[]) => void;
  increment: (key: string) => void;
  decrement: (key: string) => void;
  remove: (key: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);
const CART_KEY = "foodapp.cart.v1";

function cartKey(itemId: number, optionIds: number[]): string {
  return `${itemId}:${[...optionIds].sort((a, b) => a - b).join(",")}`;
}

function loadCart(): CartLine[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(CART_KEY) ?? "[]");
    return Array.isArray(parsed) ? (parsed as CartLine[]) : [];
  } catch {
    localStorage.removeItem(CART_KEY);
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartLine[]>(loadCart);

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart]);

  const add = useCallback((item: MenuItem, optionIds: number[]) => {
    const key = cartKey(item.id, optionIds);
    setCart((current) => {
      const existing = current.find((line) => line.key === key);
      return existing
        ? current.map((line) =>
            line.key === key ? { ...line, quantity: line.quantity + 1 } : line,
          )
        : [
            ...current,
            { key, item, optionIds: [...optionIds].sort(), quantity: 1 },
          ];
    });
  }, []);

  const increment = useCallback((key: string) => {
    setCart((current) =>
      current.map((line) =>
        line.key === key
          ? { ...line, quantity: Math.min(20, line.quantity + 1) }
          : line,
      ),
    );
  }, []);
  const decrement = useCallback((key: string) => {
    setCart((current) =>
      current
        .map((line) =>
          line.key === key ? { ...line, quantity: line.quantity - 1 } : line,
        )
        .filter((line) => line.quantity > 0),
    );
  }, []);
  const remove = useCallback((key: string) => {
    setCart((current) => current.filter((line) => line.key !== key));
  }, []);
  const clear = useCallback(() => setCart([]), []);

  const value = useMemo(
    () => ({
      cart,
      totalItems: cart.reduce((total, line) => total + line.quantity, 0),
      add,
      increment,
      decrement,
      remove,
      clear,
    }),
    [add, cart, clear, decrement, increment, remove],
  );
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const value = useContext(CartContext);
  if (!value) throw new Error("useCart must be used within CartProvider");
  return value;
}

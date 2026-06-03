import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import axios from "axios";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

/**
 * Cart item shape (mirrors Cart model snapshot fields):
 * { _id, name, price, imageUrl, category, quantity }
 * Note: _id here is the product's Mongo _id (used as product ref in the API).
 */

const useCartStore = create(
  persist(
    (set, get) => ({
      items:    [],
      syncing:  false,

      // ── Derived ─────────────────────────────────────────────────────────
      totalItems: () => get().items.reduce((s, i) => s + i.quantity, 0),
      subtotal:   () => get().items.reduce((s, i) => s + i.price * i.quantity, 0),

      // ── Internal: push current items to the server ─────────────────────
      _syncToServer: async (token, items) => {
        if (!token) return;
        try {
          const payload = items.map((i) => ({
            product:  i._id,
            quantity: i.quantity,
            name:     i.name,
            price:    i.price,
            imageUrl: i.imageUrl || "",
            category: i.category || "",
          }));
          await axios.put(
            `${API}/cart`,
            { items: payload },
            { headers: { Authorization: `Bearer ${token}` } }
          );
        } catch {
          // Silently fail — localStorage still holds state
        }
      },

      // ── Load cart from DB on login ─────────────────────────────────────
      loadFromServer: async (token) => {
        if (!token) return;
        set({ syncing: true });
        try {
          const { data } = await axios.get(`${API}/cart`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          // Map DB items (product field) → client shape (_id field)
          const items = (data.items || []).map((i) => ({
            _id:      i.product?._id || i.product,
            name:     i.name,
            price:    i.price,
            imageUrl: i.imageUrl,
            category: i.category,
            quantity: i.quantity,
          }));
          set({ items, syncing: false });
        } catch {
          set({ syncing: false });
        }
      },

      // ── Add / increment ───────────────────────────────────────────────
      addItem: (product, token) => {
        set((state) => {
          const existing = state.items.find((i) => i._id === product._id);
          const next = existing
            ? state.items.map((i) =>
                i._id === product._id ? { ...i, quantity: i.quantity + 1 } : i
              )
            : [
                ...state.items,
                {
                  _id:      product._id,
                  name:     product.name,
                  price:    product.price,
                  imageUrl: product.imageUrl,
                  category: product.category,
                  quantity: 1,
                },
              ];
          get()._syncToServer(token, next);
          return { items: next };
        });
      },

      // ── Decrement (auto-remove at 0) ──────────────────────────────────
      decrementItem: (id, token) => {
        set((state) => {
          const next = state.items
            .map((i) => (i._id === id ? { ...i, quantity: i.quantity - 1 } : i))
            .filter((i) => i.quantity > 0);
          get()._syncToServer(token, next);
          return { items: next };
        });
      },

      // ── Remove entirely ───────────────────────────────────────────────
      removeItem: (id, token) => {
        set((state) => {
          const next = state.items.filter((i) => i._id !== id);
          get()._syncToServer(token, next);
          return { items: next };
        });
      },

      // ── Set exact quantity ────────────────────────────────────────────
      setQuantity: (id, qty, token) => {
        if (qty < 1) {
          get().removeItem(id, token);
          return;
        }
        set((state) => {
          const next = state.items.map((i) => (i._id === id ? { ...i, quantity: qty } : i));
          get()._syncToServer(token, next);
          return { items: next };
        });
      },

      // ── Clear (called after checkout or logout) ───────────────────────
      clearCart: async (token) => {
        set({ items: [] });
        if (!token) return;
        try {
          await axios.delete(`${API}/cart`, {
            headers: { Authorization: `Bearer ${token}` },
          });
        } catch {
          // ignore
        }
      },
    }),
    {
      name:    "kinetiq-cart",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ items: s.items }),
    }
  )
);

export default useCartStore;

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import axios from "axios";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const useAuthStore = create(
  persist(
    (set, get) => ({
      user:  null,
      token: null,

      isLoggedIn: () => !!get().token,

      // ── Register ──────────────────────────────────────────────────────
      register: async ({ name, email, password }) => {
        const { data } = await axios.post(`${API}/auth/register`, { name, email, password });
        set({ user: data.user, token: data.token });

        // Load any existing DB cart for this new session
        const { loadFromServer } = await import("./useCartStore").then((m) => m.default.getState());
        await loadFromServer(data.token);

        return data;
      },

      // ── Login ─────────────────────────────────────────────────────────
      login: async ({ email, password }) => {
        const { data } = await axios.post(`${API}/auth/login`, { email, password });
        set({ user: data.user, token: data.token });

        // Pull saved cart from DB — replaces any guest localStorage cart
        const cartStore = (await import("./useCartStore")).default;
        await cartStore.getState().loadFromServer(data.token);

        return data;
      },

      // ── Logout ────────────────────────────────────────────────────────
      logout: () => {
        const token = get().token;

        // Clear cart state (no server DELETE needed — cart is already saved in DB)
        import("./useCartStore").then((m) => {
          m.default.getState().clearCart(null); // null = skip server DELETE, just clear local
        });

        set({ user: null, token: null });
      },

      // ── Axios helper with token ────────────────────────────────────────
      authHeaders: () => ({
        headers: { Authorization: `Bearer ${get().token}` },
      }),
    }),
    {
      name:    "kinetiq-auth",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (s) => ({ user: s.user, token: s.token }),
    }
  )
);

export default useAuthStore;

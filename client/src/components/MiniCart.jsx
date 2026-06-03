import { useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useCartStore from "../store/useCartStore";
import useAuthStore from "../store/useAuthStore";

// ── Icons ──────────────────────────────────────────────────────────────────────
const IconTrash = () => (
  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
  </svg>
);

const IconClose = () => (
  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const SHIPPING_THRESHOLD = 100; // free shipping above this

export default function MiniCart({ onClose }) {
  const navigate  = useNavigate();
  const panelRef  = useRef(null);
  const token     = useAuthStore((s) => s.token);

  const items         = useCartStore((s) => s.items);
  const subtotal      = useCartStore((s) => s.subtotal)();
  const removeItem    = useCartStore((s) => s.removeItem);
  const addItem       = useCartStore((s) => s.addItem);
  const decrementItem = useCartStore((s) => s.decrementItem);

  const shipping = subtotal >= SHIPPING_THRESHOLD || subtotal === 0 ? 0 : 9.99;
  const total    = subtotal + shipping;

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const goTo = (path) => { onClose(); navigate(path); };

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-[calc(100%+12px)] w-[360px] bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-[200] overflow-hidden"
      style={{ maxHeight: "80vh" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
        <p className="text-sm font-semibold text-white">
          Cart
          <span className="ml-2 text-xs text-slate-500 font-normal">({items.length} item{items.length !== 1 ? "s" : ""})</span>
        </p>
        <button
          onClick={onClose}
          className="text-slate-500 hover:text-white transition-colors"
        >
          <IconClose />
        </button>
      </div>

      {/* Items */}
      {items.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <p className="text-slate-500 text-sm">Your cart is empty.</p>
          <button
            onClick={() => goTo("/shop")}
            className="mt-4 text-blue-500 text-sm hover:text-blue-400 transition-colors font-medium"
          >
            Browse Products →
          </button>
        </div>
      ) : (
        <>
          {/* Scrollable item list */}
          <div className="overflow-y-auto" style={{ maxHeight: "320px" }}>
            {items.map((item) => (
              <div
                key={item._id}
                className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors"
              >
                {/* Thumbnail */}
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-12 h-12 rounded-lg object-cover shrink-0 bg-slate-800"
                />

                {/* Name + price */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate leading-tight">{item.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">${item.price.toFixed(2)}</p>
                </div>

                {/* Qty controls */}
                <div className="flex items-center border border-slate-700 rounded-md overflow-hidden shrink-0">
                  <button
                    onClick={() => decrementItem(item._id, token)}
                    className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-sm font-medium"
                  >
                    −
                  </button>
                  <span className="w-7 text-center text-sm font-semibold text-white">{item.quantity}</span>
                  <button
                    onClick={() => addItem(item, token)}
                    className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-sm font-medium"
                  >
                    +
                  </button>
                </div>

                {/* Line total */}
                <p className="text-sm font-mono font-semibold text-white w-14 text-right shrink-0">
                  ${(item.price * item.quantity).toFixed(2)}
                </p>

                {/* Remove */}
                <button
                  onClick={() => removeItem(item._id, token)}
                  className="text-slate-600 hover:text-red-400 transition-colors ml-1 shrink-0"
                >
                  <IconTrash />
                </button>
              </div>
            ))}
          </div>

          {/* Free shipping progress */}
          {subtotal < SHIPPING_THRESHOLD && (
            <div className="px-5 py-3 border-b border-slate-800/60 bg-slate-950/40">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[11px] text-slate-500">
                  Add <span className="text-white font-medium">${(SHIPPING_THRESHOLD - subtotal).toFixed(2)}</span> for free shipping
                </p>
                <span className="text-[11px] text-slate-500">{Math.round((subtotal / SHIPPING_THRESHOLD) * 100)}%</span>
              </div>
              <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min((subtotal / SHIPPING_THRESHOLD) * 100, 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Order summary */}
          <div className="px-5 py-4 space-y-2 border-b border-slate-800/60">
            <div className="flex items-center justify-between text-sm text-slate-400">
              <span>Subtotal</span>
              <span className="text-white font-medium">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-slate-400">
              <span>Shipping</span>
              <span className={shipping === 0 ? "text-green-500 font-medium" : "text-white font-medium"}>
                {shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm font-semibold text-white border-t border-slate-800 pt-2 mt-2">
              <span>Total</span>
              <span className="text-blue-400">${total.toFixed(2)}</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="px-5 py-4 flex flex-col gap-2.5">
            <button
              onClick={() => goTo("/cart")}
              className="w-full py-2.5 rounded-lg border border-slate-700 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
            >
              View Cart
            </button>
            <button
              onClick={() => goTo("/checkout")}
              className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm font-semibold text-white transition-colors"
            >
              Checkout →
            </button>
          </div>
        </>
      )}
    </div>
  );
}

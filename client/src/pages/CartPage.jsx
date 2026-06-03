import { Link, useNavigate } from "react-router-dom";
import useCartStore from "../store/useCartStore";
import useAuthStore from "../store/useAuthStore";
import toast from "react-hot-toast";

// ── Icons ──────────────────────────────────────────────────────────────────────
const IconTrash = () => (
  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
    <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
  </svg>
);

const IconShop = () => (
  <svg width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" className="text-slate-600">
    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
    <line x1="3" y1="6" x2="21" y2="6"/>
    <path d="M16 10a4 4 0 01-8 0"/>
  </svg>
);

const SHIPPING_THRESHOLD = 100;
const SHIPPING_COST      = 9.99;

export default function CartPage() {
  const navigate      = useNavigate();
  const isLoggedIn    = useAuthStore((s) => s.isLoggedIn);

  const items         = useCartStore((s) => s.items);
  const subtotal      = useCartStore((s) => s.subtotal)();
  const addItem       = useCartStore((s) => s.addItem);
  const decrementItem = useCartStore((s) => s.decrementItem);
  const removeItem    = useCartStore((s) => s.removeItem);
  const clearCart     = useCartStore((s) => s.clearCart);

  const shipping = subtotal === 0 ? 0 : subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const total    = subtotal + shipping;

  const handleCheckout = () => {
    if (!isLoggedIn()) {
      toast("Sign in to proceed to checkout.", {
        icon: "🔒",
        style: { background: "#0f172a", color: "#f1f5f9", border: "1px solid rgba(59,130,246,0.3)", fontSize: 13 },
      });
      navigate("/login");
      return;
    }
    navigate("/checkout");
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans pt-24 pb-32">
      <div className="max-w-6xl mx-auto px-6">

        {/* ── Page Header ──────────────────────────────────────────────────── */}
        <div className="mb-10 border-b border-white/[0.06] pb-8 flex items-end justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-1">Your Cart</h1>
            <p className="text-slate-500 text-sm">
              {items.length === 0
                ? "No items yet."
                : `${items.reduce((s, i) => s + i.quantity, 0)} item${items.reduce((s, i) => s + i.quantity, 0) !== 1 ? "s" : ""} in your cart`}
            </p>
          </div>
          {items.length > 0 && (
            <button
              onClick={clearCart}
              className="text-xs text-slate-500 hover:text-red-400 transition-colors font-medium uppercase tracking-widest border border-slate-800 hover:border-red-400/30 px-4 py-2 rounded-lg"
            >
              Clear Cart
            </button>
          )}
        </div>

        {/* ── Empty State ────────────────────────────────────────────────────── */}
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 gap-5">
            <IconShop />
            <p className="text-slate-500 text-sm">Your cart is empty.</p>
            <Link
              to="/shop"
              className="mt-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition-colors"
            >
              Browse the Shop
            </Link>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8 items-start">

            {/* ── Cart Table ─────────────────────────────────────────────────── */}
            <div className="flex-1 min-w-0">
              {/* Table header */}
              <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_40px] gap-4 pb-3 border-b border-white/[0.06] text-[11px] font-bold uppercase tracking-widest text-slate-500">
                <span>Product</span>
                <span className="text-center">Price</span>
                <span className="text-center">Qty</span>
                <span className="text-right">Total</span>
                <span />
              </div>

              {/* Rows */}
              <div className="divide-y divide-white/[0.04]">
                {items.map((item) => (
                  <div
                    key={item._id}
                    className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr_40px] gap-4 py-5 items-center"
                  >
                    {/* Product */}
                    <div className="flex items-center gap-4">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-16 h-16 rounded-xl object-cover bg-slate-900 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="font-semibold text-white text-sm leading-snug truncate">{item.name}</p>
                        <span className="text-[11px] text-blue-500 uppercase tracking-widest font-medium">{item.category}</span>
                      </div>
                    </div>

                    {/* Unit price */}
                    <p className="text-sm text-slate-400 md:text-center font-mono">
                      <span className="md:hidden text-slate-600 text-xs mr-2">Price:</span>
                      ${item.price.toFixed(2)}
                    </p>

                    {/* Qty stepper */}
                    <div className="flex items-center md:justify-center">
                      <div className="inline-flex items-center border border-slate-700 rounded-lg overflow-hidden">
                        <button
                          onClick={() => decrementItem(item._id)}
                          className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-base font-medium"
                        >
                          −
                        </button>
                        <span className="w-9 text-center text-sm font-semibold text-white">{item.quantity}</span>
                        <button
                          onClick={() => addItem(item)}
                          className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-base font-medium"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Line total */}
                    <p className="font-mono font-bold text-white text-sm md:text-right">
                      <span className="md:hidden text-slate-600 text-xs mr-2 font-normal">Total:</span>
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>

                    {/* Remove */}
                    <button
                      onClick={() => removeItem(item._id)}
                      className="text-slate-600 hover:text-red-400 transition-colors flex items-center justify-center"
                    >
                      <IconTrash />
                    </button>
                  </div>
                ))}
              </div>

              {/* Continue shopping */}
              <div className="pt-6 border-t border-white/[0.04]">
                <Link to="/shop" className="text-sm text-blue-500 hover:text-blue-400 transition-colors font-medium">
                  ← Continue Shopping
                </Link>
              </div>
            </div>

            {/* ── Order Summary Sidebar ─────────────────────────────────────── */}
            <div className="w-full lg:w-80 shrink-0">
              <div className="bg-slate-900 border border-white/[0.06] rounded-xl p-6 space-y-4 sticky top-24">
                <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 pb-2 border-b border-white/[0.06]">
                  Order Summary
                </h2>

                {/* Free shipping tracker */}
                {subtotal < SHIPPING_THRESHOLD && (
                  <div className="p-3 bg-slate-800/40 rounded-lg border border-slate-700/50">
                    <p className="text-[12px] text-slate-400 mb-2">
                      Add <span className="text-white font-semibold">${(SHIPPING_THRESHOLD - subtotal).toFixed(2)}</span> more for <span className="text-green-500 font-semibold">free shipping</span>
                    </p>
                    <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min((subtotal / SHIPPING_THRESHOLD) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Summary rows */}
                <div className="space-y-3">
                  <div className="flex justify-between text-sm text-slate-400">
                    <span>Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)</span>
                    <span className="text-white font-medium">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-400">
                    <span>Shipping</span>
                    <span className={shipping === 0 ? "text-green-500 font-medium" : "text-white font-medium"}>
                      {shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-400">
                    <span>Tax (est.)</span>
                    <span className="text-white font-medium">—</span>
                  </div>
                </div>

                {/* Total */}
                <div className="flex justify-between items-center border-t border-white/[0.06] pt-4">
                  <span className="font-semibold text-white">Total</span>
                  <span className="text-xl font-bold font-mono text-blue-400">${total.toFixed(2)}</span>
                </div>

                {/* Checkout CTA */}
                <button
                  onClick={handleCheckout}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-colors mt-2"
                >
                  Proceed to Checkout →
                </button>

                <p className="text-[11px] text-slate-600 text-center leading-relaxed">
                  Secure checkout. Items are not reserved until payment is confirmed.
                </p>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}

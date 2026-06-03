import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import useAuthStore from "../store/useAuthStore";
import useCartStore from "../store/useCartStore";
import PageTransition from "../components/PageTransition";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
const CATEGORIES = ["All", "supplement", "equipment", "apparel", "footwear", "accessories"];

const Stars = ({ avg }) => (
  <span className="text-xs text-blue-500 font-bold tracking-widest">
    &#9733; {avg.toFixed(1)}
  </span>
);

const IconCart = () => (
  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
    <line x1="3" y1="6" x2="21" y2="6"/>
    <path d="M16 10a4 4 0 01-8 0"/>
  </svg>
);

export default function Shop() {
  const [products, setProducts] = useState([]);
  const [filter, setFilter]     = useState("All");
  const navigate    = useNavigate();
  const isLoggedIn  = useAuthStore((s) => s.isLoggedIn);
  const token       = useAuthStore((s) => s.token);

  // Cart store
  const cartItems     = useCartStore((s) => s.items);
  const addItem       = useCartStore((s) => s.addItem);
  const decrementItem = useCartStore((s) => s.decrementItem);

  useEffect(() => {
    axios
      .get(`${API}/products`)
      .then((res) => setProducts(res.data))
      .catch(() => toast.error("Failed to load products"));
  }, []);

  const requireAuth = () => {
    if (!isLoggedIn()) {
      toast("Sign in to add items to your cart.", {
        icon: "🔒",
        style: { background: "#0f172a", color: "#f1f5f9", border: "1px solid rgba(59,130,246,0.3)", fontSize: 13 },
        duration: 3000,
      });
      navigate("/login");
      return false;
    }
    return true;
  };

  const handleAdd = (product) => {
    if (!requireAuth()) return;
    addItem(product, token);
    toast.success(`${product.name.split(" ").slice(0, 3).join(" ")} added`, {
      style: { background: "#0f172a", color: "#10b981", border: "1px solid #1e293b", fontSize: 13 },
      duration: 2000,
    });
  };

  const handleDec = (product) => {
    if (!requireAuth()) return;
    decrementItem(product._id, token);
  };

  const filtered = products.filter(
    (p) => filter === "All" || p.category.toLowerCase() === filter.toLowerCase()
  );

  // Live qty from global cart store
  const getQty = (id) => cartItems.find((i) => i._id === id)?.quantity || 0;

  return (
    <PageTransition className="bg-[#020617] text-white font-sans flex flex-col pt-24 pb-32">
      <div className="px-6 max-w-7xl mx-auto w-full">

        {/* ── Page Header ─────────────────────────────────────────────────── */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 border-b border-white/[0.06] pb-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">Shop.</h1>
            <p className="text-white/40 font-medium">
              Commercial-grade gear, supplements &amp; apparel.
            </p>
          </div>
        </header>

        {/* ── Category Filters ────────────────────────────────────────────── */}
        <div className="flex gap-3 overflow-x-auto pb-6 mb-8 scrollbar-hide">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-colors duration-200 border ${
                filter === cat
                  ? "bg-blue-600 border-transparent text-white"
                  : "bg-[#0f172a] border-white/[0.06] text-white/40 hover:text-white hover:bg-[#111827]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* ── Product Grid ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((p) => {
            const qty = getQty(p._id);
            return (
              <div
                key={p._id}
                className="bg-[#0f172a] border border-white/[0.06] rounded-xl flex flex-col overflow-hidden transition-colors hover:border-white/20 group"
              >
                {/* Image */}
                <div className="relative w-full aspect-square bg-[#020617] overflow-hidden">
                  <img
                    src={p.imageUrl}
                    alt={p.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <span className="absolute top-3 right-3 bg-[#020617]/90 backdrop-blur-md text-blue-500 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md border border-white/10">
                    {p.category}
                  </span>
                </div>

                {/* Body */}
                <div className="p-5 flex flex-col flex-1 justify-between gap-4 border-t border-white/[0.06]">
                  <div>
                    <h3 className="font-bold text-base leading-tight mb-1.5">{p.name}</h3>
                    <p className="text-white/40 text-[12px] leading-relaxed line-clamp-2">{p.description}</p>
                  </div>

                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <Stars avg={p.ratings?.average || 5.0} />
                      <span className="text-white/20 text-[10px]">({p.ratings?.count || 0})</span>
                    </div>

                    <div className="flex items-center justify-between border-t border-white/[0.06] pt-3">
                      <p className="font-mono font-bold text-base">${p.price.toFixed(2)}</p>

                      {qty === 0 ? (
                        <button
                          id={`add-to-cart-${p._id}`}
                          onClick={() => handleAdd(p)}
                          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-md transition-colors text-xs uppercase tracking-widest"
                        >
                          <IconCart />
                          Add
                        </button>
                      ) : (
                        <div className="flex items-center bg-[#111827] border border-white/10 rounded-md overflow-hidden">
                          <button
                            onClick={() => handleDec(p)}
                            className="px-3 py-1.5 text-white/50 hover:text-white transition-colors hover:bg-white/5 text-sm font-medium"
                          >
                            −
                          </button>
                          <span className="px-3 text-white font-bold text-sm min-w-[28px] text-center">{qty}</span>
                          <button
                            onClick={() => handleAdd(p)}
                            className="px-3 py-1.5 text-white/50 hover:text-white transition-colors hover:bg-white/5 text-sm font-medium"
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="py-24 text-center">
            <p className="text-white/40 text-sm font-bold uppercase tracking-widest">
              No products in this category.
            </p>
          </div>
        )}
      </div>
    </PageTransition>
  );
}

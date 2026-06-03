const Cart = require("../models/Cart");

// ── GET /api/cart ─────────────────────────────────────────────────────────────
// Returns the current user's cart
const getCart = async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  res.json({ items: cart?.items || [] });
};

// ── PUT /api/cart ─────────────────────────────────────────────────────────────
// Full replace — client sends the entire items array (used after local changes)
const syncCart = async (req, res) => {
  const { items } = req.body;

  if (!Array.isArray(items)) {
    return res.status(400).json({ success: false, message: "items must be an array" });
  }

  const cart = await Cart.findOneAndUpdate(
    { user: req.user._id },
    { items },
    { new: true, upsert: true, runValidators: true }
  );

  res.json({ success: true, items: cart.items });
};

// ── DELETE /api/cart ──────────────────────────────────────────────────────────
// Clear the entire cart
const clearCart = async (req, res) => {
  await Cart.findOneAndUpdate(
    { user: req.user._id },
    { items: [] },
    { upsert: true }
  );
  res.json({ success: true, message: "Cart cleared" });
};

module.exports = { getCart, syncCart, clearCart };

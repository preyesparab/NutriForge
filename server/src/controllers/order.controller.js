const Order   = require("../models/Order");
const Cart    = require("../models/Cart");
const Product = require("../models/Product");

// ── POST /api/orders ──────────────────────────────────────────────────────────
// Create an order from the user's current cart
const createOrder = async (req, res) => {
  const { shippingAddress, paymentMethod = "cod" } = req.body;

  // Load cart
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart || cart.items.length === 0) {
    return res.status(400).json({ success: false, message: "Cart is empty" });
  }

  // Validate stock and build order items
  const orderItems = [];
  for (const item of cart.items) {
    const product = await Product.findById(item.product);
    if (!product) {
      return res.status(400).json({ success: false, message: `Product not found: ${item.name}` });
    }
    if (product.stock < item.quantity) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock for "${product.name}". Available: ${product.stock}`,
      });
    }
    orderItems.push({
      product:         product._id,
      quantity:        item.quantity,
      priceAtPurchase: product.price,
    });
  }

  // Calculate total
  const subtotal  = cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const shipping  = subtotal >= 100 ? 0 : 9.99;
  const totalPrice = parseFloat((subtotal + shipping).toFixed(2));

  // Create order
  const order = await Order.create({
    user:            req.user._id,
    items:           orderItems,
    totalPrice,
    shippingAddress: shippingAddress || {},
    paymentMethod,
    status:          "pending",
  });

  // Deduct stock
  for (const item of cart.items) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { stock: -item.quantity },
    });
  }

  // Clear cart after ordering
  await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });

  // Populate for response
  const populated = await Order.findById(order._id).populate("items.product", "name imageUrl category");

  res.status(201).json({ success: true, order: populated });
};

// ── GET /api/orders ───────────────────────────────────────────────────────────
// List all orders for the current user
const getMyOrders = async (req, res) => {
  const orders = await Order.find({ user: req.user._id })
    .populate("items.product", "name imageUrl category")
    .sort({ createdAt: -1 });

  res.json({ success: true, orders });
};

// ── GET /api/orders/:id ───────────────────────────────────────────────────────
// Get a single order (must belong to the user)
const getOrderById = async (req, res) => {
  const order = await Order.findById(req.params.id).populate("items.product", "name imageUrl category price");

  if (!order) {
    return res.status(404).json({ success: false, message: "Order not found" });
  }
  if (order.user.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: "Not authorised to view this order" });
  }

  res.json({ success: true, order });
};

// ── PATCH /api/orders/:id/cancel ─────────────────────────────────────────────
// Cancel a pending order and restore stock
const cancelOrder = async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return res.status(404).json({ success: false, message: "Order not found" });
  }
  if (order.user.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: "Not authorised" });
  }
  if (!["pending", "processing"].includes(order.status)) {
    return res.status(400).json({ success: false, message: `Cannot cancel an order that is ${order.status}` });
  }

  order.status = "cancelled";
  await order.save();

  // Restore stock
  for (const item of order.items) {
    await Product.findByIdAndUpdate(item.product, {
      $inc: { stock: item.quantity },
    });
  }

  res.json({ success: true, order });
};

module.exports = { createOrder, getMyOrders, getOrderById, cancelOrder };

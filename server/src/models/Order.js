const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    product:  { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true, min: [1, "Quantity must be at least 1"] },
    priceAtPurchase: { type: Number, required: true }, // snapshot of price at order time
  },
  { _id: false }
);

const shippingAddressSchema = new mongoose.Schema(
  {
    street:  String,
    city:    String,
    state:   String,
    country: { type: String, default: "India" },
    pincode: String,
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    items: {
      type: [orderItemSchema],
      validate: [(arr) => arr.length > 0, "Order must have at least one item"],
    },
    totalPrice: {
      type: Number,
      required: true,
      min: [0, "Total price cannot be negative"],
    },
    status: {
      type: String,
      enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
      default: "pending",
    },
    shippingAddress: { type: shippingAddressSchema, default: () => ({}) },
    paymentMethod:   { type: String, enum: ["cod", "razorpay", "upi"], default: "cod" },
    isPaid:          { type: Boolean, default: false },
    paidAt:          { type: Date },
    deliveredAt:     { type: Date },
  },
  { timestamps: true }
);

// ── Index for admin order management ─────────────────────────────────────────
orderSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("Order", orderSchema);

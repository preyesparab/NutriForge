const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema(
  {
    product:  { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    // Snapshot fields so the cart renders without always populating
    name:     { type: String, required: true },
    price:    { type: Number, required: true },
    imageUrl: { type: String, default: "" },
    category: { type: String, default: "" },
  },
  { _id: false }
);

const cartSchema = new mongoose.Schema(
  {
    user:  { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    items: { type: [cartItemSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Cart", cartSchema);

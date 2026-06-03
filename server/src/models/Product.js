const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    // ── Core info ─────────────────────────────────────────────────────────────
    name: {
      type:      String,
      required:  [true, "Product name is required"],
      trim:      true,
      maxlength: [120, "Product name cannot exceed 120 characters"],
    },
    description: {
      type:      String,
      required:  [true, "Description is required"],
      maxlength: [2000, "Description too long"],
    },
    category: {
      type:     String,
      required: true,
      enum:     ["supplement", "equipment", "apparel", "footwear", "accessories"],
    },

    // ── Pricing ───────────────────────────────────────────────────────────────
    price: {
      type:     Number,
      required: [true, "Price is required"],
      min:      [0, "Price cannot be negative"],
    },
    discountedPrice: { type: Number, default: null },   // null = no active discount

    // ── Inventory ─────────────────────────────────────────────────────────────
    stock: {
      type:     Number,
      required: [true, "Stock count is required"],
      min:      [0, "Stock cannot be negative"],
      default:  0,
    },

    // ── Media — local multer path OR remote URL ───────────────────────────────
    imageUrl: { type: String, default: "" },

    // ── Metadata ──────────────────────────────────────────────────────────────
    brand:      { type: String, default: "" },
    isFeatured: { type: Boolean, default: false },
    ratings: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count:   { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

// ── Virtual: is stock available ───────────────────────────────────────────────
productSchema.virtual("inStock").get(function () {
  return this.stock > 0;
});

productSchema.set("toJSON",   { virtuals: true });
productSchema.set("toObject", { virtuals: true });

// ── Index for shop listing queries ───────────────────────────────────────────
productSchema.index({ category: 1, price: 1 });
productSchema.index({ isFeatured: 1 });

module.exports = mongoose.model("Product", productSchema);

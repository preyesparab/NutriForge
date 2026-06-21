const NodeCache = require("node-cache");
const Product = require("../models/Product");

/**
 * Simple in-memory cache for the full product list.
 * Strategy: cache-aside with a 60-second TTL.
 *   - Cache HIT  → return stored data immediately (no DB round-trip).
 *   - Cache MISS → query MongoDB, store the result, then return it.
 * Only the full-list route uses this cache; single-product lookups are unaffected.
 */
const productCache = new NodeCache({ stdTTL: 60, checkperiod: 120 });
const PRODUCTS_CACHE_KEY = "all_products";

const getProducts = async (req, res) => {
  try {
    // Check cache first
    const cached = productCache.get(PRODUCTS_CACHE_KEY);
    if (cached !== undefined) {
      // Cache HIT — skip the DB query entirely
      return res.json(cached);
    }

    // Cache MISS — query MongoDB and populate the cache
    const products = await Product.find({});
    productCache.set(PRODUCTS_CACHE_KEY, products);
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

module.exports = {
  getProducts,
};

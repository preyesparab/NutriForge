const express = require("express");
const { getProducts } = require("../controllers/product.controller");

const router = express.Router();

// Allow public access to view the storefront catalog
router.get("/", getProducts);

module.exports = router;

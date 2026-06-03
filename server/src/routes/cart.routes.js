const express  = require("express");
const { protect } = require("../middleware/auth");
const { getCart, syncCart, clearCart } = require("../controllers/cart.controller");

const router = express.Router();

router.use(protect); // all cart routes require auth

router.get("/",    getCart);
router.put("/",    syncCart);
router.delete("/", clearCart);

module.exports = router;

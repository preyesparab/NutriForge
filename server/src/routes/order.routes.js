const express  = require("express");
const { protect } = require("../middleware/auth");
const {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
} = require("../controllers/order.controller");

const router = express.Router();

router.use(protect);

router.post("/",                   createOrder);
router.get("/",                    getMyOrders);
router.get("/:id",                 getOrderById);
router.patch("/:id/cancel",        cancelOrder);

module.exports = router;

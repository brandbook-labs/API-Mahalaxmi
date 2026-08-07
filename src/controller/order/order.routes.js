const express = require("express");
const router = express.Router();

const { 
    placeOrder, 
    getMyOrders, 
    linkOrderToUser,
    getOrderTracking,
    getAllOrders, 
    updateOrderStatus 
} = require("./order.controller");
const { verifyToken } = require("../../middleware/verify-token.middleware"); 

// ───────────── PUBLIC / USER ROUTES ─────────────
router.post("/place-order", placeOrder); 
router.get("/my-orders", verifyToken, getMyOrders); 
router.patch("/:id/link-user", verifyToken, linkOrderToUser);
router.get("/:id/tracking", verifyToken, getOrderTracking);

// ───────────── ADMIN ROUTES ─────────────
router.get("/all-orders", getAllOrders); 
router.put("/update-status/:id", updateOrderStatus);

module.exports = router;
const express = require("express");
const router = express.Router();

const { 
    placeOrder, 
    getMyOrders, 
    getAllOrders, 
    updateOrderStatus 
} = require("./order.controller");
const { verifyToken } = require("../../middleware/verify-token.middleware"); 

// ───────────── PUBLIC / USER ROUTES ─────────────
router.post("/place-order", placeOrder); 
router.get("/my-orders", verifyToken, getMyOrders); 

// ───────────── ADMIN ROUTES ─────────────
router.get("/all-orders", getAllOrders); 
router.put("/update-status/:id", updateOrderStatus);

module.exports = router;
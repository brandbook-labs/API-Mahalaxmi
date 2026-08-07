const express = require("express");
const router = express.Router();

const { createPaymentOrder, verifyPayment } = require("./payment.controller");
const { optionalAuth } = require("../../middleware/optional-auth.middleware");

// Auth is optional here now, same pattern as placeOrder: a guest can
// pay online without signing in first, if they happen to be signed in,
// the order still gets linked to their account. See
// optional-auth.middleware.js for exactly how that decision is made.
router.post("/create-order", optionalAuth, createPaymentOrder);
router.post("/verify", optionalAuth, verifyPayment);

module.exports = router;
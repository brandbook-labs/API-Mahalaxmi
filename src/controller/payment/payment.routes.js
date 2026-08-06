const express = require("express");
const router = express.Router();

const { createPaymentOrder, verifyPayment } = require("./payment.controller");
const { verifyToken } = require("../../middleware/verify-token.middleware");

// Both require a logged-in customer, this is what ties a payment to an
// account for order history and lets us know who to attach the order to.
router.post("/create-order", verifyToken, createPaymentOrder);
router.post("/verify", verifyToken, verifyPayment);

module.exports = router;
const express = require("express");
const router = express.Router();

const { getAddresses, addAddress, updateAddress, deleteAddress } = require("./user.controller");
const { verifyToken } = require("../../middleware/verify-token.middleware");

// Every route here requires a real signed-in account, matches
// API_SPEC.md's Saved Addresses section exactly.
router.get("/addresses", verifyToken, getAddresses);
router.post("/addresses", verifyToken, addAddress);
router.put("/addresses/:id", verifyToken, updateAddress);
router.delete("/addresses/:id", verifyToken, deleteAddress);

module.exports = router;
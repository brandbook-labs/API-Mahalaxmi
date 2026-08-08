const express = require("express");
const router = express.Router();

const { getAllFaqs, createFaq, updateFaq, deleteFaq } = require("./faq.controller");
const { verifyToken } = require("../../middleware/verify-token.middleware");
const { optionalAuth } = require("../../middleware/optional-auth.middleware");

router.get("/", optionalAuth, getAllFaqs);
router.post("/", verifyToken, createFaq);
router.put("/:id", verifyToken, updateFaq);
router.delete("/:id", verifyToken, deleteFaq);

module.exports = router;
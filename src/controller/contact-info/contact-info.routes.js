const express = require("express");
const router = express.Router();

const { getContactInfo, updateContactInfo } = require("./contact-info.controller");
const { verifyToken } = require("../../middleware/verify-token.middleware");

router.get("/", getContactInfo);
router.put("/", verifyToken, updateContactInfo);

module.exports = router;
const express = require("express");
const router = express.Router();

const { getLegalPage, updateLegalPage } = require("./legal.controller");
const { verifyToken } = require("../../middleware/verify-token.middleware");

router.get("/:type", getLegalPage);
router.put("/:type", verifyToken, updateLegalPage);

module.exports = router;
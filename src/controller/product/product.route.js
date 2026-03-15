const express = require("express");
const router = express.Router();
const upload = require("../../middleware/multer.middleware");

// Controllers ଇମ୍ପୋର୍ଟ କରନ୍ତୁ
const {
    AddProductByAdmin,
    GetAllProducts,
    GetProductById,
    UpdateProductByAdmin,
    DeleteProduct
} = require("./product.controller");
const verifyToken = require("../../middleware/verify-token.middleware");

// ───────────── Public Routes (ସମସ୍ତେ ଦେଖିପାରିବେ) ─────────────
router.get("/", GetAllProducts);
router.get("/:id", GetProductById);

// ───────────── Admin/Owner Routes ─────────────
router.post(
    "/",
    verifyToken,
    upload.array("productImages", 5),
    AddProductByAdmin
);

router.put(
    "/:id",
    verifyToken,
    upload.array("productImages", 5),
    UpdateProductByAdmin
);

router.delete("/:id", DeleteProduct); 

module.exports = router;
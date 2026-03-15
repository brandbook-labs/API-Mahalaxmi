const express = require("express");
const router = express.Router();
const upload = require("../../middleware/multer.middleware");

// Controllers ଇମ୍ପୋର୍ଟ କରନ୍ତୁ
const {
    AddProductByAdmin,
    GetAllProducts,
    GetProductById,
    DeleteProduct
} = require("./product.controller");

// Middleware ଇମ୍ପୋର୍ଟ (ଆପଣଙ୍କ ଅଥେଣ୍ଟିକେସନ୍ ମିଡିଲୱେର୍ ଯାହା req.user ଦେଇଥାଏ)
// const { verifyToken } = require("../middleware/auth.middleware");

// ───────────── Public Routes (ସମସ୍ତେ ଦେଖିପାରିବେ) ─────────────
router.get("/", GetAllProducts);
router.get("/:id", GetProductById);

// ───────────── Admin/Owner Routes ─────────────
// upload.array("productImages", 5) ର ଅର୍ଥ ୟୁଜର୍ ସର୍ବାଧିକ ୫ଟି ଫଟୋ ଏକାସାଙ୍ଗରେ ଦେଇପାରିବେ
router.post(
    "/",
    // verifyToken,
    upload.array("productImages", 5),
    AddProductByAdmin
);

router.delete("/:slug", DeleteProduct); 

module.exports = router;
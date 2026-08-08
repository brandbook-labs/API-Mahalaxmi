const express = require("express");
const router = express.Router();
const upload = require("../../middleware/multer.middleware");

const {
    getAllCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    resetToDefault,
} = require("./product-category.controller");
const { verifyToken } = require("../../middleware/verify-token.middleware");

// Public, both the admin panel's dropdown and the customer app's
// category rail read from the same real list.
router.get("/", getAllCategories);

// Admin only, upload.single("image") matches the field name the React
// form sends the file under.
router.post("/", verifyToken, upload.single("image"), createCategory);
router.put("/:id", verifyToken, upload.single("image"), updateCategory);
router.delete("/:id", verifyToken, deleteCategory);
router.post("/reset-default", verifyToken, resetToDefault);

module.exports = router;
const { statusCodes } = require("../../config/statusCodes");
const { asyncHandler } = require("../../utils/asyncHandler");
const { sendApiResponse } = require("../../utils/responseUtils");
const ProductCategory = require("./product-category.model");
const { DEFAULT_CATEGORIES } = require("./default-categories");
const { sharpCompressToSize } = require("../../utils/sharpCompressToSize");
const { handleImageUpload } = require("../../cloudflare/r2Service");

// Same real compress + R2 upload pipeline product photos already use,
// just for a single file instead of an array, a category only ever
// needs one representative image.
const uploadCategoryImage = async (file) => {
    const optimizedBuffer = await sharpCompressToSize(file.buffer, 50 * 1024);
    const compressedFile = {
        ...file,
        buffer: optimizedBuffer,
        mimetype: "image/webp",
        originalname: file.originalname.replace(/\.[^/.]+$/, "") + `_${Date.now()}.webp`,
    };
    return await handleImageUpload(compressedFile);
};

// ───────────── GET ALL (public, used by both admin panel and the app) ─────────────
const getAllCategories = asyncHandler(async (req, res) => {
    // First-ever call with an empty collection seeds it automatically,
    // no manual migration step needed to get the default 20 in place.
    const count = await ProductCategory.countDocuments();
    if (count === 0) {
        await ProductCategory.insertMany(DEFAULT_CATEGORIES);
    }

    const categories = await ProductCategory.find().sort({ sortOrder: 1, label: 1 });
    return sendApiResponse(res, statusCodes.OK, "Categories fetched successfully", { categories });
});

// ───────────── CREATE (Admin Only) ─────────────
const createCategory = asyncHandler(async (req, res) => {
    const { value, label, description, group, sortOrder } = req.body;

    if (!value || !label) {
        return sendApiResponse(res, statusCodes.BAD_REQUEST, "Value and label are required.");
    }

    const existing = await ProductCategory.findOne({ value });
    if (existing) {
        return sendApiResponse(res, statusCodes.BAD_REQUEST, "A category with this value already exists.");
    }

    let imageUrl = null;
    if (req.file) {
        imageUrl = await uploadCategoryImage(req.file);
    }

    const category = await ProductCategory.create({
        value,
        label,
        description: description || "",
        imageUrl,
        group: group || "Other",
        sortOrder: sortOrder ?? 0,
        isDefault: false,
    });

    return sendApiResponse(res, statusCodes.CREATED, "Category created successfully", category);
});

// ───────────── UPDATE (Admin Only) ─────────────
// Note: `value` is intentionally never editable here, it's what's
// already saved on real products, changing it would silently orphan
// every product using this category.
const updateCategory = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { label, description, group, sortOrder } = req.body;

    const category = await ProductCategory.findById(id);
    if (!category) {
        return sendApiResponse(res, statusCodes.NOT_FOUND, "Category not found.");
    }

    if (label !== undefined) category.label = label;
    if (description !== undefined) category.description = description;
    if (group !== undefined) category.group = group;
    if (sortOrder !== undefined) category.sortOrder = sortOrder;
    if (req.file) {
        category.imageUrl = await uploadCategoryImage(req.file);
    }

    await category.save();
    return sendApiResponse(res, statusCodes.OK, "Category updated successfully", category);
});

// ───────────── DELETE (Admin Only) ─────────────
// Deleting a category only removes it from the picker, it does not
// touch any product already using that value, those keep working
// exactly as they are, just orphaned from the visible list.
const deleteCategory = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const category = await ProductCategory.findByIdAndDelete(id);
    if (!category) {
        return sendApiResponse(res, statusCodes.NOT_FOUND, "Category not found.");
    }

    return sendApiResponse(res, statusCodes.OK, "Category deleted successfully");
});

// ───────────── RESET TO DEFAULT (Admin Only) ─────────────
const resetToDefault = asyncHandler(async (req, res) => {
    await ProductCategory.deleteMany({});
    await ProductCategory.insertMany(DEFAULT_CATEGORIES);
    const categories = await ProductCategory.find().sort({ sortOrder: 1, label: 1 });
    return sendApiResponse(res, statusCodes.OK, "Reset to default categories", { categories });
});

module.exports = {
    getAllCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    resetToDefault,
};
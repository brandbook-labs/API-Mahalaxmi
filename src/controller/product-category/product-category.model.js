const mongoose = require("mongoose");

// The real, admin-editable source of truth for "what product types
// exist and how they're presented", replacing what used to be
// hardcoded separately in the React admin dropdown and the Flutter
// app's category rail. `value` is what actually gets written onto
// Product.productType, it stays fixed once created so existing
// products never break, everything else here (label, description,
// image, group, ordering) is freely editable by an admin.
const productCategorySchema = new mongoose.Schema(
    {
        value: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        label: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
            default: "",
        },
        imageUrl: {
            type: String,
            default: null,
        },
        group: {
            type: String,
            enum: ["Indian Wear", "Western Wear", "Accessories", "Other"],
            default: "Other",
        },
        sortOrder: {
            type: Number,
            default: 0,
        },
        // Marks the original 20 seeded types, so "Reset to Default" knows
        // exactly what to restore without guessing which entries an admin
        // added themselves afterward.
        isDefault: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("ProductCategory", productCategorySchema);
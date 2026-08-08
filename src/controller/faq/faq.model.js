const mongoose = require("mongoose");

// Admin-managed help content, shown on the app's Help Centre screen.
// isActive lets an admin hide a question without permanently deleting
// it, useful for something seasonal ("Do you deliver during festival
// season?") that gets turned back on later.
const faqSchema = new mongoose.Schema(
    {
        question: {
            type: String,
            required: true,
            trim: true,
        },
        answer: {
            type: String,
            required: true,
            trim: true,
        },
        category: {
            type: String,
            default: "General",
            trim: true,
        },
        sortOrder: {
            type: Number,
            default: 0,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Faq", faqSchema);
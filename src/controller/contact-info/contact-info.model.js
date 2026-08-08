const mongoose = require("mongoose");

// A singleton, exactly one document ever exists in this collection.
// This is the app's real "Contact Us" content, admin-editable, no
// separate hardcoded copy in the app to fall out of sync.
const contactInfoSchema = new mongoose.Schema(
    {
        whatsappNumber: {
            type: String,
            default: "",
        },
        // Pre-filled text a customer's WhatsApp opens with when they tap
        // the contact button, editable so the admin can adjust the
        // greeting without needing a code change.
        whatsappTemplateMessage: {
            type: String,
            default: "Hi, I have a question about my order.",
        },
        email: {
            type: String,
            default: "",
        },
        phone: {
            type: String,
            default: "",
        },
        availableTimings: {
            type: String,
            default: "",
        },
        registeredAddress: {
            type: String,
            default: "",
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("ContactInfo", contactInfoSchema);
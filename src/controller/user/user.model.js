const mongoose = require("mongoose");

// A customer's saved address book. Lives as a subdocument array on the
// user, each entry gets its own real _id automatically, which is what
// the app uses for edit/delete.
const addressSchema = new mongoose.Schema(
    {
        label: {
            type: String,
            enum: ["Home", "Work", "Other"],
            default: "Home",
        },
        recipientName: {
            type: String,
            required: true,
            trim: true,
        },
        flat: {
            type: String,
            required: true,
            trim: true,
        },
        area: {
            type: String,
            required: true,
            trim: true,
        },
        city: {
            type: String,
            required: true,
            trim: true,
        },
        state: {
            type: String,
            required: true,
            trim: true,
        },
        pincode: {
            type: String,
            required: true,
            match: [/^[0-9]{6}$/, "Please provide a valid 6-digit pincode"],
        },
        phone: {
            type: String,
            required: true,
            match: [/^[0-9]{10}$/, "Please provide a valid 10-digit phone number"],
        },
        isDefault: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

// Customer accounts, phone + OTP only, no password. Created automatically
// the first time a phone number successfully verifies an OTP.
const userSchema = new mongoose.Schema(
    {
        phone: {
            type: String,
            required: true,
            unique: true,
            index: true,
            match: [/^[0-9]{10}$/, "Please provide a valid 10-digit phone number"],
        },
        name: {
            type: String,
            trim: true,
        },
        addresses: [addressSchema],
    },
    { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
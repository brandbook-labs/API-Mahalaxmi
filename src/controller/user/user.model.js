const mongoose = require("mongoose");

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
    },
    { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
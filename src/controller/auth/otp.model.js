const mongoose = require("mongoose");

// Short-lived OTP codes, one per phone number at a time. The TTL index
// below tells MongoDB to automatically delete expired documents on its
// own, no manual cleanup job needed.
const otpSchema = new mongoose.Schema(
    {
        phone: {
            type: String,
            required: true,
            index: true,
        },
        // SHA-256 hash of the OTP, never store the plain code.
        codeHash: {
            type: String,
            required: true,
        },
        expiresAt: {
            type: Date,
            required: true,
        },
    },
    { timestamps: true }
);

// TTL index: MongoDB removes the document once expiresAt is in the past.
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("Otp", otpSchema);
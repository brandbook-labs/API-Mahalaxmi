const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            require: true,
        },
        bio: String,
        email: {
            type: String,
            require: true,
            unique: true,
        },
        username: {
            type: String,
            require: true,
            unique: true,
        },
        password: {
            type: String,
            require: true,
        },
        role: String,
        profile: String
    },
    { timestamps: true }
);

module.exports = mongoose.model("Admin", adminSchema);
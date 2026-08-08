const mongoose = require("mongoose");

// One document per real policy type, "type" is the stable key the app
// requests by (return_policy, terms_privacy), sections is the actual
// structured content, an admin edits the whole document as one unit
// since a legal document doesn't really make sense edited piecemeal
// the way an FAQ list does.
const legalPageSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            enum: ["return_policy", "terms_privacy"],
            required: true,
            unique: true,
        },
        title: {
            type: String,
            required: true,
        },
        sections: [
            {
                heading: { type: String, required: true },
                content: { type: String, required: true },
            },
        ],
    },
    { timestamps: true }
);

module.exports = mongoose.model("LegalPage", legalPageSchema);
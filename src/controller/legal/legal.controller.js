const { statusCodes } = require("../../config/statusCodes");
const { asyncHandler } = require("../../utils/asyncHandler");
const { sendApiResponse } = require("../../utils/responseUtils");
const LegalPage = require("./legal.model");

const VALID_TYPES = ["return_policy", "terms_privacy"];
const DEFAULT_TITLES = {
    return_policy: "Return & Exchange Policy",
    terms_privacy: "Terms of Service & Privacy Policy",
};

// ───────────── GET (public) ─────────────
const getLegalPage = asyncHandler(async (req, res) => {
    const { type } = req.params;

    if (!VALID_TYPES.includes(type)) {
        return sendApiResponse(res, statusCodes.BAD_REQUEST, "Unknown policy type.");
    }

    let page = await LegalPage.findOne({ type });
    if (!page) {
        // First-ever request seeds an empty shell rather than erroring,
        // an admin fills in real sections from there. This never leaves
        // the app with a broken screen if nobody has written this yet.
        page = await LegalPage.create({ type, title: DEFAULT_TITLES[type], sections: [] });
    }

    return sendApiResponse(res, statusCodes.OK, "Policy fetched successfully", page);
});

// ───────────── UPDATE (Admin Only) ─────────────
// Sections are replaced wholesale, editing a legal document as a
// single coherent unit makes more sense than patching individual
// paragraphs piecemeal.
const updateLegalPage = asyncHandler(async (req, res) => {
    const { type } = req.params;
    const { title, sections } = req.body;

    if (!VALID_TYPES.includes(type)) {
        return sendApiResponse(res, statusCodes.BAD_REQUEST, "Unknown policy type.");
    }
    if (!Array.isArray(sections)) {
        return sendApiResponse(res, statusCodes.BAD_REQUEST, "Sections must be an array.");
    }

    const page = await LegalPage.findOneAndUpdate(
        { type },
        { type, title: title || DEFAULT_TITLES[type], sections },
        { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return sendApiResponse(res, statusCodes.OK, "Policy updated successfully", page);
});

module.exports = { getLegalPage, updateLegalPage };
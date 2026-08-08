const { statusCodes } = require("../../config/statusCodes");
const { asyncHandler } = require("../../utils/asyncHandler");
const { sendApiResponse } = require("../../utils/responseUtils");
const Faq = require("./faq.model");

// ───────────── GET ALL ─────────────
// A real customer (no admin token) only ever sees active FAQs, same
// pattern as draft products, an admin (req.user set by optionalAuth)
// sees everything so they can re-enable a hidden one.
const getAllFaqs = asyncHandler(async (req, res) => {
    const query = req.user ? {} : { isActive: true };
    const faqs = await Faq.find(query).sort({ category: 1, sortOrder: 1 });
    return sendApiResponse(res, statusCodes.OK, "FAQs fetched successfully", { faqs });
});

// ───────────── CREATE (Admin Only) ─────────────
const createFaq = asyncHandler(async (req, res) => {
    const { question, answer, category, sortOrder, isActive } = req.body;

    if (!question || !answer) {
        return sendApiResponse(res, statusCodes.BAD_REQUEST, "Question and answer are required.");
    }

    const faq = await Faq.create({
        question,
        answer,
        category: category || "General",
        sortOrder: sortOrder ?? 0,
        isActive: isActive ?? true,
    });

    return sendApiResponse(res, statusCodes.CREATED, "FAQ created successfully", faq);
});

// ───────────── UPDATE (Admin Only) ─────────────
const updateFaq = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { question, answer, category, sortOrder, isActive } = req.body;

    const faq = await Faq.findById(id);
    if (!faq) {
        return sendApiResponse(res, statusCodes.NOT_FOUND, "FAQ not found.");
    }

    if (question !== undefined) faq.question = question;
    if (answer !== undefined) faq.answer = answer;
    if (category !== undefined) faq.category = category;
    if (sortOrder !== undefined) faq.sortOrder = sortOrder;
    if (isActive !== undefined) faq.isActive = isActive;

    await faq.save();
    return sendApiResponse(res, statusCodes.OK, "FAQ updated successfully", faq);
});

// ───────────── DELETE (Admin Only) ─────────────
const deleteFaq = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const faq = await Faq.findByIdAndDelete(id);
    if (!faq) {
        return sendApiResponse(res, statusCodes.NOT_FOUND, "FAQ not found.");
    }
    return sendApiResponse(res, statusCodes.OK, "FAQ deleted successfully");
});

module.exports = { getAllFaqs, createFaq, updateFaq, deleteFaq };
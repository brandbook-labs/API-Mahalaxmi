const { statusCodes } = require("../../config/statusCodes");
const { asyncHandler } = require("../../utils/asyncHandler");
const { sendApiResponse } = require("../../utils/responseUtils");
const Faq = require("./faq.model");

// ───────────── GET ALL (filterable, paginated) ─────────────
// A real customer (no admin token) only ever sees active FAQs, same
// pattern as draft products, an admin (req.user set by optionalAuth)
// sees everything so they can re-enable a hidden one.
//
// Supports ?category=X to scope to one category (what the app's
// per-category screen uses), ?search=X to search question/answer text
// server-side (so a search never needs to pull every FAQ down first
// just to filter client-side), and real ?page/?limit pagination,
// matching the same shape as the products endpoint.
const getAllFaqs = asyncHandler(async (req, res) => {
    const { category, search, page = 1, limit = 10 } = req.query;

    const query = req.user ? {} : { isActive: true };
    if (category) query.category = category;
    if (search) {
        query.$or = [
            { question: { $regex: search, $options: "i" } },
            { answer: { $regex: search, $options: "i" } },
        ];
    }

    const numericLimit = Number(limit) || 10;
    const numericPage = Number(page) || 1;

    const totalFaqs = await Faq.countDocuments(query);
    const faqs = await Faq.find(query)
        .sort({ sortOrder: 1, createdAt: 1 })
        .skip((numericPage - 1) * numericLimit)
        .limit(numericLimit);

    return sendApiResponse(res, statusCodes.OK, "FAQs fetched successfully", {
        faqs,
        pagination: {
            totalFaqs,
            totalPages: Math.max(1, Math.ceil(totalFaqs / numericLimit)),
            currentPage: numericPage,
            limit: numericLimit,
        },
    });
});

// ───────────── GET CATEGORIES (lightweight, real counts) ─────────────
// Powers the Help Centre's category picker, one small aggregation
// instead of pulling every FAQ's full text just to know what
// categories exist and how many questions are in each.
const getFaqCategories = asyncHandler(async (req, res) => {
    const matchStage = req.user ? {} : { isActive: true };

    const results = await Faq.aggregate([
        { $match: matchStage },
        { $group: { _id: "$category", count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
    ]);

    const categories = results.map((r) => ({ category: r._id, count: r.count }));
    return sendApiResponse(res, statusCodes.OK, "Categories fetched successfully", { categories });
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

module.exports = { getAllFaqs, getFaqCategories, createFaq, updateFaq, deleteFaq };
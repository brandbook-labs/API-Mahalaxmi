const { statusCodes } = require("../../config/statusCodes");
const { asyncHandler } = require("../../utils/asyncHandler");
const { sendApiResponse } = require("../../utils/responseUtils");
const ContactInfo = require("./contact-info.model");

// Both handlers share this: there is exactly one ContactInfo document,
// ever. If it doesn't exist yet, create it with defaults first, so a
// fresh install always has something real to hand back rather than an
// error, an admin just fills it in afterward.
const getOrCreateSingleton = async () => {
    let doc = await ContactInfo.findOne();
    if (!doc) {
        doc = await ContactInfo.create({});
    }
    return doc;
};

// ───────────── GET (public) ─────────────
const getContactInfo = asyncHandler(async (req, res) => {
    const contactInfo = await getOrCreateSingleton();
    return sendApiResponse(res, statusCodes.OK, "Contact info fetched successfully", contactInfo);
});

// ───────────── UPDATE (Admin Only) ─────────────
const updateContactInfo = asyncHandler(async (req, res) => {
    const { whatsappNumber, whatsappTemplateMessage, email, phone, availableTimings, registeredAddress } = req.body;

    const contactInfo = await getOrCreateSingleton();

    if (whatsappNumber !== undefined) contactInfo.whatsappNumber = whatsappNumber;
    if (whatsappTemplateMessage !== undefined) contactInfo.whatsappTemplateMessage = whatsappTemplateMessage;
    if (email !== undefined) contactInfo.email = email;
    if (phone !== undefined) contactInfo.phone = phone;
    if (availableTimings !== undefined) contactInfo.availableTimings = availableTimings;
    if (registeredAddress !== undefined) contactInfo.registeredAddress = registeredAddress;

    await contactInfo.save();
    return sendApiResponse(res, statusCodes.OK, "Contact info updated successfully", contactInfo);
});

module.exports = { getContactInfo, updateContactInfo };
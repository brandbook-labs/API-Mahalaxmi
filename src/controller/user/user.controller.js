const { statusCodes } = require("../../config/statusCodes");
const { asyncHandler } = require("../../utils/asyncHandler");
const { sendApiResponse } = require("../../utils/responseUtils");
const User = require("./user.model");

// ───────────── GET ADDRESSES ─────────────
const getAddresses = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.user_id);
    if (!user) {
        return sendApiResponse(res, statusCodes.NOT_FOUND, "Account not found.");
    }
    return sendApiResponse(res, statusCodes.OK, "Addresses fetched successfully", {
        addresses: user.addresses,
    });
});

// ───────────── ADD ADDRESS ─────────────
const addAddress = asyncHandler(async (req, res) => {
    const { label, recipientName, flat, area, city, state, pincode, phone, isDefault } = req.body;

    if (!recipientName || !flat || !area || !city || !state || !pincode || !phone) {
        return sendApiResponse(res, statusCodes.BAD_REQUEST, "All address fields are required.");
    }

    const user = await User.findById(req.user.user_id);
    if (!user) {
        return sendApiResponse(res, statusCodes.NOT_FOUND, "Account not found.");
    }

    // Only one address should ever be marked default at a time.
    if (isDefault) {
        user.addresses.forEach((addr) => {
            addr.isDefault = false;
        });
    }

    // The very first address a person ever saves becomes their default
    // automatically, there is no real reason to make them do that as a
    // separate step.
    const shouldBeDefault = isDefault || user.addresses.length === 0;

    user.addresses.push({
        label: label || "Home",
        recipientName,
        flat,
        area,
        city,
        state,
        pincode,
        phone,
        isDefault: shouldBeDefault,
    });

    await user.save();

    const newAddress = user.addresses[user.addresses.length - 1];
    return sendApiResponse(res, statusCodes.CREATED, "Address added successfully", newAddress);
});

// ───────────── UPDATE ADDRESS ─────────────
const updateAddress = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { label, recipientName, flat, area, city, state, pincode, phone, isDefault } = req.body;

    const user = await User.findById(req.user.user_id);
    if (!user) {
        return sendApiResponse(res, statusCodes.NOT_FOUND, "Account not found.");
    }

    const address = user.addresses.id(id);
    if (!address) {
        return sendApiResponse(res, statusCodes.NOT_FOUND, "Address not found.");
    }

    if (isDefault) {
        user.addresses.forEach((addr) => {
            addr.isDefault = false;
        });
    }

    if (label !== undefined) address.label = label;
    if (recipientName !== undefined) address.recipientName = recipientName;
    if (flat !== undefined) address.flat = flat;
    if (area !== undefined) address.area = area;
    if (city !== undefined) address.city = city;
    if (state !== undefined) address.state = state;
    if (pincode !== undefined) address.pincode = pincode;
    if (phone !== undefined) address.phone = phone;
    if (isDefault !== undefined) address.isDefault = isDefault;

    await user.save();

    return sendApiResponse(res, statusCodes.OK, "Address updated successfully", address);
});

// ───────────── DELETE ADDRESS ─────────────
const deleteAddress = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const user = await User.findById(req.user.user_id);
    if (!user) {
        return sendApiResponse(res, statusCodes.NOT_FOUND, "Account not found.");
    }

    const address = user.addresses.id(id);
    if (!address) {
        return sendApiResponse(res, statusCodes.NOT_FOUND, "Address not found.");
    }

    const wasDefault = address.isDefault;
    address.deleteOne();

    // If the deleted address was the default, and there's still at
    // least one address left, promote the first remaining one so the
    // person always has a real default rather than none at all.
    if (wasDefault && user.addresses.length > 0) {
        user.addresses[0].isDefault = true;
    }

    await user.save();

    return sendApiResponse(res, statusCodes.OK, "Address deleted successfully");
});

module.exports = {
    getAddresses,
    addAddress,
    updateAddress,
    deleteAddress,
};
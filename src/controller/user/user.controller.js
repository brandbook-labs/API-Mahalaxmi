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

    if (isDefault) {
        user.addresses.forEach((addr) => {
            addr.isDefault = false;
        });
    }

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

    if (wasDefault && user.addresses.length > 0) {
        user.addresses[0].isDefault = true;
    }

    await user.save();

    return sendApiResponse(res, statusCodes.OK, "Address deleted successfully");
});

// ───────────── GET PAYMENT METHODS ─────────────
const getPaymentMethods = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.user_id);
    if (!user) {
        return sendApiResponse(res, statusCodes.NOT_FOUND, "Account not found.");
    }
    
    return sendApiResponse(res, statusCodes.OK, "Payment methods fetched successfully", {
        methods: user.paymentMethods,
    });
});

// ───────────── DELETE PAYMENT METHOD ─────────────
const deletePaymentMethod = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const user = await User.findById(req.user.user_id);
    if (!user) {
        return sendApiResponse(res, statusCodes.NOT_FOUND, "Account not found.");
    }

    const paymentMethod = user.paymentMethods.id(id);
    if (!paymentMethod) {
        return sendApiResponse(res, statusCodes.NOT_FOUND, "Payment method not found.");
    }

    // Call Razorpay API to invalidate the token on their end.
    try {
        const keyId = process.env.RAZORPAY_KEY_ID;
        const keySecret = process.env.RAZORPAY_KEY_SECRET;
        
        if (keyId && keySecret) {
            const Razorpay = require("razorpay");
            const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
            
            if (user.razorpayCustomerId) {
                await razorpay.customers.deleteToken(user.razorpayCustomerId, paymentMethod.razorpayTokenId);
            } else {
                console.warn(`Could not delete token ${paymentMethod.razorpayTokenId} from Razorpay: Missing customer ID on user.`);
            }
        }
    } catch (error) {
        console.error("Failed to delete token from Razorpay:", error.message);
        return sendApiResponse(res, statusCodes.INTERNAL_SERVER_ERROR, "Failed to completely remove payment method.");
    }

    paymentMethod.deleteOne();
    await user.save();

    return res.status(200).json({ 
        code: 200, 
        msg: "Payment method removed" 
    });
});

module.exports = {
    getAddresses,
    addAddress,
    updateAddress,
    deleteAddress,
    getPaymentMethods,
    deletePaymentMethod
};
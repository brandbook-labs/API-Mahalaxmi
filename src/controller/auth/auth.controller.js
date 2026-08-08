const crypto = require("crypto");
const { statusCodes } = require("../../config/statusCodes");
const { asyncHandler } = require("../../utils/asyncHandler");
const { sendApiResponse } = require("../../utils/responseUtils");
const { isValidIndianMobile } = require("../../utils/phone-validator");
const { generateToken } = require("../../middleware/generate-token.middleware");
const { sendOtpSms } = require("../../services/sms-service");
const { linkGuestOrdersToUser } = require("../../utils/linkGuestOrders");
const User = require("../user/user.model");
const Otp = require("./otp.model");

const OTP_LENGTH = 6;
const OTP_TTL_MINUTES = 5;

const hashOtp = (otp) => crypto.createHash("sha256").update(otp).digest("hex");

const generateOtp = () => {
    // 6-digit numeric code, e.g. 048213. Cryptographically random, not
    // Math.random(), since this guards account access.
    const max = 10 ** OTP_LENGTH;
    const num = crypto.randomInt(0, max);
    return num.toString().padStart(OTP_LENGTH, "0");
};

// ───────────── REQUEST OTP ─────────────
const requestOtp = asyncHandler(async (req, res) => {
    const { phone } = req.body;

    if (!phone) {
        return sendApiResponse(res, statusCodes.BAD_REQUEST, "Phone number is required.");
    }

    if (!isValidIndianMobile(phone)) {
        return sendApiResponse(res, statusCodes.BAD_REQUEST, "Please enter a valid 10-digit mobile number.");
    }

    const otp = generateOtp();
    const codeHash = hashOtp(otp);
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

    // Replace any previous unused OTP for this phone with a fresh one.
    await Otp.deleteMany({ phone });
    await Otp.create({ phone, codeHash, expiresAt });

    const smsResult = await sendOtpSms(phone, otp);

    if (!smsResult.success) {
        return sendApiResponse(res, statusCodes.INTERNAL_SERVER_ERROR, "Could not send OTP. Please try again.");
    }

    // Dev mode only, no real SMS provider configured yet: return the OTP
    // directly in the response so the app can show it on screen. This
    // stops automatically the moment MSG91_AUTH_KEY is set, since
    // smsResult.devMode becomes false then, nothing to remember to
    // switch off manually later.
    const responseData = smsResult.devMode ? { otp, devMode: true } : null;

    return sendApiResponse(res, statusCodes.OK, "OTP sent successfully.", responseData);
});

// ───────────── VERIFY OTP ─────────────
const verifyOtp = asyncHandler(async (req, res) => {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
        return sendApiResponse(res, statusCodes.BAD_REQUEST, "Phone number and OTP are required.");
    }

    const otpRecord = await Otp.findOne({ phone }).sort({ createdAt: -1 });

    if (!otpRecord) {
        return sendApiResponse(res, statusCodes.BAD_REQUEST, "Invalid or expired OTP. Please request a new one.");
    }

    if (otpRecord.expiresAt < new Date()) {
        await Otp.deleteOne({ _id: otpRecord._id });
        return sendApiResponse(res, statusCodes.BAD_REQUEST, "This OTP has expired. Please request a new one.");
    }

    if (otpRecord.codeHash !== hashOtp(otp)) {
        return sendApiResponse(res, statusCodes.BAD_REQUEST, "Incorrect OTP. Please try again.");
    }

    // OTP is correct and unexpired, consume it so it cannot be reused.
    await Otp.deleteOne({ _id: otpRecord._id });

    // Find or create the user, first successful verification for a
    // phone number is what creates the account, no separate signup step.
    let user = await User.findOne({ phone });
    if (!user) {
        user = await User.create({ phone });
    }

    // Every verification is a real chance to sweep up any guest orders
    // sitting under this number, not just the specific one someone
    // might be in the middle of, this is what fixes "I placed three
    // orders as a guest but only see one" for good.
    await linkGuestOrdersToUser(user._id, phone);

    const token = generateToken(user._id);

    return sendApiResponse(res, statusCodes.OK, "Verified successfully.", {
        token,
        user: {
            _id: user._id,
            phone: user.phone,
            name: user.name || null,
        },
    });
});

module.exports = {
    requestOtp,
    verifyOtp,
};
const { statusCodes } = require("../../config/statusCodes");
const Admin = require("./admin.model");
const { asyncHandler } = require("../../utils/asyncHandler");
const { generateToken } = require("../../middleware/generate-token.middleware");
const { sendApiResponse } = require("../../utils/responseUtils");

const Login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return sendApiResponse(res, statusCodes.BAD_REQUEST, "Username/Email and password are required.");
    }

    // Find admin by username OR email
    const admin = await Admin.findOne({
        $or: [{ username: email }, { email }]
    });

    if (!admin) {
        return sendApiResponse(res, statusCodes.UNAUTHORIZED, "Invalid username/email or password.");
    }

    const isPasswordValid = admin.password === password; // Use bcrypt in production
    if (!isPasswordValid) {
        return sendApiResponse(res, statusCodes.UNAUTHORIZED, "Invalid username/email or password.");
    }

    const token = generateToken(admin._id);

    return sendApiResponse(res, statusCodes.OK, "Login successfully!", {
        token,
        admin: {
            id: admin._id,
            username: admin.username,
            email: admin.email,
            name: admin.name,
            profile: admin.profile,
            role: admin.role,
        },
    });
});

module.exports = Login;
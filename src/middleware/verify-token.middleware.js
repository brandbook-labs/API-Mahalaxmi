const JWT = require("jsonwebtoken");
const { asyncHandler } = require("../utils/asyncHandler");
const { sendApiResponse } = require("../utils/responseUtils");
const { statusCodes } = require("../config/statusCodes");

const verifyToken = asyncHandler(async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return sendApiResponse(res, statusCodes.UNAUTHORIZED, "Token is required")
    }

    const token = authHeader.split(" ")[1];
    try {
        const decoded = JWT.verify(token, process.env.JWT_SECRET_KEY);
        req.user = decoded; // Attach the decoded payload to the request object
        next(); // Move to the next middleware
    } catch (error) {
        return sendApiResponse(res, statusCodes.UNAUTHORIZED, "Token verification error:", error)
    }
});

module.exports = { verifyToken };
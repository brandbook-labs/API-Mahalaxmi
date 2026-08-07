const JWT = require("jsonwebtoken");
const { asyncHandler } = require("../utils/asyncHandler");

/**
 * Same idea as verifyToken, but never blocks the request. If a valid
 * Bearer token is present, req.user gets set exactly like verifyToken
 * would. If there's no token, or it's invalid/expired, the request
 * just proceeds as a guest, req.user stays undefined, nothing throws.
 *
 * This is what lets a route serve both signed-in customers and guests
 * from the same handler, the same pattern placeOrder already uses
 * (see order.controller.js checking `if (req.user && req.user.user_id)`),
 * just made reusable as real middleware instead of one-off per route.
 */
const optionalAuth = asyncHandler(async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return next();
    }

    const token = authHeader.split(" ")[1];
    try {
        const decoded = JWT.verify(token, process.env.JWT_SECRET_KEY);
        req.user = decoded;
    } catch (error) {
        // Invalid or expired token, proceed as a guest rather than
        // blocking, an expired session should never trap someone mid
        // checkout.
    }

    next();
});

module.exports = { optionalAuth };
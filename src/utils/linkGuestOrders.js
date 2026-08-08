const Order = require("../controller/order/order.model");

/**
 * Links every order ever placed under a phone number, but not yet
 * attached to any account, to the given user. Call this anywhere a
 * phone number gets freshly verified, a normal sign-in, a first-time
 * signup, or the post-checkout guest verification flow, so historic
 * guest orders under that number always surface in "My Orders" the
 * moment there's a real account to attach them to, not just whichever
 * single order happened to be top of mind at the time.
 *
 * Idempotent and safe to call on every verification, already-linked
 * orders are excluded by the query itself, so calling this twice for
 * the same person never does anything the second time.
 */
const linkGuestOrdersToUser = async (userId, phone) => {
    const result = await Order.updateMany(
        { phone, $or: [{ user: { $exists: false } }, { user: null }] },
        { $set: { user: userId } }
    );
    return result.modifiedCount || 0;
};

module.exports = { linkGuestOrdersToUser };
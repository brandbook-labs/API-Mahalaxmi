const crypto = require("crypto");
const { statusCodes } = require("../../config/statusCodes");
const { asyncHandler } = require("../../utils/asyncHandler");
const { sendApiResponse } = require("../../utils/responseUtils");
const Order = require("../order/order.model");
const Product = require("../product/product.model");

/**
 * Razorpay's SDK is only loaded and constructed when a request actually
 * comes in, and only if both keys are present. This means the server
 * starts up fine and every other route keeps working even before you
 * have a Razorpay account, these two endpoints just return a clear
 * "not configured yet" error until you add real keys.
 */
const getRazorpayClient = () => {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
        return null;
    }

    const Razorpay = require("razorpay");
    return new Razorpay({ key_id: keyId, key_secret: keySecret });
};

// ───────────── CREATE PAYMENT ORDER ─────────────
const createPaymentOrder = asyncHandler(async (req, res) => {
    const { amount } = req.body; // amount in paise, smallest INR unit

    if (!amount || typeof amount !== "number" || amount <= 0) {
        return sendApiResponse(res, statusCodes.BAD_REQUEST, "A valid amount (in paise) is required.");
    }

    const razorpay = getRazorpayClient();
    if (!razorpay) {
        return sendApiResponse(
            res,
            statusCodes.INTERNAL_SERVER_ERROR,
            "Online payments are not configured yet. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to your environment."
        );
    }

    const razorpayOrder = await razorpay.orders.create({
        amount,
        currency: "INR",
        receipt: `receipt_${Date.now()}`,
    });

    return sendApiResponse(res, statusCodes.OK, "Payment order created", {
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        razorpayKeyId: process.env.RAZORPAY_KEY_ID,
    });
});

// ───────────── VERIFY PAYMENT & CREATE ORDER ─────────────
const verifyPayment = asyncHandler(async (req, res) => {
    const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        name,
        phone,
        shippingAddress,
        products,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return sendApiResponse(res, statusCodes.BAD_REQUEST, "Missing payment verification fields.");
    }

    if (!name || !phone || !shippingAddress || !products || products.length === 0) {
        return sendApiResponse(res, statusCodes.BAD_REQUEST, "All fields and products are required.");
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
        return sendApiResponse(
            res,
            statusCodes.INTERNAL_SERVER_ERROR,
            "Online payments are not configured yet. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to your environment."
        );
    }

    // Verify the payment is genuine using Razorpay's standard HMAC check,
    // this is what actually proves the payment happened, never trust the
    // app's word for it alone.
    const expectedSignature = crypto
        .createHmac("sha256", keySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex");

    if (expectedSignature !== razorpay_signature) {
        return sendApiResponse(res, statusCodes.UNAUTHORIZED, "Payment verification failed. Signature mismatch.");
    }

    // Same server-side price verification pattern as placeOrder, never
    // trust prices sent from the app.
    let calculatedSubtotal = 0;
    const verifiedProducts = [];

    await Promise.all(products.map(async (item) => {
        const dbProduct = await Product.findById(item.product);
        if (!dbProduct) {
            throw new Error(`Product with ID ${item.product} not found.`);
        }
        const itemTotal = dbProduct.originalPrice * item.quantity;
        calculatedSubtotal += itemTotal;
        verifiedProducts.push({
            product: dbProduct._id,
            size: item.size,
            quantity: item.quantity,
            price: dbProduct.originalPrice,
        });
    }));

    const calculatedGst = Math.round(calculatedSubtotal * 0.18);
    const finalTotalPrice = calculatedSubtotal + calculatedGst;

    const orderPayload = {
        name,
        phone,
        shippingAddress,
        products: verifiedProducts,
        pricing: {
            subtotal: calculatedSubtotal,
            gst: calculatedGst,
            totalPrice: finalTotalPrice,
        },
        paymentMethod: "online",
        paymentStatus: "completed",
        razorpayPaymentId: razorpay_payment_id,
        // Same seeding as placeOrder, a real first tracking entry from
        // the moment the order exists.
        statusHistory: [{ status: "pending", timestamp: new Date() }],
    };

    if (req.user && req.user.user_id) {
        orderPayload.user = req.user.user_id;
    }

    const newOrder = await Order.create(orderPayload);
    const populatedOrder = await Order.findById(newOrder._id).populate({
        path: "products.product",
        select: "name",
    });

    return sendApiResponse(res, statusCodes.CREATED, "Order placed successfully!", populatedOrder);
});

module.exports = {
    createPaymentOrder,
    verifyPayment,
};
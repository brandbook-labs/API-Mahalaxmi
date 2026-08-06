const { statusCodes } = require("../../config/statusCodes");
const { asyncHandler } = require("../../utils/asyncHandler");
const { sendApiResponse } = require("../../utils/responseUtils");
const Order = require("./order.model");
const Product = require("../product/product.model");

// ───────────── PLACE ORDER ─────────────
const placeOrder = asyncHandler(async (req, res) => {
    const { 
        name, 
        phone, 
        shippingAddress, 
        products, 
        paymentMethod 
    } = req.body;

    // ୧. Basic Validation
    if (!name || !phone || !shippingAddress || !products || products.length === 0) {
        return sendApiResponse(res, statusCodes.BAD_REQUEST, "All fields and products are required.");
    }

    // ୨. Security Check: Calculate total price on the backend
    let calculatedSubtotal = 0;
    const verifiedProducts = [];

    // Promise.all ବ୍ୟବହାର କରି ସବୁ ପ୍ରଡକ୍ଟ ର ଡାଟାବେସ୍ ପ୍ରାଇସ୍ ଚେକ୍ କରିବା
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
            price: dbProduct.originalPrice // ଫ୍ରଣ୍ଟଏଣ୍ଡ୍ ପ୍ରାଇସ୍ ବଦଳରେ ଡାଟାବେସ୍ ପ୍ରାଇସ୍ ସେଭ୍ କରନ୍ତୁ
        });
    }));

    // ୩. GST ଏବଂ Total ହିସାବ (ଉଦାହରଣ: 18% GST)
    // ଆପଣ ଆପଣଙ୍କର ଲଜିକ୍ ଅନୁସାରେ GST ହିସାବ ବଦଳାଇ ପାରିବେ (ଯେପରିକି ଆପଣଙ୍କ ଫଟୋରେ 42372 + 7628 = 50000 ଅଛି)
    const calculatedGst = Math.round(calculatedSubtotal * 0.18); 
    const finalTotalPrice = calculatedSubtotal + calculatedGst;

    // ୪. Order Payload ପ୍ରସ୍ତୁତ କରନ୍ତୁ
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
        paymentMethod: paymentMethod || "Cash on Delivery",
    };

    // ଯଦି ୟୁଜର୍ ଲଗିନ୍ ଅଛନ୍ତି (req.user ଥିଲେ), ତେବେ ତାଙ୍କ ID ଯୋଡନ୍ତୁ
    if (req.user && req.user.user_id) {
        orderPayload.user = req.user.user_id;
    }

    // ୫. ଡାଟାବେସ୍ ରେ ଅର୍ଡର ସେଭ୍ କରନ୍ତୁ
    const newOrder = await Order.create(orderPayload);

    const populatedOrder = await Order.findById(newOrder._id).populate({
        path: "products.product",
        select: "name" // କେବଳ ନାମ ଦରକାର
    });

    // ଏଠାରେ ଆପଣ ୟୁଜର୍ କୁ SMS କିମ୍ବା Email (Order Confirmation) ପଠାଇପାରିବେ

    return sendApiResponse(
        res, 
        statusCodes.CREATED, 
        "Order placed successfully!", 
        populatedOrder
    );
});

// ───────────── ୨. GET ALL ORDERS (Admin) ─────────────
const getAllOrders = asyncHandler(async (req, res) => {
    const orders = await Order.find()
        // .populate("user", "name email") 
        .populate({
            path: "products.product",
            select: "name" // କେବଳ ନାମ ଦରକାର
        })
        .sort({ createdAt: -1 })
        .lean()
        .exec();

    return sendApiResponse(res, statusCodes.OK, "All orders fetched successfully", orders);
});

// ───────────── UPDATE ORDER STATUS (Admin) ─────────────
const updateOrderStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    // Body ରୁ ଉଭୟ ଷ୍ଟାଟସ୍ ଆଣନ୍ତୁ
    const { orderStatus, paymentStatus } = req.body; 

    // ସଠିକ୍ enum ଭ୍ୟାଲୁ ଗୁଡିକର ତାଲିକା (Validation ପାଇଁ)
    const validOrderStatuses = ["pending", "processing", "shipped", "out_for_delivery", "delivered", "cancelled"];
    const validPaymentStatuses = ["pending", "completed", "failed"];

    // ଭ୍ୟାଲିଡେସନ୍ ଚେକ୍ (ଯଦି କେହି ଭୁଲ୍ ସ୍ପେଲିଂ ପଠାନ୍ତି)
    if (orderStatus && !validOrderStatuses.includes(orderStatus)) {
        return sendApiResponse(res, statusCodes.BAD_REQUEST, "Invalid order status provided.");
    }
    if (paymentStatus && !validPaymentStatuses.includes(paymentStatus)) {
        return sendApiResponse(res, statusCodes.BAD_REQUEST, "Invalid payment status provided.");
    }

    // ଡାଟାବେସ୍ ରୁ ଅର୍ଡର ଖୋଜନ୍ତୁ
    const order = await Order.findById(id);
    if (!order) {
        return sendApiResponse(res, statusCodes.NOT_FOUND, "Order not found");
    }

    // ଯଦି ନୂଆ ଷ୍ଟାଟସ୍ ଆସିଥାଏ, ତେବେ ତାହାକୁ ଅପଡେଟ୍ କରନ୍ତୁ
    if (orderStatus) {
        order.orderStatus = orderStatus;
    }
    if (paymentStatus) {
        order.paymentStatus = paymentStatus;
    }

    // [SMART LOGIC] ଯଦି ଅର୍ଡର ଟି ଡେଲିଭର୍ (delivered) ହୋଇଯାଏ ଏବଂ COD ଥାଏ, 
    // ତେବେ ଅଟୋମେଟିକ୍ ପେମେଣ୍ଟ୍ କୁ କମ୍ପ୍ଲିଟ୍ (completed) କରିଦିଅନ୍ତୁ
    if (order.orderStatus === "delivered" && order.paymentMethod === "cash_on_delivery") {
        order.paymentStatus = "completed";
    }

    // ଡାଟାବେସ୍ ରେ ସେଭ୍ କରନ୍ତୁ
    await order.save();

    return sendApiResponse(res, statusCodes.OK, "Order status updated successfully", order);
});

// ───────────── GET MY ORDERS (Logged-in customer) ─────────────
const getMyOrders = asyncHandler(async (req, res) => {
    // verifyToken middleware guarantees req.user exists on this route.
    const orders = await Order.find({ user: req.user.user_id })
        .populate({
            path: "products.product",
            select: "name"
        })
        .sort({ createdAt: -1 })
        .lean()
        .exec();

    return sendApiResponse(res, statusCodes.OK, "Orders fetched successfully", { orders });
});

module.exports = {
    placeOrder,
    getMyOrders,
    getAllOrders,
    updateOrderStatus
};
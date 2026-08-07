const { statusCodes } = require("../../config/statusCodes");
const { asyncHandler } = require("../../utils/asyncHandler");
const { sendApiResponse } = require("../../utils/responseUtils");
const Order = require("./order.model");
const Product = require("../product/product.model");
const User = require("../user/user.model");

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

    // ୨. Security Check: Calculate total price on the backend & Validate Stock
    let calculatedSubtotal = 0;
    const verifiedProducts = [];
    const stockUpdates = []; // ଷ୍ଟକ୍ ଅପଡେଟ୍ ଟ୍ରାକ୍ କରିବା ପାଇଁ

    // Promise.all ବଦଳରେ for...of ଲୁପ୍ ବ୍ୟବହାର କରିବା ଯାହାଦ୍ୱାରା ଷ୍ଟକ୍ ସରିଯାଇଥିଲେ ତୁରନ୍ତ Error ଦେଇପାରିବା
    for (const item of products) {
        const dbProduct = await Product.findById(item.product);
        
        if (!dbProduct) {
            return sendApiResponse(res, statusCodes.NOT_FOUND, `Product with ID ${item.product} not found.`);
        }

        // ଷ୍ଟକ୍ ଚେକ୍ କରିବା (Overselling ରୋକିବା ପାଇଁ)
        const requestedSizeStr = item.size ? item.size.toLowerCase().trim() : "free_size";
        const sizeData = dbProduct.sizes.find(s => s.sizeName === requestedSizeStr);

        if (!sizeData) {
            return sendApiResponse(res, statusCodes.BAD_REQUEST, `Size '${item.size}' is not available for ${dbProduct.name}.`);
        }

        // [NEW] ଯଦି ଗ୍ରାହକ ଷ୍ଟକ୍ ଠାରୁ ଅଧିକ ଅର୍ଡର କରୁଛନ୍ତି, ତେବେ ଅଟକାଇବା
        if (sizeData.stock < item.quantity) {
            return sendApiResponse(
                res, 
                statusCodes.BAD_REQUEST, 
                `Sorry, only ${sizeData.stock} units left for ${dbProduct.name} (Size: ${item.size}).`
            );
        }

        // କେଉଁ ପ୍ରଡକ୍ଟ ରୁ କେତେ ଷ୍ଟକ୍ କାଟିବାକୁ ହେବ ତାହା ସେଭ୍ କରିବା
        stockUpdates.push({
            productId: dbProduct._id,
            sizeName: requestedSizeStr,
            quantityToDeduct: item.quantity
        });

        const itemTotal = dbProduct.originalPrice * item.quantity;
        calculatedSubtotal += itemTotal;

        verifiedProducts.push({
            product: dbProduct._id,
            size: item.size,
            quantity: item.quantity,
            price: dbProduct.originalPrice // ଫ୍ରଣ୍ଟଏଣ୍ଡ୍ ପ୍ରାଇସ୍ ବଦଳରେ ଡାଟାବେସ୍ ପ୍ରାଇସ୍ ସେଭ୍ କରନ୍ତୁ
        });
    }

    // ୩. GST ଏବଂ Total ହିସାବ (ଉଦାହରଣ: 18% GST)
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
        paymentMethod: paymentMethod || "cash_on_delivery",
        // Seeds the tracking timeline with a real first entry the
        // moment the order exists, rather than starting empty.
        statusHistory: [{ status: "pending", timestamp: new Date() }],
    };

    // ଯଦି ୟୁଜର୍ ଲଗିନ୍ ଅଛନ୍ତି (req.user ଥିଲେ), ତେବେ ତାଙ୍କ ID ଯୋଡନ୍ତୁ
    if (req.user && req.user.user_id) {
        orderPayload.user = req.user.user_id;
    }

    // ୫. ଡାଟାବେସ୍ ରେ ଅର୍ଡର ସେଭ୍ କରନ୍ତୁ
    const newOrder = await Order.create(orderPayload);

    // [NEW] ୬. ଡାଟାବେସ୍ ରୁ ଷ୍ଟକ୍ କାଟିବା ($inc ବ୍ୟବହାର କରି)
    for (const update of stockUpdates) {
        await Product.updateOne(
            { _id: update.productId, "sizes.sizeName": update.sizeName },
            { $inc: { "sizes.$.stock": -update.quantityToDeduct } }
        );
    }

    const populatedOrder = await Order.findById(newOrder._id).populate({
        path: "products.product",
        select: "name" // କେବଳ ନାମ ଦରକାର
    });

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
    
    // [UPDATED] Body ରୁ ଉଭୟ ଷ୍ଟାଟସ୍ ଏବଂ ନୂଆ Tracking Details ଆଣନ୍ତୁ
    const { orderStatus, paymentStatus, awbNumber, courierName, estimatedDelivery } = req.body; 

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

    // ଯଦି ଅର୍ଡର କ୍ୟାନ୍ସଲ୍ (cancelled) ହେଉଛି ଏବଂ ଆଗରୁ କ୍ୟାନ୍ସଲ୍ ହୋଇନଥିଲା, ତେବେ ଷ୍ଟକ୍ ଫେରାଇବା
    if (orderStatus === "cancelled" && order.orderStatus !== "cancelled") {
        for (const item of order.products) {
            const requestedSizeStr = item.size ? item.size.toLowerCase().trim() : "free_size";
            await Product.updateOne(
                { _id: item.product, "sizes.sizeName": requestedSizeStr },
                { $inc: { "sizes.$.stock": item.quantity } } // ଯେତିକି କିଣିଥିଲେ ସେତିକି ଷ୍ଟକ୍ ରେ ଯୋଡିଦେବା
            );
        }
    }

    // ଯଦି ନୂଆ ଷ୍ଟାଟସ୍ ଆସିଥାଏ, ତେବେ ତାହାକୁ ଅପଡେଟ୍ କରନ୍ତୁ
    if (orderStatus) {
        order.orderStatus = orderStatus;
        order.statusHistory.push({ status: orderStatus, timestamp: new Date() });
    }
    if (paymentStatus) {
        order.paymentStatus = paymentStatus;
    }

    // [NEW] ଟ୍ରାକିଂ ଡିଟେଲ୍ସ ଅପଡେଟ୍ କରିବା (ଯଦି ରିକ୍ୱେଷ୍ଟ୍ ରେ ପଠାଯାଇଥାଏ)
    if (awbNumber !== undefined) order.awbNumber = awbNumber;
    if (courierName !== undefined) order.courierName = courierName;
    if (estimatedDelivery !== undefined) order.estimatedDelivery = estimatedDelivery;

    // [SMART LOGIC] ଯଦି ଅର୍ଡର ଟି ଡେଲିଭର୍ (delivered) ହୋଇଯାଏ ଏବଂ COD ଥାଏ, 
    // ତେବେ ଅଟୋମେଟିକ୍ ପେମେଣ୍ଟ୍ କୁ କମ୍ପ୍ଲିଟ୍ (completed) କରିଦିଅନ୍ତୁ
    if (order.orderStatus === "delivered" && order.paymentMethod === "cash_on_delivery") {
        order.paymentStatus = "completed";
    }

    // ଡାଟାବେସ୍ ରେ ସେଭ୍ କରନ୍ତୁ
    await order.save();

    return sendApiResponse(res, statusCodes.OK, "Order updated successfully", order);
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

// ───────────── LINK ORDER TO A JUST-VERIFIED ACCOUNT ─────────────
const linkOrderToUser = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const order = await Order.findById(id);
    if (!order) {
        return sendApiResponse(res, statusCodes.NOT_FOUND, "Order not found.");
    }

    const user = await User.findById(req.user.user_id);
    if (!user) {
        return sendApiResponse(res, statusCodes.NOT_FOUND, "Account not found.");
    }

    order.user = user._id;
    order.phone = user.phone;
    await order.save();

    return sendApiResponse(res, statusCodes.OK, "Order linked to your account.", order);
});

// ───────────── GET ORDER TRACKING ─────────────
const getOrderTracking = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // .lean() guarantees we get the full, raw JSON document 
    // .populate() ensures we get the product names for the "Items" card
    const order = await Order.findById(id).populate({
        path: "products.product"
    }).lean();

    if (!order) {
        return sendApiResponse(res, statusCodes.NOT_FOUND, "Order not found.");
    }

    if (order.user && order.user.toString() !== req.user.user_id) {
        return sendApiResponse(res, statusCodes.FORBIDDEN, "Not authorized.");
    }

    // Return the ENTIRE order object so Flutter has everything it needs
    return sendApiResponse(res, statusCodes.OK, "Tracking details fetched", order);
});

module.exports = {
    placeOrder,
    getMyOrders,
    linkOrderToUser,
    getAllOrders,
    updateOrderStatus,
    getOrderTracking
};
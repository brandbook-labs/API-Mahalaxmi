const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
    {
        // ଯଦି ୟୁଜର୍ ଲଗିନ୍ ଅଛନ୍ତି, ତେବେ ତାଙ୍କ ID ରହିବ (Guest checkout ପାଇଁ ଏହା optional ରଖାଯାଇଛି)
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            index: true,
        },
        
        // ───────────── Contact Details ─────────────
        name: {
            type: String,
            required: [true, "Full name is required"],
            trim: true,
        },
        phone: {
            type: String,
            required: [true, "Phone number is required"],
            match: [/^[0-9]{10}$/, "Please provide a valid 10-digit phone number"],
        },

        // ───────────── Shipping Address ─────────────
        shippingAddress: {
            flat: { type: String, required: true },
            area: { type: String, required: true },
            pincode: { type: String, required: true },
            city: { type: String, required: true },
            state: { type: String, required: true },
        },

        // ───────────── Cart Products ─────────────
        products: [
            {
                product: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Product",
                    required: true,
                },
                size: { type: String, required: true },
                quantity: { type: Number, required: true, min: 1 },
                price: { type: Number, required: true }, // ଅର୍ଡର ବେଳେ ପ୍ରଡକ୍ଟ ର ଦାମ୍ କଣ ଥିଲା (କାରଣ ଭବିଷ୍ୟତରେ ଦାମ୍ ବଦଳିପାରେ)
            }
        ],

        // ───────────── Pricing Summary ─────────────
        pricing: {
            subtotal: { type: Number, required: true },
            gst: { type: Number, required: true },
            totalPrice: { type: Number, required: true },
        },

        // ───────────── Payment & Status ─────────────
        paymentMethod: {
            type: String,
            enum: ["cash_on_delivery", "online"], 
            default: "cash_on_delivery",
        },
        paymentStatus: {
            type: String,
            enum: ["pending", "completed", "failed"],
            default: "pending",
        },
        orderStatus: {
            type: String,
            enum: ["pending", "processing", "shipped", "out_for_delivery", "delivered", "cancelled"],
            default: "pending",
        },

        // Set only for prepaid (paymentMethod: "online") orders, useful for
        // reconciling against your Razorpay dashboard later.
        razorpayPaymentId: {
            type: String,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
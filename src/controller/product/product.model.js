const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        slug: {
            type: String,
            unique: true,
            index: true
        },
        productImages: [
            {
                type: String,
                required: true,
            }
        ],
        // ମୁଖ୍ୟ ପ୍ରାଇସ୍
        mrp: {
            type: Number,
            required: true,
        },
        originalPrice: { 
            type: Number,
            required: true,
        },
        description: {
            type: String,
            // required: true,
        },
        
        // ───────────── Multiple Sizes & Inventory Handling ─────────────
        sizes: [
            {
                sizeName: { 
                    type: String, 
                    enum: ["xs", "s", "m", "l", "xl", "xxl", "free_size"], // URL friendly
                    required: true 
                },
                stock: { 
                    type: Number, 
                    required: true, 
                    default: 0,
                    min: 0 
                },
                // ଯଦି କୌଣସି ବିଶେଷ ସାଇଜ୍ ପାଇଁ ଅଧିକ ଦାମ୍ ଥାଏ (Optional)
                additionalPrice: { 
                    type: Number, 
                    default: 0 
                }
            }
        ],

        productDetails: {
            fabric: String,
            work: String,
            inclusions: String
        }, 
        
        // ───────────── Optimized Categories (Snake Case) ─────────────
        department: { 
            type: String,
            enum: ["women", "men", "kids", "unisex"],
            required: true,
            index: true, 
        },
        collectionType: { 
            type: [String],
            enum: ["festive_wears", "wedding_collections", "everyday_casuals", "accessories"],
            required: true,
            index: true,
        },
        curatedCollection: { 
            type: [String],
            enum: ["new_arrivals", "best_sellers", "trending"],
            index: true, 
        },
        productType: {
            type: String,
            // ଆପଣ ନିଜ ଇଚ୍ଛା ଅନୁସାରେ ଆହୁରି ଅପସନ୍ ଯୋଡି ପାରିବେ
            enum: ["saree", "lehenga", "suit_set", "coat", "jewelry", "bag", "footwear", "tshirt", "jeans"],
            required: true,
            index: true, // ୟୁଜର୍ କେବଳ 'saree' ସର୍ଚ୍ଚ କଲେ ଫାଷ୍ଟ୍ ରେଜଲ୍ଟ ଆସିବ
        },

        // ───────────── Rating Summary (Fast Homepage Load) ─────────────
        averageRating: {
            type: Number,
            default: 0,
            min: 0,
            max: 5,
        },
        totalReviews: {
            type: Number,
            default: 0,
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
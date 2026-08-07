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
        },
        
        // ───────────── [NEW] Video Support ─────────────
        videoUrl: {
            type: String
        },

        // ───────────── Multiple Sizes & Inventory Handling ─────────────
        // [UPDATED] ସବୁ ପ୍ରକାରର ସାଇଜ୍ କୁ ଗ୍ରହଣ କରିବା ପାଇଁ Enum କୁ ହଟାଗଲା
        sizes: [
            {
                sizeName: { 
                    type: String, 
                    required: true,
                    trim: true,
                    lowercase: true, 
                    // ଉଦାହରଣ: "s", "m", "xl", "28", "30", "uk_7", "ring_14", "free_size"
                },
                stock: { 
                    type: Number, 
                    required: true, 
                    default: 0,
                    min: 0 
                },
                additionalPrice: { 
                    type: Number, 
                    default: 0 
                }
            }
        ],

        // [NEW] ଏହି ଫିଲ୍ଡ ଆମକୁ ଜଣାଇବ ଯେ ସାଇଜ୍ ଚାର୍ଟ (Size Chart) କିପରି ଦେଖାଇବାକୁ ହେବ
        // ଉଦାହରଣ: 'clothing' ପାଇଁ S, M, L... 'waist' ପାଇଁ 28, 30... 'footwear' ପାଇଁ UK 7, 8...
        sizeType: {
            type: String,
            enum: ["clothing", "waist", "footwear", "ring", "none"],
            default: "clothing"
        },

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
        
        // [UPDATED] Product Type ରେ ଆହୁରି ଅନେକ ବିକଳ୍ପ ଯୋଡାଗଲା
        productType: {
            type: String,
            enum: [
                // Indian Wear
                "saree", "lehenga", "suit_set", "kurta", "dupatta", 
                // Western Wear
                "tshirt", "jeans", "trouser", "shirt", "top", "dress", "coat", "jacket",
                // Accessories
                "Jewellery", "bag", "footwear", "watch", "perfume", "belt",
                // Other
                "other"
            ],
            required: true,
            index: true,
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
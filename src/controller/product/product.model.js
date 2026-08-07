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
        // ───────────── [NEW] Product Lifecycle Status ─────────────
        status: {
            type: String,
            enum: ['active', 'draft'],
            default: 'active'
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
        
        videoUrl: {
            type: String
        },

        // ───────────── Multiple Sizes & Inventory Handling ─────────────
        sizes: [
            {
                sizeName: { 
                    type: String, 
                    required: true,
                    trim: true,
                    lowercase: true, 
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

        sizeType: {
            type: String,
            enum: ["clothing", "waist", "footwear", "ring", "none"],
            default: "clothing"
        },

        productDetails: {
            fabric: String,
            work: String,
            inclusions: String,
            washCare: String // [NEW] Added WashCare
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
            enum: [
                "saree", "lehenga", "suit_set", "kurta", "dupatta", 
                "tshirt", "jeans", "trouser", "shirt", "top", "dress", "coat", "jacket",
                "Jewellery", "bag", "footwear", "watch", "perfume", "belt",
                "other"
            ],
            required: true,
            index: true,
        },

        // ───────────── [NEW] Smart Taxonomies & Search Engine Tags ─────────────
        occasions: {
            type: [String],
            index: true
        },
        colors: {
            type: [String],
            index: true
        },
        tags: {
            type: [String],
            index: true // Helps with fast text-search filtering
        },

        // ───────────── [NEW] Logistics & Tax ─────────────
        shipping: {
            weightGm: { type: Number },
            hsnCode: { type: String }
        },

        // ───────────── [NEW] SEO Optimization ─────────────
        seo: {
            metaTitle: { type: String },
            metaDescription: { type: String },
            slug: { type: String }
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
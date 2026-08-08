const { statusCodes } = require("../../config/statusCodes");
const { asyncHandler } = require("../../utils/asyncHandler");
const { sendApiResponse } = require("../../utils/responseUtils");
const Product = require("./product.model");
const safeParse = require("../../utils/safeParse");
const { sharpCompressToSize } = require('../../utils/sharpCompressToSize');
const { handleImageUpload } = require('../../cloudflare/r2Service'); 
const { generateUniqueSlug } = require("../../utils/slug-helper");

/**
 * MRP (the struck-through "compare at" price) must never be lower than
 * the actual selling price, that would show a customer an inflated
 * price with no real discount, or worse, a strikethrough number below
 * what they're being asked to pay. This guarantees the two always come
 * out the right way round in the database itself, regardless of which
 * box a number was typed into on the way in, the whole system, admin
 * table and customer app alike, only ever has to trust one source of
 * truth for this.
 */
const normalizePricing = (mrp, originalPrice) => {
    const higher = Math.max(mrp, originalPrice);
    const lower = Math.min(mrp, originalPrice);
    return { mrp: higher, originalPrice: lower };
};

// ───────────── 1. ADD PRODUCT (Admin Only) ─────────────
const AddProductByAdmin = asyncHandler(async (req, res) => {
    // [UPDATED] Extracted new smart fields: status
    const { name, mrp, originalPrice, description, department, collectionType, curatedCollection, productType, sizeType, videoUrl, status } = req.body;

    if (!name || !mrp || !originalPrice) {
        return sendApiResponse(res, statusCodes.BAD_REQUEST, "Name, MRP, and Original Price are required.");
    }

    // [NEW] Parse SEO to extract slug if frontend sent it via the new SEO block
    const parsedSeo = safeParse(req.body.seo, {});

    // 1️⃣ Generate slug from slug or name (Prioritize new SEO slug)
    const slugSource = parsedSeo.slug || req.body.slug || name;

    if (!slugSource) {
        return sendApiResponse(
            res,
            statusCodes.BAD_REQUEST,
            "Product name or slug is required" 
        );
    }

    const slug = await generateUniqueSlug(Product, slugSource);

    // JSON String କୁ Object ରେ ପରିଣତ କରିବା ପାଇଁ safeParse ର ବ୍ୟବହାର 
    const { mrp: normalizedMrp, originalPrice: normalizedOriginalPrice } =
        normalizePricing(Number(mrp), Number(originalPrice));

    const payload = {
        name,
        slug,
        mrp: normalizedMrp,
        originalPrice: normalizedOriginalPrice,
        description,
        department,
        productType,
        sizeType: sizeType || "clothing", 
        videoUrl: videoUrl || null,
        status: status || 'active', // [NEW] Smart Status Added
        collectionType: safeParse(req.body.collectionType, []),
        curatedCollection: safeParse(req.body.curatedCollection, []),
        // [NEW] Smart Tags & Logistics Added Below
        occasions: safeParse(req.body.occasions, []),
        colors: safeParse(req.body.colors, []),
        tags: safeParse(req.body.tags, []),
        shipping: safeParse(req.body.shipping, {}),
        seo: parsedSeo,
        // ----------------------------------------
        sizes: safeParse(req.body.sizes, []), 
        productDetails: safeParse(req.body.productDetails, {}),
    };

    // Handle images
    if (req.files && req.files.length > 0) {
        try {
            const uploadPromises = req.files.map(async (file) => {
                const optimizedBuffer = await sharpCompressToSize(file.buffer, 50 * 1024); 

                const compressedFile = {
                    ...file,
                    buffer: optimizedBuffer,
                    mimetype: 'image/webp',
                    originalname: file.originalname.replace(/\.[^/.]+$/, "") + `_${Date.now()}.webp` 
                };

                return await handleImageUpload(compressedFile);
            });

            payload.productImages = await Promise.all(uploadPromises);

        } catch (error) {
            console.error("Multiple Image optimization or upload failed:", error);
            return sendApiResponse(res, statusCodes.INTERNAL_SERVER_ERROR, "Image optimization or upload failed");
        }
    }

    // ଡାଟାବେସ୍ ରେ ସେଭ୍ କରିବା
    const product = await Product.create(payload);

    return sendApiResponse(res, statusCodes.CREATED, "Product added successfully!", product);
});

// ───────────── 2. GET ALL PRODUCTS (Public/Users) ─────────────
const GetAllProducts = asyncHandler(async (req, res) => {
    const { 
        department, 
        collectionType, 
        curatedCollection, 
        productType, 
        search, 
        sort,
        page = 1,    
        limit = 12   
    } = req.query;

    let query = {};
    if (department) query.department = department;
    if (collectionType) query.collectionType = collectionType;
    if (curatedCollection) query.curatedCollection = curatedCollection;
    if (productType) query.productType = productType;

    // A real customer (no valid admin token) only ever sees published
    // products, this can't be bypassed by passing a status query param,
    // that's ignored entirely here. A signed-in admin (req.user set by
    // optionalAuth) sees everything, drafts included, so the product
    // table in the admin panel keeps working exactly as it does today.
    if (!req.user) {
        query.status = "active";
    }

    if (search) {
        query.name = { $regex: search, $options: "i" }; 
    }

    let sortOption = { createdAt: -1 };
    if (sort === "price_low") sortOption = { originalPrice: 1 };
    if (sort === "price_high") sortOption = { originalPrice: -1 };

    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const skip = (pageNumber - 1) * limitNumber; 

    const [totalProducts, products] = await Promise.all([
        Product.countDocuments(query),
        Product.find(query)
            .sort(sortOption)
            .skip(skip)          
            .limit(limitNumber)  
            .lean()
            .exec()
    ]);

    const totalPages = Math.ceil(totalProducts / limitNumber);

    const responseData = {
        pagination: {
            totalProducts,
            totalPages,
            currentPage: pageNumber,
            limit: limitNumber
        },
        products
    };

    return sendApiResponse(res, statusCodes.OK, "Products fetched successfully!", responseData);
});

// ───────────── 3. GET SINGLE PRODUCT (Public/Users) ─────────────
const GetProductById = asyncHandler(async (req, res) => {
    const { slug } = req.params;

    const product = await Product.findOne({ slug }).lean().exec();

    if (!product) {
        return sendApiResponse(res, statusCodes.NOT_FOUND, "Product not found.");
    }

    // Same rule as the listing endpoint: a draft is invisible to anyone
    // without a valid admin token, even with the direct link in hand,
    // not just hidden from search and category browsing.
    if (product.status === "draft" && !req.user) {
        return sendApiResponse(res, statusCodes.NOT_FOUND, "Product not found.");
    }

    return sendApiResponse(res, statusCodes.OK, "Product details fetched!", product);
});

// ───────────── 4. UPDATE PRODUCT (Admin Only) ─────────────
const UpdateProductByAdmin = asyncHandler(async (req, res) => {
    const { id } = req.params; 

    const existingProduct = await Product.findById(id);
    if (!existingProduct) {
        return sendApiResponse(res, statusCodes.NOT_FOUND, "Product not found.");
    }

    // [UPDATED] Extracted status from req.body
    const { name, mrp, originalPrice, description, department, collectionType, curatedCollection, productType, sizeType, slug: customSlug, videoUrl, status } = req.body;

    const updatePayload = {};

    // [NEW] Extract slug from new SEO object if provided
    const parsedSeo = req.body.seo !== undefined ? safeParse(req.body.seo, {}) : null;
    const smartSlugSource = parsedSeo?.slug || customSlug;

    if (name) {
        updatePayload.name = name;
        const slugSource = smartSlugSource || name;
        if (slugSource !== existingProduct.name && slugSource !== existingProduct.slug) {
            updatePayload.slug = await generateUniqueSlug(Product, slugSource, id); 
        }
    } else if (smartSlugSource) {
        if (smartSlugSource !== existingProduct.slug) {
            updatePayload.slug = await generateUniqueSlug(Product, smartSlugSource, id);
        }
    }

    // Same normalization as creation: whichever number is higher always
    // ends up as mrp, whichever is lower always ends up as
    // originalPrice, so an edit can never accidentally invert them.
    if (mrp !== undefined || originalPrice !== undefined) {
        const effectiveMrp = mrp !== undefined ? Number(mrp) : existingProduct.mrp;
        const effectiveOriginalPrice =
            originalPrice !== undefined ? Number(originalPrice) : existingProduct.originalPrice;
        const normalized = normalizePricing(effectiveMrp, effectiveOriginalPrice);
        updatePayload.mrp = normalized.mrp;
        updatePayload.originalPrice = normalized.originalPrice;
    }

    if (description !== undefined) updatePayload.description = description;
    if (department !== undefined) updatePayload.department = department;
    if (productType !== undefined) updatePayload.productType = productType;
    if (sizeType !== undefined) updatePayload.sizeType = sizeType; 
    
    if (videoUrl !== undefined) updatePayload.videoUrl = videoUrl;
    if (status !== undefined) updatePayload.status = status; // [NEW]

    if (req.body.collectionType !== undefined) updatePayload.collectionType = safeParse(req.body.collectionType, []);
    if (req.body.curatedCollection !== undefined) updatePayload.curatedCollection = safeParse(req.body.curatedCollection, []);
    
    // [NEW] Apply Smart Categories/Tags
    if (req.body.occasions !== undefined) updatePayload.occasions = safeParse(req.body.occasions, []);
    if (req.body.colors !== undefined) updatePayload.colors = safeParse(req.body.colors, []);
    if (req.body.tags !== undefined) updatePayload.tags = safeParse(req.body.tags, []);
    if (req.body.shipping !== undefined) updatePayload.shipping = safeParse(req.body.shipping, {});
    if (parsedSeo !== null) updatePayload.seo = parsedSeo;

    if (req.body.sizes !== undefined) updatePayload.sizes = safeParse(req.body.sizes, []);
    if (req.body.productDetails !== undefined) updatePayload.productDetails = safeParse(req.body.productDetails, {});

    // ───────────── [NEW BULLETPROOF] SMART IMAGE HANDLING ─────────────
    let finalImages = [];
    let retainedImages = [];

    // ୧. ବ୍ୟାକେଣ୍ଡ୍ କୁ ଆସିଥିବା ଲିଙ୍କ୍ କୁ ସଠିକ୍ ଭାବେ Array ରେ ପରିଣତ କରିବା
    if (req.body.productImages !== undefined) {
        const incomingImages = req.body.productImages;
        
        if (Array.isArray(incomingImages)) {
            retainedImages = incomingImages; 
        } else if (typeof incomingImages === 'string') {
            if (incomingImages.trim() === '') {
                retainedImages = []; 
            } else {
                retainedImages = [incomingImages]; 
            }
        }
    } else if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
        retainedImages = [];
    } else {
        retainedImages = [...existingProduct.productImages];
    }

    // ୨. ବାହାର କରନ୍ତୁ କେଉଁ ଫଟୋ ଗୁଡିକ UI ରୁ କଟାଯାଇଛି (ଯାହାକୁ ୟୁଜର୍ X ମାରିଛନ୍ତି)
    const imagesToDelete = existingProduct.productImages.filter(
        oldImgUrl => !retainedImages.includes(oldImgUrl)
    );

    // ୩. କେବଳ ସେହି କଟାଯାଇଥିବା ଫଟୋ ଗୁଡିକୁ R2 ରୁ ପରମାନେଣ୍ଟ୍ ଡିଲିଟ୍ କରିବା
    if (imagesToDelete.length > 0) {
        try {
            await handleImageUpload(null, imagesToDelete);
            console.log("Successfully deleted SPECIFIC old images from R2:", imagesToDelete);
        } catch (error) {
            console.error("Error deleting old images from Cloudflare R2:", error);
        }
    }

    // ୪. ଯାହା ବଳିଲା ତାକୁ finalImages ରେ ରଖିବା
    finalImages = [...retainedImages];

    // ୫. ନୂଆ ଅପଲୋଡ୍ ହୋଇଥିବା ଫଟୋ ଗୁଡିକୁ R2 କୁ ପଠାଇ ମିଶାଇବା
    if (req.files && req.files.length > 0) {
        try {
            const uploadPromises = req.files.map(async (file) => {
                const optimizedBuffer = await sharpCompressToSize(file.buffer, 50 * 1024); 

                const compressedFile = {
                    ...file,
                    buffer: optimizedBuffer,
                    mimetype: 'image/webp',
                    originalname: file.originalname.replace(/\.[^/.]+$/, "") + `_${Date.now()}.webp` 
                };

                return await handleImageUpload(compressedFile);
            });

            const newUploadedImages = await Promise.all(uploadPromises);
            finalImages = [...finalImages, ...newUploadedImages];

        } catch (error) {
            console.error("Multiple Image optimization or upload failed during update:", error);
            return sendApiResponse(res, statusCodes.INTERNAL_SERVER_ERROR, "Image optimization or upload failed");
        }
    }

    // ଅପଡେଟ୍ ପେଲୋଡ୍ ରେ ଫାଇନାଲ୍ ଇମେଜ୍ ଆରେ କୁ ସେଭ୍ କରିବା
    updatePayload.productImages = finalImages;

    // ───────────── ଡାଟାବେସ୍ ଅପଡେଟ୍ ─────────────
    const updatedProduct = await Product.findByIdAndUpdate(id, updatePayload, { 
        new: true, 
        runValidators: true 
    });

    return sendApiResponse(res, statusCodes.OK, "Product updated successfully!", updatedProduct);
});

// ───────────── 5. DELETE PRODUCT (Admin Only) ─────────────
const DeleteProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const product = await Product.findByIdAndDelete(id);

    if (!product) {
        return sendApiResponse(res, statusCodes.NOT_FOUND, "Product not found.");
    }

    if (product.productImages) {
        try {
            await handleImageUpload(null, product.productImages);
        } catch (error) {
            console.error("Error deleting image from Cloudflare R2: ", error);
        }
    }
    
    return sendApiResponse(res, statusCodes.OK, "Product deleted successfully!");
});

module.exports = {
    AddProductByAdmin,
    GetAllProducts,
    GetProductById,
    DeleteProduct,
    UpdateProductByAdmin
};
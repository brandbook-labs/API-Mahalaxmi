const { statusCodes } = require("../../config/statusCodes");
const { asyncHandler } = require("../../utils/asyncHandler");
const { sendApiResponse } = require("../../utils/responseUtils");
const Product = require("./product.model");
const safeParse = require("../../utils/safeParse");
const { sharpCompressToSize } = require('../../utils/sharpCompressToSize');
const { handleImageUpload } = require('../../cloudflare/r2Service'); 
const { generateUniqueSlug } = require("../../utils/slug-helper");

// ───────────── 1. ADD PRODUCT (Admin Only) ─────────────
const AddProductByAdmin = asyncHandler(async (req, res) => {
    const { name, mrp, originalPrice, description, department, collectionType, curatedCollection, productType, sizeType } = req.body;

    if (!name || !mrp || !originalPrice) {
        return sendApiResponse(res, statusCodes.BAD_REQUEST, "Name, MRP, and Original Price are required.");
    }

    // 1️⃣ Generate slug from slug or name
    const slugSource = req.body.slug || name;

    if (!slugSource) {
        return sendApiResponse(
            res,
            statusCodes.BAD_REQUEST,
            "Product name or slug is required" // [FIXED] Clinic ବଦଳରେ Product ଲେଖାଗଲା
        );
    }

    const slug = await generateUniqueSlug(Product, slugSource);

    // JSON String କୁ Object ରେ ପରିଣତ କରିବା ପାଇଁ safeParse ର ବ୍ୟବହାର 
    const payload = {
        name,
        slug,
        mrp: Number(mrp),
        originalPrice: Number(originalPrice),
        description,
        department,
        productType,
        sizeType: sizeType || "clothing", // [NEW] ଡାଟାବେସ୍ ରେ sizeType ସେଭ୍ କରିବା ପାଇଁ
        collectionType: safeParse(req.body.collectionType, []),
        curatedCollection: safeParse(req.body.curatedCollection, []),
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

    return sendApiResponse(res, statusCodes.OK, "Product details fetched!", product);
});

// ───────────── 4. UPDATE PRODUCT (Admin Only) ─────────────
const UpdateProductByAdmin = asyncHandler(async (req, res) => {
    const { id } = req.params; 

    const existingProduct = await Product.findById(id);
    if (!existingProduct) {
        return sendApiResponse(res, statusCodes.NOT_FOUND, "Product not found.");
    }

    const { name, mrp, originalPrice, description, department, collectionType, curatedCollection, productType, sizeType, slug: customSlug } = req.body;

    const updatePayload = {};

    if (name) {
        updatePayload.name = name;
        const slugSource = customSlug || name;
        if (slugSource !== existingProduct.name && slugSource !== existingProduct.slug) {
            updatePayload.slug = await generateUniqueSlug(Product, slugSource, id); 
        }
    } else if (customSlug) {
        updatePayload.slug = await generateUniqueSlug(Product, customSlug, id);
    }

    if (originalPrice !== undefined) updatePayload.originalPrice = Number(originalPrice);
    if (mrp !== undefined) {
        updatePayload.mrp = Number(mrp);
    } else if (originalPrice !== undefined && !existingProduct.mrp) {
        updatePayload.mrp = Number(originalPrice);
    }

    if (description !== undefined) updatePayload.description = description;
    if (department !== undefined) updatePayload.department = department;
    if (productType !== undefined) updatePayload.productType = productType;
    if (sizeType !== undefined) updatePayload.sizeType = sizeType; 

    if (req.body.collectionType !== undefined) updatePayload.collectionType = safeParse(req.body.collectionType, []);
    if (req.body.curatedCollection !== undefined) updatePayload.curatedCollection = safeParse(req.body.curatedCollection, []);
    if (req.body.sizes !== undefined) updatePayload.sizes = safeParse(req.body.sizes, []);
    if (req.body.productDetails !== undefined) updatePayload.productDetails = safeParse(req.body.productDetails, {});

    // ───────────── [NEW BULLETPROOF] SMART IMAGE HANDLING ─────────────
    let finalImages = [];
    let retainedImages = [];

    // ୧. ବ୍ୟାକେଣ୍ଡ୍ କୁ ଆସିଥିବା ଲିଙ୍କ୍ କୁ ସଠିକ୍ ଭାବେ Array ରେ ପରିଣତ କରିବା
    if (req.body.productImages !== undefined) {
        const incomingImages = req.body.productImages;
        
        if (Array.isArray(incomingImages)) {
            // ଏକାଧିକ ଲିଙ୍କ୍ ଆସିଲେ ଏହା Array ହୋଇଥାଏ
            retainedImages = incomingImages; 
        } else if (typeof incomingImages === 'string') {
            // ଗୋଟିଏ ଲିଙ୍କ୍ କିମ୍ବା ଖାଲି ଷ୍ଟ୍ରିଙ୍ଗ୍ ଆସିଲେ
            if (incomingImages.trim() === '') {
                retainedImages = []; 
            } else {
                retainedImages = [incomingImages]; 
            }
        }
    } else if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
        // ଯଦି FormData ଆସିଛି କିନ୍ତୁ productImages ଆସିନାହିଁ, ଏହାର ଅର୍ଥ UI ରୁ ସବୁ ପୁରୁଣା ଫଟୋ Remove କରାଯାଇଛି
        retainedImages = [];
    } else {
        // ଯଦି କେବଳ JSON ଅପଡେଟ୍ ହେଉଛି, ତେବେ ପୁରୁଣା ଫଟୋ ଗୁଡିକୁ ସୁରକ୍ଷିତ ରଖିବା
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
            // [FIXED] 'କ୍ଲିନିକ୍' ବଦଳରେ 'ପ୍ରଡକ୍ଟ' ଲେଖାଗଲା
            // ଇମେଜ୍ ଡିଲିଟ୍ ରେ ଛୋଟ ଏରର୍ ଆସିଲେ ବି ପ୍ରଡକ୍ଟ ଡିଲିଟ୍ ପ୍ରୋସେସ୍ ଅଟକିବ ନାହିଁ
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
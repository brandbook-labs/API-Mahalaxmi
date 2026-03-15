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
    // const { role } = req.user;  

    // if (!["super_admin", "admin", "owner"].includes(role)) {
    //     return sendApiResponse(res, statusCodes.FORBIDDEN, "You are not authorized to add a product.");
    // }

    const { name, mrp, originalPrice, description, department, collectionType, curatedCollection, productType } = req.body;

    if (!name || !mrp || !originalPrice) {
        return sendApiResponse(res, statusCodes.BAD_REQUEST, "Name, MRP, and Original Price are required.");
    }

    // 1️⃣ Generate slug from slug or name
    const slugSource = req.body.slug || name;

    if (!slugSource) {
        return sendApiResponse(
            res,
            statusCodes.BAD_REQUEST,
            "Clinic name or slug is required"
        );
    }

    const slug = await generateUniqueSlug(Product, slugSource);

    // JSON String କୁ Object ରେ ପରିଣତ କରିବା ପାଇଁ safeParse ର ବ୍ୟବହାର 
    // (କାରଣ FormData ରେ array/object string ହୋଇ ଆସେ)
    const payload = {
        name,
        slug,
        mrp: Number(mrp),
        originalPrice: Number(originalPrice),
        description,
        department,
        productType,
        collectionType: safeParse(req.body.collectionType, []),
        curatedCollection: safeParse(req.body.curatedCollection, []),
        sizes: safeParse(req.body.sizes, []), 
        productDetails: safeParse(req.body.productDetails, {}),
    };

    // ଇମେଜ୍ ଅପଲୋଡ୍ (Multiple Images)
    // if (req.files && req.files.length > 0) {
    //     try {
    //         // Promise.all() ବ୍ୟବହାର କରି ସବୁ ଇମେଜ୍ କୁ ଏକାସାଙ୍ଗରେ (parallel) ପ୍ରୋସେସ୍ କରିବା
    //         const uploadPromises = req.files.map(async (file) => {
    //             // ପ୍ରଡକ୍ଟ ଇମେଜ୍ ଟିକେ କ୍ଲିୟର୍ ଦରକାର, ତେଣୁ 20KB ବଦଳରେ 50KB-100KB ଭିତରେ ରଖିବା ଭଲ
    //             const optimizedBuffer = await sharpCompressToSize(file.buffer, 50 * 1024); 

    //             const compressedFile = {
    //                 ...file,
    //                 buffer: optimizedBuffer,
    //                 mimetype: 'image/webp',
    //                 originalname: file.originalname.replace(/\.[^/.]+$/, "") + `_${Date.now()}.webp` 
    //             };

    //             return await handleImageUpload(compressedFile);
    //         });

    //         // ସବୁ ଇମେଜ୍ ଅପଲୋଡ୍ ହେବା ପରେ URL ଗୁଡିକୁ ଆଣିବା
    //         payload.productImages = await Promise.all(uploadPromises);

    //     } catch (error) {
    //         console.error("Multiple Image optimization or upload failed:", error);
    //         return sendApiResponse(res, statusCodes.INTERNAL_SERVER_ERROR, "Image optimization or upload failed");
    //     }
    // } else {
    //     return sendApiResponse(res, statusCodes.BAD_REQUEST, "At least one product image is required.");
    // }

    // ଡାଟାବେସ୍ ରେ ସେଭ୍ କରିବା
    const product = await Product.create(payload);

    return sendApiResponse(res, statusCodes.CREATED, "Product added successfully!", product);
});

// ───────────── 2. GET ALL PRODUCTS (Public/Users) ─────────────
const GetAllProducts = asyncHandler(async (req, res) => {
    // ୧. page ଏବଂ limit କୁ କ୍ୱେରୀରୁ ଆଣନ୍ତୁ (ଡିଫଲ୍ଟ ଭାବରେ page=1 ଏବଂ limit=12 ରଖାଯାଇଛି)
    const { 
        department, 
        collectionType, 
        curatedCollection, 
        productType, 
        search, 
        sort,
        page = 1,     // [NEW]
        limit = 12    // [NEW]
    } = req.query;

    // ଫିଲ୍ଟର୍ ଲଜିକ୍ (Filter Logic)
    let query = {};
    if (department) query.department = department;
    if (collectionType) query.collectionType = collectionType;
    if (curatedCollection) query.curatedCollection = curatedCollection;
    if (productType) query.productType = productType;
    
    // ସର୍ଚ୍ଚ ଲଜିକ୍ (Search by Name)
    if (search) {
        query.name = { $regex: search, $options: "i" }; // Case-insensitive search
    }

    // ସର୍ଟିଂ ଲଜିକ୍ (Sorting) - ନୂଆ ପ୍ରଡକ୍ଟ ପ୍ରଥମେ ଆସିବ
    let sortOption = { createdAt: -1 };
    if (sort === "price_low") sortOption = { originalPrice: 1 };
    if (sort === "price_high") sortOption = { originalPrice: -1 };

    // ୨. Pagination ଗଣନା (Math)
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const skip = (pageNumber - 1) * limitNumber; // କେତୋଟି ପ୍ରଡକ୍ଟ ଛାଡିବେ ତାର ହିସାବ

    // ୩. Super Fast Parallel Execution (Promise.all)
    const [totalProducts, products] = await Promise.all([
        // ପ୍ରଥମ କ୍ୱେରୀ: ଫିଲ୍ଟର୍ ଅନୁସାରେ ମୋଟ କେତେ ପ୍ରଡକ୍ଟ ଅଛି ତାହା ଗଣିବ
        Product.countDocuments(query),
        
        // ଦ୍ଵିତୀୟ କ୍ୱେରୀ: କେବଳ ଦରକାର ଥିବା ଲିମିଟ୍ ପ୍ରଡକ୍ଟ ଆଣିବ
        Product.find(query)
            .sort(sortOption)
            .skip(skip)           // [NEW] ପୂର୍ବ ପେଜ୍ ର ଡାଟା ଛାଡିବା ପାଇଁ
            .limit(limitNumber)   // [NEW] କେବଳ ୧୨ଟି ଡାଟା ଆଣିବା ପାଇଁ
            .lean()
            .exec()
    ]);

    // ୪. ସମୁଦାୟ ପେଜ୍ (Total Pages) ବାହାର କରିବା
    const totalPages = Math.ceil(totalProducts / limitNumber);

    // ୫. ରେସ୍ପୋନ୍ସ (Response) କୁ ସଠିକ୍ ଢାଞ୍ଚାରେ ସଜାଇବା
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

    const product = await Product.findOne(slug).lean().exec();

    if (!product) {
        return sendApiResponse(res, statusCodes.NOT_FOUND, "Product not found.");
    }

    return sendApiResponse(res, statusCodes.OK, "Product details fetched!", product);
});

// ───────────── 4. DELETE PRODUCT (Admin Only) ─────────────
const DeleteProduct = asyncHandler(async (req, res) => {
    // const { role } = req.user;

    // if (!["super_admin", "admin", "owner"].includes(role)) {
    //     return sendApiResponse(res, statusCodes.FORBIDDEN, "Unauthorized to delete product.");
    // }

    const { id } = req.params;
    const product = await Product.findByIdAndDelete(id);

    if (!product) {
        return sendApiResponse(res, statusCodes.NOT_FOUND, "Product not found.");
    }

    // if (product.productImages) {
    //     try {
    //         await handleImageUpload(null, product.productImages);
    //     } catch (error) {
    //         console.error("Error deleting image from Cloudflare R2: ", error);
    //         // ଇମେଜ୍ ଡିଲିଟ୍ ରେ ଛୋଟ ଏରର୍ ଆସିଲେ ବି କ୍ଲିନିକ୍ ଡିଲିଟ୍ ପ୍ରୋସେସ୍ ଅଟକିବ ନାହିଁ
    //     }
    // }
    
    return sendApiResponse(res, statusCodes.OK, "Product deleted successfully!");
});

module.exports = {
    AddProductByAdmin,
    GetAllProducts,
    GetProductById,
    DeleteProduct
};
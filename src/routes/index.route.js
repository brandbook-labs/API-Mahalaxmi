const express = require("express");
const router = express.Router();

// ସମସ୍ତ ବିଭାଗର ରାଉଟ୍ ଗୁଡିକୁ ଇମ୍ପୋର୍ଟ କରନ୍ତୁ
const adminRoutes = require("../controller/admin/admin.routes");
const productRoutes = require("../controller/product/product.route");
const orderRoutes = require("../controller/order/order.routes");
const authRoutes = require("../controller/auth/auth.routes");
const paymentRoutes = require("../controller/payment/payment.routes");
const userRoutes = require("../controller/user/user.routes");
const productCategoryRoutes = require("../controller/product-category/product-category.routes");
const faqRoutes = require("../controller/faq/faq.routes");
const contactInfoRoutes = require("../controller/contact-info/contact-info.routes");
const legalRoutes = require("../controller/legal/legal.routes");

// API Versioning (ବେଷ୍ଟ୍ ପ୍ରାକ୍ଟିସ୍)
const API_VERSION = "/api/v1";

// ରାଉଟ୍ ଗୁଡିକୁ ନିଜ ନିଜ ପାଥ୍ (path) ସହିତ କନେକ୍ଟ କରନ୍ତୁ
router.use(`${API_VERSION}/admin`, adminRoutes);
router.use(`${API_VERSION}/products`, productRoutes);
router.use(`${API_VERSION}/order`, orderRoutes);
router.use(`${API_VERSION}/auth`, authRoutes);
router.use(`${API_VERSION}/payment`, paymentRoutes);
router.use(`${API_VERSION}/user`, userRoutes);
router.use(`${API_VERSION}/product-categories`, productCategoryRoutes);
router.use(`${API_VERSION}/faqs`, faqRoutes);
router.use(`${API_VERSION}/contact-info`, contactInfoRoutes);
router.use(`${API_VERSION}/legal`, legalRoutes);

// Health Check Route (ସର୍ଭର ଚାଲୁଛି କି ନାହିଁ ଜାଣିବା ପାଇଁ)
router.get("/health", (req, res) => {
    res.status(200).json({ status: "success", message: "Server is running perfectly!" });
});

module.exports = router;
const express = require("express");
const router = express.Router();

// ସମସ୍ତ ବିଭାଗର ରାଉଟ୍ ଗୁଡିକୁ ଇମ୍ପୋର୍ଟ କରନ୍ତୁ
// const adminRoutes = require("./admin.routes");
const productRoutes = require("../controller/product/product.route");

// API Versioning (ବେଷ୍ଟ୍ ପ୍ରାକ୍ଟିସ୍)
const API_VERSION = "/api/v1";

// ରାଉଟ୍ ଗୁଡିକୁ ନିଜ ନିଜ ପାଥ୍ (path) ସହିତ କନେକ୍ଟ କରନ୍ତୁ
// router.use(`${API_VERSION}/admin`, adminRoutes);
router.use(`${API_VERSION}/products`, productRoutes);

// Health Check Route (ସର୍ଭର ଚାଲୁଛି କି ନାହିଁ ଜାଣିବା ପାଇଁ)
router.get("/health", (req, res) => {
    res.status(200).json({ status: "success", message: "Server is running perfectly!" });
});

module.exports = router;
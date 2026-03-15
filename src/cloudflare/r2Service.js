const { S3Client, PutObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const path = require("path");
const crypto = require("crypto");
require("dotenv").config();

// Cloudflare R2 Client Setup
const r2Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME;
const PUBLIC_URL_BASE = process.env.R2_PUBLIC_URL || "https://pub-6d3def983c7f486ea73eb71a460afd9a.r2.dev"; 

// Helper Function: ଇମେଜ୍ ଡିଲିଟ୍ କରିବା ପାଇଁ
const deleteImageFromR2 = async (imageUrl) => {
  try {
    if (!imageUrl) return;
    const imageKey = imageUrl.split('/').pop(); 
    
    if (imageKey) {
      const deleteCommand = new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: imageKey,
      });
      await r2Client.send(deleteCommand);
      console.log(`[R2] Deleted old image: ${imageKey}`);
    }
  } catch (error) {
    console.error(`[R2] Failed to delete image ${imageUrl}:`, error);
  }
};

// Helper Function: ଗୋଟିଏ ଇମେଜ୍ ଅପଲୋଡ୍ କରିବା ପାଇଁ
const uploadImageToR2 = async (file) => {
  const fileExtension = path.extname(file.originalname);
  const randomString = crypto.randomBytes(8).toString("hex");
  const fileName = `jivan-${Date.now()}-${randomString}${fileExtension}`;

  const uploadCommand = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fileName,
    Body: file.buffer,
    ContentType: file.mimetype,
  });

  await r2Client.send(uploadCommand);
  console.log(`[R2] Uploaded new image: ${fileName}`);

  return `${PUBLIC_URL_BASE}/${fileName}`;
};

/**
 * Handle Single/Multiple Image Upload & Deletion in Cloudflare R2
 * @param {Object|Array} files - req.file (Single Object) OR req.files (Array of Objects)
 * @param {String|Array} oldImageUrls - Single URL string OR Array of URL strings to delete
 * @returns {Promise<String|Array|null>} - Returns single URL string or Array of URLs
 */
const handleImageUpload = async (files, oldImageUrls = null) => {
  try {
    // ୧. ପୁରୁଣା ଇମେଜ୍/ଇମେଜ୍ ଗୁଡ଼ିକୁ ଡିଲିଟ୍ କରିବା (Single ବା Multiple ହ୍ୟାଣ୍ଡେଲ୍ କରିବା)
    if (oldImageUrls) {
      const urlsToDelete = Array.isArray(oldImageUrls) ? oldImageUrls : [oldImageUrls];
      // Promise.all ବ୍ୟବହାର କରିବା ଯାହାଦ୍ୱାରା ସବୁ ଇମେଜ୍ ଏକାସାଙ୍ଗରେ ଶୀଘ୍ର ଡିଲିଟ୍ ହେବ
      await Promise.all(urlsToDelete.map(url => deleteImageFromR2(url)));
    }

    // ୨. ଯଦି କୌଣସି ନୂଆ ଫାଇଲ୍ ନାହିଁ, null ଫେରାନ୍ତୁ
    if (!files || (Array.isArray(files) && files.length === 0)) {
      return null;
    }

    // ୩. ଚେକ୍ କରିବା ଯେ ୟୁଜର୍ ଗୋଟିଏ ଫାଇଲ୍ ଦେଇଛନ୍ତି ନା Array of files
    const isMultipleFiles = Array.isArray(files);
    const filesToUpload = isMultipleFiles ? files : [files];

    // ୪. ସବୁ ଫାଇଲ୍ କୁ ଏକାସାଙ୍ଗରେ (concurrently) ଅପଲୋଡ୍ କରିବା
    const uploadedUrls = await Promise.all(filesToUpload.map(file => uploadImageToR2(file)));

    // ୫. ଯଦି input Multiple ଥିଲା ତେବେ Array ରିଟର୍ଣ୍ଣ କରନ୍ତୁ, ନଚେତ୍ Single String ରିଟର୍ଣ୍ଣ କରନ୍ତୁ
    return isMultipleFiles ? uploadedUrls : uploadedUrls[0];

  } catch (error) {
    console.error("[R2] Image processing error:", error);
    throw new Error("Failed to process images in Cloudflare R2");
  }
};

module.exports = {
  handleImageUpload
};
const multer = require("multer");

// 1. STORAGE: RAM IS SPEED
// We use memoryStorage so the file is available in `req.file.buffer`.
// This avoids the I/O bottleneck of writing to disk, then reading back.
const storage = multer.memoryStorage();

// 2. INTELLIGENT FILTERING
// We don't just accept anything. We strictly gatekeep for images.
const fileFilter = (req, file, cb) => {
    // Check MIME type (e.g., 'image/png', 'image/jpeg', 'image/webp')
    if (file.mimetype.startsWith("image/")) {
        cb(null, true);
    } else {
        // Reject with a clear error
        cb(new Error("UNSUPPORTED_FILE_TYPE"), false);
    }
};

// 3. DEFENSIVE LIMITS
// Protect your server's RAM. We allow max 5MB upload.
// Since we compress with Sharp later, 5MB input is generous enough.
const limits = {
    fileSize: 10 * 1024 * 1024, // 10 MB
};

const upload = multer({
    storage,
    fileFilter,
    limits
});

module.exports = upload;
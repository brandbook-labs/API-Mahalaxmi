const sharp = require("sharp");

// Helper: Smartly compress image to be under a specific size (e.g., 20KB)
const sharpCompressToSize = async (inputBuffer, maxBytes = 20480) => {
    let quality = 80; // Start with high quality
    let width = 800;  // Start with good width
    let outputBuffer;

    // First attempt
    outputBuffer = await sharp(inputBuffer)
        .resize({ width })
        .webp({ quality })
        .toBuffer();

    // Loop: If file is too big, reduce quality & size and try again
    while (outputBuffer.length > maxBytes && quality > 10) {
        // Aggressively drop quality and size to meet the target
        quality -= 15; 
        width -= 100; 
        
        // Prevent width from getting too tiny (bad UX)
        if (width < 300) width = 300; 

        outputBuffer = await sharp(inputBuffer)
            .resize({ width })
            .webp({ quality })
            .toBuffer();
    }

    return outputBuffer;
};

module.exports = { sharpCompressToSize }
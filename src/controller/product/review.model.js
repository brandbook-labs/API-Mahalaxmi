const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
    {
        // କେଉଁ ପ୍ରଡକ୍ଟ ପାଇଁ ରିଭ୍ୟୁ ଦିଆଯାଇଛି
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true,
            index: true, // ନିର୍ଦ୍ଦିଷ୍ଟ ପ୍ରଡକ୍ଟର ରିଭ୍ୟୁ ଫାଷ୍ଟ୍ ଖୋଜିବା ପାଇଁ
        },
        // କିଏ ରିଭ୍ୟୁ ଦେଇଛନ୍ତି (ଆପଣଙ୍କର User ମଡେଲ୍)
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
        },
        comment: {
            type: String,
            required: true,
            trim: true,
        },
        // ଯଦି ୟୁଜର୍ କୌଣସି ଫଟୋ ଅପଲୋଡ୍ କରନ୍ତି
        reviewImages: [
            {
                type: String
            }
        ]
    },
    { timestamps: true }
);

// ଏହା ନିଶ୍ଚିତ କରିବ ଯେ ଜଣେ ୟୁଜର୍ ଗୋଟିଏ ପ୍ରଡକ୍ଟ ଉପରେ କେବଳ ଥରେ ହିଁ ରିଭ୍ୟୁ ଦେଇପାରିବେ
reviewSchema.index({ product: 1, user: 1 }, { unique: true });

module.exports = mongoose.model("Review", reviewSchema);
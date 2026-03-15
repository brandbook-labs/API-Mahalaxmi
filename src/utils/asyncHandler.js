const { sendApiResponse } = require("./responseUtils");

const asyncHandler = (fn) => async(req, res, next) => {
    try{
        await fn(req, res, next);
    }catch (error){
        console.log(error);
        sendApiResponse(res, 500, "Something went wrong", null, error.message + error.stack);
    }
}

module.exports = { asyncHandler };
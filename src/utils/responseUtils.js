const apiResponse = require("./apiResponse");

const sendApiResponse = (res, code, msg, data = null, error = null) => {
    return res.status(code).json(new apiResponse(code, msg, data, error));
};

module.exports = { sendApiResponse };
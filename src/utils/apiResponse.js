class apiResponse {
    constructor(code, msg, data = null, error = null) {
        this.code = code;
        this.msg = msg;
        this.data = data;
        this.error = error;
    }

    toJson() {
        return {
            code: this.code,
            msg: this.msg,
            data: this.data,
            error: this.error
        };
    }
}

module.exports = apiResponse;
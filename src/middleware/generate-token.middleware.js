const jwt = require('jsonwebtoken');

const generateToken = (user_id) => {
    const payload = {user_id};    

    return jwt.sign(payload, process.env.JWT_SECRET_KEY, {
        expiresIn: '30d'
    });
};

module.exports = { generateToken };
const jwt = require('jsonwebtoken');

const generateToken = ({ admin_id = null, clinic_id = null, staff_id = null, user_id = null, super_role = null }) => {
    const payload = { admin_id, clinic_id, staff_id, user_id, super_role };    

    return jwt.sign(payload, process.env.JWT_SECRET_KEY, {
        expiresIn: '30d'
    });
};

module.exports = { generateToken };
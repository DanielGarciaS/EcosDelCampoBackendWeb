const jwt = require('jsonwebtoken');

// ✅ Secret obligatorio, falla si no existe
const SECRET = process.env.JWT_SECRET;
if (!SECRET) {
  throw new Error('❌ JWT_SECRET no definido en .env');
}

const generateToken = (payload, expires = '7d') => {
  return jwt.sign(payload, SECRET, { expiresIn: expires });
};

const verifyToken = (token) => {
  return jwt.verify(token, SECRET);
};

module.exports = { generateToken, verifyToken };

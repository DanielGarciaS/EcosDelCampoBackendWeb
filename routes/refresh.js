const express = require('express');
const router  = express.Router();
const { verifyToken, generateToken } = require('../utils/jwt');

// POST /api/auth/refresh
router.post('/', (req, res) => {
  const rf = req.cookies?.refreshToken;
  if (!rf) return res.status(401).json({message:'No refresh token'});

  try {
    const payload = verifyToken(rf);
    const access  = generateToken({id:payload.id, email:payload.email, role:payload.role}, '15m');
    return res.json({token:access});
  } catch {
    return res.status(403).json({message:'Refresh inválido'});
  }
});

module.exports = router;
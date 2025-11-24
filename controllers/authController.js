const User = require('../models/User');
const bcrypt = require('bcrypt');
const { generateToken } = require('../utils/jwt');

exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    // Validación básica
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Completa todos los campos' });
    }
    
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'Email ya registrado' });
    }
    
    const user = await User.create({ name, email, password, role });
    
    // Tokens
    const access = generateToken({ id: user._id, email, role }, '15m');
    const refresh = generateToken({ id: user._id, email, role }, '7d');
    
    // Cookie httpOnly
    res.cookie('refreshToken', refresh, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // ✅ true en producción
      sameSite: 'Lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
    
    // ✅ Response sin password
    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    };
    
    res.status(201).json({ 
      message: 'Usuario creado', 
      token: access, 
      user: userResponse 
    });
  } catch (e) {
    res.status(500).json({ message: 'Error registro', error: e.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email y password requeridos' });
    }
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }
    
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }
    
    // Tokens
    const access = generateToken({ id: user._id, email: user.email, role: user.role }, '15m');
    const refresh = generateToken({ id: user._id, email: user.email, role: user.role }, '7d');
    
    // Cookie httpOnly
    res.cookie('refreshToken', refresh, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
    
    // ✅ Response sin password
    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    };
    
    res.json({ 
      message: 'Login exitoso', 
      token: access, 
      user: userResponse 
    });
  } catch (e) {
    res.status(500).json({ message: 'Error login', error: e.message });
  }
};

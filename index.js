// ===== CARGAR .ENV PRIMERO (ANTES DE TODO) =====
const dotenv = require('dotenv');
dotenv.config(); // ← Debe ser LA PRIMERA LÍNEA ejecutable

// ===== AHORA SÍ IMPORTAR EL RESTO =====
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const path = require('path');

const authRoutes = require('./routes/auth');
const refreshRoutes = require('./routes/refresh');
const userRoutes = require('./routes/user');
const orderRoutes = require('./routes/order');
const productRoutes = require('./routes/product');

const app = express();
const PORT = process.env.PORT || 3000;

// ===== MIDDLEWARES =====
app.use(cors({
  origin: process.env.FRONTEND_URL === '*' ? '*' : process.env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));


app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '../frontend')));

// ===== RUTAS =====
app.use('/api/auth', authRoutes);
app.use('/api/auth/refresh', refreshRoutes);
app.use('/api', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/products', productRoutes);

// ===== MONGODB =====
mongoose.connect(process.env.MONGODB_URL)
  .then(() => console.log('✅ Conectado a MongoDB'))
  .catch(err => {
    console.error('❌ Error MongoDB:', err.message);
    process.exit(1);
  });

// ===== SERVIDOR =====
app.listen(PORT, () => console.log(`🚀 Servidor en http://localhost:${PORT}`));

const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const Product = require('../models/Product');

// POST /api/products → farmer publica producto
router.post('/', verifyToken, async (req, res) => {
  try {
    // ✅ Validación mejorada
    if (!req.user || req.user.role !== 'farmer') {
      return res.status(403).json({ message: 'Solo farmers pueden publicar' });
    }
    
    const { name, description, price, stock, unit, image } = req.body;
    
    if (!name || price === undefined || stock === undefined) {
      return res.status(400).json({ message: 'Nombre, precio y stock son obligatorios' });
    }
    
    const product = new Product({
      name, 
      description, 
      price, 
      stock, 
      unit, 
      image,
      farmer: req.user.id
    });
    
    await product.save();
    res.status(201).json({ message: 'Producto publicado', product });
  } catch (err) {
    res.status(500).json({ message: 'Error al publicar', error: err.message });
  }
});

// GET /api/products → catálogo público (solo activos)
router.get('/', async (req, res) => {
  try {
    const products = await Product.find({ status: 'active' })
      .populate('farmer', 'name email')
      .sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener productos', error: err.message });
  }
});

// GET /api/products/my → mis productos (farmer)
router.get('/my', verifyToken, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'farmer') {
      return res.status(403).json({ message: 'Solo farmers pueden ver sus productos' });
    }
    
    const products = await Product.find({ farmer: req.user.id })
      .sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener productos', error: err.message });
  }
});

// ✅ DELETE /api/products/:id → eliminar producto (solo dueño)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'farmer') {
      return res.status(403).json({ message: 'No autorizado' });
    }
    
    const product = await Product.findOneAndDelete({
      _id: req.params.id,
      farmer: req.user.id
    });
    
    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }
    
    res.json({ message: 'Producto eliminado correctamente' });
  } catch (err) {
    res.status(500).json({ message: 'Error al eliminar', error: err.message });
  }
});

// ✅ PATCH /api/products/:id → actualizar stock/precio
router.patch('/:id', verifyToken, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'farmer') {
      return res.status(403).json({ message: 'No autorizado' });
    }
    
    const { price, stock, status } = req.body;
    const updates = {};
    
    if (price !== undefined) updates.price = price;
    if (stock !== undefined) updates.stock = stock;
    if (status !== undefined) updates.status = status;
    
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, farmer: req.user.id },
      updates,
      { new: true }
    );
    
    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }
    
    res.json({ message: 'Producto actualizado', product });
  } catch (err) {
    res.status(500).json({ message: 'Error al actualizar', error: err.message });
  }
});

module.exports = router;

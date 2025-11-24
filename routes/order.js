const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const Order = require('../models/Order');
const Product = require('../models/Product');

// POST /api/orders → crear pedido (buyer)
router.post('/', verifyToken, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'buyer') {
      return res.status(403).json({ message: 'Solo compradores pueden hacer pedidos' });
    }
    
    const { productId, quantity, price, farmerId } = req.body;
    const buyer = req.user.id;
    
    if (!productId || !quantity || !farmerId) {
      return res.status(400).json({ message: 'Datos incompletos' });
    }
    
    // ✅ Verificar stock disponible
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }
    
    if (product.stock < quantity) {
      return res.status(400).json({ 
        message: 'Stock insuficiente', 
        available: product.stock 
      });
    }
    
    // ✅ Reducir stock
    product.stock -= quantity;
    await product.save();
    
    // Crear orden
    const newOrder = new Order({
      product: productId,
      quantity,
      price: price || product.price,
      buyer,
      farmer: farmerId,
      status: 'pending'
    });
    
    await newOrder.save();
    
    // Populate para respuesta completa
    await newOrder.populate('product', 'name image');
    
    res.status(201).json({ message: 'Pedido creado', order: newOrder });
  } catch (err) {
    res.status(500).json({ message: 'Error al crear pedido', error: err.message });
  }
});

// GET /api/orders/incoming → pedidos entrantes (farmer)
router.get('/incoming', verifyToken, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'farmer') {
      return res.status(403).json({ message: 'Solo farmers pueden ver pedidos entrantes' });
    }
    
    const orders = await Order.find({ farmer: req.user.id })
      .populate('buyer', 'name email')
      .populate('product', 'name image unit')
      .sort({ createdAt: -1 });
    
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener pedidos', error: err.message });
  }
});

// GET /api/orders/my → mis pedidos (buyer)
router.get('/my', verifyToken, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'buyer') {
      return res.status(403).json({ message: 'Solo compradores pueden ver sus pedidos' });
    }
    
    const orders = await Order.find({ buyer: req.user.id })
      .populate('farmer', 'name email')
      .populate('product', 'name image unit')
      .sort({ createdAt: -1 });
    
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Error al obtener pedidos', error: err.message });
  }
});

// ✅ PATCH /api/orders/:id → cambiar estado (farmer)
router.patch('/:id', verifyToken, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'farmer') {
      return res.status(403).json({ message: 'Solo farmers pueden actualizar pedidos' });
    }
    
    const { status } = req.body;
    
    if (!['pending', 'accepted', 'delivered', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Estado inválido' });
    }
    
    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, farmer: req.user.id },
      { status },
      { new: true }
    ).populate('buyer', 'name email').populate('product', 'name');
    
    if (!order) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }
    
    res.json({ message: 'Estado actualizado', order });
  } catch (err) {
    res.status(500).json({ message: 'Error al actualizar', error: err.message });
  }
});

// ✅ DELETE /api/orders/:id → cancelar pedido (buyer, solo pending)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'buyer') {
      return res.status(403).json({ message: 'Solo compradores pueden cancelar' });
    }
    
    const order = await Order.findOne({ _id: req.params.id, buyer: req.user.id });
    
    if (!order) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }
    
    if (order.status !== 'pending') {
      return res.status(400).json({ message: 'Solo se pueden cancelar pedidos pendientes' });
    }
    
    // ✅ Devolver stock
    const product = await Product.findById(order.product);
    if (product) {
      product.stock += order.quantity;
      await product.save();
    }
    
    await order.deleteOne();
    res.json({ message: 'Pedido cancelado y stock restaurado' });
  } catch (err) {
    res.status(500).json({ message: 'Error al cancelar', error: err.message });
  }
});

module.exports = router;

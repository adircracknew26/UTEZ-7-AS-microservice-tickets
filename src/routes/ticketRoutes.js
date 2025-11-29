const express = require('express');
const router = express.Router();
const controller = require('../controllers/ticketController');

// Rutas base: /api/tickets

// Comprar (Generar tickets)
router.post('/purchase', controller.purchaseTicket);

// Historial de usuario
router.get('/user/:userId', controller.getMyTickets);

// Validar boleto (Escanear QR sin entrar)
router.get('/validate/:token', controller.validateTicket);

// Check-in (Entrar al evento)
router.patch('/check-in', controller.checkInTicket);

// STATS
router.get('/stats/:eventId', controller.getEventStats);

module.exports = router;
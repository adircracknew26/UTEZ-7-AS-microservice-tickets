const Ticket = require('../models/Ticket');
const axios = require('axios');

// URL del servicio de notificaciones (Ajusta si usas local o render)
const NOTIFICATION_SERVICE_URL = 'https://utez-7-as-microservice-notifications.onrender.com/api/notifications/ticket';

// Helper para enviar correo
const sendTicketNotification = async (ticket, emailUsuario) => {
    try {
        const ticketData = {
            evento: ticket.nombreEvento || 'Evento SVCBDE',
            fecha: ticket.fechaEvento || new Date().toLocaleDateString(),
            lugar: ticket.lugarEvento || 'Sede del Evento',
            asiento: 'General', 
            zona: ticket.zona,
            boletoId: ticket.ticketToken
        };

        await axios.post(NOTIFICATION_SERVICE_URL, {
            email: emailUsuario,
            ticketData
        });
        console.log(`Correo enviado a ${emailUsuario}`);
    } catch (error) {
        console.error('Error enviando correo:', error.message);
    }
};

// 1. COMPRAR BOLETO
exports.purchaseTicket = async (req, res) => {
    try {
        const { 
            eventoId, usuarioId, zona, precio, cantidad, 
            nombreAsistente, emailUsuario, 
            nombreEvento, imagenEvento, lugarEvento, fechaEvento // <--- NUEVOS DATOS
        } = req.body;

        const ticketsCreados = [];

        for (let i = 0; i < cantidad; i++) {
            const nuevoTicket = new Ticket({
                eventoId,
                usuarioId,
                zona,
                precio,
                nombreAsistente: nombreAsistente || 'Portador',
                // Guardamos los datos visuales para que la tarjeta se vea bonita
                nombreEvento,
                imagenEvento,
                lugarEvento,
                fechaEvento
            });
            
            await nuevoTicket.save();
            ticketsCreados.push(nuevoTicket);

            // Enviamos correo si hay email
            if (emailUsuario) {
                // No usamos await para no bloquear la respuesta
                sendTicketNotification(nuevoTicket, emailUsuario);
            }
        }

        res.status(201).json({
            msg: 'Compra exitosa',
            cantidad: ticketsCreados.length,
            tickets: ticketsCreados 
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Error en la compra', error: error.message });
    }
};

// ... (El resto de funciones: getMyTickets, validateTicket, checkInTicket, getEventStats QUEDAN IGUAL) ...
// Copia aquí el resto de tu código original a partir de exports.getMyTickets
exports.getMyTickets = async (req, res) => {
    try {
        const { userId } = req.params;
        const tickets = await Ticket.find({ usuarioId: userId }).sort({ fechaCompra: -1 });
        res.status(200).json(tickets);
    } catch (error) {
        res.status(500).json({ msg: 'Error obteniendo historial' });
    }
};

exports.validateTicket = async (req, res) => {
    try {
        const { token } = req.params;
        const ticket = await Ticket.findOne({ ticketToken: token });

        if (!ticket) return res.status(404).json({ valido: false, msg: 'Boleto NO encontrado' });
        if (ticket.estado === 'USADO') return res.status(400).json({ valido: false, msg: 'Boleto YA FUE USADO', fechaUso: ticket.fechaUso });
        if (ticket.estado === 'CANCELADO') return res.status(400).json({ valido: false, msg: 'Boleto CANCELADO' });

        res.status(200).json({ valido: true, msg: 'ACCESO PERMITIDO', data: ticket });
    } catch (error) {
        res.status(500).json({ msg: 'Error de validación' });
    }
};

exports.checkInTicket = async (req, res) => {
    try {
        const { token } = req.body;
        const ticket = await Ticket.findOne({ ticketToken: token });

        if (!ticket || ticket.estado !== 'VALIDO') return res.status(400).json({ msg: 'No se puede hacer Check-in. Boleto inválido o usado.' });

        ticket.estado = 'USADO';
        ticket.fechaUso = new Date();
        await ticket.save();

        res.status(200).json({ msg: 'Check-in exitoso. Bienvenido.' });
    } catch (error) {
        res.status(500).json({ msg: 'Error en Check-in' });
    }
};

exports.getEventStats = async (req, res) => {
    try {
        const { eventId } = req.params;
        if (!eventId) return res.status(400).json({ msg: "Error: No se recibió el ID" });

        const totalVendidos = await Ticket.countDocuments({ eventoId: eventId });
        const totalIngresados = await Ticket.countDocuments({ eventoId: eventId, estado: 'USADO' });
        
        res.status(200).json({
            eventId,
            totalVendidos,
            totalIngresados,
            porcentajeAsistencia: totalVendidos > 0 ? ((totalIngresados / totalVendidos) * 100).toFixed(2) + '%' : '0%'
        });
    } catch (error) {
        res.status(500).json({ msg: 'Error calculando estadísticas' });
    }
};
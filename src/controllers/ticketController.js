const Ticket = require('../models/Ticket');

// 1. COMPRAR BOLETO (Genera N tickets en BD)
exports.purchaseTicket = async (req, res) => {
    try {
        const { 
            eventoId, usuarioId, usuarioEmail, zona, precio, cantidad, 
            nombreAsistente, nombreEvento, imagenEvento, lugarEvento, fechaEvento 
        } = req.body;

        const ticketsCreados = [];
        // Valor por defecto 1 por seguridad
        const numBoletos = cantidad || 1;

        console.log(`Generando ${numBoletos} tickets para usuario ${usuarioId}`);

        for (let i = 0; i < numBoletos; i++) {
            const nuevoTicket = new Ticket({
                eventoId,
                usuarioId,
                usuarioEmail, // Útil para tener el correo a la mano en el ticket
                zona,
                precio, // Precio unitario (puede ser la mitad si es 2x1)
                asiento: 'General', // O lógica de asientos numerados
                nombreAsistente: nombreAsistente || 'Portador',
                
                // Snapshot visual para historial
                nombreEvento,
                imagenEvento,
                lugarEvento,
                fechaEvento
            });
            
            await nuevoTicket.save();
            ticketsCreados.push(nuevoTicket);
        }

        // Respondemos con el array de tickets creados
        res.status(201).json({
            msg: 'Compra exitosa',
            cantidad: ticketsCreados.length,
            tickets: ticketsCreados // Array de objetos Ticket
        });

    } catch (error) {
        console.error("Error en purchaseTicket:", error);
        res.status(500).json({ msg: 'Error en la compra', error: error.message });
    }
};

// 2. OBTENER MIS BOLETOS (Historial)
exports.getMyTickets = async (req, res) => {
    try {
        const { userId } = req.params;
        const tickets = await Ticket.find({ usuarioId: userId }).sort({ fechaCompra: -1 });
        res.status(200).json(tickets);
    } catch (error) {
        res.status(500).json({ msg: 'Error obteniendo historial' });
    }
};

// 3. VALIDAR BOLETO (Scanner)
exports.validateTicket = async (req, res) => {
    try {
        const { token } = req.params;
        const ticket = await Ticket.findOne({ ticketToken: token });

        if (!ticket) {
            return res.status(404).json({ valid: false, msg: 'Boleto NO encontrado' });
        }

        if (ticket.estado === 'USADO') {
            return res.status(400).json({ 
                valid: false, 
                msg: 'Boleto YA FUE USADO', 
                fechaUso: ticket.fechaUso 
            });
        }

        if (ticket.estado === 'CANCELADO') {
            return res.status(400).json({ valid: false, msg: 'Boleto CANCELADO' });
        }

        res.status(200).json({ 
            valid: true, 
            msg: 'ACCESO PERMITIDO', 
            ticket 
        });

    } catch (error) {
        res.status(500).json({ msg: 'Error de validación' });
    }
};

// 4. CHECK-IN (Cambio de estado)
exports.checkInTicket = async (req, res) => {
    try {
        const { token } = req.body;
        const ticket = await Ticket.findOne({ ticketToken: token });

        if (!ticket || ticket.estado !== 'VALIDO') {
            return res.status(400).json({ msg: 'No se puede hacer Check-in. Boleto inválido o usado.' });
        }

        ticket.estado = 'USADO';
        ticket.fechaUso = new Date();
        await ticket.save();

        res.status(200).json({ msg: 'Check-in exitoso. Bienvenido.' });

    } catch (error) {
        res.status(500).json({ msg: 'Error en Check-in' });
    }
};

// 5. ESTADÍSTICAS
exports.getEventStats = async (req, res) => {
    try {
        const { eventId } = req.params;
        if (!eventId) {
            return res.status(400).json({ msg: "Error: No se recibió el ID del evento" });
        }

        const totalVendidos = await Ticket.countDocuments({ eventoId: eventId });
        const totalIngresados = await Ticket.countDocuments({ eventoId: eventId, estado: 'USADO' });
        
        res.status(200).json({
            eventId,
            totalVendidos,
            totalIngresados,
            porcentajeAsistencia: totalVendidos > 0 ? ((totalIngresados / totalVendidos) * 100).toFixed(2) + '%' : '0%'
        });

    } catch (error) {
        console.error("ERROR EN STATS:", error);
        res.status(500).json({ 
            msg: 'Error calculando estadísticas', 
            errorDetalle: error.message 
        });
    }
};
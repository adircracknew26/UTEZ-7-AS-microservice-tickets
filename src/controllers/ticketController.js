const Ticket = require('../models/Ticket');

// 1. COMPRAR BOLETO (Genera el registro y el Token)
exports.purchaseTicket = async (req, res) => {
    try {
        // En un caso real, aquí primero validarías con el Microservicio de Eventos si hay aforo disponible.
        const { eventoId, usuarioId, zona, precio, cantidad, nombreAsistente } = req.body;

        const ticketsCreados = [];

        // Si compra 3 boletos, creamos 3 registros diferentes
        for (let i = 0; i < cantidad; i++) {
            const nuevoTicket = new Ticket({
                eventoId,
                usuarioId,
                zona,
                precio,
                nombreAsistente: nombreAsistente || 'Portador'
            });
            await nuevoTicket.save();
            ticketsCreados.push(nuevoTicket);
        }

        // AQUÍ es donde llamarías al Microservicio de Notificaciones para enviar el correo
        // await axios.post('http://localhost:4002/api/notifications/ticket', ... )

        res.status(201).json({
            msg: 'Compra exitosa',
            cantidad: ticketsCreados.length,
            tickets: ticketsCreados // Retornamos los tickets con sus tokens
        });

    } catch (error) {
        console.error(error);
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

// 3. VALIDAR BOLETO (Para la App del Portero - Solo lectura)
exports.validateTicket = async (req, res) => {
    try {
        const { token } = req.params;
        
        const ticket = await Ticket.findOne({ ticketToken: token });

        if (!ticket) {
            return res.status(404).json({ valido: false, msg: 'Boleto NO encontrado' });
        }

        if (ticket.estado === 'USADO') {
            return res.status(400).json({ 
                valido: false, 
                msg: 'Boleto YA FUE USADO', 
                fechaUso: ticket.fechaUso 
            });
        }

        if (ticket.estado === 'CANCELADO') {
            return res.status(400).json({ valido: false, msg: 'Boleto CANCELADO' });
        }

        // Si pasa todo, es válido
        res.status(200).json({ 
            valido: true, 
            msg: 'ACCESO PERMITIDO', 
            data: ticket 
        });

    } catch (error) {
        res.status(500).json({ msg: 'Error de validación' });
    }
};

// 4. CHECK-IN (Para la App del Portero - Cambia estado a USADO)
exports.checkInTicket = async (req, res) => {
    try {
        const { token } = req.body; // El token viene en el body
        
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

// 5. ESTADÍSTICAS (Para el Dashboard en tiempo real)
// 5. ESTADÍSTICAS (Con logs para depurar)
// 5. ESTADÍSTICAS
exports.getEventStats = async (req, res) => {
    try {
        // --- AQUÍ ESTABA EL ERROR: Asegúrate de que esta línea exista ---
        const { eventId } = req.params; 
        
        console.log("ID Recibido:", eventId); // Para ver en consola si llega

        // Validación extra: Si el ID llega undefined
        if (!eventId) {
            return res.status(400).json({ msg: "Error: No se recibió el ID del evento en la URL" });
        }

        // Usamos el ID para contar
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
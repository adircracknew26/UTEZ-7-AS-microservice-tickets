const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const ticketSchema = new mongoose.Schema({
    eventoId: { type: String, required: true },
    usuarioId: { type: String, required: true },
    
    // --- NUEVOS CAMPOS (Snapshot) ---
    nombreEvento: { type: String }, // Guardamos el nombre "congelado"
    imagenEvento: { type: String }, // Guardamos la foto del evento
    lugarEvento: { type: String },  // Guardamos el lugar
    fechaEvento: { type: String },  // Guardamos la fecha del evento (texto)
    // -------------------------------

    nombreAsistente: { type: String },
    ticketToken: {
        type: String,
        default: uuidv4,
        unique: true,
        index: true
    },
    zona: { type: String, required: true },
    precio: { type: Number, required: true },
    estado: {
        type: String,
        enum: ['VALIDO', 'USADO', 'CANCELADO'],
        default: 'VALIDO'
    },
    fechaCompra: { type: Date, default: Date.now },
    fechaUso: { type: Date }
});

module.exports = mongoose.model('Ticket', ticketSchema);
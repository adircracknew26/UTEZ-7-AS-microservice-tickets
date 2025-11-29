const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid'); // Generador de IDs únicos

const ticketSchema = new mongoose.Schema({
    eventoId: {
        type: String, // Guardamos el ID del evento (que viene del microservicio de Eventos)
        required: true
    },
    usuarioId: {
        type: String, // Guardamos el ID del usuario que compró
        required: true
    },
    nombreAsistente: { // Opcional: si el boleto es nominativo
        type: String
    },
    // EL CORAZÓN DEL SISTEMA: El Token Único
    ticketToken: {
        type: String,
        default: uuidv4, // Se genera automáticamente ej: "9b1deb4d-3b7d..."
        unique: true,
        index: true // Indexado para búsquedas rápidas al escanear
    },
    zona: {
        type: String,
        required: true
    },
    precio: {
        type: Number,
        required: true
    },
    estado: {
        type: String,
        enum: ['VALIDO', 'USADO', 'CANCELADO'],
        default: 'VALIDO'
    },
    fechaCompra: {
        type: Date,
        default: Date.now
    },
    fechaUso: { // Se llena cuando el portero escanea el boleto
        type: Date
    }
});

module.exports = mongoose.model('Ticket', ticketSchema);
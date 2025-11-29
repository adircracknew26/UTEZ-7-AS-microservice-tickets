const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
require('dotenv').config();

const app = express();

connectDB();

app.use(cors());
app.use(express.json());

app.use('/api/tickets', require('./routes/ticketRoutes'));

const PORT = process.env.PORT || 4003; // Puerto 4003 para Tickets
app.listen(PORT, () => {
    console.log(`Servicio de Tickets corriendo en puerto ${PORT}`);
});
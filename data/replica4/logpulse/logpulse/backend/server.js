const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Almacén en memoria volátil (últimos 100 logs del clúster)
let logsBuffer = [];
// Clientes conectados por SSE
let sseClients = [];

// Endpoint 1: Ingesta de logs (aquí apuntan tus otros contenedores)
app.post('/api/logs', (req, res) => {
    const { source, level, message, metadata } = req.body;
    
    if (!message) return res.status(400).json({ error: 'El campo message es obligatorio' });

    const logEntry = {
        id: Date.now() + Math.random().toString('36'.substring(2, 7)),
        timestamp: new Date().toISOString(),
        source: source || 'unknown-container',
        level: (level || 'INFO').toUpperCase(),
        message,
        metadata: metadata || {}
    };

    logsBuffer.unshift(logEntry);
    if (logsBuffer.length > 100) logsBuffer.pop(); // Mantener límite

    // Transmitir en tiempo real a todos los frontends conectados
    sseClients.forEach(client => client.res.write(`data: ${JSON.stringify(logEntry)}\n\n`));
    res.status(201).json({ status: 'Log indexado con éxito', id: logEntry.id });
});

// Endpoint 2: Histórico inicial
app.get('/api/logs', (req, res) => {
    res.json(logsBuffer);
});

// Endpoint 3: Canal de Streaming en tiempo real (Server-Sent Events)
app.get('/api/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const clientId = Date.now();
    const newClient = { id: clientId, res };
    sseClients.push(newClient);

    req.on('close', () => {
        sseClients = sseClients.filter(client => client.id !== clientId);
    });
});

app.listen(PORT, () => {
    console.log(`[LOG-PULSE] Escuchando en el puerto ${PORT} dentro de la red interna.`);
});
/**
 * Arquivo principal do backend.
 * Inicializa o servidor Express, configura o Socket.IO para comunicação em tempo real,
 * registra middlewares e rotas, e exporta a instância do Socket.IO.
 */

import { Server } from 'socket.io';
import http from 'http';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import fileRoutes from './routes/files.js';
import commentRoutes from './routes/comments.js';
import eventRoutes from './routes/eventRoutes.js';
import setorRoutes from './routes/setor.js';
import './database/connection.js';
import ticketRoutes from './routes/ticketRoutes.js';
import chatRoutes from './routes/chat.js';
import User from './models/User.js';
import userRoutes from './routes/user.js';
import { sendMessage } from './controllers/chatMessageController.js'
import servicoTipoRoutes from './routes/servicoTipoRoutes.js';
import infra   from './routes/infra.js';
import equipamentos from './routes/equipamentos.js';
import agendamentos from './routes/agendamento.js';

/**
 * Objeto para mapear usuários conectados e seus socket IDs.
 * @type {Object.<string, string>}
 */
export const users = {};

dotenv.config();
const app = express();

// Middlewares globais
// Restringe CORS em produção via variável de ambiente CORS_ORIGIN (lista separada por vírgulas)
const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: allowedOrigins.length ? allowedOrigins : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

const server = http.createServer(app);

/**
 * Instância do Socket.IO para comunicação em tempo real.
 */
const io = new Server(server, {
    cors: {
        origin: allowedOrigins.length ? allowedOrigins : '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        allowedHeaders: ['Content-Type', 'Authorization' ],
    },
});

/**
 * Gerencia eventos de conexão de clientes via Socket.IO.
 */
io.on('connection', (socket) => {
    console.log('Novo cliente conectado:', socket.id);

    socket.on('register', async (userId) => {
        users[userId] = socket.id;
        // Envia a lista atualizada de usuários online para todos
        const onlineUserIds = Object.keys(users);
        const onlineUsers = await User.find({ _id: { $in: onlineUserIds } }, 'name email');
        io.emit('online-users', onlineUsers);
    });

    socket.on('unregister', async (userId) => {
        if (users[userId] === socket.id) {
            delete users[userId];
            const onlineUserIds = Object.keys(users);
            const onlineUsers = await User.find({ _id: { $in: onlineUserIds } }, 'name email');
            io.emit('online-users', onlineUsers);
        }
    });

    socket.on('private-message', async ({ to, message, from, id }) => {
        if (users[to]) {
            io.to(users[to]).emit('private-message', { from, message, sender: from, id });
        }
        sendMessage(to, from, message); // Salva a mensagem no banco de dados
    });

    socket.on('typing', ({ to, from }) => {
        const targetSocketId = users[to];
        if (targetSocketId) {
            io.to(targetSocketId).emit('typing', { from, to });
        }
    });

    socket.on('message-read', ({ from, to, messageIds }) => {
        const targetSocketId = users[to];
        if (targetSocketId) {
            io.to(targetSocketId).emit('message-read', { from, to, messageIds });
        }
    });

    socket.on('disconnect', async () => {
        for (const userId in users) {
            if (users[userId] === socket.id) {
                delete users[userId];
                break;
            }
        }
        // Envia a lista atualizada de usuários online para todos
        const onlineUserIds = Object.keys(users);
        const onlineUsers = await User.find({ _id: { $in: onlineUserIds } }, 'name email');
        io.emit('online-users', onlineUsers);
        console.log('Cliente desconectado:', socket.id);
    });
});

/**
 * Middleware para logar todas as requisições recebidas.
 */
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url} - Origin: ${req.headers.origin}`);
    next();
});

// Rotas da aplicação
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/users', userRoutes); // Rota para usuários
app.use('/api/setor', setorRoutes);
app.use('/api/servicoTipo', servicoTipoRoutes); // Rota para tipos de serviço
app.use('/api/infra', infra); // Rota para infraestruturas
app.use('/api/equipamentos', equipamentos); // Rota para equipamentos
app.use('/api/agendamentos', agendamentos); // Rota para agendamentos

const PORT = process.env.PORT || 3000;

/**
 * Inicializa o servidor HTTP.
 */
server.listen(PORT, '0.0.0.0', () => console.log(`Servidor rodando na porta ${PORT}`));

/**
 * Exporta a instância do Socket.IO para uso nos controladores.
 */
export { io };
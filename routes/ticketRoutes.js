import express from 'express';
import rateLimit from 'express-rate-limit';
import { createTicket, getTickets, updateTicketStatusAndDiagnostic, getTicketsByStatus,
            deleteTicket, getTicketById } from '../controllers/ticketController.js';
import { authenticate } from '../middlewares/authMiddleware.js';


const router = express.Router();

// Limite para criação pública de chamados
const createTicketLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minuto
    max: 5, // 5 criações por minuto por IP
    message: 'Muitas criações de chamados. Tente novamente em alguns instantes.'
});

// Criar um novo chamado (apenas usuários autenticados)
router.post('/' , createTicketLimiter, createTicket);

// Listar todos os chamados (apenas usuários autenticados)
router.get('/', authenticate, getTickets);

router.get('/:id', authenticate, getTicketById);

router.get('/status/:status', authenticate, getTicketsByStatus);

// Atualizar o status de um chamado (apenas usuários autenticados)
router.put('/:id', authenticate, updateTicketStatusAndDiagnostic);


router.delete('/:id', authenticate, deleteTicket);

export default router;
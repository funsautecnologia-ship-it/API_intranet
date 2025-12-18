import express from 'express';
import rateLimit from 'express-rate-limit';
import { createAgendamento, getAgendamentos, deleteAgendamento, updateAgendamento, getAgendamentosByDateTime, getAgendamentosByDate  } from '../controllers/agendamentoController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
const router = express.Router();

// Limite para criação pública de agendamentos
const createAgendamentoLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 10, // 10 criações por minuto por IP
  message: 'Muitas criações de agendamento. Tente novamente em alguns instantes.'
});
// Rota para criar um agendamento
router.post('/create', createAgendamentoLimiter, createAgendamento);
// Rota para obter todos os agendamentos
router.get('/', getAgendamentos); // Rota para obter todos os agendamentos
router.delete('/:id', authenticate, deleteAgendamento); // Deletar agendamento (autenticado)
// Rota para atualizar um agendamento pelo ID
router.put('/:id', authenticate, updateAgendamento); // Atualizar agendamento (autenticado)
router.get('/datetime', getAgendamentosByDateTime); // Rota para obter agendamentos por data e hora
router.get('/date', getAgendamentosByDate); // Rota para obter agendamentos por data
export default router;

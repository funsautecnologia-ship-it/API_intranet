import express from 'express';
import { createServicoTipo, getServicoTipos, getServicoTipoById, updateServicoTipo, deleteServicoTipo } from '../controllers/servicoTipoController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
const router = express.Router();

// Rota para criar um tipo de serviço (apenas administradores)
router.post('/create', authenticate, createServicoTipo);
// Rota para obter todos os tipos de serviço (qualquer usuário autenticado)
router.get('/', authenticate, getServicoTipos);
// Rota para obter um tipo de serviço por ID (qualquer usuário autenticado)
router.get('/:id', authenticate, getServicoTipoById);

// Rota para atualizar um tipo de serviço (apenas administradores)
router.put('/:id', authenticate, updateServicoTipo);
// Rota para deletar um tipo de serviço (apenas administradores)
router.delete('/:id', authenticate, deleteServicoTipo);

// Exporta o roteador para uso no servidor principal
export default router;



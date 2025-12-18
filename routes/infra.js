import express from "express";
import { createInfra,getInfras, getInfraById, updateInfra, deleteInfra } from '../controllers/infraController.js';
import { authenticate, authorizeAdmin } from '../middlewares/authMiddleware.js';

const router = express.Router();
router.post('/create', authenticate, authorizeAdmin, createInfra); // Criar infraestrutura (admin)
router.get('/', getInfras); // Listar infraestruturas (público)
router.put('/:id', authenticate, authorizeAdmin, updateInfra); // Atualizar (admin)
router.get('/:id', getInfraById); // Obter por ID (público)
router.delete('/:id', authenticate, authorizeAdmin, deleteInfra); // Deletar (admin)

export default router;
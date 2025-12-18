import express from "express";
import {createEquipamento, getEquipamentos, getEquipamentoById, updateEquipamento, deleteEquipamento } from "../controllers/equipamentoController.js";
import { authenticate, authorizeAdmin } from '../middlewares/authMiddleware.js';

const router = express.Router();
router.post('/create', authenticate, authorizeAdmin, createEquipamento); // Criar equipamento (admin)
router.get('/', getEquipamentos); // Listar equipamentos (público)
router.get('/:id', getEquipamentoById); // Obter equipamento por ID (público)
router.put('/:id', authenticate, authorizeAdmin, updateEquipamento); // Atualizar (admin)
router.delete('/:id', authenticate, authorizeAdmin, deleteEquipamento); // Deletar (admin)
export default router;
import express from 'express';
import { createSetor,getSetores, getSetorById, deleteSetor, updateSetor } from '../controllers/setorController.js';
import { authenticate} from '../middlewares/authMiddleware.js';


const router = express.Router();
// Rota para criar um setor (apenas administradores)
router.post('/create',authenticate, createSetor);
// Rota para obter todos os setores (qualquer usuário autenticado)
router.get('/',  getSetores);
// Rota para obter um setor por ID (qualquer usuário autenticado)
router.get('/:id', authenticate, getSetorById);
// Rota para atualizar um setor (apenas administradores)
router.put('/:id', authenticate, updateSetor);
// Rota para deletar um setor (apenas administradores)
router.delete('/:id', authenticate, deleteSetor);




// Exporta o roteador para uso no servidor principal
export default router;
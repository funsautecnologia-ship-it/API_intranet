import express  from 'express';
import User from '../models/User.js'; 
import { authenticate } from '../middlewares/authMiddleware.js';
import {updateUser, deleteUser, avatar  } from '../controllers/authController.js';
import upload from '../middlewares/uploadMiddleware.js';

const router = express.Router();

// Endpoint para retornar todos os usuários (exceto senha)
router.get('/', authenticate, async (req, res) => {
  try {
    const users = await User.find({}, { password: 0 }); // não retorna senha
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar usuários' });
  }
});

router.put('/:id',authenticate, updateUser); // Atualiza o usuário
router.post('/:id/avatar',upload.single('file') ,authenticate, avatar); // Atualiza o avatar do usuário
router.delete('/:id', authenticate, deleteUser); // Deleta o usuário

export default  router;
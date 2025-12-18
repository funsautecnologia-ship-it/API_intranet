import express from 'express';
import { getPendingComments, approveComment, deleteComment } from '../controllers/commentController.js';
import { authenticate, authorizeAdmin } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Rota para listar comentários pendentes de aprovação (somente administradores)
router.get('/pending', authenticate, authorizeAdmin, async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    try {
        const comments = await getPendingComments(page, limit);
        res.json(comments);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao buscar comentários pendentes' });
    }
});

// Aprovar um comentário (somente administradores)
router.put('/approve/:id', authenticate, authorizeAdmin, approveComment);

// Deletar um comentário (somente administradores)
router.delete('/:id', authenticate, authorizeAdmin, deleteComment);

export default router; // Exportação correta para ESM

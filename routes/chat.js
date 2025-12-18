import express from 'express';
import { authenticate } from '../middlewares/authMiddleware.js';
import { sendMessage, getMessages,markMessagesAsRead } from '../controllers/chatMessageController.js';
import User from '../models/User.js'; 
import { users } from '../server.js'; // Importa o objeto users do servidor

const router = express.Router();

router.post('/', authenticate, sendMessage);
router.get('/:userId', authenticate, getMessages);
router.put('/read', authenticate, markMessagesAsRead);

/*router.get('/api/online-users', async (req, res) => {
    try {
        const onlineUserIds = Object.keys(users);
        const onlineUsers = await User.find({ _id: { $in: onlineUserIds } }, 'name email');
        res.json(onlineUsers);
    } catch (err) {
        res.status(500).json({ message: 'Erro ao buscar usuários online.' });
    }
});*/

export default router;
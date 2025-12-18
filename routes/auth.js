import express from 'express';
import rateLimit from 'express-rate-limit';
import { login, register, loadSession,me,resetPassword,resetPasswordToken } from '../controllers/authController.js';
import { authenticate} from '../middlewares/authMiddleware.js';
//import { me } from '../controllers/authController.js';

const router = express.Router();

// Configuração de limite de requisições para evitar ataques de força bruta
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // Limite de 5 tentativas por IP
    message: 'Muitas tentativas de login. Tente novamente mais tarde.'
});

// Rotas de autenticação
router.post('/login', loginLimiter, login);
router.post('/register', register);
router.get('/me', authenticate, me);
router.get('/loadSession', authenticate, loadSession);
router.post('/reset-password',resetPassword);
router.post('/resetpassword/', resetPasswordToken);


export default router;
// middlewares/authMiddleware.js

import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import User from '../models/User.js';
dotenv.config();
const secret = process.env.JWT_SECRET ;

// Middleware para autenticação de usuários
export const authenticate = async (req, res, next) => {
    const token = req.header('Authorization');

    if (!token) {
        return res.status(401).json({ error: 'Acesso negado. Nenhum token fornecido.' });
    }

    try {
        const decoded = jwt.verify(token.replace('Bearer ', ''), secret);
        req.user = await User.findById(decoded.id).select('-password'); // Remove a senha dos dados do usuário
        if (!req.user) {
            return res.status(401).json({ error: 'Usuário não encontrado.' });
        }
        if (req.user.active === false) {
            return res.status(403).json({ error: 'Usuário inativo.' });
        }
        next();
    } catch (error) {
        res.status(400).json({ error: 'Token inválido.' });
    }
};

// Middleware para verificar se o usuário é administrador
export const authorizeAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ error: 'Acesso negado. Apenas administradores podem realizar essa ação.' });
    }
};

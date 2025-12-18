import express from 'express';
import { createEvent, getEvents, deleteEvent, getEventById } from '../controllers/eventController.js';
import upload from '../middlewares/uploadMiddleware.js';
import { authenticate} from '../middlewares/authMiddleware.js';
//import { authenticate, authorizeAdmin } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Rota para criar um evento (apenas usuários autenticados)
router.post('/create',upload.single('file'),authenticate, createEvent);

// Rota para buscar todos os eventos (público)
router.get('/',authenticate, getEvents);

// Rota para remover um evento (apenas criador ou administrador)
router.delete('/:id',authenticate,  deleteEvent);
router.get('/:id',authenticate, getEventById);
export default router;
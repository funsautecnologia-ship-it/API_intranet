import express from 'express';
import upload from '../middlewares/uploadMiddleware.js';
import { uploadFile,getFiles, deleteFile } from '../controllers/fileController.js';
import { authenticate} from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/upload', upload.single('file'),authenticate, uploadFile); // 'file' é o nome do campo no formulário
router.get('/', authenticate, getFiles);
router.delete('/remove/:id',authenticate, deleteFile); 
// rota para deletar arquivos

export default router;
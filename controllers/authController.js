import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import validator from 'validator';
import dotenv from 'dotenv';
dotenv.config();
const secret = process.env.JWT_SECRET || '2514301ec89fbed758da35d85a27f042';
import User from '../models/User.js';
import { uploadToGoogleDrive, uploadBufferToGoogleDrive, setFilePublic,} from '../services/googleDriveService.js';
import { google } from 'googleapis';
import fs from 'fs';

import{Resend} from 'resend';


// Registro de usuário
/**
 * Registra um novo usuário.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const register = async (req, res) => {
    try {
        const { name, email, password, role,endereco } = req.body;

        // Validação de e-mail
        if (!email || !validator.isEmail(email)) {
            return res.status(400).json({ message: 'E-mail inválido.' });
        }

        // Verifica se o usuário já existe
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'E-mail já cadastrado.' });
        }

        // Hash da senha antes de salvar
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Cria novo usuário
        const newUser = new User({ name, email, password: hashedPassword, role,endereco });
        await newUser.save();

        res.status(201).json({ message: 'Usuário registrado com sucesso.' });
    } catch (error) {
        res.status(500).json({ message: 'Erro no registro.', error: error.message });
    }
};

// Login de usuário
/**
 * Realiza o login do usuário.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const emailNorm = String(email || '').toLowerCase().trim();

        // Verifica se o usuário existe
        const user = await User.findOne({ email: emailNorm });
        if (!user) {
            return res.status(400).json({ message: 'Credenciais inválidas.' });
        }

        // Compara a senha informada com o hash armazenado
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Credenciais inválidas.' });
        }

        // Bloqueia login para usuários inativos
        if (user.active === false) {
            return res.status(403).json({ message: 'Usuário inativo.' });
        }

        // Gera token JWT
        const token = jwt.sign({ id: user._id, role: user.role }, secret, { expiresIn: '1h' });

        res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
    } catch (error) {
        res.status(500).json({ message: 'Erro no login.', error: error.message });
    }
};

/**
 * Retorna os dados do usuário autenticado.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const me = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user); // Retorna os dados do usuário autenticado
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar usuário.', error: error.message });
    }
};

/**
 * Carrega a sessão do usuário autenticado via token JWT.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const loadSession = async (req, res) => {
    try {
        // Verifica se o token foi enviado no cabeçalho Authorization
        const token = req.header('Authorization');
        if (!token) {
            return res.status(401).json({ message: 'Token não fornecido.' });
        }

        console.log('Authorization header:', req.header('Authorization'));

        // Remove o prefixo "Bearer " do token e verifica sua validade
        const decoded = jwt.verify(token.replace('Bearer ', ''), secret);

        // Busca o usuário no banco de dados pelo ID decodificado
        const user = await User.findById(decoded.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        // Retorna os dados do usuário autenticado
        res.json({ user });
    } catch (error) {
        res.status(401).json({ message: 'Token inválido ou expirado.', error: error.message });
    }
};

/**
 * Atualiza os dados de um usuário.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, password, role, endereco, active } = req.body;

        // Verifica se o usuário existe
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        // Atualiza os dados do usuário
        user.name = name || user.name;
        user.email = email || user.email;
        user.role = role || user.role;
        if (typeof active !== 'undefined') {
            user.active = Boolean(active);
        }
        user.endereco = endereco || user.endereco;

        // Se a senha for fornecida, faz o hash antes de salvar
        if (password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);
        }

        await user.save();

        res.json({ message: 'Usuário atualizado com sucesso.' });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao atualizar usuário.' });
    }
};
/**
 * Remove um usuário do banco de dados.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        // Verifica se o usuário existe
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        // Remove o usuário do banco de dados
        await user.remove();

        res.json({ message: 'Usuário removido com sucesso.' });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao remover usuário.', error: error.message });
    }
};
/**
 * Envia e-mail para redefinição de senha.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const resetPassword = async (req, res) => {
   
    try {
        const { email } = req.body;
        
        // Validação de e-mail
        if (!email || !validator.isEmail(email)) {
            return res.status(400).json({ message: 'E-mail inválido.' });
        }
        
        
        // Verifica se o usuário já existe
        const existingUser = await User.findOne({ email });
        console.log('existingUser:', existingUser);
        if (!existingUser) { 
            return res.status(400).json({ message: 'E-mail não cadastrado.' });
        }
       
      
        // Gera um token de redefinição de senha
        const resetToken = jwt.sign({ id: existingUser._id }, secret, { expiresIn: '1h' });
        
      
        console.log('resetToken:', resetToken);
        // Aqui você deve enviar o token para o e-mail do usuário
       const resend = new Resend(process.env.RESEND_API_KEY || 're_KXb4YzLc_46a28c5HkrJfbmjxXKkhXEt4');
        

        resend.emails.send({
            from: 'onboarding@resend.dev',
            to: email,
            subject: 'Redefinição de Senha',
            html: `<p>Olá,</p>
                   <p>Você solicitou a redefinição de senha. Clique no link abaixo para redefinir sua senha:</p>
                   <a href="https://intra-hsp.onrender.com/reset-password/${resetToken}">Redefinir Senha</a>
                   <p>Se você não solicitou essa alteração, ignore este e-mail.</p>`,
            });
            res.json({ message: 'E-mail de redefinição de senha enviado com sucesso.' });


    }
    catch (error) {
        res.status(500).json({ message: 'Erro ao redefinir senha.', error: error.message });
    }
};
/**
 * Altera a senha do usuário autenticado.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const changePassword = async (req, res) => {
    try {
        const { id } = req.params;
        const { oldPassword, newPassword } = req.body;

        // Verifica se o usuário existe
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        // Verifica se a senha antiga está correta
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Senha antiga incorreta.' });
        }

        // Atualiza a senha
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        res.json({ message: 'Senha alterada com sucesso.' });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao alterar senha.', error: error.message });
    }
};

/**
 * Redefine a senha usando o token enviado por e-mail.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const resetPasswordToken = async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        if (!token || !newPassword) {
            return res.status(400).json({ message: 'Token e nova senha são obrigatórios.' });
        }

        // Verifica e decodifica o token
        let decoded;
        try {
            decoded = jwt.verify(token, secret);
        } catch (err) {
            return res.status(400).json({ message: 'Token inválido ou expirado.' });
        }

        // Busca o usuário pelo ID do token
        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }

        // Atualiza a senha
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        res.json({ message: 'Senha redefinida com sucesso.' });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao redefinir senha.', error: error.message });
    }
};
/**
 * Atualiza o avatar do usuário com upload para o Google Drive.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const avatar = async (req, res) => {
    try {
        const { id } = req.params;
        console.log('ID do usuário:', id);
        // Verifica se o usuário existe
        const user = await User.findById(id);
        console.log('Usuário encontrado:', user);
        console.log('Arquivo recebido:', req.file);
        if (!user) {
            console.log('Usuário não encontrado.');
          
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        } 
        // Verifica se o arquivo foi enviado
        if (!req.file) {
            console.log('Nenhum arquivo enviado.');
            return res.status(400).json({ message: 'Nenhum arquivo enviado.' });
        }
        const fileData = await uploadToGoogleDrive(req.file.path, req.file.originalname);
        console.log('Dados do arquivo:', fileData);
        // Define permissões públicas para o arquivo
        await setFilePublic(fileData.id);
        console.log('ID do arquivo no Google Drive:', fileData.id);
        console.log('URL de download:', 'https://drive.google.com/uc?id=' + fileData.id);
        console.log('URL de visualização:', 'https://drive.google.com/file/d/' + fileData.id + '/view');
        // Remove o arquivo local após o upload
        fs.unlinkSync(req.file.path);
        // Atualiza o avatar com a URL do Google Drive
        user.avatar = 'https://drive.google.com/thumbnail?id=' + fileData.id;
        // Salva o usuário com o novo avatar
        await user.save();
        res.json({ message: 'Avatar atualizado com sucesso.', avatar: user.avatar });
       
    }
    catch (error) {
        res.status(500).json({ message: 'Erro ao atualizar avatar.', error: error.message });
    }
}



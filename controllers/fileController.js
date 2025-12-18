import File from '../models/File.js';
import { uploadToGoogleDrive, setFilePublic } from '../services/googleDriveService.js';
import { google } from 'googleapis';
import fs from 'fs';

/**
 * Faz upload de um arquivo para o Google Drive e salva os dados no banco.
 * Apenas administradores podem realizar esta ação.
 * @param {import('express').Request} req - Requisição HTTP contendo o arquivo.
 * @param {import('express').Response} res - Resposta HTTP.
 */
export const uploadFile = async (req, res) => {
    try {
        console.log('Arquivo recebido:', req.file); // Log para depuração
        console.log('Tipo de arquivo:', req.body.filename); // Log para depuração
        if (!req.file) {
            return res.status(400).json({ message: 'Nenhum arquivo enviado.' });
        }

        const fileName = req.file.originalname;
        // Faz upload do arquivo para o Google Drive
        const fileData = await uploadToGoogleDrive(req.file.path, fileName);

        // Define permissões públicas para o arquivo
        await setFilePublic(fileData.id);

        console.log('ID do arquivo no Google Drive:', fileData.id);
        console.log('URL de download:', 'https://drive.google.com/uc?id=' + fileData.id);
        console.log('URL de visualização:', 'https://drive.google.com/file/d/' + fileData.id + '/view');

        // Salva os detalhes do arquivo no banco de dados
       
        const newFile = new File({
            titulo: req.body.filename,
            name: fileData.name,
            idgoogle: 'https://drive.google.com/thumbnail?id='+ fileData.id,
            url: 'https://drive.google.com/uc?id=' + fileData.id,
            urlView: 'https://drive.google.com/file/d/' + fileData.id + '/view',
            size: fileData.size,
        });

        console.log('Arquivo salvo:', newFile); // Log para depuração

        await newFile.save();

        // Remove o arquivo local após o upload
        fs.unlinkSync(req.file.path);

        res.status(201).json({ message: 'Arquivo enviado com sucesso.', file: newFile });
    } catch (error) {
        console.error('Erro ao enviar arquivo para o Google Drive:', error.message);
        res.status(500).json({ message: 'Erro ao enviar arquivo.', error: error.message });
    }
};

/**
 * Lista todos os arquivos cadastrados.
 * Disponível para todos os usuários autenticados.
 * @param {import('express').Request} req - Requisição HTTP.
 * @param {import('express').Response} res - Resposta HTTP.
 */
export const getFiles = async (req, res) => {
    try {
        const files = await File.find().populate();
        res.json(files);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar arquivos.', error: error.message });
    }
};

/**
 * Deleta um arquivo do Google Drive e do banco de dados.
 * Apenas administradores podem realizar esta ação.
 * @param {import('express').Request} req - Requisição HTTP contendo o ID do arquivo.
 * @param {import('express').Response} res - Resposta HTTP.
 */
export const deleteFile = async (req, res) => {
    try {
        const { id } = req.params;

        // Busca o arquivo no banco de dados
        const file = await File.findById(id);
        if (!file) {
            return res.status(404).json({ message: 'Arquivo não encontrado.' });
        }

        // Remove o arquivo do Google Drive
        const drive = google.drive({ version: 'v3', auth: new google.auth.GoogleAuth({
            keyFile: './credentials.json',
            scopes: ['https://www.googleapis.com/auth/drive'],
        }) });

        await drive.files.delete({ fileId: file.url.split('id=')[1] });

        // Remove o arquivo do banco de dados
        await File.findByIdAndDelete(id);
        console.log('Arquivo deletado:', file); // Log para depuração

        res.status(200).json({ message: 'Arquivo deletado com sucesso.' });
    } catch (error) {
        console.error('Erro ao deletar arquivo:', error.message);
        res.status(500).json({ message: 'Erro ao deletar arquivo.', error: error.message });
    }
};



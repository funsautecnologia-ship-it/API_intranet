import Event from '../models/Event.js';
import { uploadToGoogleDrive, setFilePublic } from '../services/googleDriveService.js';
import { google } from 'googleapis';
import fs from 'fs';

/**
 * Cria um evento com upload de foto para o Google Drive.
 * @param {import('express').Request} req - Requisição HTTP contendo os dados do evento e o arquivo.
 * @param {import('express').Response} res - Resposta HTTP.
 */
export const createEvent = async (req, res) => {
    try {
        const { title, description } = req.body;
        console.log('Dados do evento:', req.body); // Log para depuração

        // Verifica se os campos obrigatórios foram fornecidos
        if (!title || !description) {
            return res.status(400).json({ message: 'Título e descricao são obrigatórios.' });
        }

        // Faz upload do arquivo para o Google Drive
        const fileData = await uploadToGoogleDrive(req.file.path, req.file.originalname);

        // Define permissões públicas para o arquivo
        await setFilePublic(fileData.id);

        console.log('ID do arquivo no Google Drive:', fileData.id);
        console.log('URL de download:', 'https://drive.google.com/uc?id=' + fileData.id);
        console.log('URL de visualização:', 'https://drive.google.com/file/d/' + fileData.id + '/view');

        // Cria o evento
        const event = new Event({
            title,
            description,
            img: 'https://drive.google.com/thumbnail?id=' + fileData.id,
        });

        await event.save();

        // Remove o arquivo local após o upload
        fs.unlinkSync(req.file.path);

        res.status(201).json({ message: 'Evento criado com sucesso.', event });
    } catch (error) {
        console.error('Erro ao criar evento:', error.message);
        res.status(500).json({ message: 'Erro ao criar evento.', error: error.message });
    }
};

/**
 * Busca todos os eventos cadastrados.
 * @param {import('express').Request} req - Requisição HTTP.
 * @param {import('express').Response} res - Resposta HTTP.
 */
export const getEvents = async (req, res) => {
    try {
        const events = await Event.find().populate(); 
        res.status(200).json(events);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar eventos.', error: error.message });
    }
};

/**
 * Remove um evento pelo ID, incluindo o arquivo do Google Drive.
 * @param {import('express').Request} req - Requisição HTTP contendo o ID do evento.
 * @param {import('express').Response} res - Resposta HTTP.
 */
export const deleteEvent = async (req, res) => {
    try {
        const { id } = req.params;
        console.log('ID do evento:', id); // Log para depuração

        // Verifica se o evento existe
        const event = await Event.findById(id);
        if (!event) {
            
            return res.status(404).json({ message: 'Evento não encontrado.' });
        }

        // Remove o arquivo do Google Drive
        const drive = google.drive({ version: 'v3', auth: new google.auth.GoogleAuth({
            keyFile: './credentials.json',
            scopes: ['https://www.googleapis.com/auth/drive'],
        }) });

        await drive.files.delete({
            fileId: event.img.split('id=')[1],
        });
        // Verifica se o usuário autenticado é o criador do evento ou um administrador
       //if (event.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            //return res.status(403).json({ message: 'Acesso negado. Você não pode remover este evento.' });
        //}

        await Event.findByIdAndDelete(id);
        res.status(200).json({ message: 'Evento removido com sucesso.' });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao remover evento.', error: error.message });
    }
};

/**
 * Busca um evento pelo ID.
 * @param {import('express').Request} req - Requisição HTTP contendo o ID do evento.
 * @param {import('express').Response} res - Resposta HTTP.
 */
export const getEventById = async (req, res) => {
    try {
        const { id } = req.params;

        // Busca o evento no banco de dados pelo ID
        const event = await Event.findById(id);
        if (!event) {
            return res.status(404).json({ message: 'Evento não encontrado.' });
        }

        res.status(200).json(event);
    } catch (error) {
        console.error('Erro ao buscar evento:', error.message);
        res.status(500).json({ message: 'Erro ao buscar evento.', error: error.message });
    }
};

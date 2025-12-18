import fs from 'fs';
import { google } from 'googleapis';

const auth = new google.auth.GoogleAuth({
    keyFile: './credentials.json',
    scopes: ['https://www.googleapis.com/auth/drive'],
});

const drive = google.drive({ version: 'v3', auth });

export const uploadToGoogleDrive = async (filePath, fileName) => {
    try {
        console.log('Iniciando upload para o Google Drive...');
        console.log('Nome do arquivo:', fileName);

        const fileStream = fs.createReadStream(filePath);

        const response = await drive.files.create({
            requestBody: {
                name: fileName,
                mimeType: 'application/octet-stream',
                parents: ['1EMYtspsBZ17bxj0dEb7ZzvgGq6FuG6yZ'],
            },
            media: {
                mimeType: 'application/octet-stream',
                body: fileStream,
            },
        });

        console.log('Upload concluído com sucesso:', response.data);
        return response.data;
    } catch (error) {
        console.error('Erro ao enviar arquivo para o Google Drive:', error.response?.data || error.message);
        throw error;
    }
};

export const uploadBufferToGoogleDrive = async (buffer, fileName, mimeType = 'application/octet-stream') => {
    try {
        const response = await drive.files.create({
            requestBody: {
                name: fileName,
                mimeType,
                parents: ['1EMYtspsBZ17bxj0dEb7ZzvgGq6FuG6yZ'],
            },
            media: {
                mimeType,
                body: Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer),
            },
        });
        return response.data;
    } catch (error) {
        throw error;
    }
};

export const setFilePublic = async (fileId) => {
    try {
        console.log(`Definindo permissões públicas para o arquivo: ${fileId}`);
        await drive.permissions.create({
            fileId: fileId,
            requestBody: {
                role: 'reader',
                type: 'anyone',
            },
        });
        console.log(`Permissões públicas definidas com sucesso.`);
    } catch (error) {
        console.error('Erro ao definir permissões públicas:', error.message);
        throw error;
    }
};

export default { uploadToGoogleDrive, uploadBufferToGoogleDrive, setFilePublic };

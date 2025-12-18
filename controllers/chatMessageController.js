import ChatMessage from '../models/ChatMessage.js';
import crypto from 'crypto';

const algorithm = 'aes-256-cbc';
const secretKey = '12345678901234567890123456789012'; // 32 caracteres
const iv = crypto.randomBytes(16);

/**
 * Criptografa uma mensagem de texto.
 * @param {string} text - Texto a ser criptografado.
 * @returns {string} Mensagem criptografada.
 */
function encrypt(text) {
    const cipher = crypto.createCipheriv(algorithm, Buffer.from(secretKey), iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
}

/**
 * Descriptografa uma mensagem de texto.
 * @param {string} text - Texto criptografado.
 * @returns {string} Mensagem descriptografada.
 */
function decrypt(text) {
    const parts = text.split(':');
    const iv = Buffer.from(parts.shift(), 'hex');
    const encryptedText = parts.join(':');
    const decipher = crypto.createDecipheriv(algorithm, Buffer.from(secretKey), iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

/**
 * Envia uma mensagem criptografada entre usuários.
 * @param {string} to - ID do destinatário.
 * @param {string} from - ID do remetente.
 * @param {string} message - Conteúdo da mensagem.
 * @returns {Promise<void>}
 */
export const sendMessage = async (to, from, message) => {
    try {
        const encryptedMsg = encrypt(message);
        await ChatMessage.create({
            sender: from,
            receiver: to,
            message: encryptedMsg
        });
        console.log('Mensagem salva no banco de dados:', { sender: from, receiver: to, message });
    } catch (err) {
        console.error('Erro ao salvar mensagem:', err);
    }
};

/**
 * Busca todas as mensagens trocadas entre o usuário autenticado e outro usuário.
 * Descriptografa as mensagens antes de retornar.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const getMessages = async (req, res) => {
    try {
        const { userId } = req.params;
        const messages = await ChatMessage.find({
            $or: [
                { sender: req.user._id, receiver: userId },
                { sender: userId, receiver: req.user._id }
            ]
        }).sort('createdAt');
        // Descriptografa as mensagens antes de enviar
        const decryptedMessages = messages.map(msg => ({
        ...msg._doc,
        message: decrypt(msg.message),
        read: msg.read
        }));

        res.json(decryptedMessages);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar mensagens.', error: error.message });
        console.error('Erro ao buscar mensagens:', error.message);
    }

};

/**
 * Marca como lidas todas as mensagens enviadas de um usuário para o usuário autenticado.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const markMessagesAsRead = async (req, res) => {
  const { from } = req.body; // Quem enviou
  const to = req.user._id;   // Quem está lendo

  try {
    await ChatMessage.updateMany(
      { sender: from, receiver: to, read: false },
      { $set: { read: true } }
    );
    res.status(200).json({ message: 'Mensagens marcadas como lidas.' });
  } catch (err) {
    console.error('Erro ao marcar como lidas:', err.message);
    res.status(500).json({ message: 'Erro ao marcar mensagens como lidas.' });
  }
};
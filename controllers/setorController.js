import Setor from '../models/Setor.js';
import Ticket from '../models/Ticket.js';


/** * Cria um novo setor.
 * @param {import('express').Request} req - Requisição HTTP contendo os dados do setor.
 * @param {import('express').Response} res - Resposta HTTP.
 */ 
export const createSetor = async (req, res) => {

    console.log('Dados recebidos para criar setor:', req.body); // Log para depuração
    try {
        const { nome } = req.body;

        if (!nome) {
            return res.status(400).json({ message: 'Nome do setor é obrigatório.' });
        }

        const setor = new Setor({ nome });
        await setor.save();

        res.status(201).json({ message: 'Setor criado com sucesso.', setor });
    } catch (error) {
        console.error('Erro ao criar setor:', error.message);
        res.status(500).json({ message: 'Erro ao criar setor.', error: error.message });
    }
}  

/**
 * Obtém todos os setores.
 * @param {import('express').Request} req - Requisição HTTP.
 * @param {import('express').Response} res - Resposta HTTP.
 */

export const getSetores = async (req, res) => {
    try {
        const setores = await Setor.find().lean();
        const ids = setores.map(s => s._id);
        const agg = await Ticket.aggregate([
            { $match: { setor: { $in: ids } } },
            { $group: { _id: '$setor', count: { $sum: 1 } } }
        ]);
        const counts = new Map(agg.map(r => [String(r._id), r.count]));
        const enriched = setores.map(s => ({
            ...s,
            hasTickets: counts.get(String(s._id)) > 0
        }));
        res.status(200).json(enriched);
    } catch (error) {
        console.error('Erro ao obter setores:', error.message);
        res.status(500).json({ message: 'Erro ao obter setores.', error: error.message });
    }
}

/**
 * Obtém um setor pelo ID.
 * @param {import('express').Request} req - Requisição HTTP contendo o ID do setor.
 * @param {import('express').Response} res - Resposta HTTP.
 */
export const getSetorById = async (req, res) => {
    const { id } = req.params;

    try {
        const setor = await Setor.findById(id);
        if (!setor) {
            return res.status(404).json({ message: 'Setor não encontrado.' });
        }
        res.status(200).json(setor);
    } catch (error) {
        console.error('Erro ao obter setor:', error.message);
        res.status(500).json({ message: 'Erro ao obter setor.', error: error.message });
    }
}

/**
 * Atualiza um setor pelo ID.
 * @param {import('express').Request} req - Requisição HTTP contendo o ID do setor e os dados a serem atualizados.
 * @param {import('express').Response} res - Resposta HTTP.
 */
export const updateSetor = async (req, res) => {
    const { id } = req.params;
    const { nome, active } = req.body;

    try {
        const update = {};
        if (typeof nome === 'string' && nome.trim() !== '') update.nome = nome;
        if (typeof active === 'boolean') update.active = active;

        if (Object.keys(update).length === 0) {
            return res.status(400).json({ message: 'Nenhum campo válido para atualizar.' });
        }

        const setor = await Setor.findByIdAndUpdate(id, update, { new: true });
        if (!setor) {
            return res.status(404).json({ message: 'Setor não encontrado.' });
        }
        res.status(200).json({ message: 'Setor atualizado com sucesso.', setor });
    } catch (error) {
        console.error('Erro ao atualizar setor:', error.message);
        res.status(500).json({ message: 'Erro ao atualizar setor.', error: error.message });
    }
}
/**
 * Exclui um setor pelo ID.
 * @param {import('express').Request} req - Requisição HTTP contendo o ID do setor.
 * @param {import('express').Response} res - Resposta HTTP.
 */

export const deleteSetor = async (req, res) => {
    const { id } = req.params;

    try {
        const vinculados = await Ticket.exists({ setor: id });
        if (vinculados) {
            return res.status(409).json({ message: 'Setor vinculado a chamados não pode ser excluído.' });
        }
        const setor = await Setor.findByIdAndDelete(id);
        if (!setor) {
            return res.status(404).json({ message: 'Setor não encontrado.' });
        }
        res.status(200).json({ message: 'Setor excluído com sucesso.' });
    } catch (error) {
        console.error('Erro ao excluir setor:', error.message);
        res.status(500).json({ message: 'Erro ao excluir setor.', error: error.message });
    }
}

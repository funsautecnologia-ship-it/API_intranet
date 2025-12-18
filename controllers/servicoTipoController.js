import ServicoTipo from '../models/ServicoTipo.js'; // Importa o modelo de TipoServico
import Ticket from '../models/Ticket.js';

/**
 * Cria um novo tipo de serviço.
 * @param {import('express').Request} req - Requisição HTTP contendo os dados do tipo de serviço.   
 * @param {import('express').Response} res - Resposta HTTP.
 */
export const createServicoTipo = async (req, res) => {
    try {
        const { nome, descricao } = req.body;

        if (!nome) {
            return res.status(400).json({ message: 'Nome do tipo de serviço é obrigatório.' });
        }

        const servicoTipo = new ServicoTipo({ nome, descricao });
        await servicoTipo.save();

        res.status(201).json({ message: 'Tipo de serviço criado com sucesso.', servicoTipo });
    } catch (error) {
        console.error('Erro ao criar tipo de serviço:', error.message);
        res.status(500).json({ message: 'Erro ao criar tipo de serviço.', error: error.message });
    }
};

/**
 * Obtém todos os tipos de serviço. 
 * @param {import('express').Request} req - Requisição HTTP.
 * @param {import('express').Response} res - Resposta HTTP.
 *  */
export const getServicoTipos = async (req, res) => {
    try {
        const tipos = await ServicoTipo.find().lean();
        const ids = tipos.map(t => t._id);
        const agg = await Ticket.aggregate([
            { $match: { servicoTipo: { $in: ids } } },
            { $group: { _id: '$servicoTipo', count: { $sum: 1 } } }
        ]);
        const counts = new Map(agg.map(r => [String(r._id), r.count]));
        const enriched = tipos.map(t => ({
            ...t,
            hasTickets: counts.get(String(t._id)) > 0
        }));
        res.status(200).json(enriched);
    } catch (error) {
        console.error('Erro ao obter tipos de serviço:', error.message);
        res.status(500).json({ message: 'Erro ao obter tipos de serviço.', error: error.message });
    }
};

/**
 * Obtém um tipo de serviço pelo ID.
 *  * @param {import('express').Request} req - Requisição HTTP contendo o ID do tipo de serviço.
 * @param {import('express').Response} res - Resposta HTTP.
 */
export const getServicoTipoById = async (req, res) => {
    const { id } = req.params;

    try {
        const servicoTipo = await ServicoTipo.findById(id);
        if (!servicoTipo) {
            return res.status(404).json({ message: 'Tipo de serviço não encontrado.' });
        }
        res.status(200).json(servicoTipo);
    } catch (error) {
        console.error('Erro ao obter tipo de serviço:', error.message);
        res.status(500).json({ message: 'Erro ao obter tipo de serviço.', error: error.message });
    }
};

/**
 * Atualiza um tipo de serviço pelo ID.
 * @param {import('express').Request} req - Requisição HTTP contendo o ID do tipo de serviço e os dados a serem atualizados.
 * @param {import('express').Response} res - Resposta HTTP.
 */ 
export const updateServicoTipo = async (req, res) => {
    const { id } = req.params;
    const { nome } = req.body;
    const { descricao } = req.body;

    try {
        const servicoTipo = await ServicoTipo.findById(id);
        if (!servicoTipo) {
            return res.status(404).json({ message: 'Tipo de serviço não encontrado.' });
        }   
        servicoTipo.nome = nome;
        servicoTipo.descricao = descricao;
        await servicoTipo.save();
        res.status(200).json({ message: 'Tipo de serviço atualizado com sucesso.', servicoTipo });
    } catch (error) {
        console.error('Erro ao atualizar tipo de serviço:', error.message);
        res.status(500).json({ message: 'Erro ao atualizar tipo de serviço.', error: error.message });
    }   
};
/**
 * Deleta um tipo de serviço pelo ID.
 * @param {import('express').Request} req - Requisição HTTP contendo o ID do tipo de serviço.
 * @param {import('express').Response} res - Resposta HTTP.
 */
export const deleteServicoTipo = async (req, res) => {
    const { id } = req.params;
    console.log('ID recebido para exclusão:', id);
    try {
        const vinculados = await Ticket.exists({ servicoTipo: id });
        if (vinculados) {
            return res.status(409).json({ message: 'Tipo de serviço vinculado a chamados não pode ser excluído.' });
        }
        const servicoTipo = await ServicoTipo.findByIdAndDelete(id);
        if (!servicoTipo) {
            return res.status(404).json({ message: 'Tipo de serviço não encontrado.' });
        }
        res.status(200).json({ message: 'Tipo de serviço deletado com sucesso.' });
    } catch (error) {
        console.error('Erro ao deletar tipo de serviço:', error.message);
        res.status(500).json({ message: 'Erro ao deletar tipo de serviço.', error: error.message });
    }
};

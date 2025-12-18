import Equipamentos from "../models/Equipamentos.js";
import Agendamento from "../models/Agendamento.js";

/** * Cria um novo equipamento.
 * @param {import('express').Request} req - Requisição HTTP contendo os dados do equipamento.
 * @param {import('express').Response} res - Resposta HTTP. 
 * */
export const createEquipamento= async (req, res) => {
    const { nome, descricao, quantidade } = req.body;
    console.log('Dados recebidos para criação de equipamento:', { nome, descricao, quantidade });

    try {
        const equipamento = new Equipamentos({ nome, descricao,  quantidade });
        await equipamento.save();
        res.status(201).json({ message: 'Equipamento criado com sucesso.', equipamento });
    } catch (error) {
        console.error('Erro ao criar equipamento:', error.message);
        res.status(500).json({ message: 'Erro ao criar equipamento.', error: error.message });
    }
};

/** * Obtém todos os equipamentos.
 * @param {import('express').Request} req - Requisição HTTP.
 * @param {import('express').Response} res - Resposta HTTP.
 * */
export const getEquipamentos= async (req, res) => {
    try {
        const equipamentos = await Equipamentos.find().lean();
        const ids = equipamentos.map(e => e._id);
        const agg = await Agendamento.aggregate([
            { $match: { Equipamentos: { $in: ids } } },
            { $unwind: '$Equipamentos' },
            { $match: { Equipamentos: { $in: ids } } },
            { $group: { _id: '$Equipamentos', count: { $sum: 1 } } }
        ]);
        const counts = new Map(agg.map(r => [String(r._id), r.count]));
        const enriched = equipamentos.map(e => ({
            ...e,
            hasAgendamentos: counts.get(String(e._id)) > 0
        }));
        res.status(200).json(enriched);

    }
    catch (error) {
        console.error('Erro ao obter equipamentos:', error.message);
        res.status(500).json({ message: 'Erro ao obter equipamentos.', error: error.message });
    }
};

/** * Obtém um equipamento pelo ID.
 * @param {import('express').Request} req - Requisição HTTP contendo o ID do equipamento.
 *  * @param {import('express').Response} res - Resposta HTTP.
 * */
export const getEquipamentoById = async (req, res) => {
    const { id } = req.params;

    try {
        const equipamento = await Equipamentos.findById(id);
        if (!equipamento) {
            return res.status(404).json({ message: 'Equipamento não encontrado.' });
        }
        res.status(200).json(equipamento);
    } catch (error) {
        console.error('Erro ao obter equipamento:', error.message);
        res.status(500).json({ message: 'Erro ao obter equipamento.', error: error.message });
    }
};

/** * Atualiza um equipamento pelo ID.
 * @param {import('express').Request} req - Requisição HTTP contendo o ID do equipamento e os dados a serem atualizados.
 *  
 * @param {import('express').Response} res - Resposta HTTP.
 * */
export const updateEquipamento = async (req, res) => {
    const { id } = req.params;
    const { nome, descricao, quantidade } = req.body;

    try {
        const equipamento = await Equipamentos.findByIdAndUpdate(id, { nome, descricao, quantidade }, { new: true });
        if (!equipamento) {
            return res.status(404).json({ message: 'Equipamento não encontrado.' });
        }
        res.status(200).json({ message: 'Equipamento atualizado com sucesso.', equipamento });
    } catch (error) {
        console.error('Erro ao atualizar equipamento:', error.message);
        res.status(500).json({ message: 'Erro ao atualizar equipamento.', error: error.message });
    }
};

/** * Deleta um equipamento pelo ID.
 * @param {import('express').Request} req - Requisição HTTP contendo o ID do equipamento.
 * @param {import('express').Response} res - Resposta HTTP.
 * */
export const deleteEquipamento = async (req, res) => {
    const { id } = req.params;
    console.log('Deletando equipamento com ID:', id);

    try {
        const vinculos = await Agendamento.exists({ Equipamentos: id });
        if (vinculos) {
            return res.status(409).json({ message: 'Equipamento vinculado a agendamentos não pode ser excluído.' });
        }
        const equipamento = await Equipamentos.findByIdAndDelete(id);
        if (!equipamento) {
            return res.status(404).json({ message: 'Equipamento não encontrado.' });
        }
        res.status(200).json({ message: 'Equipamento deletado com sucesso.' });
    } catch (error) {
        console.error('Erro ao deletar equipamento:', error.message);
        res.status(500).json({ message: 'Erro ao deletar equipamento.', error: error.message });
    }
};

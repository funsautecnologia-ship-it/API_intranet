import Infra from "../models/Infra.js";
import Agendamento from "../models/Agendamento.js";

/** * Cria uma nova infraestrutura.
 * @param {import('express').Request} req - Requisição HTTP contendo os dados da infraestrutura.
 * @param {import('express').Response} res - Resposta HTTP.
 * */
export const createInfra = async (req, res) => {
    const dados = req.body.infra;
    console.log('Dados recebidos para criação de infraestrutura:', dados);
   

    try {
        const infra = new Infra(dados);
        await infra.save();
        res.status(201).json({ message: 'Infraestrutura criada com sucesso.', infra});
    } catch (error) {
        console.error('Erro ao criar infraestrutura:', error.message);
        res.status(500).json({ message: 'Erro ao criar infraestrutura.', error: error.message });
    }
};

/** * Obtém todas as infraestruturas.
 * @param {import('express').Request} req - Requisição HTTP.
 * @param {import('express').Response} res - Resposta HTTP.
 * */

export const getInfras = async (req, res) => {
    try {
        const infras = await Infra.find().lean();
        const ids = infras.map(i => i._id);
        const agg = await Agendamento.aggregate([
            { $match: { Infra: { $in: ids } } },
            { $group: { _id: '$Infra', count: { $sum: 1 } } }
        ]);
        const counts = new Map(agg.map(r => [String(r._id), r.count]));
        const enriched = infras.map(i => ({
            ...i,
            hasAgendamentos: counts.get(String(i._id)) > 0
        }));
        res.status(200).json(enriched);
    } catch (error) {
        console.error('Erro ao obter infraestruturas:', error.message);
        res.status(500).json({ message: 'Erro ao obter infraestruturas.', error: error.message });
    }
};

/** * Obtém uma infraestrutura pelo ID.
 * @param {import('express').Request} req - Requisição HTTP contendo o ID da infraestrutura.
 * @param {import('express').Response} res - Resposta HTTP.
 * */

export const getInfraById = async (req, res) => {
    const { id } = req.params;

    try {
        const infra = await Infra.findById(id);
        if (!infra) {
            return res.status(404).json({ message: 'Infraestrutura não encontrada.' });
        }
        res.status(200).json(infra);
    } catch (error) {
        console.error('Erro ao obter infraestrutura:', error.message);
        res.status(500).json({ message: 'Erro ao obter infraestrutura.', error: error.message });
    }
};

/** * Atualiza uma infraestrutura pelo ID.
 * @param {import('express').Request} req - Requisição HTTP contendo o ID da infraestrutura e os dados a serem atualizados.
 * @param {import('express').Response} res - Resposta HTTP.
 *  */

export const updateInfra = async (req, res) => {
    const { id } = req.params;
    const { nome, descricao } = req.body;

    try {
        const infra = await Infra.findByIdAndUpdate(id, { nome, descricao }, { new: true });
        if (!infra) {
            return res.status(404).json({ message: 'Infraestrutura não encontrada.' });
        }
        res.status(200).json({ message: 'Infraestrutura atualizada com sucesso.', infra });
    } catch (error) {
        console.error('Erro ao atualizar infraestrutura:', error.message);
        res.status(500).json({ message: 'Erro ao atualizar infraestrutura.', error: error.message });
    }
};
/** * Deleta uma infraestrutura pelo ID.
 * @param {import('express').Request} req - Requisição HTTP contendo o ID da infraestrutura.
 * @param {import('express').Response} res - Resposta HTTP.
 *  
 * */   

export const deleteInfra = async (req, res) => {
    const { id } = req.params;

    try {
        const vinculada = await Agendamento.exists({ Infra: id });
        if (vinculada) {
            return res.status(409).json({ message: 'Infraestrutura vinculada a agendamentos não pode ser excluída.' });
        }
        const infra = await Infra.findByIdAndDelete(id);
        if (!infra) {
            return res.status(404).json({ message: 'Infraestrutura não encontrada.' });
        }
        res.status(200).json({ message: 'Infraestrutura deletada com sucesso.' });
    } catch (error) {
        console.error('Erro ao deletar infraestrutura:', error.message);
        res.status(500).json({ message: 'Erro ao deletar infraestrutura.', error: error.message });
    }
};





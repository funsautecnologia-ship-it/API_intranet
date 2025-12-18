import Ticket from '../models/Ticket.js';
import { io } from '../server.js';

/**
 * Cria um novo chamado.
 * @param {import('express').Request} req - Requisição HTTP contendo os dados do chamado.
 * @param {import('express').Response} res - Resposta HTTP.
 */
export const createTicket = async (req, res) => {
    try {
        const { title, description, setor,createdBy } = req.body;

        if (!title || !description) {
            return res.status(400).json({ message: 'Título e descrição são obrigatórios.' });
        }


        const ticket = new Ticket({
            title,
            description,
            priority: req.body.priority || 'Baixa', // Padrão
            // 'Baixa' se não fornecido
            status: 'open', // Padrão
            createdBy, // Funcionario que criou o chamado
            
            setor: setor, // Setor do chamado
            // Tipo de serviço do chamado
            
        });

        await ticket.save();

        // Emite um evento para o frontend informando que um novo chamado foi criado
        const populatedTicket = await Ticket.findById(ticket._id).populate('createdBy', 'name email')
        .populate('setor', 'nome'); // Popula o campo 'setor' com o nome do setor

        io.emit('ticket-created', {
            message: 'Novo chamado criado!',
            ticket: populatedTicket,
        });
        res.status(201).json({ message: 'Chamado criado com sucesso.', ticket });
    } catch (error) {
        console.error('Erro ao criar chamado:', error); // Log para depuração
        res.status(500).json({ message: 'Erro ao criar chamado.', error: error.message });
    }
};

/**
 * Lista todos os chamados.
 * Usuários comuns veem apenas seus chamados; administradores veem todos.
 * @param {import('express').Request} req - Requisição HTTP.
 * @param {import('express').Response} res - Resposta HTTP.
 */
/*export const getTickets = async (req, res) => {
    const { user } = req; // Usuário autenticado

    try {
        let tickets;
        if (user.role !== 'admin') {
            tickets = await Ticket.find({ createdBy: user._id }).populate('createdBy', 'name email');
        }else {
            tickets = await Ticket.find().populate('createdBy', 'name email');
            console.log('Chamados encontrados:', tickets); // Log para depuração

        }
        res.status(200).json(tickets);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar chamados.', error: error.message });
    }
};
*/
/**
 * Busca tickets por status e data (YYYY-MM-DD).
 * Exemplo de uso: GET /api/tickets?status=open&date=2024-06-04
 */
export const getTickets = async (req, res) => {
    const { status, date } = req.query;
    let filter = {};
    console.log('Buscando tickets com os seguintes parâmetros:', { status, date }); // Log para depuração

    if (status) filter.status = status;
    console.log('Filtro de status:', filter.status); // Log para depuração
    if (date) {
    // Ajuste para UTC-3
    const offset = -3; // Horário de Brasília
    const start = new Date(`${date}T00:00:00-03:00`);
    const end = new Date(`${date}T23:59:59.999-03:00`);
    filter.createdAt = { $gte: start, $lte: end };
}
    console.log('Filtro de data:', filter.createdAt); // Log para depuração
    try {
        let tickets;
        if (req.user.role !== 'admin') {
            filter.createdBy = req.user._id; // Filtra por usuário autenticado
            tickets= await Ticket.find(filter).populate('createdBy', 'name email')
            .populate('setor', 'nome'); // Popula o campo 'setor' com o nome do setor
            console.log('Chamados encontrados para o usuário:', tickets); // Log para depuração
        } else {
            tickets = await Ticket.find(filter).populate('createdBy', 'name email')
            .populate('setor', 'nome'); // Popula o campo 'setor' com o nome do setor
        }
        
        console.log('Chamados encontrados:', tickets); // Log para depuração
        res.status(200).json(tickets);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar chamados.', error: error.message });
    }
};
/**
 * Lista um chamado específico pelo ID.
 * @param {import('express').Request} req - Requisição HTTP contendo o ID do chamado.
 * @param {import('express').Response} res - Resposta HTTP.
 */
export const getTicketById = async (req, res) => {
    try {
        const ticket = await Ticket.findById(req.params.id).populate('createdBy', ' name email').
        populate('setor', 'nome'); // Popula o campo 'setor' com o nome do setor
        if (!ticket) {
            return res.status(404).json({ message: 'Chamado não encontrado.' });
        }
        res.status(200).json(ticket);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar chamado.', error: error.message });
    }
};

/**
 * Lista chamados por status.
 * Usuários comuns veem apenas seus chamados; administradores veem todos.
 * @param {import('express').Request} req - Requisição HTTP contendo o status.
 * @param {import('express').Response} res - Resposta HTTP.
 */
export const getTicketsByStatus = async (req, res) => {
    console.log('Tentando buscar chamados por status...'); // Log para depuração
     const { user } = req; // Usuário autenticado
     const status = req.params.status; 
    try {
        let tickets;
        if (user.role !== 'admin') {
            tickets = await Ticket.find({ status, createdBy: String(user._id) })
                .populate('setor', 'nome');
            console.log('Chamados encontrados para o usuário:', tickets);
        } else {
            tickets = await Ticket.find({ status })
                .populate('setor', 'nome');
            console.log('Chamados encontrados:', tickets);
        }
        if (!tickets || tickets.length === 0) {
            return res.status(404).json({ message: 'Nenhum chamado encontrado.' });
        }
        res.status(200).json(tickets);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar chamados.', error: error.message });
        console.error('Erro ao buscar chamados:', error); // Log para depuração
    }

};

/**
 * Atualiza o status e o diagnóstico de um chamado.
 * @param {import('express').Request} req - Requisição HTTP contendo o ID do chamado e os dados de atualização.
 * @param {import('express').Response} res - Resposta HTTP.
 */
export const updateTicketStatusAndDiagnostic = async (req, res) => {
    
    try {
        const { id } = req.params;
        const {data} = req.body; // Desestruturando os dados recebidos
        const { status, diagnostic, servicoTipo } = data; // Desestruturando os dados recebidos
        const { user } = req; // Usuário autenticado

        console.log('Tentando atualizar status do chamado...'); // Log para depuração
        console.log('ID do chamado:', id); // Log para depuração

        console.log('Novo status:', status); // Log para depuração

        console.log('Novo diagnóstico:', diagnostic); // Log para depuração


        const ticket = await Ticket.findById(id);
        if (!ticket) {
            return res.status(404).json({ message: 'Chamado não encontrado.' });
           
        }

        ticket.status = status;
        ticket.servicoTipo = servicoTipo; // Atualizando o tipo de serviço
        ticket.diagnostic = diagnostic; // Atualizando o diagnóstico
        ticket.updatedBy = user._id; // Atualizando o usuário que fez a atualização
        ticket.updatedAt = new Date(); // Atualizando a data de atualização
        await ticket.save();

        res.status(200).json({ message: 'Status do chamado atualizado com sucesso.', ticket });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao atualizar status do chamado.', error: error.message });
        console.error('Erro ao atualizar status do chamado:', error); // Log para depuração
    }
    };

/**
 * Deleta um chamado (apenas administradores podem realizar esta ação).
 * @param {import('express').Request} req - Requisição HTTP contendo o ID do chamado.
 * @param {import('express').Response} res - Resposta HTTP.
 */
export const deleteTicket = async (req, res) => {
    console.log('Tentando deletar chamado...'); // Log para depuração
    try {
        const { id } = req.params;
        console.log('ID do chamado:', id); // Log para depuração
        const ticket = await Ticket.findById(id);
        if (!ticket) {
            console.log('Chamado não encontrado.'); // Log para depuração
            return res.status(404).json({ message: 'Chamado não encontrado.' });
        }

        await Ticket.findByIdAndDelete(id);
        io.emit('ticket-deleted', {
            message: 'Chamado deletado!',
            ticketId: id,
        });
        console.log('Chamado deletado:', ticket); // Log para depuração
        res.status(200).json({ message: 'Chamado deletado com sucesso.' });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao deletar chamado.', error: error.message });
        console.error('Erro ao deletar chamado:', error); // Log para depuração
    }
};


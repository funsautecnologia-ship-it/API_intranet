import Agendamento from '../models/Agendamento.js';
import Infraestrutura from '../models/Infra.js';
import Equipamento from '../models/Equipamentos.js';
import mongoose from 'mongoose';
import User from '../models/User.js';
import {DateTime} from 'luxon';

/** * Cria um novo agendamento.
 * @param {import('express').Request} req - Requisição HTTP contendo os dados do agendamento.
 * @param {import('express').Response} res - Resposta HTTP.
 */
export const createAgendamento = async (req, res) => {
    const { body } = req;
    console.log('Dados recebidos para criação de agendamento:', { body });

    try {
        const zone = 'America/Manaus';
        const horaStr = body.Hora;
        if (body.dataInicio) {
            const s = String(body.dataInicio);
            const base = s.includes('T') ? s.split('T')[0] : s;
            const dataLocal = DateTime.fromISO(base, { zone }).startOf('day');
            body.dataInicio = dataLocal.toJSDate();
        }

        let isAdmin = false;
        if (req.user && req.user.role === 'admin') {
            isAdmin = true;
        }
        if (body.dataInicio && horaStr && !isAdmin) {
            const hojeLocal = DateTime.now().setZone(zone);
            const dataLocal = DateTime.fromJSDate(body.dataInicio).setZone(zone);
            if (dataLocal.toISODate() === hojeLocal.toISODate()) {
                const [h, m] = horaStr.split(':').map(Number);
                const agendamentoLocal = dataLocal.set({ hour: h, minute: m, second: 0, millisecond: 0 });
                const diffMin = agendamentoLocal.diff(hojeLocal, 'minutes').minutes;
                if (diffMin < 60) {
                    const alvo = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
                    return res.status(400).json({
                        code: 'LEAD_TIME_TOO_SHORT',
                        message: 'Agendamento para hoje requer pelo menos 1 hora de antecedência.',
                        data: {
                            data: dataLocal.toISODate(),
                            hora: alvo,
                            minimoMinutos: 60
                        }
                    });
                }
            }
        }

        const { Hora, Infra, Equipamentos } = body;
        const equipamentosIds = Array.isArray(Equipamentos) ? Equipamentos : (Equipamentos ? [Equipamentos] : []);
        await verificarDisponibilidade(body.dataInicio, Hora, Infra, equipamentosIds, null);

        const agendamento = await Agendamento.create(body);
        
        res.status(201).json({ message: 'Agendamento criado com sucesso.', agendamento });
    } catch (error) {
        console.error('Erro ao criar agendamento:', error.message);
        if (error.message.includes('já agendada') || error.message.includes('não possui quantidade suficiente')) {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Erro ao criar agendamento.', error: error.message });
    }
};

/** * Obtém todos os agendamentos.
 * @param {import('express').Request} req - Requisição HTTP.
 * @param {import('express').Response} res - Resposta HTTP.
 */
export const getAgendamentos = async (req, res) => {
    try {
        const agendamentos = await Agendamento.find()
            .populate('Infra')
            .populate('Equipamentos')
          
            

        res.status(200).json(agendamentos);
    } catch (error) {
        console.error('Erro ao obter agendamentos:', error.message);
        res.status(500).json({ message: 'Erro ao obter agendamentos.', error: error.message });
    }
};

/** * Obtém um agendamento pelo ID.
 * @param {import('express').Request} req - Requisição HTTP contendo o ID do agendamento.
 * @param {import('express').Response} res - Resposta HTTP.
 */
export const getAgendamentoById = async (req, res) => {
    const { id } = req.params;

    try {
        const agendamento = await Agendamento.findById(id)
            .populate('Infra')
            .populate('Equipamentos')
            .populate('user', 'name email');
        if (!agendamento) {
            return res.status(404).json({ message: 'Agendamento não encontrado.' });
        }
        res.status(200).json(agendamento);
    } catch (error) {
        console.error('Erro ao obter agendamento:', error.message);
        res.status(500).json({ message: 'Erro ao obter agendamento.', error: error.message });
    }   
}

/** * Deleta um agendamento pelo ID.
 * @param {import('express').Request} req - Requisição HTTP contendo o ID do agendamento.
 * @param {import('express').Response} res - Resposta HTTP.
 */
export const deleteAgendamento = async (req, res) => {
    const { id } = req.params;

    try {
        const agendamento = await Agendamento.findByIdAndDelete(id);
        if (!agendamento) {
            return res.status(404).json({ message: 'Agendamento não encontrado.' });
        }
        res.status(200).json({ message: 'Agendamento deletado com sucesso.' });
    } catch (error) {
        console.error('Erro ao deletar agendamento:', error.message);
        res.status(500).json({ message: 'Erro ao deletar agendamento.', error: error.message });
    }
}

// Função auxiliar para verificar disponibilidade
const verificarDisponibilidade = async (dataInicio, hora, infraId, equipamentosIds, agendamentoId = null) => {
    // Converter data para o formato correto
   
    
    // Buscar agendamentos no mesmo horário, excluindo o próprio agendamento se estiver atualizando
    const query = {
        dataInicio: dataInicio,
        Hora: hora,
        _id: { $ne: agendamentoId } // Exclui o próprio agendamento na atualização
    };

    const agendamentos = await Agendamento.find(query)
        .populate('Infra')
        .populate('Equipamentos');

    // Verificar disponibilidade da infraestrutura
    if (infraId) {
        const infraOcupada = agendamentos.some(agendamento => {
            const agendamentoInfraId = agendamento.Infra?._id ? String(agendamento.Infra._id) : String(agendamento.Infra);
            return agendamentoInfraId && String(agendamentoInfraId) === String(infraId);
        });
        if (infraOcupada) {
            throw new Error('Infraestrutura já agendada para este horário.');
        }
    }

    // Verificar disponibilidade dos equipamentos
    const equipamentosAgendados = {};
    agendamentos.forEach(agendamento => {
        let equipamentos = [];
        
        if (Array.isArray(agendamento.Equipamentos)) {
            equipamentos = agendamento.Equipamentos.map(equip => 
                equip._id ? String(equip._id) : String(equip)
            );
        } else if (agendamento.Equipamentos) {
            equipamentos = [agendamento.Equipamentos._id ? String(agendamento.Equipamentos._id) : String(agendamento.Equipamentos)];
        }

        equipamentos.forEach(equipId => {
            equipamentosAgendados[equipId] = (equipamentosAgendados[equipId] || 0) + 1;
        });
    });

    // Verificar se há equipamentos suficientes disponíveis
    for (const equipId of equipamentosIds) {
        const equipamento = await Equipamento.findById(equipId);
        if (!equipamento) {
            throw new Error(`Equipamento com ID ${equipId} não encontrado.`);
        }

        const quantidadeAgendada = equipamentosAgendados[String(equipId)] || 0;
        
        // Se estiver atualizando, não contar o próprio agendamento nos equipamentos
        const quantidadeNecessaria = equipamentosIds.filter(id => String(id) === String(equipId)).length;
        
        if (quantidadeAgendada + quantidadeNecessaria > equipamento.quantidade) {
            throw new Error(`Equipamento ${equipamento.nome} não possui quantidade suficiente disponível para este horário.`);
        }
    }

    return true;
};

/** * Atualiza um agendamento pelo ID.
 * @param {import('express').Request} req - Requisição HTTP contendo o ID do agendamento e os dados a serem atualizados.
 * @param {import('express').Response} res - Resposta HTTP.
 */
export const updateAgendamento = async (req, res) => {
    const { id } = req.params;
    const { body } = req;
    console.log('agentamento', body);
    
    // Não modificar a data recebida do frontend
    console.log('data recebida:', body.dataInicio);

    try {
        if (body.dataInicio) {
            const s = String(body.dataInicio);
            const base = s.includes('T') ? s.split('T')[0] : s;
            const zone = 'America/Manaus';
            const dataLocal = DateTime.fromISO(base, { zone }).startOf('day');
            body.dataInicio = dataLocal.toJSDate();
        }
        // Buscar o agendamento atual para comparar mudanças
        const agendamentoAtual = await Agendamento.findById(id);
        console.log('Agendamento atual:', agendamentoAtual);
        if (!agendamentoAtual) {
            return res.status(404).json({ message: 'Agendamento não encontrado.' });
        }

        // Verificar se houve mudança de data, hora, infra ou equipamentos
        const dataMudou = body.dataInicio && new Date(body.dataInicio).toISOString() !== new Date(agendamentoAtual.dataInicio).toISOString();
        const horaMudou = body.Hora && body.Hora !== agendamentoAtual.Hora;
        const infraMudou = body.Infra && String(body.Infra) !== String(agendamentoAtual.Infra);
        const equipamentosMudaram = body.Equipamentos && JSON.stringify(body.Equipamentos) !== JSON.stringify(agendamentoAtual.Equipamentos);

        // Se algum desses campos mudou, verificar disponibilidade
        if (dataMudou || horaMudou || infraMudou || equipamentosMudaram) {
            const dataVerificacao = body.dataInicio || agendamentoAtual.dataInicio;
            const horaVerificacao = body.Hora || agendamentoAtual.Hora;
            const infraVerificacao = body.Infra || agendamentoAtual.Infra;
            const equipamentosVerificacao = body.Equipamentos || agendamentoAtual.Equipamentos;

            await verificarDisponibilidade(
                dataVerificacao,
                horaVerificacao,
                infraVerificacao,
                Array.isArray(equipamentosVerificacao) ? equipamentosVerificacao : (equipamentosVerificacao ? [equipamentosVerificacao] : []),
                id
            );
        }
        // Atualizar o agendamento
        const agendamento = await Agendamento.findByIdAndUpdate(id, body, { new: true });
        
        res.status(200).json({ message: 'Agendamento atualizado com sucesso.', agendamento });  
    } catch (error) {
        console.error('Erro ao atualizar agendamento:', error.message);
        
        if (error.message.includes('já agendada') || error.message.includes('não possui quantidade suficiente')) {
            return res.status(400).json({ message: error.message });
        }
        
        res.status(500).json({ message: 'Erro ao atualizar agendamento.', error: error.message });
    }
}

export const getAgendamentosByDateTime = async (req, res) => {

    const { data, hora, userId } = req.query;
    let usuario = null;
    if (userId) {
        try {
            usuario = await User.findById(userId);
            if (!usuario) {
                console.warn('Usuário não encontrado para userId:', userId);
            }
        } catch (e) {
            console.error('Erro ao buscar usuário:', e.message);
        }
    }
    console.log('Parâmetros recebidos para busca de agendamentos por data e hora:', { data, hora, userId, usuario });


    const zone = 'America/Manaus';
    const s = String(data);
    const base = s.includes('T') ? s.split('T')[0] : s;
    const dataLocal = DateTime.fromISO(base, { zone }).startOf('day');
    const diaSemana = dataLocal.weekday % 7; // Luxon: 1=Mon ... 7=Sun; converter para 0..6
    const horaNumero = parseInt(String(hora).split(':')[0]);

    const isSegundaFeira = diaSemana === 1;
    const isAntesDas12h = horaNumero < 12;

    let isAdmin = false;
    if (usuario && usuario.role === 'admin') {
        isAdmin = true;
    } else if (req.user && req.user.role === 'admin') {
        isAdmin = true;
    }

    console.log('Verificação de disponibilidade:', {
        diaSemana,
        isSegundaFeira,
        hora: horaNumero,
        isAntesDas12h
    });

    // Busca todos os agendamentos para data/hora
    const agendamentos = await Agendamento.find({ dataInicio: dataLocal.toJSDate(), Hora: hora })
        .populate('Infra', '_id nome')
        .populate('Equipamentos');
    
    console.log('Agendamentos encontrados para data e hora:', agendamentos);
    
    // Função para extrair IDs de qualquer formato
    const extractIds = (field) => {
        const ids = [];
        
        if (!field) return ids;
        
        // Se for ObjectId ou string
        if (typeof field === 'string' || field instanceof mongoose.Types.ObjectId) {
            ids.push(String(field));
        }
        // Se for objeto com _id
        else if (field._id) {
            ids.push(String(field._id));
        }
        // Se for array
        else if (Array.isArray(field)) {
            field.forEach(item => {
                if (typeof item === 'string' || item instanceof mongoose.Types.ObjectId) {
                    ids.push(String(item));
                } else if (item && item._id) {
                    ids.push(String(item._id));
                }
            });
        }
        
        return ids;
    };

    // Extrair IDs de infraestruturas ocupadas
    const infraOcupadaIds = [];
    agendamentos.forEach(a => {
        infraOcupadaIds.push(...extractIds(a.Infra));
    });

    // Extrair e contar equipamentos
    const agendadosPorEquip = {};
    agendamentos.forEach(a => {
        const equipIds = extractIds(a.Equipamentos);
        equipIds.forEach(equipId => {
            agendadosPorEquip[equipId] = (agendadosPorEquip[equipId] || 0) + 1;
        });
    });

    // Buscar todos os recursos
    const todasInfra = await Infraestrutura.find();
    const todosEquipamentos = await Equipamento.find();

    // Filtrar infra disponível
    let infraDisponivel = todasInfra.filter(infra => 
        !infraOcupadaIds.includes(String(infra._id))
    );

    // Aplicar regra especial: sala de reunião indisponível às segundas antes das 12h
    if (isSegundaFeira && isAntesDas12h && !isAdmin) {
        infraDisponivel = infraDisponivel.filter(infra => 
            infra.nome.toLowerCase() !== 'sala de reunião'
        );
        
        console.log('Aplicada regra especial: Sala de reunião indisponível para segundas antes das 12h');
    }

    // Calcular equipamentos disponíveis
    const equipamentosDisponiveis = todosEquipamentos.map(equip => {
        const usados = agendadosPorEquip[String(equip._id)] || 0;
        const disponivel = equip.quantidade - usados;
        
        return {
            ...equip.toObject(),
            quantidadeDisponivel: Math.max(0, disponivel),
            quantidadeUsada: usados,
            disponivel: disponivel > 0
        };
    }).filter(equip => equip.disponivel);

    res.json({
        infraestruturas: infraDisponivel,
        equipamentos: equipamentosDisponiveis,
    });
};

/**buscar agendamentos por data */
export const getAgendamentosByDate = async (req, res) => {
    const { data } = req.query;
    const s = String(data);
    const base = s.includes('T') ? s.split('T')[0] : s;
    const zone = 'America/Manaus';
    const dataLocal = DateTime.fromISO(base, { zone }).startOf('day');
    const inicioDia = dataLocal.toJSDate();
    const fimDia = dataLocal.endOf('day').toJSDate();
    

    try {
        const agendamentos = await Agendamento.find({
            dataInicio: { $gte: inicioDia, $lte: fimDia }
        }).sort({ Hora: 1 })
            .populate('Infra', 'nome')
            .populate('Equipamentos', 'nome')

        res.status(200).json(agendamentos);
    } catch (error) {
        console.error('Erro ao obter agendamentos por data:', error.message);
        res.status(500).json({ message: 'Erro ao obter agendamentos por data.', error: error.message });
    }
};

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const BASE = `http://localhost:${process.env.PORT || 3000}/api/agendamentos`;
const INFRA_BASE = `http://localhost:${process.env.PORT || 3000}/api/infra`;
const EQUIP_BASE = `http://localhost:${process.env.PORT || 3000}/api/equipamentos`;

const log = (...args) => console.log('[SELFTEST]', ...args);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const toYMD = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

async function run() {
  try {
    const today = new Date();
    const ymd = toYMD(today);
    const hora = '15:00';

    log('Testando busca por data:', ymd);
    const byDate = await axios.get(`${BASE}/date?data=${ymd}`);
    log('Total retornado (date):', Array.isArray(byDate.data) ? byDate.data.length : 'formato inesperado');

    log('Testando busca por data e hora:', ymd, hora);
    const byDateTime = await axios.get(`${BASE}/datetime?data=${ymd}&hora=${hora}`);
    const infra = byDateTime.data?.infraestruturas?.length ?? 0;
    const equips = byDateTime.data?.equipamentos?.length ?? 0;
    log('Disponíveis (datetime): infra =', infra, ', equipamentos =', equips);

    // Regra de 1 hora para hoje (não admin)
    try {
      const now = new Date();
      const ymdToday = toYMD(now);
      const target = new Date(now.getTime() + 30 * 60 * 1000);
      const hh = String(target.getHours()).padStart(2, '0');
      const mm = String(target.getMinutes()).padStart(2, '0');
      const horaHoje = `${hh}:${mm}`;
      log('Testando regra de 1h para hoje em', ymdToday, horaHoje, '(espera 400)');
      await axios.post(`${BASE}/create`, {
        solicitante: 'SelfTest LeadTime',
        descricao: 'Teste 1h',
        dataInicio: ymdToday,
        Hora: horaHoje
      });
      log('ERRO: criação para hoje com menos de 1h não deveria ser permitida');
      process.exit(1);
    } catch (e) {
      const status = e.response?.status;
      const code = e.response?.data?.code;
      log('Resultado esperado (1h): status', status, 'code', code, 'mensagem:', e.response?.data?.message);
    }

    // Preparar datas/horas para criação sem regra de 1h
    const tomorrow = new Date(today.getTime() + 24*60*60*1000);
    const ymdTomorrow = toYMD(tomorrow);

    // Teste de conflito: Infraestrutura (usando disponibilidade)
    try {
      const horaInfra = '15:30';
      const availability = await axios.get(`${BASE}/datetime?data=${ymdTomorrow}&hora=${horaInfra}`);
      const disponiveis = availability.data?.infraestruturas || [];
      if (Array.isArray(disponiveis) && disponiveis.length > 0) {
        const infraId = disponiveis[0]._id;
        log('Criando primeiro agendamento com infra disponível', infraId, ymdTomorrow, horaInfra);
        await axios.post(`${BASE}/create`, {
          solicitante: 'SelfTest Infra 1',
          descricao: 'Teste conflito infra',
          dataInicio: ymdTomorrow,
          Hora: horaInfra,
          Infra: infraId,
          Equipamentos: []
        });
        await sleep(200);

        log('Tentando segundo agendamento com a mesma infra e horário (espera 400)');
        try {
          await axios.post(`${BASE}/create`, {
            solicitante: 'SelfTest Infra 2',
            descricao: 'Teste conflito infra',
            dataInicio: ymdTomorrow,
            Hora: horaInfra,
            Infra: infraId,
            Equipamentos: []
          });
          log('ERRO: segundo agendamento com mesma infra/horário não deveria ser permitido');
          process.exit(1);
        } catch (e) {
          const status = e.response?.status;
          log('Resultado esperado: status', status, 'mensagem:', e.response?.data?.message);
        }
      } else {
        log('Nenhuma infraestrutura disponível para o horário escolhido, pulando teste');
      }
    } catch (e) {
      log('Falha ao testar conflito de infra:', e.response?.data || e.message);
    }

    // Teste de conflito: Equipamentos por quantidade
    try {
      const equipList = await axios.get(`${EQUIP_BASE}/`);
      if (Array.isArray(equipList.data) && equipList.data.length > 0) {
        const equip = equipList.data[0];
        const equipId = equip._id;
        const qtd = Number(equip.quantidade) || 0;
        const horaEquip = '16:00';
        if (qtd > 0) {
          log('Equipamento para teste', equip.nome, 'quantidade=', qtd);
          for (let i = 0; i < qtd; i++) {
            log(`Criando agendamento ${i+1}/${qtd} com equip ${equipId} em ${ymdTomorrow} ${horaEquip}`);
            await axios.post(`${BASE}/create`, {
              solicitante: `SelfTest Equip ${i+1}`,
              descricao: 'Teste conflito equip',
              dataInicio: ymdTomorrow,
              Hora: horaEquip,
              Equipamentos: [equipId]
            });
            await sleep(200);
          }
          log('Tentando ultrapassar a quantidade disponível (espera 400)');
          try {
            await axios.post(`${BASE}/create`, {
              solicitante: 'SelfTest Equip Extra',
              descricao: 'Teste conflito equip',
              dataInicio: ymdTomorrow,
              Hora: horaEquip,
              Equipamentos: [equipId]
            });
            log('ERRO: agendamento excedendo quantidade não deveria ser permitido');
            process.exit(1);
          } catch (e) {
            const status = e.response?.status;
            log('Resultado esperado: status', status, 'mensagem:', e.response?.data?.message);
          }
        } else {
          log('Equipamento escolhido possui quantidade 0, pulando teste');
        }
      } else {
        log('Sem equipamento cadastrado público para testar conflito');
      }
    } catch (e) {
      log('Falha ao testar conflito de equipamentos:', e.response?.data || e.message);
    }

    log('OK');
  } catch (err) {
    if (err.response) {
      log('Erro HTTP', err.response.status, err.response.data);
    } else {
      log('Erro', err.message);
    }
    process.exit(1);
  }
}

run();

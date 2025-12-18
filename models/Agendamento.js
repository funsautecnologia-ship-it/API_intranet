import mongoose from "mongoose";


const AgendamentoSchema = new mongoose.Schema({
    Infra: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Infra',
        
    },
    Equipamentos: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Equipamentos',
        
    }],

    solicitante: {
        type: String,
        trim: true,  
        required: true 
    },

    dataInicio: { 
        type: Date,
        required: true
    },
    Hora: { 
        type: String,
        required: true
    },
    descricao: {
        type: String,
        trim: true,
        required: true
    }
});
const Agendamento = mongoose.model('Agendamento', AgendamentoSchema);
export default Agendamento;
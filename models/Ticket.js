import mongoose from 'mongoose';

const TicketSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    priority: {
        type: String,
        enum: ['Baixa', 'Media', 'Alta'],
        default: 'Baixa',
    },
    status: {
        type: String,
        enum: ['open', 'in progress', 'closed'],
        default: 'open',
    },
    createdBy: {
        type:String,
        required: true,
      
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    diagnostic: {
        type: String,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    setor:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Setor',
    },
    servicoTipo:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ServicoTipo',
    },

});

const Ticket = mongoose.model('Ticket', TicketSchema);
export default Ticket;
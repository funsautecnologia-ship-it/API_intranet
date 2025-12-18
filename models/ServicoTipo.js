import mongoose from 'mongoose';
const ServicoTipoSchema = new mongoose.Schema({
    nome: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    descricao: {
        type: String,
        trim: true
    }

});
const ServicoTipo = mongoose.model('ServicoTipo', ServicoTipoSchema);
export default ServicoTipo;

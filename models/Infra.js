import mongoose from 'mongoose';
const InfraSchema = new mongoose.Schema({
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
const Infra = mongoose.model('Infra', InfraSchema);
export default Infra;

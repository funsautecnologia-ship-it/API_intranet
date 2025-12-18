import mongoose from "mongoose";
const SetorSchema = new mongoose.Schema({
    nome: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    active: {
        type: Boolean,
        default: true
    },
    
});
const Setor = mongoose.model('Setor', SetorSchema);
export default Setor;

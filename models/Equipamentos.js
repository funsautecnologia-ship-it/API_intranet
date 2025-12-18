import mongoose from "mongoose";

const EquipamentosSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    },
    descricao: {
        type: String,
        trim: true
    },
    quantidade: {
        type: Number,
        required: true,
        min: 0
    }
});
const Equipamentos = mongoose.model("Equipamentos", EquipamentosSchema);
export default Equipamentos;

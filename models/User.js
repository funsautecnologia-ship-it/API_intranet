import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    name: String,
    email: {
        type: String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true,
        
      },
    password: {
        type: String,
        required:true
        
      },
    role: { type: String, enum: ['admin', 'user'], default: 'user' },
    active: { type: Boolean, default: true },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    avatar: {
        type: String,
        
    },
     Setor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Setor',
        },

    endereco:[
        {
            rua: String,
            numero: String,
            bairro: String,
            cidade: String,
            estado: String,
            cep: String
        }
    ]

});

const User = mongoose.model('User', UserSchema);
export default User;  

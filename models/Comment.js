import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    }, // Relacionamento com usuários
    content: { 
        type: String, 
        required: true 
     }, // Conteúdo do comentário
    status: { 
        type: String, 
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending' 
    }, // Status do comentário
    createdAt: { 
        type: Date, default: Date.now 
    } // Data de criação
});

const Comment = mongoose.model('Comment', commentSchema);

export default Comment;

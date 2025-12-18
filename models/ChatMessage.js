import mongoose from 'mongoose';

const ChatMessageSchema = new mongoose.Schema({
    sender: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', required: true 
    },
    receiver: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', required: true 
    },
    message: { 
        type: String, 
        required: true 
    },
    read: { type: Boolean, default: false },
    createdAt: { 
        type: Date, default: Date.now 
    }
});

export default mongoose.model('ChatMessage', ChatMessageSchema);
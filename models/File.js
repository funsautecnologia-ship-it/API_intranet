import mongoose from 'mongoose';

const FileSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    idgoogle: {
        type: String,
        required: true
    },
    titulo: {
        type: String,
        required: true
    },
    url: {
        type: String,
        required: true
    },
    urlView: {
        type: String,
        
    },
    size: {
        type: Number,
       
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model('File', FileSchema);

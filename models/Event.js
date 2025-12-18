import mongoose from 'mongoose';

const EventSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
    img: {
        type: String // Array of strings to store photo URLs
       
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
   
    
}, { timestamps: true });

const Event = mongoose.model('Event', EventSchema);
export default Event;
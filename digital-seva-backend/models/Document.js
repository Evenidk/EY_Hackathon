// models/Document.js
const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    documentType: {
        type: String,
        required: true,
        enum: [
            'Aadhar Card',
            'PAN Card',
            'Caste Certificate',
            'Ration Card',
            'Voter ID',
            'Driving License'
        ]
    },
    filePath: {
        type: String,
        required: true
    },
    uploadedAt: {
        type: Date,
        default: Date.now
    },
    isVerified: {
        type: Boolean,
        default: false
    }
});

module.exports = mongoose.model('Document', DocumentSchema);
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    name: {
        type: String,
        required: true
    },
    passwordHash: {
        type: String,
        required: true
    },
    timezone: {
        type: String,
        default: 'America/New_York'
    },
    reflectionDay: {
        type: Number,
        min: 0,
        max: 6,
        default: 0  // Sunday
    },
    reflectionTime: {
        type: String,
        default: '18:00'  // 6pm in 24hr format
    },
    nextReflectionAt: {
        type: Date,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    settings: {
        locationEnabled: {
            type: Boolean,
            default: true
        }
    }
});

module.exports = mongoose.model('User', userSchema);

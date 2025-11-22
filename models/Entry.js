const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
    latitude: {
        type: Number,
        required: true,
        min: -90,
        max: 90
    },
    longitude: {
        type: Number,
        required: true,
        min: -180,
        max: 180
    },
    accuracy: {
        type: Number,
        min: 0
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    address: {
        type: String,
        default: null
    },
    city: { type: String },
    state: { type: String },
    country: { type: String },
    neighborhood: { type: String },
    formattedAddress: { type: String }
}, { _id: false });

const entrySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    weekId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Week',
        required: true
    },
    audioUrl: {
        type: String,
        required: true
    },
    duration: {
        type: Number,
        required: true,
        min: 0
    },
    recordedAt: {
        type: Date,
        default: Date.now
    },
    location: {
        type: locationSchema,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index for efficient querying
entrySchema.index({ userId: 1, weekId: 1 });
entrySchema.index({ recordedAt: -1 });

module.exports = mongoose.model('Entry', entrySchema);

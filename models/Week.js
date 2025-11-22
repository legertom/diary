const mongoose = require('mongoose');

const locationClusterSchema = new mongoose.Schema({
    centerLat: Number,
    centerLng: Number,
    radius: Number,
    entryCount: Number,
    label: String
}, { _id: false });

const primaryLocationSchema = new mongoose.Schema({
    latitude: Number,
    longitude: Number,
    address: String,
    entryCount: Number
}, { _id: false });

const locationInsightsSchema = new mongoose.Schema({
    totalUniqueLocations: {
        type: Number,
        default: 0
    },
    primaryLocation: {
        type: primaryLocationSchema,
        default: null
    },
    mobilityScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },
    distanceTraveled: {
        type: Number,
        min: 0,
        default: 0
    },
    locationClusters: {
        type: [locationClusterSchema],
        default: []
    },
    timeAtHome: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },
    explorationScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    }
}, { _id: false });

const transcriptionSchema = new mongoose.Schema({
    entryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Entry',
        required: true
    },
    text: String,
    recordedAt: Date
}, { _id: false });

const insightsSchema = new mongoose.Schema({
    moodTrend: String,
    keyThemes: [String],
    highlights: [String],
    locationInsights: {
        type: locationInsightsSchema,
        default: null
    }
}, { _id: false });

const weekSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    weekNumber: {
        type: Number,
        required: true,
        min: 1,
        max: 53
    },
    year: {
        type: Number,
        required: true
    },
    weekStart: {
        type: Date,
        required: true
    },
    weekEnd: {
        type: Date,
        required: true
    },
    reflectionDate: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['recording', 'processing', 'complete', 'error'],
        default: 'recording'
    },
    transcriptions: {
        type: [transcriptionSchema],
        default: []
    },
    summary: {
        type: String,
        default: null
    },
    insights: {
        type: insightsSchema,
        default: null
    },
    processedAt: {
        type: Date,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Compound index for efficient user + week queries
weekSchema.index({ userId: 1, year: 1, weekNumber: 1 }, { unique: true });

module.exports = mongoose.model('Week', weekSchema);

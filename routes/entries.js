const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Entry = require('../models/Entry');
const Week = require('../models/Week');

// Configure multer for audio file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'audio-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /webm|mp3|wav|m4a|ogg/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Invalid file type. Only audio files are allowed.'));
    }
});

/**
 * POST /api/entries
 * Create a new diary entry with optional location data
 */
router.post('/', upload.single('audio'), async (req, res) => {
    try {
        console.log('📝 Entry creation request received');
        console.log('File:', req.file ? req.file.filename : 'NO FILE');
        console.log('Body:', req.body);

        const { userId, duration, location } = req.body;

        if (!req.file) {
            console.log('❌ No audio file in request');
            return res.status(400).json({ error: 'Audio file is required' });
        }

        if (!userId || !duration) {
            console.log('❌ Missing userId or duration');
            return res.status(400).json({ error: 'userId and duration are required' });
        }

        // Validate location data if provided
        let locationData = null;
        if (location) {
            const loc = typeof location === 'string' ? JSON.parse(location) : location;

            if (loc.latitude !== undefined && loc.longitude !== undefined) {
                // Validate coordinates
                if (loc.latitude < -90 || loc.latitude > 90) {
                    return res.status(400).json({ error: 'Invalid latitude' });
                }
                if (loc.longitude < -180 || loc.longitude > 180) {
                    return res.status(400).json({ error: 'Invalid longitude' });
                }

                locationData = {
                    latitude: loc.latitude,
                    longitude: loc.longitude,
                    accuracy: loc.accuracy || null,
                    timestamp: loc.timestamp ? new Date(loc.timestamp) : new Date()
                };

                // Reverse Geocode
                try {
                    const geocoder = require('node-geocoder')({
                        provider: 'openstreetmap'
                    });
                    const res = await geocoder.reverse({ lat: loc.latitude, lon: loc.longitude });
                    if (res && res.length > 0) {
                        const addr = res[0];
                        locationData.city = addr.city || addr.town || addr.village;
                        locationData.state = addr.state;
                        locationData.country = addr.country;
                        locationData.neighborhood = addr.neighbourhood || addr.suburb;
                        locationData.formattedAddress = addr.formattedAddress;

                        // Construct a nice display string
                        const parts = [];
                        if (locationData.neighborhood) parts.push(locationData.neighborhood);
                        if (locationData.city && locationData.city !== locationData.neighborhood) parts.push(locationData.city);
                        if (locationData.state) parts.push(locationData.state);

                        locationData.address = parts.join(', ');
                        console.log('📍 Geocoded:', locationData.address);
                    }
                } catch (geoError) {
                    console.error('Geocoding error:', geoError);
                    // Continue without address if geocoding fails
                }
            }
        }

        // Get or create week for this entry
        const recordedAt = new Date();
        const weekNumber = getWeekNumber(recordedAt);
        const year = recordedAt.getFullYear();

        // Get user to determine reflection date
        const User = require('../models/User');
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        let week = await Week.findOne({ userId, year, weekNumber });
        if (!week) {
            const { DateTime } = require('luxon');
            const now = DateTime.fromJSDate(recordedAt, { zone: user.timezone });
            const [hours, minutes] = user.reflectionTime.split(':').map(Number);

            // Luxon uses 1 (Monday) to 7 (Sunday)
            // Our app uses 0 (Sunday) to 6 (Saturday)
            const targetWeekday = user.reflectionDay === 0 ? 7 : user.reflectionDay;

            // Find next reflection day
            let reflectionDate = now.set({ hour: hours, minute: minutes, second: 0 });
            while (reflectionDate.weekday !== targetWeekday || reflectionDate <= now) {
                reflectionDate = reflectionDate.plus({ days: 1 });
            }

            const weekStart = reflectionDate.minus({ days: 6 }).startOf('day');
            const weekEnd = reflectionDate.endOf('day');

            week = await Week.create({
                userId,
                weekNumber,
                year,
                weekStart: weekStart.toJSDate(),
                weekEnd: weekEnd.toJSDate(),
                reflectionDate: reflectionDate.toJSDate(),
                status: 'recording'
            });
        }

        // Create entry
        const entry = await Entry.create({
            userId,
            weekId: week._id,
            audioUrl: `/uploads/${req.file.filename}`,
            duration: parseFloat(duration),
            recordedAt,
            location: locationData
        });

        res.status(201).json({
            success: true,
            entry,
            locationCaptured: !!locationData
        });

    } catch (error) {
        console.error('Error creating entry:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/entries
 * Get all entries for a user
 */
router.get('/', async (req, res) => {
    try {
        const { userId, weekId } = req.query;

        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }

        const query = { userId };
        if (weekId) {
            query.weekId = weekId;
        }

        const entries = await Entry.find(query).sort({ recordedAt: -1 });

        res.json({
            success: true,
            count: entries.length,
            entries
        });

    } catch (error) {
        console.error('Error fetching entries:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/entries/:id
 * Get a specific entry
 */
router.get('/:id', async (req, res) => {
    try {
        const entry = await Entry.findById(req.params.id);

        if (!entry) {
            return res.status(404).json({ error: 'Entry not found' });
        }

        res.json({
            success: true,
            entry
        });

    } catch (error) {
        console.error('Error fetching entry:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * DELETE /api/entries/:id
 * Delete an entry
 */
router.delete('/:id', async (req, res) => {
    try {
        const entry = await Entry.findByIdAndDelete(req.params.id);

        if (!entry) {
            return res.status(404).json({ error: 'Entry not found' });
        }

        res.json({
            success: true,
            message: 'Entry deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting entry:', error);
        res.status(500).json({ error: error.message });
    }
});

// Helper functions
function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}



module.exports = router;

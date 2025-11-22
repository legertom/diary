const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { calculateNextReflection, createNextWeek } = require('../services/scheduler');

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', async (req, res) => {
    try {
        const { email, name, password, timezone, reflectionDay, reflectionTime } = req.body;

        if (!email || !name || !password) {
            return res.status(400).json({ error: 'Email, name, and password are required' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(409).json({ error: 'User already exists' });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Create user with default reflection settings
        const user = new User({
            email: email.toLowerCase(),
            name,
            passwordHash,
            timezone: timezone || 'America/New_York',
            reflectionDay: reflectionDay !== undefined ? reflectionDay : 0, // Sunday
            reflectionTime: reflectionTime || '18:00',
            nextReflectionAt: new Date() // Will be calculated properly below
        });

        // Calculate first reflection date
        await calculateNextReflection(user);

        // Create first week
        await createNextWeek(user);

        // Generate JWT
        const token = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '30d' }
        );

        res.status(201).json({
            success: true,
            token,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                timezone: user.timezone,
                reflectionDay: user.reflectionDay,
                reflectionTime: user.reflectionTime,
                nextReflectionAt: user.nextReflectionAt
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/auth/login
 * Login user
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        // Find user
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Verify password
        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT
        const token = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '30d' }
        );

        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                timezone: user.timezone,
                reflectionDay: user.reflectionDay,
                reflectionTime: user.reflectionTime,
                nextReflectionAt: user.nextReflectionAt
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * PUT /api/auth/settings
 * Update user settings and reschedule reflection if needed
 */
router.put('/settings', authenticateToken, async (req, res) => {
    try {
        const { name, reflectionDay, reflectionTime, timezone } = req.body;
        const user = await User.findById(req.user.userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Update basic info
        if (name) user.name = name;

        // Parse inputs to ensure correct types
        const newReflectionDay = reflectionDay !== undefined ? parseInt(reflectionDay) : undefined;

        // Validation
        if (newReflectionDay !== undefined && (isNaN(newReflectionDay) || newReflectionDay < 0 || newReflectionDay > 6)) {
            return res.status(400).json({ error: 'Invalid reflection day (must be 0-6)' });
        }

        if (reflectionTime && !/^([01]\d|2[0-3]):([0-5]\d)$/.test(reflectionTime)) {
            return res.status(400).json({ error: 'Invalid reflection time (must be HH:MM)' });
        }

        console.log(`Settings update request for ${user.email}:`, {
            current: { day: user.reflectionDay, time: user.reflectionTime, tz: user.timezone },
            new: { day: newReflectionDay, time: reflectionTime, tz: timezone }
        });

        // Check if schedule changed
        const scheduleChanged = (newReflectionDay !== undefined && newReflectionDay !== user.reflectionDay) ||
            (reflectionTime && reflectionTime !== user.reflectionTime) ||
            (timezone && timezone !== user.timezone);

        if (scheduleChanged) {
            console.log(`🔄 Schedule changed for ${user.email}. Recalculating...`);

            if (newReflectionDay !== undefined) user.reflectionDay = newReflectionDay;
            if (reflectionTime) user.reflectionTime = reflectionTime;
            if (timezone) user.timezone = timezone;

            // 1. Calculate NEW nextReflectionAt
            const { DateTime } = require('luxon');
            const now = DateTime.now().setZone(user.timezone);

            const [hours, minutes] = user.reflectionTime.split(':').map(Number);

            // Find next occurrence of new reflection day
            let nextReflection = now.set({ hour: hours, minute: minutes, second: 0, millisecond: 0 });

            // Luxon uses 1 (Monday) to 7 (Sunday)
            // Our app uses 0 (Sunday) to 6 (Saturday)
            const targetWeekday = user.reflectionDay === 0 ? 7 : user.reflectionDay;

            // If today is the day but time passed, or if day is different, move forward
            while (nextReflection.weekday !== targetWeekday || nextReflection <= now) {
                nextReflection = nextReflection.plus({ days: 1 });
            }

            user.nextReflectionAt = nextReflection.toJSDate();
            console.log(`📅 New reflection time: ${nextReflection.toISO()}`);

            // 2. Update CURRENT week to match new schedule
            const Week = require('../models/Week');
            const currentWeek = await Week.findOne({
                userId: user._id,
                status: 'recording'
            }).sort({ reflectionDate: -1 });

            if (currentWeek) {
                console.log(`Updating current week ${currentWeek._id} to end at new reflection time`);
                currentWeek.reflectionDate = user.nextReflectionAt;
                currentWeek.weekEnd = nextReflection.endOf('day').toJSDate();
                await currentWeek.save();
            }
        }

        await user.save();

        res.json({
            success: true,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                timezone: user.timezone,
                reflectionDay: user.reflectionDay,
                reflectionTime: user.reflectionTime,
                nextReflectionAt: user.nextReflectionAt
            },
            message: scheduleChanged ? 'Schedule updated and current week adjusted' : 'Settings updated'
        });

    } catch (error) {
        console.error('Update settings error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/auth/me
 * Get current user (requires authentication)
 */
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-passwordHash');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            success: true,
            user
        });

    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Middleware to authenticate JWT token
 */
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
}

module.exports = router;
module.exports.authenticateToken = authenticateToken;

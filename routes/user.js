const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { calculateNextReflection } = require('../services/scheduler');
const { authenticateToken } = require('./auth');

/**
 * GET /api/user/settings
 * Get user settings
 */
router.get('/settings', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-passwordHash');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            success: true,
            settings: {
                timezone: user.timezone,
                reflectionDay: user.reflectionDay,
                reflectionTime: user.reflectionTime,
                nextReflectionAt: user.nextReflectionAt,
                locationEnabled: user.settings.locationEnabled
            }
        });

    } catch (error) {
        console.error('Get settings error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * PUT /api/user/settings
 * Update user settings
 */
router.put('/settings', authenticateToken, async (req, res) => {
    try {
        const { timezone, reflectionDay, reflectionTime, locationEnabled } = req.body;

        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Update fields if provided
        if (timezone !== undefined) user.timezone = timezone;
        if (reflectionDay !== undefined) user.reflectionDay = reflectionDay;
        if (reflectionTime !== undefined) user.reflectionTime = reflectionTime;
        if (locationEnabled !== undefined) user.settings.locationEnabled = locationEnabled;

        // Recalculate next reflection if day/time changed
        if (reflectionDay !== undefined || reflectionTime !== undefined || timezone !== undefined) {
            await calculateNextReflection(user);
        } else {
            await user.save();
        }

        res.json({
            success: true,
            message: 'Settings updated successfully',
            settings: {
                timezone: user.timezone,
                reflectionDay: user.reflectionDay,
                reflectionTime: user.reflectionTime,
                nextReflectionAt: user.nextReflectionAt,
                locationEnabled: user.settings.locationEnabled
            }
        });

    } catch (error) {
        console.error('Update settings error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

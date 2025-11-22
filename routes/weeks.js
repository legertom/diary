const express = require('express');
const router = express.Router();
const Week = require('../models/Week');
const Entry = require('../models/Entry');
const { processWeekReflection } = require('../services/reflectionService');

/**
 * GET /api/weeks
 * Get all weeks for a user
 */
router.get('/', async (req, res) => {
    try {
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }

        const weeks = await Week.find({ userId }).sort({ year: -1, weekNumber: -1 });

        res.json({
            success: true,
            count: weeks.length,
            weeks
        });

    } catch (error) {
        console.error('Error fetching weeks:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/weeks/:id
 * Get a specific week with its entries
 */
router.get('/:id', async (req, res) => {
    try {
        const week = await Week.findById(req.params.id);

        if (!week) {
            return res.status(404).json({ error: 'Week not found' });
        }

        const entries = await Entry.find({ weekId: week._id }).sort({ recordedAt: 1 });

        res.json({
            success: true,
            week,
            entries,
            entryCount: entries.length
        });

    } catch (error) {
        console.error('Error fetching week:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/weeks/:id/generate-reflection
 * Manually trigger reflection for a week (for testing or user-initiated)
 */
router.post('/:id/generate-reflection', async (req, res) => {
    try {
        const week = await Week.findById(req.params.id);

        if (!week) {
            return res.status(404).json({ error: 'Week not found' });
        }

        if (week.status === 'complete') {
            return res.status(400).json({ error: 'Week reflection already complete' });
        }

        if (week.status === 'processing') {
            return res.status(400).json({ error: 'Week reflection is already being processed' });
        }

        if (week.status === 'error') {
            return res.status(400).json({ error: 'Week reflection is in error state' });
        }

        // Process the week's reflection
        await processWeekReflection(week._id);

        // Reload week to get updated data
        const updatedWeek = await Week.findById(week._id);
        const entries = await Entry.find({ weekId: week._id }).sort({ recordedAt: 1 });

        res.json({
            success: true,
            week: updatedWeek,
            entries,
            message: 'Reflection generated successfully'
        });

    } catch (error) {
        console.error('Error generating reflection:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

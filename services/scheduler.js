const cron = require('node-cron');
const { DateTime } = require('luxon');
const User = require('../models/User');
const Week = require('../models/Week');
const { processWeekReflection } = require('../services/reflectionService');

/**
 * Initialize cron job to check for users whose reflection time has arrived
 * Runs every hour
 */
function initializeReflectionScheduler() {
    // Run every hour at minute 0
    cron.schedule('0 * * * *', async () => {
        console.log('🔍 Checking for users ready for reflection...');

        try {
            const now = new Date();

            // Find users whose nextReflectionAt has passed
            const users = await User.find({
                nextReflectionAt: { $lte: now }
            });

            console.log(`Found ${users.length} user(s) ready for reflection`);

            for (const user of users) {
                try {
                    await processUserReflection(user);
                } catch (error) {
                    console.error(`Error processing reflection for user ${user._id}:`, error);
                }
            }

        } catch (error) {
            console.error('Error in reflection scheduler:', error);
        }
    });

    console.log('✅ Reflection scheduler initialized (runs hourly)');
}

/**
 * Process reflection for a specific user
 * @param {Object} user - User document
 */
async function processUserReflection(user) {
    console.log(`Processing reflection for user ${user.email}...`);

    try {
        // Find the current week that needs processing
        const week = await Week.findOne({
            userId: user._id,
            status: 'recording',
            reflectionDate: { $lte: new Date() }
        }).sort({ reflectionDate: -1 });

        if (!week) {
            console.log(`No week found for user ${user.email}`);
            // Still update nextReflectionAt to prevent repeated checks
            await calculateNextReflection(user);
            return;
        }

        // Process the week's reflection
        await processWeekReflection(week._id);

        // Create next week
        await createNextWeek(user);

        // Calculate and update next reflection time
        await calculateNextReflection(user);

        console.log(`✅ Reflection complete for user ${user.email}`);

        // TODO: Send notification (email or push) that reflection is ready

    } catch (error) {
        console.error(`Error processing user ${user._id} reflection:`, error);
        throw error;
    }
}

/**
 * Create the next week document for a user
 * @param {Object} user - User document
 */
async function createNextWeek(user) {
    const nextReflection = DateTime.fromJSDate(user.nextReflectionAt, { zone: user.timezone })
        .plus({ weeks: 1 });

    const weekStart = nextReflection.minus({ days: 6 }).startOf('day');
    const weekEnd = nextReflection.endOf('day');

    const week = await Week.create({
        userId: user._id,
        weekNumber: nextReflection.weekNumber,
        year: nextReflection.year,
        weekStart: weekStart.toJSDate(),
        weekEnd: weekEnd.toJSDate(),
        reflectionDate: nextReflection.toJSDate(),
        status: 'recording'
    });

    console.log(`Created new week ${week._id} for user ${user.email}`);
    return week;
}

/**
 * Calculate and update user's next reflection time
 * @param {Object} user - User document
 */
async function calculateNextReflection(user) {
    const now = DateTime.now().setZone(user.timezone);

    // Parse reflection time (e.g., "18:00")
    const [hours, minutes] = user.reflectionTime.split(':').map(Number);

    // Find next occurrence of reflection day
    let nextReflection = now.set({ hour: hours, minute: minutes, second: 0, millisecond: 0 });

    // Luxon uses 1 (Monday) to 7 (Sunday)
    // Our app uses 0 (Sunday) to 6 (Saturday)
    const targetWeekday = user.reflectionDay === 0 ? 7 : user.reflectionDay;

    // If we're past this week's reflection time, move to next week
    while (nextReflection.weekday !== targetWeekday || nextReflection <= now) {
        nextReflection = nextReflection.plus({ days: 1 });
    }

    // Update user
    user.nextReflectionAt = nextReflection.toJSDate();
    await user.save();

    console.log(`Next reflection for ${user.email}: ${nextReflection.toISO()}`);
}

/**
 * Manually trigger reflection for a user (for testing or user-initiated reflection)
 * @param {ObjectId} userId - User ID
 */
async function triggerManualReflection(userId) {
    const user = await User.findById(userId);
    if (!user) {
        throw new Error('User not found');
    }

    await processUserReflection(user);
}

module.exports = {
    initializeReflectionScheduler,
    processUserReflection,
    calculateNextReflection,
    createNextWeek,
    triggerManualReflection
};

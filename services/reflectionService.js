const OpenAI = require('openai');
const { analyzeLocationInsights } = require('../utils/locationAnalysis');
const Entry = require('../models/Entry');
const Week = require('../models/Week');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

/**
 * Process a week's reflection: transcribe all entries and generate AI summary
 * This is called on reflection day for each user
 * @param {ObjectId} weekId - Week document ID
 * @returns {Object} Updated week with transcriptions and insights
 */
async function processWeekReflection(weekId) {
    try {
        const week = await Week.findById(weekId);
        if (!week) {
            throw new Error('Week not found');
        }

        if (week.status !== 'recording') {
            throw new Error(`Week is already ${week.status}`);
        }

        // Mark as processing
        week.status = 'processing';
        await week.save();

        // Fetch all entries for this week
        const entries = await Entry.find({ weekId: week._id }).sort({ recordedAt: 1 });

        if (entries.length === 0) {
            week.status = 'complete';
            week.processedAt = new Date();
            await week.save();
            return week;
        }

        // Step 1: Transcribe all audio entries using Whisper
        console.log(`Transcribing ${entries.length} entries for week ${weekId}...`);
        const transcriptions = await transcribeEntries(entries);

        // Store transcriptions in week document
        week.transcriptions = transcriptions;
        await week.save();

        // Step 2: Analyze location data
        const locationInsights = analyzeLocationInsights(entries);

        // Step 3: Generate AI summary with GPT-4
        console.log(`Generating AI summary for week ${weekId}...`);
        const insights = await generateWeeklySummary(transcriptions, locationInsights);

        // Update week with complete insights
        week.insights = insights;
        week.status = 'complete';
        week.processedAt = new Date();
        await week.save();

        console.log(`✅ Week ${weekId} reflection complete`);
        return week;

    } catch (error) {
        console.error('Error processing week reflection:', error);

        // Mark week as error
        const week = await Week.findById(weekId);
        if (week) {
            week.status = 'error';
            await week.save();
        }

        throw error;
    }
}

/**
 * Transcribe all audio entries using OpenAI Whisper
 * @param {Array} entries - Array of Entry documents
 * @returns {Array} Array of transcription objects
 */
async function transcribeEntries(entries) {
    const transcriptions = [];
    const fs = require('fs');
    const path = require('path');

    for (const entry of entries) {
        try {
            console.log(`Transcribing entry ${entry._id}...`);

            // Construct absolute path to file
            // entry.audioUrl is like "/uploads/filename.webm"
            const filename = path.basename(entry.audioUrl);
            const filePath = path.join(__dirname, '../uploads', filename);

            if (!fs.existsSync(filePath)) {
                throw new Error(`Audio file not found at ${filePath}`);
            }

            // Call Whisper API
            const transcription = await openai.audio.transcriptions.create({
                file: fs.createReadStream(filePath),
                model: 'whisper-1',
                language: 'en'
            });

            console.log(`📝 Transcription for ${entry._id}: ${transcription.text.substring(0, 50)}...`);

            transcriptions.push({
                entryId: entry._id,
                text: transcription.text,
                recordedAt: entry.recordedAt
            });

        } catch (error) {
            console.error(`Error transcribing entry ${entry._id}:`, error);
            transcriptions.push({
                entryId: entry._id,
                text: '[Transcription failed: ' + error.message + ']',
                recordedAt: entry.recordedAt
            });
        }
    }

    return transcriptions;
}

/**
 * Generate weekly summary using GPT-4
 * @param {Array} transcriptions - Array of transcription objects
 * @param {Object} locationInsights - Location analysis data
 * @returns {Object} Insights object
 */
async function generateWeeklySummary(transcriptions, locationInsights) {
    const prompt = buildSummaryPrompt(transcriptions, locationInsights);

    try {
        const completion = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: [
                {
                    role: 'system',
                    content: 'You are a thoughtful, empathetic AI assistant helping someone reflect on their week through their voice diary entries. Provide insightful, supportive analysis that helps them understand patterns in their thoughts, emotions, and experiences. When location data is available, consider how physical movement and places might relate to their mental and emotional states.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.7,
            max_tokens: 1500
        });

        const aiResponse = completion.choices[0].message.content;

        // Parse AI response
        const insights = parseAIResponse(aiResponse);

        // Add location insights
        if (locationInsights) {
            insights.locationInsights = locationInsights;
        }

        return insights;

    } catch (error) {
        console.error('Error generating summary:', error);
        throw error;
    }
}

/**
 * Build GPT-4 prompt with transcriptions and location context
 */
function buildSummaryPrompt(transcriptions, locationInsights) {
    let prompt = 'Here are the diary entries from this person\'s week:\n\n';

    // Add each transcription
    transcriptions.forEach((t, index) => {
        const day = new Date(t.recordedAt).toLocaleDateString('en-US', { weekday: 'long' });
        const time = new Date(t.recordedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

        prompt += `Entry ${index + 1} (${day} at ${time}):\n`;
        prompt += `${t.text}\n\n`;
    });

    // Add location summary if available
    if (locationInsights) {
        prompt += '\n--- Movement & Location Summary ---\n';
        prompt += `- Recorded from ${locationInsights.totalUniqueLocations} unique location${locationInsights.totalUniqueLocations !== 1 ? 's' : ''}\n`;
        prompt += `- Traveled approximately ${locationInsights.distanceTraveled.toFixed(1)}km this week\n`;
        prompt += `- ${locationInsights.timeAtHome}% of entries from primary location (likely home)\n`;
        prompt += `- Mobility score: ${locationInsights.mobilityScore}/100 `;

        if (locationInsights.mobilityScore < 30) {
            prompt += '(stayed mostly in one place)\n';
        } else if (locationInsights.mobilityScore < 70) {
            prompt += '(moderate movement)\n';
        } else {
            prompt += '(high mobility, moved around a lot)\n';
        }

        prompt += `- Exploration score: ${locationInsights.explorationScore}/100 `;

        if (locationInsights.explorationScore < 30) {
            prompt += '(stuck to familiar places)\n';
        } else if (locationInsights.explorationScore < 70) {
            prompt += '(some variety in locations)\n';
        } else {
            prompt += '(explored new places)\n';
        }

        prompt += '\n';
    }

    prompt += `Please analyze this week and provide:

1. **SUMMARY**: A thoughtful 2-3 paragraph summary of their week
2. **MOOD**: Overall mood trend (e.g., "positive", "mixed", "stressed", "reflective")
3. **THEMES**: 3-5 key themes or topics that came up repeatedly
4. **HIGHLIGHTS**: 2-3 specific moments or insights worth remembering`;

    if (locationInsights) {
        prompt += `
5. **LOCATION_INSIGHT**: How their movement patterns might relate to their emotional state or experiences`;
    }

    prompt += `\n\nFormat your response as:
SUMMARY:
[Your 2-3 paragraph summary]

MOOD: [mood trend]

THEMES: [theme 1], [theme 2], [theme 3]

HIGHLIGHTS:
- [highlight 1]
- [highlight 2]
- [highlight 3]`;

    if (locationInsights) {
        prompt += `\n\nLOCATION_INSIGHT: [brief insight about movement and mood]`;
    }

    return prompt;
}

/**
 * Parse AI response into structured insights
 */
function parseAIResponse(response) {
    const insights = {
        moodTrend: '',
        keyThemes: [],
        highlights: []
    };

    // Extract summary (everything between SUMMARY: and MOOD:)
    const summaryMatch = response.match(/SUMMARY:\s*([\s\S]+?)(?=\n\nMOOD:|MOOD:)/i);
    if (summaryMatch) {
        insights.summary = summaryMatch[1].trim();
    }

    // Extract mood
    const moodMatch = response.match(/MOOD:\s*(.+)/i);
    if (moodMatch) {
        insights.moodTrend = moodMatch[1].trim();
    }

    // Extract themes
    const themesMatch = response.match(/THEMES:\s*(.+)/i);
    if (themesMatch) {
        insights.keyThemes = themesMatch[1]
            .split(',')
            .map(t => t.trim())
            .filter(t => t.length > 0);
    }

    // Extract highlights
    const highlightsSection = response.match(/HIGHLIGHTS:\s*([\s\S]+?)(?=\n\nLOCATION_INSIGHT:|$)/i);
    if (highlightsSection) {
        insights.highlights = highlightsSection[1]
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.startsWith('-') || line.match(/^\d+\./))
            .map(line => line.replace(/^[-\d.]\s*/, '').trim())
            .filter(h => h.length > 0);
    }

    return insights;
}

module.exports = {
    processWeekReflection,
    transcribeEntries,
    generateWeeklySummary
};

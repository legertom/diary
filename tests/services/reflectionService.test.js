const fs = require('fs');
const path = require('path');
const {
    processWeekReflection,
    transcribeEntries,
    generateWeeklySummary
} = require('../../services/reflectionService');
const Week = require('../../models/Week');
const Entry = require('../../models/Entry');
const OpenAI = require('openai');

jest.mock('../../models/Week');
jest.mock('../../models/Entry');
jest.mock('../../utils/locationAnalysis', () => ({
    analyzeLocationInsights: jest.fn().mockReturnValue({
        totalUniqueLocations: 3,
        mobilityScore: 50,
        distanceTraveled: 25.5,
        timeAtHome: 60
    })
}));

// Mock OpenAI - use factory function
const mockTranscribe = jest.fn();
const mockChatCompletion = jest.fn();

jest.mock('openai', () => {
    return jest.fn().mockImplementation(() => ({
        audio: {
            transcriptions: {
                create: jest.fn().mockResolvedValue({ text: 'Test transcription' })
            }
        },
        chat: {
            completions: {
                create: jest.fn().mockResolvedValue({
                    choices: [{
                        message: {
                            content: 'SUMMARY:\nGreat week!\n\nMOOD: positive\n\nTHEMES: work, family, fun\n\nHIGHLIGHTS:\n- Had fun\n- Worked hard'
                        }
                    }]
                })
            }
        }
    }));
});

describe('reflectionService', () => {
    let openaiInstance;

    beforeEach(() => {
        jest.clearAllMocks();
        // Get the mocked OpenAI instance
        const OpenAI = require('openai');
        openaiInstance = new OpenAI();
    });

    describe('processWeekReflection', () => {
        it('should return error if week not found', async () => {
            Week.findById.mockResolvedValue(null);

            await expect(processWeekReflection('nonexistent')).rejects.toThrow('Week not found');
        });

        it('should return error if week already processed', async () => {
            const mockWeek = {
                _id: 'weekId',
                status: 'complete',
                save: jest.fn().mockResolvedValue(true)
            };

            Week.findById.mockResolvedValue(mockWeek);

            await expect(processWeekReflection('weekId')).rejects.toThrow('already complete');
        });

        it('should handle week with no entries', async () => {
            const mockWeek = {
                _id: 'weekId',
                status: 'recording',
                save: jest.fn().mockResolvedValue(true)
            };

            Week.findById.mockResolvedValue(mockWeek);
            Entry.find.mockReturnValue({
                sort: jest.fn().mockResolvedValue([])
            });

            const result = await processWeekReflection('weekId');

            expect(result.status).toBe('complete');
            expect(result.processedAt).toBeDefined();
        });

        it('should mark week as error on failure', async () => {
            const mockWeek = {
                _id: 'weekId',
                status: 'recording',
                save: jest.fn().mockResolvedValue(true)
            };

            Week.findById.mockResolvedValue(mockWeek);
            Entry.find.mockReturnValue({
                sort: jest.fn().mockRejectedValue(new Error('Database error'))
            });

            await expect(processWeekReflection('weekId')).rejects.toThrow();

            // Check that week was marked as error
            const errorWeek = await Week.findById('weekId');
            if (errorWeek) {
                expect(errorWeek.status).toBe('error');
            }
        });
    });

    describe('transcribeEntries', () => {
        it('should handle missing audio files gracefully', async () => {
            const mockEntries = [
                {
                    _id: 'entry1',
                    audioUrl: '/uploads/nonexistent.webm',
                    recordedAt: new Date()
                }
            ];

            // Mock OpenAI to throw error for this test
            openaiInstance.audio.transcriptions.create.mockRejectedValueOnce(new Error('File not found'));

            const transcriptions = await transcribeEntries(mockEntries);

            expect(transcriptions).toHaveLength(1);
            expect(transcriptions[0].text).toContain('Transcription failed');
        });
    });

    describe('generateWeeklySummary', () => {
        it('should generate summary with location insights', async () => {
            const transcriptions = [
                {
                    entryId: 'entry1',
                    text: 'Had a great day today',
                    recordedAt: new Date()
                }
            ];

            const locationInsights = {
                totalUniqueLocations: 3,
                mobilityScore: 50,
                distanceTraveled: 25.5
            };

            const insights = await generateWeeklySummary(transcriptions, locationInsights);

            expect(insights.moodTrend).toBe('positive');
            expect(insights.keyThemes).toContain('work');
            expect(insights.locationInsights).toBeDefined();
        });

        it('should handle missing location insights', async () => {
            const transcriptions = [
                {
                    entryId: 'entry1',
                    text: 'Had a great day',
                    recordedAt: new Date()
                }
            ];

            const insights = await generateWeeklySummary(transcriptions, null);

            expect(insights.moodTrend).toBe('positive');
            expect(insights.locationInsights).toBeUndefined();
        });
    });
});


const request = require('supertest');
const express = require('express');
const weeksRoutes = require('../routes/weeks');
const Week = require('../models/Week');
const Entry = require('../models/Entry');
const { processWeekReflection } = require('../services/reflectionService');

// Mock dependencies
jest.mock('../models/Week');
jest.mock('../models/Entry');
jest.mock('../services/reflectionService', () => ({
    processWeekReflection: jest.fn().mockResolvedValue(true)
}));

const app = express();
app.use(express.json());
app.use('/api/weeks', weeksRoutes);

describe('GET /api/weeks', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return all weeks for a user', async () => {
        const mockWeeks = [
            { _id: 'week1', userId: 'user1', year: 2024, weekNumber: 1 },
            { _id: 'week2', userId: 'user1', year: 2024, weekNumber: 2 }
        ];

        Week.find.mockReturnValue({
            sort: jest.fn().mockResolvedValue(mockWeeks)
        });

        const res = await request(app)
            .get('/api/weeks')
            .query({ userId: 'user1' });

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.count).toBe(2);
        expect(res.body.weeks).toHaveLength(2);
    });

    it('should reject request without userId', async () => {
        const res = await request(app)
            .get('/api/weeks');

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/userId is required/i);
    });
});

describe('GET /api/weeks/:id', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return a specific week with entries', async () => {
        const mockWeek = {
            _id: 'week1',
            userId: 'user1',
            year: 2024,
            weekNumber: 1,
            status: 'recording'
        };

        const mockEntries = [
            { _id: 'entry1', weekId: 'week1', duration: 60 },
            { _id: 'entry2', weekId: 'week1', duration: 120 }
        ];

        Week.findById.mockResolvedValue(mockWeek);
        Entry.find.mockReturnValue({
            sort: jest.fn().mockResolvedValue(mockEntries)
        });

        const res = await request(app)
            .get('/api/weeks/week1');

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.week._id).toBe('week1');
        expect(res.body.entries).toHaveLength(2);
        expect(res.body.entryCount).toBe(2);
    });

    it('should return 404 if week not found', async () => {
        Week.findById.mockResolvedValue(null);

        const res = await request(app)
            .get('/api/weeks/nonexistent');

        expect(res.statusCode).toBe(404);
        expect(res.body.error).toMatch(/not found/i);
    });
});

describe('POST /api/weeks/:id/generate-reflection', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should generate reflection for a week', async () => {
        const mockWeek = {
            _id: 'week1',
            userId: 'user1',
            status: 'recording',
            year: 2024,
            weekNumber: 1
        };

        const mockUpdatedWeek = {
            ...mockWeek,
            status: 'complete',
            insights: { moodTrend: 'positive' }
        };

        const mockEntries = [
            { _id: 'entry1', weekId: 'week1', duration: 60 }
        ];

        Week.findById.mockResolvedValueOnce(mockWeek);
        Week.findById.mockResolvedValueOnce(mockUpdatedWeek);
        Entry.find.mockReturnValue({
            sort: jest.fn().mockResolvedValue(mockEntries)
        });

        const res = await request(app)
            .post('/api/weeks/week1/generate-reflection');

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toMatch(/generated successfully/i);
        expect(processWeekReflection).toHaveBeenCalledWith('week1');
    });

    it('should return 404 if week not found', async () => {
        Week.findById.mockResolvedValue(null);

        const res = await request(app)
            .post('/api/weeks/nonexistent/generate-reflection');

        expect(res.statusCode).toBe(404);
        expect(res.body.error).toMatch(/not found/i);
    });

    it('should return 400 if reflection already complete', async () => {
        const mockWeek = {
            _id: 'week1',
            userId: 'user1',
            status: 'complete'
        };

        Week.findById.mockResolvedValue(mockWeek);

        const res = await request(app)
            .post('/api/weeks/week1/generate-reflection');

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/already complete/i);
    });
});


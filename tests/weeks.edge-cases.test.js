const request = require('supertest');
const express = require('express');
const weeksRoutes = require('../routes/weeks');
const Week = require('../models/Week');
const Entry = require('../models/Entry');
const { processWeekReflection } = require('../services/reflectionService');

jest.mock('../models/Week');
jest.mock('../models/Entry');
jest.mock('../services/reflectionService', () => ({
    processWeekReflection: jest.fn().mockResolvedValue(true)
}));

const app = express();
app.use(express.json());
app.use('/api/weeks', weeksRoutes);

describe('Weeks edge cases', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/weeks - edge cases', () => {
        it('should handle database errors', async () => {
            Week.find.mockReturnValue({
                sort: jest.fn().mockRejectedValue(new Error('Database error'))
            });

            const res = await request(app)
                .get('/api/weeks')
                .query({ userId: 'user1' });

            expect(res.statusCode).toBe(500);
        });

        it('should handle empty weeks array', async () => {
            Week.find.mockReturnValue({
                sort: jest.fn().mockResolvedValue([])
            });

            const res = await request(app)
                .get('/api/weeks')
                .query({ userId: 'user1' });

            expect(res.statusCode).toBe(200);
            expect(res.body.weeks).toEqual([]);
            expect(res.body.count).toBe(0);
        });

        it('should handle invalid userId format', async () => {
            const res = await request(app)
                .get('/api/weeks')
                .query({ userId: '' });

            expect(res.statusCode).toBe(400);
        });
    });

    describe('GET /api/weeks/:id - edge cases', () => {
        it('should handle database errors', async () => {
            Week.findById.mockRejectedValue(new Error('Database error'));

            const res = await request(app)
                .get('/api/weeks/week1');

            expect(res.statusCode).toBe(500);
        });

        it('should handle invalid week ID format', async () => {
            Week.findById.mockResolvedValue(null);

            const res = await request(app)
                .get('/api/weeks/invalid-id-format');

            expect(res.statusCode).toBe(404);
        });

        it('should handle week with no entries', async () => {
            const mockWeek = {
                _id: 'week1',
                userId: 'user1',
                status: 'recording'
            };

            Week.findById.mockResolvedValue(mockWeek);
            Entry.find.mockReturnValue({
                sort: jest.fn().mockResolvedValue([])
            });

            const res = await request(app)
                .get('/api/weeks/week1');

            expect(res.statusCode).toBe(200);
            expect(res.body.entries).toEqual([]);
            expect(res.body.entryCount).toBe(0);
        });

        it('should handle entries query error', async () => {
            const mockWeek = {
                _id: 'week1',
                userId: 'user1',
                status: 'recording'
            };

            Week.findById.mockResolvedValue(mockWeek);
            Entry.find.mockReturnValue({
                sort: jest.fn().mockRejectedValue(new Error('Database error'))
            });

            const res = await request(app)
                .get('/api/weeks/week1');

            expect(res.statusCode).toBe(500);
        });
    });

    describe('POST /api/weeks/:id/generate-reflection - edge cases', () => {
        it('should handle database errors when finding week', async () => {
            Week.findById.mockRejectedValue(new Error('Database error'));

            const res = await request(app)
                .post('/api/weeks/week1/generate-reflection');

            expect(res.statusCode).toBe(500);
        });

        it('should handle processing errors', async () => {
            const mockWeek = {
                _id: 'week1',
                userId: 'user1',
                status: 'recording'
            };

            Week.findById.mockResolvedValue(mockWeek);
            processWeekReflection.mockRejectedValue(new Error('Processing failed'));

            const res = await request(app)
                .post('/api/weeks/week1/generate-reflection');

            expect(res.statusCode).toBe(500);
        });

        it('should handle week in processing status', async () => {
            const mockWeek = {
                _id: 'week1',
                userId: 'user1',
                status: 'processing'
            };

            Week.findById.mockResolvedValue(mockWeek);

            const res = await request(app)
                .post('/api/weeks/week1/generate-reflection');

            expect(res.statusCode).toBe(400);
            expect(res.body.error).toBe('Week reflection is already being processed');
        });

        it('should handle week in error status', async () => {
            const mockWeek = {
                _id: 'week1',
                userId: 'user1',
                status: 'error'
            };

            Week.findById.mockResolvedValue(mockWeek);

            const res = await request(app)
                .post('/api/weeks/week1/generate-reflection');

            expect(res.statusCode).toBe(400);
        });

        it('should handle error reloading week after processing', async () => {
            const mockWeek = {
                _id: 'week1',
                userId: 'user1',
                status: 'recording'
            };

            Week.findById.mockResolvedValueOnce(mockWeek);
            Week.findById.mockRejectedValueOnce(new Error('Database error'));

            const res = await request(app)
                .post('/api/weeks/week1/generate-reflection');

            expect(res.statusCode).toBe(500);
        });
    });
});


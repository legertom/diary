const request = require('supertest');
const express = require('express');
const entriesRoutes = require('../routes/entries');
const Entry = require('../models/Entry');
const Week = require('../models/Week');
const User = require('../models/User');
const path = require('path');

// Mock dependencies
jest.mock('../models/Entry');
jest.mock('../models/Week');
jest.mock('../models/User');
jest.mock('node-geocoder', () => {
    return () => ({
        reverse: jest.fn().mockResolvedValue([{
            city: 'Test City',
            state: 'Test State',
            country: 'Test Country',
            formattedAddress: 'Test Address'
        }])
    });
});

const app = express();
app.use(express.json());
app.use('/api/entries', entriesRoutes);

describe('Entries edge cases', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/entries - edge cases', () => {
        it('should handle missing audio file', async () => {
            const res = await request(app)
                .post('/api/entries')
                .field('userId', 'user1')
                .field('duration', '60');

            expect(res.statusCode).toBe(400);
            expect(res.body.error).toBe('Audio file is required');
        });

        it('should handle missing userId', async () => {
            const res = await request(app)
                .post('/api/entries')
                .attach('audio', Buffer.from('fake audio'), 'test.webm')
                .field('duration', '60');

            expect(res.statusCode).toBe(400);
            expect(res.body.error).toBe('userId and duration are required');
        });

        it('should handle missing duration', async () => {
            const res = await request(app)
                .post('/api/entries')
                .attach('audio', Buffer.from('fake audio'), 'test.webm')
                .field('userId', 'user1');

            expect(res.statusCode).toBe(400);
            expect(res.body.error).toBe('userId and duration are required');
        });

        it('should handle invalid file type', async () => {
            const res = await request(app)
                .post('/api/entries')
                .attach('audio', Buffer.from('fake text'), 'test.txt')
                .field('userId', 'user1')
                .field('duration', '60');

            // Multer error handling might return 500 or HTML depending on setup
            // In this app, it seems to crash or return 500 if not handled explicitly in route
            // But the route uses upload.single which throws if file filter fails
            // Let's see what it returns. Usually 500 with "Invalid file type"
            expect(res.statusCode).toBe(500);
        });

        it('should handle user not found', async () => {
            User.findById.mockResolvedValue(null);

            const res = await request(app)
                .post('/api/entries')
                .attach('audio', Buffer.from('fake audio'), 'test.webm')
                .field('userId', 'nonexistent')
                .field('duration', '60');

            expect(res.statusCode).toBe(404);
            expect(res.body.error).toBe('User not found');
        });

        it('should handle invalid location coordinates', async () => {
            const location = JSON.stringify({ latitude: 100, longitude: 0 }); // Invalid lat

            const res = await request(app)
                .post('/api/entries')
                .attach('audio', Buffer.from('fake audio'), 'test.webm')
                .field('userId', 'user1')
                .field('duration', '60')
                .field('location', location);

            expect(res.statusCode).toBe(400);
            expect(res.body.error).toBe('Invalid latitude');
        });

        it('should handle database errors during entry creation', async () => {
            User.findById.mockResolvedValue({
                _id: 'user1',
                timezone: 'America/New_York',
                reflectionDay: 0,
                reflectionTime: '18:00'
            });
            Week.findOne.mockResolvedValue({ _id: 'week1' });
            Entry.create.mockRejectedValue(new Error('Database error'));

            const res = await request(app)
                .post('/api/entries')
                .attach('audio', Buffer.from('fake audio'), 'test.webm')
                .field('userId', 'user1')
                .field('duration', '60');

            expect(res.statusCode).toBe(500);
        });
    });

    describe('GET /api/entries - edge cases', () => {
        it('should handle missing userId', async () => {
            const res = await request(app)
                .get('/api/entries');

            expect(res.statusCode).toBe(400);
            expect(res.body.error).toBe('userId is required');
        });

        it('should handle database errors', async () => {
            Entry.find.mockReturnValue({
                sort: jest.fn().mockRejectedValue(new Error('Database error'))
            });

            const res = await request(app)
                .get('/api/entries')
                .query({ userId: 'user1' });

            expect(res.statusCode).toBe(500);
        });
    });

    describe('GET /api/entries/:id - edge cases', () => {
        it('should handle entry not found', async () => {
            Entry.findById.mockResolvedValue(null);

            const res = await request(app)
                .get('/api/entries/nonexistent');

            expect(res.statusCode).toBe(404);
            expect(res.body.error).toBe('Entry not found');
        });

        it('should handle database errors', async () => {
            Entry.findById.mockRejectedValue(new Error('Database error'));

            const res = await request(app)
                .get('/api/entries/entry1');

            expect(res.statusCode).toBe(500);
        });
    });

    describe('DELETE /api/entries/:id - edge cases', () => {
        it('should handle entry not found', async () => {
            Entry.findByIdAndDelete.mockResolvedValue(null);

            const res = await request(app)
                .delete('/api/entries/nonexistent');

            expect(res.statusCode).toBe(404);
            expect(res.body.error).toBe('Entry not found');
        });

        it('should handle database errors', async () => {
            Entry.findByIdAndDelete.mockRejectedValue(new Error('Database error'));

            const res = await request(app)
                .delete('/api/entries/entry1');

            expect(res.statusCode).toBe(500);
        });
    });
});

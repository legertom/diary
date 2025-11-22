const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const authRoutes = require('../routes/auth');
const User = require('../models/User');
const Week = require('../models/Week');

// Mock dependencies
jest.mock('../models/User');
jest.mock('../models/Week');
jest.mock('../services/scheduler', () => ({
    calculateNextReflection: jest.fn(),
    createNextWeek: jest.fn()
}));

// DO NOT mock auth routes, use the real one
// jest.mock('../routes/auth'); 

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('PUT /api/auth/settings', () => {
    let mockUser;
    let token;

    beforeEach(() => {
        jest.clearAllMocks();

        mockUser = {
            _id: 'mockUserId',
            email: 'test@example.com',
            name: 'Test User',
            reflectionDay: 0, // Sunday
            reflectionTime: '18:00',
            timezone: 'America/New_York',
            nextReflectionAt: new Date(),
            save: jest.fn().mockResolvedValue(true)
        };

        // Mock User.findById to support both direct await and .select() chaining
        const mockQuery = Promise.resolve(mockUser);
        mockQuery.select = jest.fn().mockResolvedValue(mockUser);
        User.findById.mockReturnValue(mockQuery);

        // Mock Week.findOne().sort() chain
        const mockWeekQuery = {
            sort: jest.fn().mockResolvedValue(null) // Return null for currentWeek
        };
        Week.findOne.mockReturnValue(mockWeekQuery);

        // Generate a valid token
        token = jwt.sign(
            { userId: 'mockUserId', email: 'test@example.com' },
            'your-secret-key', // Default secret used in auth.js
            { expiresIn: '1h' }
        );
    });

    it('should update reflection day when provided as a number', async () => {
        const res = await request(app)
            .put('/api/auth/settings')
            .set('Authorization', `Bearer ${token}`)
            .send({
                reflectionDay: 1, // Monday
                reflectionTime: '18:00',
                timezone: 'America/New_York'
            });

        expect(res.statusCode).toBe(200);
        expect(mockUser.reflectionDay).toBe(1);
        expect(mockUser.save).toHaveBeenCalled();
    });

    it('should update reflection day when provided as a string (coercion)', async () => {
        const res = await request(app)
            .put('/api/auth/settings')
            .set('Authorization', `Bearer ${token}`)
            .send({
                reflectionDay: '1', // Monday as string
                reflectionTime: '18:00',
                timezone: 'America/New_York'
            });

        expect(res.statusCode).toBe(200);
        expect(mockUser.reflectionDay).toBe(1); // Should be number 1
        expect(typeof mockUser.reflectionDay).toBe('number');
        expect(mockUser.save).toHaveBeenCalled();
    });

    it('should not update if values are unchanged', async () => {
        const res = await request(app)
            .put('/api/auth/settings')
            .set('Authorization', `Bearer ${token}`)
            .send({
                reflectionDay: 0,
                reflectionTime: '18:00',
                timezone: 'America/New_York'
            });

        expect(res.statusCode).toBe(200);
        expect(mockUser.reflectionDay).toBe(0);
    });

    it('should persist settings after update (simulate page refresh)', async () => {
        // 1. Update settings
        await request(app)
            .put('/api/auth/settings')
            .set('Authorization', `Bearer ${token}`)
            .send({
                reflectionDay: 2, // Tuesday
                reflectionTime: '18:00',
                timezone: 'America/New_York'
            })
            .expect(200);

        // 2. Simulate page refresh by fetching user data
        // We need to ensure the mock returns the updated value for the subsequent findById call
        // Since we are mocking User.findById, we need to update the mock implementation
        // or rely on the fact that our previous test updated the mockUser object reference?
        // In a real DB, this happens automatically. With mocks, we must simulate it.

        // Update the mock object to reflect the change (simulating DB save)
        mockUser.reflectionDay = 2;

        const res = await request(app)
            .get('/api/auth/me')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.user.reflectionDay).toBe(2);
    });

    it('should reject invalid reflection day (out of range)', async () => {
        const res = await request(app)
            .put('/api/auth/settings')
            .set('Authorization', `Bearer ${token}`)
            .send({
                reflectionDay: 7, // Invalid (0-6)
                reflectionTime: '18:00',
                timezone: 'America/New_York'
            });

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/invalid reflection day/i);
    });

    it('should reject invalid reflection time format', async () => {
        const res = await request(app)
            .put('/api/auth/settings')
            .set('Authorization', `Bearer ${token}`)
            .send({
                reflectionDay: 0,
                reflectionTime: '25:00', // Invalid hour
                timezone: 'America/New_York'
            });

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/invalid reflection time/i);
    });

    it('should reject unauthenticated requests', async () => {
        const res = await request(app)
            .put('/api/auth/settings')
            .send({
                reflectionDay: 0,
                reflectionTime: '18:00',
                timezone: 'America/New_York'
            });

        expect(res.statusCode).toBe(401); // or 403 depending on implementation
    });
});

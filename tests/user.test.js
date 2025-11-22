const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const userRoutes = require('../routes/user');
const User = require('../models/User');
const { calculateNextReflection } = require('../services/scheduler');

// Mock dependencies
jest.mock('../models/User');
jest.mock('../services/scheduler', () => ({
    calculateNextReflection: jest.fn().mockResolvedValue(true)
}));

const app = express();
app.use(express.json());
app.use('/api/user', userRoutes);

describe('GET /api/user/settings', () => {
    let token;
    let mockUser;

    beforeEach(() => {
        jest.clearAllMocks();

        mockUser = {
            _id: 'userId',
            email: 'test@example.com',
            timezone: 'America/New_York',
            reflectionDay: 0,
            reflectionTime: '18:00',
            nextReflectionAt: new Date(),
            settings: {
                locationEnabled: true
            }
        };

        token = jwt.sign(
            { userId: 'userId', email: 'test@example.com' },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '1h' }
        );

        const mockQuery = Promise.resolve(mockUser);
        mockQuery.select = jest.fn().mockResolvedValue(mockUser);
        User.findById.mockReturnValue(mockQuery);
    });

    it('should return user settings', async () => {
        const res = await request(app)
            .get('/api/user/settings')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.settings.timezone).toBe('America/New_York');
        expect(res.body.settings.reflectionDay).toBe(0);
        expect(res.body.settings.locationEnabled).toBe(true);
    });

    it('should reject request without token', async () => {
        const res = await request(app)
            .get('/api/user/settings');

        expect(res.statusCode).toBe(401);
    });

    it('should return 404 if user not found', async () => {
        const mockQuery = Promise.resolve(null);
        mockQuery.select = jest.fn().mockResolvedValue(null);
        User.findById.mockReturnValue(mockQuery);

        const res = await request(app)
            .get('/api/user/settings')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(404);
        expect(res.body.error).toMatch(/not found/i);
    });
});

describe('PUT /api/user/settings', () => {
    let token;
    let mockUser;

    beforeEach(() => {
        jest.clearAllMocks();

        mockUser = {
            _id: 'userId',
            email: 'test@example.com',
            timezone: 'America/New_York',
            reflectionDay: 0,
            reflectionTime: '18:00',
            nextReflectionAt: new Date(),
            settings: {
                locationEnabled: true
            },
            save: jest.fn().mockResolvedValue(true)
        };

        token = jwt.sign(
            { userId: 'userId', email: 'test@example.com' },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '1h' }
        );

        User.findById.mockResolvedValue(mockUser);
    });

    it('should update timezone', async () => {
        const res = await request(app)
            .put('/api/user/settings')
            .set('Authorization', `Bearer ${token}`)
            .send({
                timezone: 'Europe/London'
            });

        expect(res.statusCode).toBe(200);
        expect(mockUser.timezone).toBe('Europe/London');
        expect(calculateNextReflection).toHaveBeenCalled();
    });

    it('should update reflection day', async () => {
        const res = await request(app)
            .put('/api/user/settings')
            .set('Authorization', `Bearer ${token}`)
            .send({
                reflectionDay: 1
            });

        expect(res.statusCode).toBe(200);
        expect(mockUser.reflectionDay).toBe(1);
        expect(calculateNextReflection).toHaveBeenCalled();
    });

    it('should update location enabled setting', async () => {
        const res = await request(app)
            .put('/api/user/settings')
            .set('Authorization', `Bearer ${token}`)
            .send({
                locationEnabled: false
            });

        expect(res.statusCode).toBe(200);
        expect(mockUser.settings.locationEnabled).toBe(false);
        expect(mockUser.save).toHaveBeenCalled();
    });

    it('should not recalculate reflection if only locationEnabled changed', async () => {
        const res = await request(app)
            .put('/api/user/settings')
            .set('Authorization', `Bearer ${token}`)
            .send({
                locationEnabled: false
            });

        expect(res.statusCode).toBe(200);
        expect(calculateNextReflection).not.toHaveBeenCalled();
        expect(mockUser.save).toHaveBeenCalled();
    });

    it('should return 404 if user not found', async () => {
        User.findById.mockResolvedValue(null);

        const res = await request(app)
            .put('/api/user/settings')
            .set('Authorization', `Bearer ${token}`)
            .send({
                timezone: 'Europe/London'
            });

        expect(res.statusCode).toBe(404);
        expect(res.body.error).toMatch(/not found/i);
    });
});


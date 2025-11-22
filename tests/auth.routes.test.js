const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const authRoutes = require('../routes/auth');
const User = require('../models/User');
const Week = require('../models/Week');

// Mock dependencies
jest.mock('../models/User');
jest.mock('../models/Week');
jest.mock('../services/scheduler', () => ({
    calculateNextReflection: jest.fn().mockResolvedValue(true),
    createNextWeek: jest.fn().mockResolvedValue(true)
}));

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('POST /api/auth/register', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should register a new user successfully', async () => {
        User.findOne.mockResolvedValue(null); // No existing user
        User.prototype.save = jest.fn().mockResolvedValue(true);
        
        const mockUser = {
            _id: 'newUserId',
            email: 'newuser@example.com',
            name: 'New User',
            passwordHash: 'hashedpassword',
            timezone: 'America/New_York',
            reflectionDay: 0,
            reflectionTime: '18:00',
            nextReflectionAt: new Date()
        };

        User.mockImplementation(() => mockUser);

        const res = await request(app)
            .post('/api/auth/register')
            .send({
                email: 'newuser@example.com',
                name: 'New User',
                password: 'password123',
                timezone: 'America/New_York',
                reflectionDay: 0,
                reflectionTime: '18:00'
            });

        expect(res.statusCode).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.token).toBeDefined();
        expect(res.body.user.email).toBe('newuser@example.com');
    });

    it('should reject registration with missing fields', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({
                email: 'test@example.com'
                // Missing name and password
            });

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/required/i);
    });

    it('should reject registration if user already exists', async () => {
        User.findOne.mockResolvedValue({ _id: 'existingUserId', email: 'existing@example.com' });

        const res = await request(app)
            .post('/api/auth/register')
            .send({
                email: 'existing@example.com',
                name: 'Existing User',
                password: 'password123'
            });

        expect(res.statusCode).toBe(409);
        expect(res.body.error).toMatch(/already exists/i);
    });
});

describe('POST /api/auth/login', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should login successfully with valid credentials', async () => {
        const hashedPassword = await bcrypt.hash('password123', 10);
        const mockUser = {
            _id: 'userId',
            email: 'test@example.com',
            name: 'Test User',
            passwordHash: hashedPassword,
            timezone: 'America/New_York',
            reflectionDay: 0,
            reflectionTime: '18:00',
            nextReflectionAt: new Date()
        };

        User.findOne.mockResolvedValue(mockUser);

        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'test@example.com',
                password: 'password123'
            });

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.token).toBeDefined();
        expect(res.body.user.email).toBe('test@example.com');
    });

    it('should reject login with missing credentials', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'test@example.com'
                // Missing password
            });

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toMatch(/required/i);
    });

    it('should reject login with invalid email', async () => {
        User.findOne.mockResolvedValue(null);

        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'nonexistent@example.com',
                password: 'password123'
            });

        expect(res.statusCode).toBe(401);
        expect(res.body.error).toMatch(/invalid credentials/i);
    });

    it('should reject login with invalid password', async () => {
        const hashedPassword = await bcrypt.hash('correctpassword', 10);
        const mockUser = {
            _id: 'userId',
            email: 'test@example.com',
            passwordHash: hashedPassword
        };

        User.findOne.mockResolvedValue(mockUser);

        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'test@example.com',
                password: 'wrongpassword'
            });

        expect(res.statusCode).toBe(401);
        expect(res.body.error).toMatch(/invalid credentials/i);
    });
});

describe('GET /api/auth/me', () => {
    let token;
    let mockUser;

    beforeEach(() => {
        jest.clearAllMocks();

        mockUser = {
            _id: 'userId',
            email: 'test@example.com',
            name: 'Test User',
            timezone: 'America/New_York',
            reflectionDay: 0,
            reflectionTime: '18:00',
            nextReflectionAt: new Date()
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

    it('should return current user with valid token', async () => {
        const res = await request(app)
            .get('/api/auth/me')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.user.email).toBe('test@example.com');
    });

    it('should reject request without token', async () => {
        const res = await request(app)
            .get('/api/auth/me');

        expect(res.statusCode).toBe(401);
        expect(res.body.error).toMatch(/token required/i);
    });

    it('should reject request with invalid token', async () => {
        const res = await request(app)
            .get('/api/auth/me')
            .set('Authorization', 'Bearer invalidtoken');

        expect(res.statusCode).toBe(403);
        expect(res.body.error).toMatch(/invalid or expired/i);
    });

    it('should return 404 if user not found', async () => {
        const mockQuery = Promise.resolve(null);
        mockQuery.select = jest.fn().mockResolvedValue(null);
        User.findById.mockReturnValue(mockQuery);

        const res = await request(app)
            .get('/api/auth/me')
            .set('Authorization', `Bearer ${token}`);

        expect(res.statusCode).toBe(404);
        expect(res.body.error).toMatch(/not found/i);
    });
});

describe('PUT /api/auth/settings - additional cases', () => {
    let mockUser;
    let token;

    beforeEach(() => {
        jest.clearAllMocks();

        mockUser = {
            _id: 'userId',
            email: 'test@example.com',
            name: 'Test User',
            reflectionDay: 0,
            reflectionTime: '18:00',
            timezone: 'America/New_York',
            nextReflectionAt: new Date(),
            save: jest.fn().mockResolvedValue(true)
        };

        const mockQuery = Promise.resolve(mockUser);
        mockQuery.select = jest.fn().mockResolvedValue(mockUser);
        User.findById.mockReturnValue(mockQuery);

        const mockWeekQuery = {
            sort: jest.fn().mockResolvedValue(null)
        };
        Week.findOne.mockReturnValue(mockWeekQuery);

        token = jwt.sign(
            { userId: 'userId', email: 'test@example.com' },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '1h' }
        );
    });

    it('should return 404 if user not found', async () => {
        User.findById.mockResolvedValue(null);

        const res = await request(app)
            .put('/api/auth/settings')
            .set('Authorization', `Bearer ${token}`)
            .send({
                name: 'Updated Name'
            });

        expect(res.statusCode).toBe(404);
        expect(res.body.error).toMatch(/not found/i);
    });

    it('should update name only', async () => {
        const res = await request(app)
            .put('/api/auth/settings')
            .set('Authorization', `Bearer ${token}`)
            .send({
                name: 'Updated Name'
            });

        expect(res.statusCode).toBe(200);
        expect(mockUser.name).toBe('Updated Name');
        expect(mockUser.save).toHaveBeenCalled();
    });

    it('should handle schedule change with current week update', async () => {
        const mockWeek = {
            _id: 'weekId',
            userId: 'userId',
            status: 'recording',
            reflectionDate: new Date(),
            weekEnd: new Date(),
            save: jest.fn().mockResolvedValue(true)
        };

        const mockWeekQuery = {
            sort: jest.fn().mockResolvedValue(mockWeek)
        };
        Week.findOne.mockReturnValue(mockWeekQuery);

        const res = await request(app)
            .put('/api/auth/settings')
            .set('Authorization', `Bearer ${token}`)
            .send({
                reflectionDay: 1,
                reflectionTime: '19:00'
            });

        expect(res.statusCode).toBe(200);
        expect(mockUser.reflectionDay).toBe(1);
        expect(mockUser.reflectionTime).toBe('19:00');
        expect(mockWeek.save).toHaveBeenCalled();
    });
});


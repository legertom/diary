const { DateTime } = require('luxon');
const {
    calculateNextReflection,
    createNextWeek,
    processUserReflection,
    triggerManualReflection
} = require('../../services/scheduler');
const User = require('../../models/User');
const Week = require('../../models/Week');
const { processWeekReflection } = require('../../services/reflectionService');

jest.mock('../../models/User');
jest.mock('../../models/Week');
jest.mock('../../services/reflectionService', () => ({
    processWeekReflection: jest.fn().mockResolvedValue(true)
}));

describe('scheduler service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('calculateNextReflection', () => {
        it('should calculate next reflection time for Sunday', async () => {
            const mockUser = {
                _id: 'userId',
                email: 'test@example.com',
                reflectionDay: 0, // Sunday
                reflectionTime: '18:00',
                timezone: 'America/New_York',
                nextReflectionAt: new Date(),
                save: jest.fn().mockResolvedValue(true)
            };

            await calculateNextReflection(mockUser);

            expect(mockUser.save).toHaveBeenCalled();
            expect(mockUser.nextReflectionAt).toBeInstanceOf(Date);
        });

        it('should calculate next reflection time for weekday', async () => {
            const mockUser = {
                _id: 'userId',
                email: 'test@example.com',
                reflectionDay: 1, // Monday
                reflectionTime: '09:00',
                timezone: 'America/New_York',
                nextReflectionAt: new Date(),
                save: jest.fn().mockResolvedValue(true)
            };

            await calculateNextReflection(mockUser);

            expect(mockUser.save).toHaveBeenCalled();
            expect(mockUser.nextReflectionAt).toBeInstanceOf(Date);
        });

        it('should handle different timezones', async () => {
            const mockUser = {
                _id: 'userId',
                email: 'test@example.com',
                reflectionDay: 0,
                reflectionTime: '18:00',
                timezone: 'Europe/London',
                nextReflectionAt: new Date(),
                save: jest.fn().mockResolvedValue(true)
            };

            await calculateNextReflection(mockUser);

            expect(mockUser.save).toHaveBeenCalled();
        });
    });

    describe('createNextWeek', () => {
        it('should create next week for user', async () => {
            const mockUser = {
                _id: 'userId',
                email: 'test@example.com',
                timezone: 'America/New_York',
                nextReflectionAt: DateTime.now().plus({ days: 7 }).toJSDate()
            };

            const mockWeek = {
                _id: 'weekId',
                userId: 'userId',
                year: 2024,
                weekNumber: 1
            };

            Week.create.mockResolvedValue(mockWeek);

            const week = await createNextWeek(mockUser);

            expect(Week.create).toHaveBeenCalled();
            expect(week).toBeDefined();
        });

        it('should set correct week boundaries', async () => {
            const futureDate = DateTime.now().plus({ weeks: 1 });
            const mockUser = {
                _id: 'userId',
                email: 'test@example.com',
                timezone: 'America/New_York',
                nextReflectionAt: futureDate.toJSDate()
            };

            Week.create.mockResolvedValue({ _id: 'weekId' });

            await createNextWeek(mockUser);

            const createCall = Week.create.mock.calls[0][0];
            expect(createCall.userId).toBe('userId');
            expect(createCall.status).toBe('recording');
            expect(createCall.weekStart).toBeInstanceOf(Date);
            expect(createCall.weekEnd).toBeInstanceOf(Date);
        });
    });

    describe('processUserReflection', () => {
        it('should process reflection when week exists', async () => {
            const mockUser = {
                _id: 'userId',
                email: 'test@example.com',
                timezone: 'America/New_York',
                reflectionDay: 0,
                reflectionTime: '18:00',
                nextReflectionAt: new Date(),
                save: jest.fn().mockResolvedValue(true)
            };

            const mockWeek = {
                _id: 'weekId',
                userId: 'userId',
                status: 'recording',
                reflectionDate: new Date(Date.now() - 1000) // Past date
            };

            const mockWeekQuery = {
                sort: jest.fn().mockResolvedValue(mockWeek)
            };
            Week.findOne.mockReturnValue(mockWeekQuery);

            // Mock the internal functions by mocking the scheduler module functions
            const scheduler = require('../../services/scheduler');
            const originalCalculate = scheduler.calculateNextReflection;
            const originalCreate = scheduler.createNextWeek;
            
            scheduler.calculateNextReflection = jest.fn().mockResolvedValue(true);
            scheduler.createNextWeek = jest.fn().mockResolvedValue({ _id: 'newWeek' });

            await processUserReflection(mockUser);

            expect(processWeekReflection).toHaveBeenCalledWith('weekId');
            
            // Restore
            scheduler.calculateNextReflection = originalCalculate;
            scheduler.createNextWeek = originalCreate;
        });

        it('should handle case when no week found', async () => {
            const mockUser = {
                _id: 'userId',
                email: 'test@example.com',
                timezone: 'America/New_York',
                reflectionDay: 0,
                reflectionTime: '18:00',
                nextReflectionAt: new Date(),
                save: jest.fn().mockResolvedValue(true)
            };

            const mockWeekQuery = {
                sort: jest.fn().mockResolvedValue(null)
            };
            Week.findOne.mockReturnValue(mockWeekQuery);

            await processUserReflection(mockUser);

            expect(processWeekReflection).not.toHaveBeenCalled();
            expect(mockUser.save).toHaveBeenCalled(); // calculateNextReflection calls save
        });
    });

    describe('triggerManualReflection', () => {
        it('should trigger reflection for valid user', async () => {
            const mockUser = {
                _id: 'userId',
                email: 'test@example.com',
                timezone: 'America/New_York',
                reflectionDay: 0,
                reflectionTime: '18:00',
                nextReflectionAt: new Date(),
                save: jest.fn().mockResolvedValue(true)
            };

            User.findById.mockResolvedValue(mockUser);

            const mockWeekQuery = {
                sort: jest.fn().mockResolvedValue(null)
            };
            Week.findOne.mockReturnValue(mockWeekQuery);

            await triggerManualReflection('userId');

            expect(User.findById).toHaveBeenCalledWith('userId');
            expect(mockUser.save).toHaveBeenCalled();
        });

        it('should throw error if user not found', async () => {
            User.findById.mockResolvedValue(null);

            await expect(triggerManualReflection('nonexistent')).rejects.toThrow('User not found');
        });
    });
});


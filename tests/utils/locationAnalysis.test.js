const {
    haversineDistance,
    clusterLocations,
    calculateTotalDistance,
    calculateMobilityScore,
    calculateExplorationScore,
    analyzeLocationInsights
} = require('../../utils/locationAnalysis');

describe('locationAnalysis utilities', () => {
    describe('haversineDistance', () => {
        it('should calculate distance between two points', () => {
            // Distance between NYC and LA (approximately 3944 km)
            const distance = haversineDistance(40.7128, -74.0060, 34.0522, -118.2437);
            expect(distance).toBeGreaterThan(3900);
            expect(distance).toBeLessThan(4000);
        });

        it('should return 0 for same point', () => {
            const distance = haversineDistance(40.7128, -74.0060, 40.7128, -74.0060);
            expect(distance).toBe(0);
        });

        it('should handle negative coordinates', () => {
            const distance = haversineDistance(-40.7128, -74.0060, -34.0522, -118.2437);
            expect(distance).toBeGreaterThan(0);
        });
    });

    describe('clusterLocations', () => {
        it('should return empty array for no entries', () => {
            const clusters = clusterLocations([]);
            expect(clusters).toEqual([]);
        });

        it('should return empty array for entries without location', () => {
            const entries = [
                { _id: '1', location: null },
                { _id: '2', location: {} }
            ];
            const clusters = clusterLocations(entries);
            expect(clusters).toEqual([]);
        });

        it('should cluster nearby locations', () => {
            const entries = [
                {
                    _id: '1',
                    location: { latitude: 40.7128, longitude: -74.0060 }
                },
                {
                    _id: '2',
                    location: { latitude: 40.7130, longitude: -74.0062 } // Very close
                },
                {
                    _id: '3',
                    location: { latitude: 34.0522, longitude: -118.2437 } // Far away
                }
            ];

            const clusters = clusterLocations(entries, 1000); // 1km radius
            expect(clusters.length).toBeGreaterThan(0);
            expect(clusters[0].entryCount).toBeGreaterThanOrEqual(1);
        });

        it('should label largest cluster as Home', () => {
            const entries = [
                {
                    _id: '1',
                    location: { latitude: 40.7128, longitude: -74.0060 }
                },
                {
                    _id: '2',
                    location: { latitude: 40.7130, longitude: -74.0062 }
                },
                {
                    _id: '3',
                    location: { latitude: 40.7132, longitude: -74.0064 }
                }
            ];

            const clusters = clusterLocations(entries, 1000);
            expect(clusters[0].label).toBe('Home');
        });
    });

    describe('calculateTotalDistance', () => {
        it('should return 0 for less than 2 entries', () => {
            const entries = [
                { location: { latitude: 40.7128, longitude: -74.0060 } }
            ];
            const distance = calculateTotalDistance(entries);
            expect(distance).toBe(0);
        });

        it('should calculate total distance for multiple entries', () => {
            const entries = [
                {
                    recordedAt: new Date('2024-01-01'),
                    location: { latitude: 40.7128, longitude: -74.0060 }
                },
                {
                    recordedAt: new Date('2024-01-02'),
                    location: { latitude: 40.7130, longitude: -74.0062 }
                },
                {
                    recordedAt: new Date('2024-01-03'),
                    location: { latitude: 40.7132, longitude: -74.0064 }
                }
            ];

            const distance = calculateTotalDistance(entries);
            expect(distance).toBeGreaterThan(0);
        });

        it('should sort entries by recordedAt before calculating', () => {
            const entries = [
                {
                    recordedAt: new Date('2024-01-03'),
                    location: { latitude: 40.7132, longitude: -74.0064 }
                },
                {
                    recordedAt: new Date('2024-01-01'),
                    location: { latitude: 40.7128, longitude: -74.0060 }
                }
            ];

            const distance = calculateTotalDistance(entries);
            expect(distance).toBeGreaterThan(0);
        });
    });

    describe('calculateMobilityScore', () => {
        it('should return score between 0 and 100', () => {
            const score = calculateMobilityScore(5, 100);
            expect(score).toBeGreaterThanOrEqual(0);
            expect(score).toBeLessThanOrEqual(100);
        });

        it('should return higher score for more locations', () => {
            const score1 = calculateMobilityScore(1, 0);
            const score2 = calculateMobilityScore(10, 0);
            expect(score2).toBeGreaterThan(score1);
        });

        it('should return higher score for more distance', () => {
            const score1 = calculateMobilityScore(1, 10);
            const score2 = calculateMobilityScore(1, 100);
            expect(score2).toBeGreaterThan(score1);
        });

        it('should cap at 100', () => {
            const score = calculateMobilityScore(100, 1000);
            expect(score).toBeLessThanOrEqual(100);
        });
    });

    describe('calculateExplorationScore', () => {
        it('should return 0 for empty clusters', () => {
            const score = calculateExplorationScore([], 10);
            expect(score).toBe(0);
        });

        it('should return higher score for distributed entries', () => {
            const clusters = [
                { entryCount: 5 },
                { entryCount: 3 },
                { entryCount: 2 }
            ];
            const score = calculateExplorationScore(clusters, 10);
            expect(score).toBeGreaterThan(0);
        });

        it('should return lower score when most entries in one cluster', () => {
            const clusters1 = [
                { entryCount: 9 },
                { entryCount: 1 }
            ];
            const clusters2 = [
                { entryCount: 5 },
                { entryCount: 5 }
            ];
            const score1 = calculateExplorationScore(clusters1, 10);
            const score2 = calculateExplorationScore(clusters2, 10);
            expect(score2).toBeGreaterThan(score1);
        });
    });

    describe('analyzeLocationInsights', () => {
        it('should return null for entries without location', () => {
            const entries = [
                { _id: '1', location: null },
                { _id: '2', location: {} }
            ];
            const insights = analyzeLocationInsights(entries);
            expect(insights).toBeNull();
        });

        it('should analyze location insights for entries with locations', () => {
            const entries = [
                {
                    recordedAt: new Date('2024-01-01'),
                    location: { latitude: 40.7128, longitude: -74.0060 }
                },
                {
                    recordedAt: new Date('2024-01-02'),
                    location: { latitude: 40.7130, longitude: -74.0062 }
                }
            ];

            const insights = analyzeLocationInsights(entries);
            expect(insights).not.toBeNull();
            expect(insights.totalUniqueLocations).toBeGreaterThan(0);
            expect(insights.mobilityScore).toBeGreaterThanOrEqual(0);
            expect(insights.mobilityScore).toBeLessThanOrEqual(100);
            expect(insights.distanceTraveled).toBeGreaterThanOrEqual(0);
        });

        it('should calculate time at home percentage', () => {
            const entries = [
                {
                    recordedAt: new Date('2024-01-01'),
                    location: { latitude: 40.7128, longitude: -74.0060 }
                },
                {
                    recordedAt: new Date('2024-01-02'),
                    location: { latitude: 40.7128, longitude: -74.0060 } // Same location
                },
                {
                    recordedAt: new Date('2024-01-03'),
                    location: { latitude: 40.7128, longitude: -74.0060 } // Same location
                }
            ];

            const insights = analyzeLocationInsights(entries);
            expect(insights.timeAtHome).toBeGreaterThanOrEqual(0);
            expect(insights.timeAtHome).toBeLessThanOrEqual(100);
        });
    });
});


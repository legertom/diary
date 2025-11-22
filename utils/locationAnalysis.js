/**
 * Geospatial analysis utilities for location-based insights
 */

/**
 * Calculate distance between two GPS coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in kilometers
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const toRad = (deg) => (deg * Math.PI) / 180;

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

/**
 * Cluster nearby locations using distance-based clustering
 * @param {Array} entries - Array of entry objects with location data
 * @param {number} radiusMeters - Clustering radius in meters (default: 100m)
 * @returns {Array} Array of location clusters
 */
function clusterLocations(entries, radiusMeters = 100) {
    const radiusKm = radiusMeters / 1000;
    const clusters = [];
    const processed = new Set();

    // Filter entries with valid location data
    const locatedEntries = entries.filter(e => e.location && e.location.latitude && e.location.longitude);

    if (locatedEntries.length === 0) {
        return [];
    }

    for (let i = 0; i < locatedEntries.length; i++) {
        if (processed.has(i)) continue;

        const entry = locatedEntries[i];
        const cluster = {
            entries: [entry],
            indices: [i]
        };

        // Find all entries within radius
        for (let j = i + 1; j < locatedEntries.length; j++) {
            if (processed.has(j)) continue;

            const otherEntry = locatedEntries[j];
            const distance = haversineDistance(
                entry.location.latitude,
                entry.location.longitude,
                otherEntry.location.latitude,
                otherEntry.location.longitude
            );

            if (distance <= radiusKm) {
                cluster.entries.push(otherEntry);
                cluster.indices.push(j);
                processed.add(j);
            }
        }

        processed.add(i);
        clusters.push(cluster);
    }

    // Calculate cluster centers
    return clusters.map((cluster, index) => {
        const centerLat = cluster.entries.reduce((sum, e) => sum + e.location.latitude, 0) / cluster.entries.length;
        const centerLng = cluster.entries.reduce((sum, e) => sum + e.location.longitude, 0) / cluster.entries.length;

        // Calculate cluster radius (max distance from center)
        const maxDistance = Math.max(...cluster.entries.map(e =>
            haversineDistance(centerLat, centerLng, e.location.latitude, e.location.longitude)
        ));

        return {
            centerLat,
            centerLng,
            radius: maxDistance * 1000, // Convert to meters
            entryCount: cluster.entries.length,
            label: cluster.entries.length === 1 ? `Location ${index + 1}` :
                index === 0 ? 'Home' :
                    index === 1 ? 'Work' :
                        `Location ${index + 1}`
        };
    }).sort((a, b) => b.entryCount - a.entryCount); // Sort by entry count descending
}

/**
 * Calculate total distance traveled based on chronologically ordered entries
 * @param {Array} entries - Array of entry objects with location data (should be sorted by recordedAt)
 * @returns {number} Total distance in kilometers
 */
function calculateTotalDistance(entries) {
    const locatedEntries = entries
        .filter(e => e.location && e.location.latitude && e.location.longitude)
        .sort((a, b) => new Date(a.recordedAt) - new Date(b.recordedAt));

    if (locatedEntries.length < 2) {
        return 0;
    }

    let totalDistance = 0;
    for (let i = 1; i < locatedEntries.length; i++) {
        const prev = locatedEntries[i - 1];
        const curr = locatedEntries[i];

        totalDistance += haversineDistance(
            prev.location.latitude,
            prev.location.longitude,
            curr.location.latitude,
            curr.location.longitude
        );
    }

    return totalDistance;
}

/**
 * Calculate mobility score (0-100) based on unique locations and distance
 * @param {number} uniqueLocations - Number of unique location clusters
 * @param {number} distanceKm - Total distance traveled in km
 * @returns {number} Mobility score (0-100)
 */
function calculateMobilityScore(uniqueLocations, distanceKm) {
    // Normalize factors
    const locationScore = Math.min(uniqueLocations * 10, 50); // Max 50 points for locations
    const distanceScore = Math.min(distanceKm * 2, 50); // Max 50 points for distance

    return Math.min(Math.round(locationScore + distanceScore), 100);
}

/**
 * Calculate exploration score based on cluster distribution
 * @param {Array} clusters - Array of location clusters
 * @param {number} totalEntries - Total number of entries
 * @returns {number} Exploration score (0-100)
 */
function calculateExplorationScore(clusters, totalEntries) {
    if (clusters.length === 0 || totalEntries === 0) {
        return 0;
    }

    // Higher score if entries are distributed across multiple locations
    const primaryClusterRatio = clusters[0].entryCount / totalEntries;
    const diversityScore = (1 - primaryClusterRatio) * 100;

    // Bonus for having many unique locations
    const locationBonus = Math.min(clusters.length * 5, 30);

    return Math.min(Math.round(diversityScore + locationBonus), 100);
}

/**
 * Analyze location data for a week's entries
 * @param {Array} entries - Array of entry objects
 * @returns {Object} Location insights object
 */
function analyzeLocationInsights(entries) {
    const locatedEntries = entries.filter(e => e.location && e.location.latitude && e.location.longitude);

    if (locatedEntries.length === 0) {
        return null;
    }

    // Cluster locations
    const clusters = clusterLocations(locatedEntries, 100);

    // Calculate distance traveled
    const distanceTraveled = calculateTotalDistance(locatedEntries);

    // Calculate mobility score
    const mobilityScore = calculateMobilityScore(clusters.length, distanceTraveled);

    // Calculate exploration score
    const explorationScore = calculateExplorationScore(clusters, locatedEntries.length);

    // Determine primary location (largest cluster)
    const primaryCluster = clusters[0];
    const primaryLocation = primaryCluster ? {
        latitude: primaryCluster.centerLat,
        longitude: primaryCluster.centerLng,
        address: null, // Will be populated by reverse geocoding if enabled
        entryCount: primaryCluster.entryCount
    } : null;

    // Calculate time at home (percentage of entries at primary location)
    const timeAtHome = primaryCluster ?
        Math.round((primaryCluster.entryCount / locatedEntries.length) * 100) : 0;

    return {
        totalUniqueLocations: clusters.length,
        primaryLocation,
        mobilityScore,
        distanceTraveled: Math.round(distanceTraveled * 100) / 100, // Round to 2 decimals
        locationClusters: clusters,
        timeAtHome,
        explorationScore
    };
}

module.exports = {
    haversineDistance,
    clusterLocations,
    calculateTotalDistance,
    calculateMobilityScore,
    calculateExplorationScore,
    analyzeLocationInsights
};

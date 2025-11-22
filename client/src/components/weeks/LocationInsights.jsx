import StatCard from '../common/StatCard';
import './LocationInsights.css';

const LocationInsights = ({ locationInsights }) => {
  if (!locationInsights) return null;

  return (
    <div className="location-insights">
      <h3>Movement & Location Insights</h3>
      <div className="location-insights-grid">
        <StatCard 
          label="Unique Locations" 
          value={locationInsights.totalUniqueLocations} 
        />
        <StatCard 
          label="Distance Traveled" 
          value={`${locationInsights.distanceTraveled.toFixed(1)} km`} 
        />
        <StatCard 
          label="Mobility Score" 
          value={`${locationInsights.mobilityScore}/100`} 
        />
        <StatCard 
          label="Time at Home" 
          value={`${locationInsights.timeAtHome}%`} 
        />
      </div>
    </div>
  );
};

export default LocationInsights;


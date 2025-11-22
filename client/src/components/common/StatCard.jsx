import './StatCard.css';

const StatCard = ({ label, value, className = '' }) => {
  return (
    <div className={`stat ${className}`.trim()}>
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
    </div>
  );
};

export default StatCard;


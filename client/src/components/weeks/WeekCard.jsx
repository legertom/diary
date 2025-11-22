import { formatDate } from '../../utils/dateUtils';
import './WeekCard.css';

const WeekCard = ({ week, onClick }) => {
  const startDate = formatDate(week.weekStart, {
    month: 'short',
    day: 'numeric'
  });
  const endDate = formatDate(week.weekEnd, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  const statusClass = week.status === 'complete' ? 'complete' : 'recording';
  const statusText = week.status === 'complete' ? 'Complete' : 'In Progress';
  const summary = week.insights?.moodTrend
    ? `Mood: ${week.insights.moodTrend}`
    : 'Reflection pending...';

  return (
    <div className="week-card" onClick={onClick}>
      <div className="week-header">
        <div className="week-title">Week of {startDate} - {endDate}</div>
        <div className={`week-status-badge ${statusClass}`}>{statusText}</div>
      </div>
      <div className="week-summary">{summary}</div>
    </div>
  );
};

export default WeekCard;


import { formatDate } from '../../utils/dateUtils';
import LocationInsights from './LocationInsights';
import TranscriptionsList from './TranscriptionsList';
import EmptyState from '../common/EmptyState';
import './WeekDetail.css';

const WeekDetail = ({ week, entries }) => {
  const startDate = formatDate(week.weekStart, {
    month: 'long',
    day: 'numeric'
  });
  const endDate = formatDate(week.weekEnd, {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  if (week.status !== 'complete' || !week.insights) {
    return (
      <EmptyState 
        message="Reflection for this week is still in progress. Check back after your reflection day!"
        icon="⏳"
      />
    );
  }

  return (
    <div className="week-detail">
      <h2>Week of {startDate} - {endDate}</h2>
      <p className="week-detail-meta">{entries.length} entries</p>

      {week.summary && (
        <div className="week-detail-section">
          <h3>Weekly Summary</h3>
          <p className="week-summary-text">{week.summary}</p>
        </div>
      )}

      <div className="week-detail-section">
        <h3>Mood Trend</h3>
        <p className="mood-trend">{week.insights.moodTrend}</p>
      </div>

      {week.insights.keyThemes && week.insights.keyThemes.length > 0 && (
        <div className="week-detail-section">
          <h3>Key Themes</h3>
          <ul className="themes-list">
            {week.insights.keyThemes.map((theme, i) => (
              <li key={i}>{theme}</li>
            ))}
          </ul>
        </div>
      )}

      {week.insights.highlights && week.insights.highlights.length > 0 && (
        <div className="week-detail-section">
          <h3>Highlights</h3>
          <ul className="highlights-list">
            {week.insights.highlights.map((highlight, i) => (
              <li key={i}>{highlight}</li>
            ))}
          </ul>
        </div>
      )}

      {week.insights.locationInsights && (
        <LocationInsights locationInsights={week.insights.locationInsights} />
      )}

      <TranscriptionsList transcriptions={week.transcriptions} />
    </div>
  );
};

export default WeekDetail;


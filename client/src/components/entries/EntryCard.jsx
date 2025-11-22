import { formatDate, formatTime, formatDuration } from '../../utils/dateUtils';
import './EntryCard.css';

const EntryCard = ({ entry }) => {
  const dateStr = formatDate(entry.recordedAt, {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  });
  const timeStr = formatTime(entry.recordedAt);
  const locationDisplay = entry.location?.address
    ? `• ${entry.location.address}`
    : (entry.location ? '📍' : '');

  return (
    <div className="entry-card">
      <div className="entry-info">
        <div className="entry-date">
          {dateStr} at {timeStr} {locationDisplay}
        </div>
        <div className="entry-duration">{formatDuration(entry.duration)}</div>
      </div>
    </div>
  );
};

export default EntryCard;


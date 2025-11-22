import { formatDate, formatTime } from '../../utils/dateUtils';
import './TranscriptionsList.css';

const TranscriptionsList = ({ transcriptions }) => {
  if (!transcriptions || transcriptions.length === 0) return null;

  return (
    <div className="transcriptions-list">
      <h3>Transcriptions</h3>
      {transcriptions.map((t, index) => {
        const dateStr = formatDate(t.recordedAt, {
          weekday: 'long',
          month: 'short',
          day: 'numeric'
        });
        const timeStr = formatTime(t.recordedAt);

        return (
          <div key={index} className="transcription-item">
            <div className="transcription-header">
              Entry {index + 1} - {dateStr} at {timeStr}
              {t.location?.address && ` • ${t.location.address}`}
            </div>
            <div className="transcription-text">{t.text}</div>
          </div>
        );
      })}
    </div>
  );
};

export default TranscriptionsList;


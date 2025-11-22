import { useEffect, useState } from 'react';
import StatCard from '../common/StatCard';
import Button from '../common/Button';
import { getDayName, formatTime } from '../../utils/dateUtils';
import './WeekStatus.css';

const WeekStatus = ({ user, entryCount = 0, onGenerateReflection }) => {
  const [nextReflection, setNextReflection] = useState('');

  useEffect(() => {
    if (user?.nextReflectionAt) {
      const date = new Date(user.nextReflectionAt);
      const dayName = getDayName(date.getDay());
      const time = formatTime(date);
      setNextReflection(`${dayName} at ${time}`);
    }
  }, [user]);

  return (
    <div className="week-status">
      <h2>This Week</h2>
      <div className="stats">
        <StatCard label="Entries" value={entryCount} />
        <StatCard label="Next Reflection" value={nextReflection || 'Loading...'} />
      </div>
      {onGenerateReflection && (
        <div className="week-status-actions">
          <Button
            variant="secondary"
            onClick={onGenerateReflection}
            style={{
              fontSize: '0.8rem',
              padding: '6px 12px',
              borderRadius: '20px'
            }}
          >
            ⚡ Generate Reflection (Dev)
          </Button>
        </div>
      )}
    </div>
  );
};

export default WeekStatus;


import EntryCard from './EntryCard';
import EmptyState from '../common/EmptyState';
import './EntriesList.css';

const EntriesList = ({ entries, emptyMessage = 'No entries yet.', emptyIcon = '🎙️' }) => {
  if (entries.length === 0) {
    return <EmptyState message={emptyMessage} icon={emptyIcon} />;
  }

  return (
    <div className="entries-list">
      {entries.map(entry => (
        <EntryCard key={entry._id} entry={entry} />
      ))}
    </div>
  );
};

export default EntriesList;


import './EmptyState.css';

const EmptyState = ({ 
  message, 
  icon = '📝',
  action,
  actionLabel 
}) => {
  return (
    <div className="empty-state">
      {icon && <div className="empty-state-icon">{icon}</div>}
      <p className="empty-state-message">{message}</p>
      {action && actionLabel && (
        <button onClick={action} className="empty-state-action">
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;


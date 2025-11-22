import './SuccessMessage.css';

const SuccessMessage = ({ message, className = '' }) => {
  if (!message) return null;
  
  return (
    <div className={`success-message ${className}`.trim()}>
      {message}
    </div>
  );
};

export default SuccessMessage;


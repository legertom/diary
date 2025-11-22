import './ErrorMessage.css';

const ErrorMessage = ({ message, className = '' }) => {
  if (!message) return null;
  
  return (
    <div className={`error-message ${className}`.trim()}>
      {message}
    </div>
  );
};

export default ErrorMessage;


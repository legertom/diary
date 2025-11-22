import './FormGroup.css';

const FormGroup = ({ children, className = '' }) => {
  return (
    <div className={`form-group ${className}`.trim()}>
      {children}
    </div>
  );
};

export default FormGroup;


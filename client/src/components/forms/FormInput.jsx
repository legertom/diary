import FormGroup from './FormGroup';

const FormInput = ({ 
  label, 
  id, 
  name,
  type = 'text',
  value, 
  onChange, 
  required = false,
  minLength,
  placeholder,
  ...props 
}) => {
  return (
    <FormGroup>
      <label htmlFor={id}>{label}</label>
      <input
        type={type}
        id={id}
        name={name || id}
        value={value}
        onChange={onChange}
        required={required}
        minLength={minLength}
        placeholder={placeholder}
        {...props}
      />
    </FormGroup>
  );
};

export default FormInput;


import FormGroup from './FormGroup';

const FormSelect = ({ 
  label, 
  id, 
  name,
  value, 
  onChange, 
  required = false,
  options = [],
  ...props 
}) => {
  return (
    <FormGroup>
      <label htmlFor={id}>{label}</label>
      <select
        id={id}
        name={name || id}
        value={value}
        onChange={onChange}
        required={required}
        {...props}
      >
        {options.map((option, index) => {
          if (typeof option === 'string') {
            return (
              <option key={index} value={index}>
                {option}
              </option>
            );
          }
          return (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          );
        })}
      </select>
    </FormGroup>
  );
};

export default FormSelect;


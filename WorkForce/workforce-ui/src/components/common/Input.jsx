import React from 'react';

export const Input = ({
  type = 'text',
  value,
  onChange,
  placeholder,
  disabled,
  required,
  style,
  className,
  label,
  error,
  name,
  maxLength,
  ...props
}) => {
  const baseStyle = {
    width: '100%',
    padding: '12px 14px',
    borderRadius: '8px',
    border: error ? '1px solid #DC2626' : '1px solid #CBD5E1',
    fontSize: '14px',
    color: '#1E293B',
    outline: 'none',
    boxSizing: 'border-box',
    backgroundColor: disabled ? '#F1F5F9' : '#F8FAFC',
    cursor: disabled ? 'not-allowed' : 'text',
    transition: 'border-color 0.2s ease',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
      {label && (
        <label style={{ 
          fontSize: '12px', 
          fontWeight: '600', 
          color: '#475569', 
          textTransform: 'uppercase', 
          letterSpacing: '0.025em' 
        }}>
          {label} {required && <span style={{ color: '#DC2626' }}>*</span>}
        </label>
      )}
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        maxLength={maxLength}
        style={{ ...baseStyle, ...style }}
        className={className}
        {...props}
      />
      {error && <span style={{ fontSize: '12px', color: '#DC2626' }}>{error}</span>}
    </div>
  );
};
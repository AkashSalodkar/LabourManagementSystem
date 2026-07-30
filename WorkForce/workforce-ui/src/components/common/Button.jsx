import React from 'react';

export const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  disabled, 
  className, 
  style,
  type = 'button',
  fullWidth = false,
}) => {
  const baseStyle = {
    padding: '12px 24px',
    borderRadius: '8px',
    border: 'none',
    fontSize: '14px',
    fontWeight: '600',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    width: fullWidth ? '100%' : 'auto',
    transition: 'all 0.2s ease',
  };

  const variants = {
    primary: {
      backgroundColor: '#0B3C9B',
      color: '#ffffff',
      '&:hover': {
        backgroundColor: '#0A3485',
      },
    },
    secondary: {
      backgroundColor: '#f4f6f9',
      color: '#0B3C9B',
      border: '1px solid #0B3C9B',
    },
    danger: {
      backgroundColor: '#DC2626',
      color: '#ffffff',
      '&:hover': {
        backgroundColor: '#B91C1C',
      },
    },
    success: {
      backgroundColor: '#10B981',
      color: '#ffffff',
      '&:hover': {
        backgroundColor: '#059669',
      },
    },
    outline: {
      backgroundColor: 'transparent',
      color: '#0B3C9B',
      border: '1px solid #CBD5E1',
    },
  };

  const combinedStyle = { ...baseStyle, ...variants[variant], ...style };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={combinedStyle}
      className={className}
    >
      {children}
    </button>
  );
};
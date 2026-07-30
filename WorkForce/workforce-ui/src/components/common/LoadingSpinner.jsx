import React from 'react';

export const LoadingSpinner = ({ size = 40, color = '#0B3C9B' }) => {
  return (
    <div style={{
      display: 'inline-block',
      width: size,
      height: size,
      border: `3px solid ${color}20`,
      borderRadius: '50%',
      borderTop: `3px solid ${color}`,
      animation: 'spin 0.8s linear infinite',
    }}>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};
import React, { useRef, useEffect } from 'react';

export const OtpInput = ({ value, onChange, disabled }) => {
  const otpBoxRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];
  const otpDigits = Array.from({ length: 6 }, (_, i) => value?.[i] || '');

  useEffect(() => {
    if (!disabled && otpBoxRefs[0].current) {
      otpBoxRefs[0].current.focus();
    }
  }, [disabled]);

  const handleOtpDigitChange = (index, rawValue) => {
    const digit = rawValue.replace(/\D/g, '').slice(-1);
    const nextDigits = [...otpDigits];
    nextDigits[index] = digit;
    onChange(nextDigits.join('').slice(0, 6));
    if (digit && index < 5) {
      otpBoxRefs[index + 1].current?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpBoxRefs[index - 1].current?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text');
    const digits = pasteData.replace(/\D/g, '').slice(0, 6);
    if (digits.length > 0) {
      onChange(digits);
      const nextIndex = Math.min(digits.length, 5);
      otpBoxRefs[nextIndex].current?.focus();
    }
  };

  const otpBoxStyle = {
    width: '48px',
    height: '56px',
    textAlign: 'center',
    fontSize: '22px',
    fontWeight: '700',
    color: '#1E293B',
    border: '1px solid #CBD5E1',
    borderRadius: '10px',
    outline: 'none',
    backgroundColor: !disabled ? '#F8FAFC' : '#F1F5F9',
    cursor: !disabled ? 'text' : 'not-allowed',
    transition: 'border-color 0.2s ease, background-color 0.2s ease',
  };

  const otpBoxFilledStyle = {
    borderColor: '#2563EB',
    backgroundColor: '#ffffff',
  };

  return (
    <div 
      style={{ display: 'flex', gap: '10px', marginBottom: '10px', justifyContent: 'center' }}
      onPaste={handlePaste}
    >
      {otpDigits.map((digit, index) => (
        <input
          key={index}
          ref={otpBoxRefs[index]}
          type="text"
          inputMode="numeric"
          maxLength={1}
          disabled={disabled}
          value={digit}
          onChange={(e) => handleOtpDigitChange(index, e.target.value)}
          onKeyDown={(e) => handleOtpKeyDown(index, e)}
          style={{ ...otpBoxStyle, ...(digit ? otpBoxFilledStyle : {}) }}
        />
      ))}
    </div>
  );
};

export default OtpInput;
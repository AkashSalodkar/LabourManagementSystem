import { FAKE_MOBILE_NUMBERS, MOBILE_REGEX } from './constants';

export const isValidMobileNumber = (value) => {
  const digits = (value || '').replace(/\D/g, '');
  if (!MOBILE_REGEX.test(digits)) return false;
  if (/^(\d)\1{9}$/.test(digits)) return false;
  if (FAKE_MOBILE_NUMBERS.has(digits)) return false;
  return true;
};

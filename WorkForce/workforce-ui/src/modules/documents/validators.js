import { EMAIL_REGEX, GSTIN_REGEX, HSN_REGEX, IFSC_REGEX, PAN_REGEX, PINCODE_REGEX, UPI_REGEX } from './constants';

export const isValidGSTIN = (value) => GSTIN_REGEX.test((value || '').trim().toUpperCase());

export const isValidEmailAddress = (value) => EMAIL_REGEX.test((value || '').trim());

export const isValidPincode = (value) => PINCODE_REGEX.test((value || '').trim());

export const isValidHSN = (value) => HSN_REGEX.test((value || '').trim());

export const isValidPAN = (value) => PAN_REGEX.test((value || '').trim().toUpperCase());

export const isValidIFSC = (value) => IFSC_REGEX.test((value || '').trim().toUpperCase());

export const isValidUPI = (value) => UPI_REGEX.test((value || '').trim());

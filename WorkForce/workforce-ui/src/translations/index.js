import en from './en';
import hi from './hi';
import mr from './mr';

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिंदी' },
  { code: 'mr', label: 'मराठी' },
];

export const LANGUAGE_STORAGE_KEY = 'workforce_app_language';

// Create translations object
export const translations = {
  en,
  hi,
  mr,
};

// Named exports for individual languages
export { en, hi, mr };
export const PROJECTS_CACHE_KEY_PREFIX = 'workforce_app_projects_cache_';

// ===== Multilingual support: supported languages + translation strings =====
export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिंदी' },
];

// ===== EMPLOYEE AVATAR COLORS =====
// Light pastel background + darker readable text, keyed off the employee's
// first-name initial so the same letter always gets the same color across
// every screen (Attendance, Payments, Employee List, Muster Card, etc).
// Colors repeat after 12 letters, which is expected/acceptable.
export const AVATAR_COLOR_PALETTE = [
  { bg: '#EAF3FF', text: '#1D4ED8' }, // Blue
  { bg: '#EAFBF3', text: '#047857' }, // Mint / Green
  { bg: '#FDECEC', text: '#DC2626' }, // Pink / Red
  { bg: '#F3EEFF', text: '#7C3AED' }, // Lavender / Purple
  { bg: '#FFF4E8', text: '#C2410C' }, // Peach / Orange
  { bg: '#FEFBEA', text: '#A16207' }, // Yellow
  { bg: '#E6FBF8', text: '#0F766E' }, // Teal
  { bg: '#FFF0F6', text: '#BE185D' }, // Rose
  { bg: '#EEF1FF', text: '#4338CA' }, // Indigo
  { bg: '#F2FCE8', text: '#4D7C0F' }, // Lime / Green
  { bg: '#E8FBFF', text: '#0369A1' }, // Cyan
  { bg: '#FBF3EA', text: '#92400E' }, // Tan / Brown
];

export const EDIT_WAGE_PAST_DAYS_MAX = 15;

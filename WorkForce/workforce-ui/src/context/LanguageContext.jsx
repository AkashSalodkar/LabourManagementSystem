import React, { createContext, useState, useContext, useEffect } from 'react';
import { translations, LANGUAGE_STORAGE_KEY, SUPPORTED_LANGUAGES } from '../translations';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [appLanguage, setAppLanguage] = useState('en');

  useEffect(() => {
    const savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (savedLanguage && SUPPORTED_LANGUAGES.some(l => l.code === savedLanguage)) {
      setAppLanguage(savedLanguage);
    }
  }, []);

  const changeLanguage = (langCode) => {
    setAppLanguage(langCode);
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, langCode);
    } catch {
      // ignore storage errors
    }
  };

  const t = (key) => {
    return (translations[appLanguage] && translations[appLanguage][key])
      || translations.en[key]
      || key;
  };

  const value = {
    appLanguage,
    setAppLanguage: changeLanguage,
    t,
    translations,
    supportedLanguages: SUPPORTED_LANGUAGES,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};
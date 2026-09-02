import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { en, id, Translations, LanguageKey } from '../i18n/locales';
import { useFinance } from './FinanceContext';

interface LanguageContextType {
  language: LanguageKey;
  setLanguage: (lang: LanguageKey) => void;
  t: (key: string, options?: { returnObjects?: boolean }) => any;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { profile, updateProfile } = useFinance();
  const getValidLang = (lang: any): LanguageKey => {
    return (lang === 'en' || lang === 'id') ? lang : 'id';
  };

  const [localLang, setLocalLang] = useState<LanguageKey>(
    () => getValidLang(localStorage.getItem('language'))
  );

  // Sync with user profile when it loads — tapi pilihan lokal (localStorage) MENANG.
  // Kalau user pilih bahasa di landing page (belum login), jangan ditimpa profile DB.
  const [hasLocalChoice] = useState(() => !!localStorage.getItem('language'));

  useEffect(() => {
    if (profile?.email && profile?.language && !hasLocalChoice && profile.language !== localLang) {
      const validProfileLang = getValidLang(profile.language);
      if (validProfileLang !== localLang) {
        setLocalLang(validProfileLang);
        localStorage.setItem('language', validProfileLang);
      }
    }
  }, [profile?.language, profile?.email]);

  const setLanguage = (lang: LanguageKey) => {
    setLocalLang(lang);
    localStorage.setItem('language', lang);
  };

  const language = localLang;

  const translations: Record<LanguageKey, Translations> = { en, id };

  // Helper to get nested object property via string path like "dashboard.title"
  const t = (path: string, options?: { returnObjects?: boolean }): any => {
    const keys = path.split('.');
    let current: any = translations[language] || translations['id'];
    for (const key of keys) {
      if (!current || current[key] === undefined) {
        return ""; // Return empty string so || 'Fallback' works correctly!
      }
      current = current[key];
    }
    return current;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

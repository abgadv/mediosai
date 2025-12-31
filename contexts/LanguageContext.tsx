
import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'ar';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  isRTL: boolean;
  t: (en: string, ar: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem('clinic_lang') as Language) || 'en';
  });

  const isRTL = language === 'ar';

  useEffect(() => {
    localStorage.setItem('clinic_lang', language);
    const root = document.documentElement;
    root.dir = isRTL ? 'rtl' : 'ltr';
    root.lang = language;
    
    // Inject global font styling based on language
    if (isRTL) {
        root.classList.add('font-arabic');
        root.classList.remove('font-sans');
    } else {
        root.classList.add('font-sans');
        root.classList.remove('font-arabic');
    }
  }, [language, isRTL]);

  const t = (en: string, ar: string) => (language === 'ar' ? ar : en);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, isRTL, t }}>
      <div className={isRTL ? 'font-arabic' : 'font-sans'}>
        {children}
      </div>
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};

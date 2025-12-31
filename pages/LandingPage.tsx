
import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import LandingPageEN from './LandingPageEN';
import LandingPageAR from './LandingPageAR';

const LandingPage: React.FC = () => {
  const { language } = useLanguage();

  return language === 'ar' ? <LandingPageAR /> : <LandingPageEN />;
};

export default LandingPage;

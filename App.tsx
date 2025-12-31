
import React, { useMemo } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { DataProvider } from './contexts/DataContext';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import AdminSetup from './pages/AdminSetup';
import Dashboard from './pages/Dashboard';
import TrialExpiredView from './pages/TrialExpiredView';
import PublicLiveView from './pages/PublicLiveView';
import PublicLiveViewAR from './pages/PublicLiveViewAR';

const AppContent: React.FC = () => {
  const { firebaseUser, systemUser, isSetupComplete, isVerified, isTrialExpired, currentPlan, loading } = useAuth();
  const { language } = useLanguage();

  // Route Check for Live Monitor (Separate Page Mode)
  const isLiveView = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('view') === 'live';
  }, []);

  if (isLiveView) {
    return language === 'ar' ? <PublicLiveViewAR /> : <PublicLiveView />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white">
        <div className="w-16 h-16 border-4 border-neon-blue border-t-transparent rounded-full animate-spin mb-4 shadow-[0_0_20px_#00f3ff]"></div>
        <h2 className="text-xl font-bold tracking-widest animate-pulse uppercase">Syncing Neural Core...</h2>
      </div>
    );
  }

  // Phase 1: Not even a SaaS tenant yet
  if (!firebaseUser) {
    return <LandingPage />;
  }

  // Phase 2: Check for email verification / OTP completion
  if (!isVerified) {
    return <LandingPage />;
  }

  // Phase 3: Check for Trial Expiration (Lockout)
  if (isTrialExpired && currentPlan === 'trial') {
    return <TrialExpiredView />;
  }

  // Phase 4: Tenant logged in, but system not setup
  if (!isSetupComplete) {
    return <AdminSetup />;
  }

  // Phase 5: Tenant logged in, but staff member not identified
  if (!systemUser) {
    return <Login />;
  }

  // Phase 6: Fully authenticated in the dashboard
  return <Dashboard />;
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <DataProvider>
            <AppContent />
          </DataProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
};

export default App;

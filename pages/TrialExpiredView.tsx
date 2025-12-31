
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  AlertOctagon, Rocket, LogOut, ChevronRight, 
  ShieldAlert, Database, History, Languages
} from 'lucide-react';
import PricingPage from './PricingPage';

const TrialExpiredView: React.FC = () => {
  const { logoutSaaS, trialExpiry } = useAuth();
  const { t, setLanguage, language, isRTL } = useLanguage();
  const [showPricing, setShowPricing] = useState(false);

  if (showPricing) {
      return <PricingPage onBack={() => setShowPricing(false)} onTrial={() => setShowPricing(false)} />;
  }

  return (
    <div className={`min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden selection:bg-neon-red selection:text-white ${isRTL ? 'font-arabic' : 'font-sans'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Background Emergency Glow */}
      <div className="absolute top-[-10%] right-[-10%] w-[60vw] h-[60vw] bg-neon-red/10 rounded-full blur-[150px] animate-pulse-slow pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-neon-purple/5 rounded-full blur-[150px] animate-pulse-slow pointer-events-none" style={{animationDelay: '2s'}}></div>
      
      {/* Language Toggle Header */}
      <div className="fixed top-8 right-8 z-[100] flex gap-4">
          <button 
            onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-xl text-white font-black text-[10px] uppercase tracking-widest hover:bg-neon-red hover:text-white transition-all hover:scale-105 active:scale-95"
          >
             <Languages size={14} /> {language === 'en' ? 'العربية' : 'English'}
          </button>
      </div>

      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-16 items-center relative z-10">
        {/* Left Side: Status Report */}
        <div className="space-y-12">
          <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-neon-red to-neon-purple flex items-center justify-center shadow-[0_0_40px_-5px_rgba(255,0,85,0.4)] animate-pulse border border-white/20">
                <ShieldAlert size={48} className="text-white drop-shadow-lg" />
              </div>
              <div>
                  <div className="text-neon-red font-black uppercase tracking-[0.4em] text-[10px] mb-1">{t("SECURITY PHASE SUSPENDED", "مرحلة الأمان معلقة")}</div>
                  <div className="flex gap-1">
                      {[1,2,3,4,5].map(i => <div key={i} className={`h-1 w-4 rounded-full ${i <= 5 ? 'bg-neon-red' : 'bg-white/10'}`}></div>)}
                  </div>
              </div>
          </div>

          <div className="space-y-6">
            <h1 className="text-6xl lg:text-7xl font-black text-white tracking-tighter leading-none">
              {t("Neural Link", "الرابط العصبي")} <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-red to-neon-purple drop-shadow-[0_0_15px_rgba(255,0,85,0.4)]">{t("Suspended", "متوقف")}</span>
            </h1>
            <p className="text-gray-400 text-xl leading-relaxed max-w-md font-medium opacity-80">
              {t("Your 14 day trial access for", "انتهت فترة الوصول التجريبية لعيادة")} <span className="text-white font-black">{t("AB Clinic System", "نظام عيادة AB")}</span> {t("has reached its temporal limit", "وصلت لحدها الزمني")}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5">
             {[
               t("Database Integrity Preserved", "تم الحفاظ على سلامة البيانات"),
               t("Operational Modules Locked", "وحدات التشغيل مغلقة"),
               t("Patient History Encrypted", "تاريخ المرضى مشفر"),
               t("Upgrade to Restore Control", "قم بالترقية لاستعادة التحكم")
             ].map((text, i) => (
               <div key={i} className="flex items-center gap-4 text-sm font-black text-gray-300">
                 <div className="w-8 h-8 rounded-xl bg-neon-red/10 border border-neon-red/30 flex items-center justify-center text-neon-red">
                    <AlertOctagon size={16} />
                 </div>
                 <span className="tracking-wide">{text}</span>
               </div>
             ))}
          </div>
        </div>

        {/* Right Side: Action Panel */}
        <div className="glass-panel p-12 lg:p-16 rounded-[4rem] border border-white/10 shadow-[0_0_100px_-20px_rgba(255,0,85,0.2)] relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-red via-neon-purple to-neon-pink opacity-80"></div>
          
          <div className="mb-12 text-center md:text-right">
            <h2 className="text-4xl font-black text-white mb-3 tracking-tighter uppercase">{t("Restore Session", "استعادة الجلسة")}</h2>
            <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.5em]">{t("SUBSCRIPTION REQUIRED TO PROCEED", "الاشتراك مطلوب للمتابعة")}</p>
          </div>
          
          <div className="space-y-8">
            <div className="p-8 bg-black/40 border border-white/5 rounded-3xl text-center space-y-4">
                <p className="text-gray-400 text-sm font-bold">{t("Neural sync ended on", "انتهت المزامنة في")}</p>
                <div className="text-4xl font-black text-neon-red tracking-tighter font-mono uppercase">
                   {trialExpiry ? new Date(trialExpiry).toLocaleDateString() : 'EXPIRED'}
                </div>
                <div className="flex justify-center gap-2">
                    <div className="px-2 py-1 bg-neon-red/10 rounded border border-neon-red/20 text-neon-red text-[8px] font-black">OFFLINE</div>
                </div>
            </div>

            <button 
                onClick={() => setShowPricing(true)}
                className="w-full py-6 bg-neon-red text-white font-black rounded-[2rem] shadow-[0_0_30px_rgba(255,0,85,0.4)] hover:scale-[1.02] active:scale-95 transition-all text-xs uppercase tracking-[0.4em] flex items-center justify-center gap-4 group overflow-hidden relative"
            >
              <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 pointer-events-none"></div>
              <Rocket size={22} className="group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform"/> 
              {t("RESTORE NEURAL LINK", "استعادة الرابط العصبي")}
            </button>

            <button 
                onClick={logoutSaaS}
                className="w-full py-5 border border-white/10 text-gray-500 hover:text-white hover:border-white/20 transition-all rounded-[2rem] font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3"
            >
                <LogOut size={16}/> {t("EXIT SYSTEM SESSION", "خروج من جلسة النظام")}
            </button>
          </div>

          <div className="mt-12 text-center opacity-30">
             <span className="text-[9px] text-gray-600 font-bold uppercase tracking-[0.4em] flex items-center justify-center gap-3">
                <Database size={14} /> {t("SECURE DATA VAULT ACTIVE", "خزنة البيانات الآمنة نشطة")}
             </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrialExpiredView;

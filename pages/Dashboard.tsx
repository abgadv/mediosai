
import React, { useState, useMemo, useRef, useEffect, useContext } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useLanguage } from '../contexts/LanguageContext';
import Sidebar from '../components/Sidebar';
import Chat from '../components/Chat';
import AIChat from '../components/AIChat';
import PricingPage from './PricingPage';
import { DashboardUIContext } from '../contexts/DashboardUIContext';

// Views
import DashboardView from './dashboard/DashboardView';
import AnalyticsView from './dashboard/AnalyticsView';
import SystemControlView from './dashboard/SystemControlView';
import FrontDeskView from './dashboard/FrontDeskView';
import SocialMediaView from './dashboard/SocialMediaView';
import AccountantView from './dashboard/AccountantView';
import DashboardViewAR from './dashboard/DashboardViewAR';
import AnalyticsViewAR from './dashboard/AnalyticsViewAR';
import SystemControlViewAR from './dashboard/SystemControlViewAR';
import FrontDeskViewAR from './dashboard/FrontDeskViewAR';
import SocialMediaViewAR from './dashboard/SocialMediaViewAR';
import AccountantViewAR from './dashboard/AccountantViewAR';
import ExaminationRoomView from './dashboard/ExaminationRoomView';
import PatientDataView from './dashboard/PatientDataView';
import CustomizePrintsView from './dashboard/CustomizePrintsView';
import AssistantDoctorView from './dashboard/AssistantDoctorView'; // New View

import { 
  Bell, Search, Sparkles, Camera, User, Loader2, Key, CheckCircle, XCircle, Maximize2, Minimize2, AlertCircle, Rocket, ShieldCheck, Save, MessageSquare
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const { systemUser, logoutSystem, updateUserProfile, trialExpiry } = useAuth();
  const { language, t, isRTL } = useLanguage();
  const [activeTab, setActiveTab] = useState(t('Dashboard', 'الرئيسية'));
  const [showNotifications, setShowNotifications] = useState(false);
  const [headerHidden, setHeaderHidden] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [showChat, setShowChat] = useState(false); // State for Chat visibility
  const { logs } = useData();
  const notificationRef = useRef<HTMLDivElement>(null);

  const [isAIOpen, setIsAIOpen] = useState(false);
  const [aiInitialQuery, setAiInitialQuery] = useState('');
  const [headerSearch, setHeaderSearch] = useState('');

  const [showAccountModal, setShowAccountModal] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [accountForm, setAccountForm] = useState({
      displayName: '',
      password: '',
      photoURL: ''
  });

  const trialDaysRemaining = useMemo(() => {
    if (!trialExpiry) return null;
    const expiry = new Date(trialExpiry);
    const now = new Date();
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  }, [trialExpiry]);
  
  useEffect(() => {
    if (systemUser) {
        setAccountForm({
            displayName: systemUser.displayName || '',
            password: '', 
            photoURL: systemUser.photoURL || ''
        });
    }
  }, [systemUser, showAccountModal]);

  useEffect(() => {
    const enTabs = ['Dashboard', 'Front Desk', 'Assistant Doctor Room', 'Examination Room', 'Patient Data', 'Social Media', 'Accountant', 'Analytics', 'Customize Prints', 'System Control'];
    const arTabs = ['الرئيسية', 'مكتب الاستقبال', 'غرفة الطبيب المساعد', 'غرفة الفحص', 'بيانات المرضى', 'التواصل الاجتماعي', 'المحاسبة', 'التحليلات', 'تخصيص المطبوعات', 'التحكم بالنظام'];
    
    if (language === 'ar') {
      const idx = enTabs.indexOf(activeTab);
      if (idx !== -1) setActiveTab(arTabs[idx]);
    } else {
      const idx = arTabs.indexOf(activeTab);
      if (idx !== -1) setActiveTab(enTabs[idx]);
    }
  }, [language]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
      e.preventDefault();
      setSaveStatus('saving');
      try {
          await updateUserProfile({
              displayName: accountForm.displayName,
              password: accountForm.password || undefined,
              photoURL: accountForm.photoURL
          });
          setSaveStatus('success');
          setTimeout(() => {
              setShowAccountModal(false);
              setSaveStatus('idle');
          }, 1000);
      } catch (err) {
          setSaveStatus('error');
          setTimeout(() => setSaveStatus('idle'), 2000);
      }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAccountForm(prev => ({ ...prev, photoURL: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const ViewComponent = useMemo(() => {
    const isAR = language === 'ar';
    switch(activeTab) {
      case 'Dashboard': return <DashboardView />;
      case 'الرئيسية': return <DashboardViewAR />;
      case 'Front Desk': return <FrontDeskView />;
      case 'مكتب الاستقبال': return <FrontDeskViewAR />;
      case 'Assistant Doctor Room': return <AssistantDoctorView />;
      case 'غرفة الطبيب المساعد': return <AssistantDoctorView />; // Use same component, handles language inside
      case 'Social Media': return <SocialMediaView />;
      case 'التواصل الاجتماعي': return <SocialMediaViewAR />;
      case 'Accountant': return <AccountantView />;
      case 'المحاسبة': return <AccountantViewAR />;
      case 'Analytics': return <AnalyticsView />;
      case 'التحليلات': return <AnalyticsViewAR />;
      case 'Customize Prints':
      case 'تخصيص المطبوعات':
        return <CustomizePrintsView />;
      case 'System Control': return <SystemControlView />;
      case 'التحكم بالنظام': return <SystemControlViewAR />;
      case 'Examination Room':
      case 'غرفة الفحص':
        return <ExaminationRoomView />;
      case 'Patient Data':
      case 'بيانات المرضى':
        return <PatientDataView />;
      default: return isAR ? <DashboardViewAR /> : <DashboardView />;
    }
  }, [activeTab, language]);

  return (
    <DashboardUIContext.Provider value={{ setHeaderHidden, setActiveTab }}>
      <div className={`flex h-screen bg-[#050505] text-white overflow-hidden selection:bg-neon-blue/30 selection:text-white`} dir={isRTL ? 'rtl' : 'ltr'}>
         <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
         
         <div className="flex-1 flex flex-col min-w-0 relative">
            {/* Neural Trial Disclaimer Bar */}
            {trialDaysRemaining !== null && (
              <div className={`relative w-full py-2.5 px-8 flex items-center justify-between z-[60] bg-neon-blue/5 border-b border-neon-blue/20 backdrop-blur-xl animate-fade-in`}>
                  <div className="absolute inset-0 bg-gradient-to-r from-neon-blue/5 via-transparent to-neon-blue/5 animate-shimmer pointer-events-none"></div>
                  
                  <div className={`flex items-center gap-4 relative z-10 ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div className="w-8 h-8 rounded-lg bg-neon-blue/10 flex items-center justify-center text-neon-blue animate-pulse">
                          <Rocket size={16} />
                      </div>
                      <p className={`text-[11px] font-black uppercase tracking-widest text-gray-200 ${isRTL ? 'text-right' : 'text-left'}`}>
                          {t("SaaS Neural Link Status:", "حالة الرابط العصبي:")}{" "}
                          <span className="text-neon-blue animate-pulse">
                              {trialDaysRemaining} {t("Days Remaining in Trial", "أيام متبقية في التجربة")}
                          </span>
                      </p>
                  </div>

                  <div className="flex items-center gap-6 relative z-10">
                      <button 
                          onClick={() => setShowPricing(true)}
                          className="group relative px-6 py-1.5 bg-neon-blue text-black text-[10px] font-black uppercase tracking-wider rounded-full hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(0,243,255,0.4)]"
                      >
                          {t("Unlock Pro Access", "فتح الوصول الاحترافي")}
                          <div className="absolute inset-0 rounded-full border-2 border-neon-blue animate-ping opacity-20 group-hover:opacity-40"></div>
                      </button>
                      <div className="hidden md:flex items-center gap-2 text-[9px] font-bold text-gray-500 uppercase tracking-widest border-l border-white/10 pl-4">
                          <ShieldCheck size={12} className="text-neon-blue" /> {t("Encrypted Session", "جلسة مشفرة")}
                      </div>
                  </div>
              </div>
            )}

            {!headerHidden && (
                <header className={`h-20 border-b border-white/5 bg-white/5 backdrop-blur-md flex items-center justify-between px-8 shrink-0 relative z-20 gap-6`}>
                     <div className={`flex flex-col min-w-[200px] ${isRTL ? 'text-right' : 'text-left'}`}>
                        <h2 className="text-2xl font-black text-white tracking-wide uppercase">{activeTab}</h2>
                        <p className="text-xs text-gray-400 font-medium">
                          {t('Welcome,', 'مرحباً،')} <span className="text-neon-blue font-bold">{systemUser?.displayName}</span>
                        </p>
                     </div>

                     <div className="flex-1 max-w-lg relative group">
                        <Search className={`absolute top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-neon-blue transition-colors ${isRTL ? 'right-4' : 'left-4'}`} size={20} />
                        <input 
                            type="text" 
                            placeholder={t('Ask Aura AI or Search...', 'اسأل أورا أو ابحث...')}
                            value={headerSearch}
                            onChange={(e) => setHeaderSearch(e.target.value)}
                            onKeyDown={(e) => {
                                if(e.key === 'Enter') {
                                    setAiInitialQuery(headerSearch);
                                    setIsAIOpen(true);
                                }
                            }}
                            className={`w-full bg-black/40 border border-white/10 rounded-2xl py-3 text-sm focus:border-neon-blue/50 focus:bg-black/60 outline-none transition-all placeholder-gray-500 shadow-inner ${isRTL ? 'pr-12 pl-12 text-right' : 'pl-12 pr-12 text-left'}`}
                        />
                        <button 
                            onClick={() => { setAiInitialQuery(headerSearch); setIsAIOpen(true); }}
                            className={`absolute top-1/2 -translate-y-1/2 p-1.5 bg-neon-blue/10 rounded-lg text-neon-blue hover:bg-neon-blue hover:text-black transition-colors ${isRTL ? 'left-3' : 'right-3'}`}
                        >
                            <Sparkles size={16} />
                        </button>
                     </div>

                     <div className="flex items-center gap-4">
                         <button onClick={toggleFullscreen} className="p-3 hover:bg-white/5 rounded-xl text-gray-400 hover:text-white transition-colors border border-transparent hover:border-white/10" title={t('Fullscreen', 'ملء الشاشة')}>
                             {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                         </button>

                         <div className="relative">
                            <button onClick={() => setShowNotifications(!showNotifications)} className={`p-3 hover:bg-white/5 rounded-xl text-gray-400 hover:text-white transition-colors border border-transparent hover:border-white/10 ${showNotifications ? 'bg-white/5 text-white' : ''}`}>
                                <Bell size={20} />
                                {logs.length > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>}
                            </button>
                            {showNotifications && (
                                <div ref={notificationRef} className={`absolute top-full mt-4 w-80 glass-panel border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-slide-up z-50 ${isRTL ? 'left-0 origin-top-left' : 'right-0 origin-top-right'}`}>
                                    <div className="p-4 border-b border-white/5 bg-white/5 flex justify-between items-center">
                                        <h4 className="font-bold text-sm text-white">{t('Notifications', 'التنبيهات')}</h4>
                                    </div>
                                    <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                                        {logs.map(log => (
                                            <div key={log.id} className={`p-4 border-b border-white/5 hover:bg-white/5 transition-colors flex gap-3 ${isRTL ? 'text-right flex-row-reverse' : 'text-left'}`}>
                                                 <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${log.type === 'success' ? 'bg-green-500' : 'bg-neon-blue'}`}></div>
                                                 <p className="text-xs text-gray-300 leading-relaxed">{log.message}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                         </div>

                         {/* Chat Toggle in Header */}
                         <button onClick={() => setShowChat(!showChat)} className={`p-3 hover:bg-white/5 rounded-xl text-gray-400 hover:text-white transition-colors border border-transparent hover:border-white/10 ${showChat ? 'bg-white/5 text-white' : ''}`}>
                             <MessageSquare size={20} />
                         </button>

                         <div className="h-8 w-[1px] bg-white/10 mx-2"></div>

                         <button onClick={() => setShowAccountModal(true)} className={`flex items-center gap-3 pl-2 pr-4 py-1.5 rounded-xl hover:bg-white/5 transition-all border border-transparent hover:border-white/10 group ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
                             <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-neon-blue to-neon-purple p-[1px]">
                                 <div className="w-full h-full rounded-lg bg-black/90 flex items-center justify-center overflow-hidden">
                                     {systemUser?.photoURL ? <img src={systemUser.photoURL} alt="avi" className="w-full h-full object-cover" /> : <span className="font-bold text-white">{systemUser?.displayName?.[0]}</span>}
                                 </div>
                             </div>
                             <div className={`hidden md:block ${isRTL ? 'text-right' : 'text-left'}`}>
                                 <p className="text-sm font-bold text-white leading-none group-hover:text-neon-blue transition-colors">{systemUser?.displayName}</p>
                                 <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-1">{systemUser?.role}</p>
                             </div>
                         </button>
                     </div>
                </header>
            )}

            <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                {ViewComponent}
            </main>

            <Chat isOpen={showChat} onClose={() => setShowChat(false)} />
            <AIChat isOpen={isAIOpen} onClose={() => setIsAIOpen(false)} initialQuery={aiInitialQuery} onClearQuery={() => { setAiInitialQuery(''); setHeaderSearch(''); }} />
         </div>

         {/* Pricing Overlay within Dashboard */}
         {showPricing && (
            <div className="fixed inset-0 z-[150] bg-[#020203] overflow-y-auto animate-fade-in custom-scrollbar">
                <div className="sticky top-0 z-[160] w-full p-4 flex justify-end">
                    <button onClick={() => setShowPricing(false)} className="p-3 bg-white/10 hover:bg-red-500/20 text-white hover:text-red-400 rounded-full transition-all border border-white/10 group">
                        <XCircle size={24} className="group-hover:rotate-90 transition-transform" />
                    </button>
                </div>
                <PricingPage onBack={() => setShowPricing(false)} onTrial={() => setShowPricing(false)} />
            </div>
         )}

         {showAccountModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
                <div className="w-full max-w-lg glass-panel rounded-3xl p-10 border border-white/10 shadow-2xl animate-slide-up relative">
                    <button onClick={() => setShowAccountModal(false)} className={`absolute top-6 p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white ${isRTL ? 'left-6' : 'right-6'}`}><XCircle size={24}/></button>
                    
                    <div className="text-center mb-10">
                        <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-tr from-neon-blue to-neon-purple p-[3px] mb-6 relative group cursor-pointer overflow-hidden shadow-glow-blue">
                             <div className="w-full h-full rounded-full bg-black overflow-hidden relative">
                                {accountForm.photoURL ? <img src={accountForm.photoURL} className="w-full h-full object-cover" alt="Profile" /> : <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-white">{accountForm.displayName?.[0]}</div>}
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Camera size={32} className="text-white" />
                                </div>
                             </div>
                             <input type="file" accept="image/*" onChange={handlePhotoUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                        </div>
                        <h3 className="text-3xl font-black text-white uppercase tracking-tighter">{t('My Account', 'حسابي')}</h3>
                        <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mt-1">{t('Update your profile settings', 'تحديث إعدادات الملف الشخصي')}</p>
                    </div>

                    <form onSubmit={handleProfileUpdate} className="space-y-6">
                        <div className="space-y-2">
                             <label className={`text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 block ${isRTL ? 'text-right' : ''}`}>
                               {t('Display Name', 'الاسم المستعار')}
                             </label>
                             <div className="relative">
                                <div className={`absolute top-1/2 -translate-y-1/2 text-gray-500 ${isRTL ? 'right-4' : 'left-4'}`}><User size={18} /></div>
                                <input type="text" value={accountForm.displayName} onChange={e => setAccountForm({...accountForm, displayName: e.target.value})} className={`w-full bg-black/40 border border-white/10 rounded-2xl py-4 text-white font-bold focus:border-neon-blue outline-none transition-colors ${isRTL ? 'pr-12 pl-4 text-right' : 'pl-12 pr-4'}`} />
                             </div>
                        </div>
                        
                        <div className="pt-6 flex gap-4">
                            <button type="button" onClick={logoutSystem} className="flex-1 py-4 bg-red-500/10 text-red-400 border border-red-500/30 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-red-500 hover:text-white transition-all">
                              {t('Switch User', 'تبديل المستخدم')}
                            </button>
                            <button type="submit" disabled={saveStatus === 'saving'} className={`flex-[2] py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all flex items-center justify-center gap-3 ${saveStatus === 'success' ? 'bg-green-500 text-white shadow-glow-green' : 'bg-neon-blue text-black shadow-glow-blue hover:scale-[1.02]'}`}>
                                {saveStatus === 'saving' ? <><Loader2 size={16} className="animate-spin"/> {t('Saving...', 'جاري الحفظ...')}</> : saveStatus === 'success' ? <><CheckCircle size={16}/> {t('Saved', 'تم الحفظ')}</> : <><Save size={16}/> {t('Save Changes', 'حفظ التغييرات')}</>}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
         )}
      </div>
    </DashboardUIContext.Provider>
  );
};

export default Dashboard;


import React, { useState, useEffect } from 'react';
import { 
  Home, Stethoscope, Share2, LayoutDashboard,
  Calculator, PieChart, Settings, ChevronLeft, ChevronRight,
  Activity, Power, FolderOpen, Languages, Printer, UserPlus
} from 'lucide-react';
import { SidebarItem } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useData } from '../contexts/DataContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [exitConfirm, setExitConfirm] = useState(false);
  const { systemUser, logoutSystem } = useAuth();
  const { hasAssistantDoctor } = useData();
  const { language, setLanguage, isRTL, t } = useLanguage();

  const menuItems: SidebarItem[] = [
    { name: t('Dashboard', 'الرئيسية'), icon: <LayoutDashboard size={22} />, id: 'dashboard', permissionKey: 'dashboard' },
    { name: t('Front Desk', 'مكتب الاستقبال'), icon: <Home size={22} />, id: 'front-desk', permissionKey: 'front_desk' },
    // Only show Assistant Doctor Room if a user with that role exists
    ...(hasAssistantDoctor ? [{ name: t('Assistant Doctor Room', 'غرفة الطبيب المساعد'), icon: <UserPlus size={22} />, id: 'assistant-room', permissionKey: 'assistant_room' }] : []),
    { name: t('Examination Room', 'غرفة الفحص'), icon: <Stethoscope size={22} />, id: 'exam-room', permissionKey: 'examination_room' },
    { name: t('Patient Data', 'بيانات المرضى'), icon: <FolderOpen size={22} />, id: 'patient-data', permissionKey: 'examination_room' },
    { name: t('Social Media', 'التواصل الاجتماعي'), icon: <Share2 size={22} />, id: 'social', permissionKey: 'social_media' },
    { name: t('Accountant', 'المحاسبة'), icon: <Calculator size={22} />, id: 'accountant', permissionKey: 'accountant' },
    { name: t('Analytics', 'التحليلات'), icon: <PieChart size={22} />, id: 'analytics', permissionKey: 'analytics' },
    { name: t('Customize Prints', 'تخصيص المطبوعات'), icon: <Printer size={22} />, id: 'customize-prints', permissionKey: 'customize_prints' },
    { name: t('System Control', 'التحكم بالنظام'), icon: <Settings size={22} />, id: 'system', permissionKey: 'system_control' },
  ];

  const hasAccess = (key: string) => {
    if (systemUser?.role === 'admin') return true;
    if (key === 'examination_room' && systemUser?.role === 'doctor') return true;
    if (key === 'assistant_room' && (systemUser?.role === 'assistant_doctor')) return true;
    return systemUser?.permissions?.[key]?.access === true;
  };

  useEffect(() => {
    if (exitConfirm) {
        const timer = setTimeout(() => setExitConfirm(false), 3000);
        return () => clearTimeout(timer);
    }
  }, [exitConfirm]);

  const handleExit = () => {
    if (exitConfirm) {
        logoutSystem();
    } else {
        setExitConfirm(true);
    }
  };

  return (
    <div 
      className={`relative h-screen glass-panel border-r border-white/5 transition-all duration-500 ease-[cubic-bezier(0.25,0.8,0.25,1)] flex flex-col z-30 shadow-2xl
        ${collapsed ? 'w-[88px]' : 'w-72'}`}
    >
      <div className="h-28 flex items-center justify-center relative overflow-hidden shrink-0 drag-region">
        <div className={`transition-all duration-500 absolute ${collapsed ? 'opacity-0 scale-75 blur-sm translate-y-4' : 'opacity-100 scale-100 translate-y-0'}`}>
            <h1 className="text-3xl font-black tracking-wider text-center flex flex-col items-center select-none">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-blue to-neon-purple drop-shadow-[0_0_8px_rgba(0,243,255,0.5)]">MediOS</span>
                <span className="text-[10px] tracking-[0.2em] text-gray-400 font-bold mt-1 uppercase">AI Powered</span>
            </h1>
        </div>
        <div className={`transition-all duration-500 absolute ${!collapsed ? 'opacity-0 scale-75 blur-sm' : 'opacity-100 scale-100'}`}>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center shadow-[0_0_15px_rgba(0,243,255,0.4)]">
                <Activity className="text-white" size={24} />
            </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-2 px-4 space-y-3 custom-scrollbar">
        {menuItems.map((item) => {
          if (!hasAccess(item.permissionKey)) return null;
          const isActive = activeTab === item.name;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.name)}
              className={`w-full flex items-center p-3.5 rounded-2xl transition-all duration-300 relative group overflow-hidden outline-none
                ${isActive 
                  ? 'bg-neon-blue/10 text-neon-blue shadow-[0_0_20px_-5px_rgba(0,243,255,0.3)] border border-neon-blue/20' 
                  : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent hover:border-white/10'
                }
              `}
            >
              <div className="relative z-10 flex items-center justify-center min-w-[24px]">
                 <span className={`transition-all duration-300 ${isActive ? 'drop-shadow-[0_0_8px_rgba(0,243,255,0.6)] scale-110' : 'group-hover:scale-110'}`}>
                    {item.icon}
                 </span>
                 <span className={`text-sm font-semibold whitespace-nowrap transition-all duration-500 origin-left
                    ${isRTL ? 'mr-4 ml-0' : 'ml-4 mr-0'}
                    ${collapsed ? 'opacity-0 translate-x-4 max-w-0 hidden' : 'opacity-100 translate-x-0 max-w-[200px]'}
                 `}>
                    {item.name}
                 </span>
              </div>
              {isActive && !collapsed && (
                  <div className={`absolute w-1.5 h-1.5 rounded-full bg-neon-blue shadow-[0_0_10px_#00f3ff] ${isRTL ? 'left-3' : 'right-3'}`}></div>
              )}
            </button>
          );
        })}
      </nav>

      <div className="px-4 pb-3 flex flex-col gap-2 shrink-0">
         <button
            onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
            className="w-full h-9 flex items-center justify-center gap-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-neon-blue hover:border-neon-blue/30 transition-all group overflow-hidden"
          >
            <Languages size={14} />
            <span className={`text-[10px] font-bold uppercase tracking-widest ${collapsed ? 'hidden' : 'inline'}`}>
              {t('العربية', 'ENGLISH')}
            </span>
          </button>

         <button
            onClick={handleExit}
            className={`w-full h-9 flex items-center justify-center gap-2 rounded-xl transition-all duration-300 relative group overflow-hidden outline-none border
              ${exitConfirm 
                ? 'bg-red-500 text-white border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)]' 
                : 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20 hover:border-red-500/30'
              }
            `}
          >
            <Power size={14} strokeWidth={3} className={exitConfirm ? 'animate-pulse' : ''} />
            <span className={`text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all duration-500
               ${collapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'}
            `}>
               {exitConfirm ? t('Confirm?', 'تأكيد؟') : t('Logout', 'خروج')}
            </span>
          </button>
      </div>

       <button 
        onClick={() => setCollapsed(!collapsed)}
        className={`absolute top-[106px] w-6 h-6 bg-neon-blue text-black rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(0,243,255,0.6)] hover:scale-110 transition-transform z-50 border-2 border-[#050505]
          ${isRTL ? '-left-3' : '-right-3'}`}
      >
        {collapsed ? (isRTL ? <ChevronLeft size={14} /> : <ChevronRight size={14} />) : (isRTL ? <ChevronRight size={14} /> : <ChevronLeft size={14} />)}
      </button>
    </div>
  );
};

export default Sidebar;

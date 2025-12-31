
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  User, Lock, Shield, Camera, LayoutGrid, 
  CheckCircle2, Rocket, Loader2, Sparkles, 
  AlertCircle, ShieldCheck, Languages, Printer, FileText, ArrowRight,
  Phone, MapPin, Plus, Trash2
} from 'lucide-react';

const AdminSetup: React.FC = () => {
  const { firebaseUser, completeAdminSetup, error } = useAuth();
  const { t, setLanguage, language, isRTL } = useLanguage();
  
  // Step State
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    username: '',
    displayName: firebaseUser?.displayName || '',
    password: '',
    photoURL: ''
  });
  
  // Print Setup State
  const [clinicName, setClinicName] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [phones, setPhones] = useState<string[]>([]);
  const [addresses, setAddresses] = useState<string[]>([]);
  const [tempPhone, setTempPhone] = useState('');
  const [tempAddress, setTempAddress] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [installProgress, setInstallProgress] = useState(0);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, photoURL: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const addPhone = () => { if(tempPhone) { setPhones([...phones, tempPhone]); setTempPhone(''); } };
  const removePhone = (idx: number) => { setPhones(phones.filter((_, i) => i !== idx)); };
  
  const addAddress = () => { if(tempAddress) { setAddresses([...addresses, tempAddress]); setTempAddress(''); } };
  const removeAddress = (idx: number) => { setAddresses(addresses.filter((_, i) => i !== idx)); };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const interval = setInterval(() => {
      setInstallProgress(prev => {
        if (prev >= 95) return prev;
        return prev + 5;
      });
    }, 150);

    try {
      // Build print settings from setup
      const printConfig = {
          clinicName: clinicName || formData.displayName,
          doctorName: doctorName || formData.displayName,
          specialty: specialty || 'General Practice',
          phones: phones,
          addresses: addresses
      };

      await completeAdminSetup({
        ...formData,
        role: 'admin',
        permissions: { 
          dashboard: { access: true }, 
          front_desk: { access: true }, 
          accountant: { access: true }, 
          analytics: { access: true }, 
          system_control: { access: true },
          examination_room: { access: true },
          social_media: { access: true },
          customize_prints: { access: true },
          assistant_room: { access: true }
        }
      }, printConfig as any); 
      setInstallProgress(100);
    } finally {
      clearInterval(interval);
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden selection:bg-neon-blue selection:text-black ${isRTL ? 'font-arabic' : 'font-sans'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Background Decor */}
      <div className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-neon-blue/5 rounded-full blur-[150px] animate-pulse-slow pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-neon-purple/5 rounded-full blur-[150px] animate-pulse-slow pointer-events-none" style={{animationDelay: '2s'}}></div>
      
      {/* Language Toggle Header */}
      <div className="fixed top-8 right-8 z-[100] flex gap-4">
          <button 
            onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-xl text-white font-black text-[10px] uppercase tracking-widest hover:bg-neon-blue hover:text-black transition-all hover:scale-105 active:scale-95 shadow-lg"
          >
             <Languages size={14} /> {language === 'en' ? 'العربية' : 'English'}
          </button>
      </div>

      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-16 items-center relative z-10">
        {/* Left Side: Neural Branding */}
        <div className="space-y-12">
          <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center shadow-glow-blue animate-float border border-white/20">
                <Shield size={48} className="text-white drop-shadow-lg" />
              </div>
              <div>
                  <div className="text-neon-blue font-black uppercase tracking-[0.4em] text-[10px] mb-1">{t("SYSTEM INITIALIZATION", "تهيئة النظام")}</div>
                  <div className="flex gap-1">
                      <div className={`h-1 w-4 rounded-full ${step >= 1 ? 'bg-neon-blue' : 'bg-white/10'}`}></div>
                      <div className={`h-1 w-4 rounded-full ${step >= 2 ? 'bg-neon-blue' : 'bg-white/10'}`}></div>
                  </div>
              </div>
          </div>

          <div className="space-y-6">
            <h1 className="text-6xl lg:text-7xl font-black text-white tracking-tighter leading-none">
              {t("Initialize", "بدء تشغيل")} <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-blue to-neon-purple drop-shadow-[0_0_15px_rgba(0,243,255,0.4)]">{t("Clinic Core", "نظام العيادة")}</span>
            </h1>
            <p className="text-gray-400 text-xl leading-relaxed max-w-md font-medium opacity-80">
              {t("Authenticated as", "تم التحقق كـ")} <span className="text-white font-black">{firebaseUser?.displayName}</span>
            </p>
          </div>

          {isSubmitting && (
            <div className="space-y-4 animate-fade-in max-w-sm">
               <div className="flex justify-between text-[11px] font-black uppercase tracking-[0.3em] text-neon-blue">
                  <span>{t("DEPLOYING ASSETS", "نشر الأصول")}</span>
                  <span>{installProgress}%</span>
               </div>
               <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 p-[2px]">
                  <div className="h-full bg-neon-blue shadow-[0_0_15px_#00f3ff] transition-all duration-300 rounded-full" style={{width: `${installProgress}%`}}></div>
               </div>
            </div>
          )}
        </div>

        {/* Right Side: Identity Form */}
        <div className="glass-panel p-12 lg:p-16 rounded-[4rem] border border-white/10 shadow-[0_0_80px_-20px_rgba(0,0,0,0.8)] relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-blue via-neon-purple to-neon-pink opacity-80 group-hover:opacity-100 transition-opacity"></div>
          
          <div className="mb-12 text-center md:text-right">
            <h2 className="text-4xl font-black text-white mb-3 tracking-tighter uppercase">{t("Installation Wizard", "معالج التثبيت")}</h2>
            <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.5em]">{step === 1 ? t("STEP 1 IDENTITY", "الخطوة ١ الهوية") : t("STEP 2 STATIONERY", "الخطوة ٢ المطبوعات")}</p>
          </div>
          
          {error && <div className="mb-10 p-5 bg-red-500/10 border border-red-500/20 rounded-[2rem] text-red-400 text-xs font-black flex items-center gap-4 animate-slide-up"><AlertCircle size={22}/> {error}</div>}

          {step === 1 && (
              <div className="space-y-10 animate-slide-up">
                <div className="flex flex-col items-center">
                  <div className="relative group">
                    <div className="w-32 h-32 rounded-[2.5rem] bg-black/60 border-2 border-dashed border-white/10 overflow-hidden flex items-center justify-center group-hover:border-neon-blue transition-all cursor-pointer relative shadow-inner group-hover:shadow-[0_0_20px_rgba(0,243,255,0.2)]">
                      {formData.photoURL ? <img src={formData.photoURL} alt="Avatar" className="w-full h-full object-cover" /> : <Camera size={44} className="text-gray-700 group-hover:text-neon-blue transition-colors" />}
                      <input type="file" accept="image/*" onChange={handlePhotoUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-500 font-black uppercase tracking-[0.3em] mt-5">{t("UPLOAD ADMIN SIGNATURE PHOTO", "تحميل صورة توقيع المسؤول")}</p>
                </div>

                <div className="space-y-6">
                  <div className="space-y-3 group">
                    <label className={`text-[10px] font-black text-gray-500 uppercase tracking-widest block ${isRTL ? 'mr-2' : 'ml-2'}`}>{t("Master Access ID", "معرف الوصول الرئيسي")}</label>
                    <div className="relative">
                      <User size={20} className={`absolute ${isRTL ? 'right-5' : 'left-5'} top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-neon-blue transition-colors`} />
                      <input required type="text" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} className={`w-full bg-black/40 border border-white/10 rounded-2xl py-5 ${isRTL ? 'pr-14 pl-6 text-right' : 'pl-14 pr-6 text-left'} text-sm text-white focus:border-neon-blue focus:bg-black/60 outline-none transition-all placeholder-gray-800`} placeholder="username" />
                    </div>
                  </div>

                  <div className="space-y-3 group">
                    <label className={`text-[10px] font-black text-gray-500 uppercase tracking-widest block ${isRTL ? 'mr-2' : 'ml-2'}`}>{t("Display Designation", "المسمى الوظيفي")}</label>
                    <div className="relative">
                      <LayoutGrid size={20} className={`absolute ${isRTL ? 'right-5' : 'left-5'} top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-neon-purple transition-colors`} />
                      <input required type="text" value={formData.displayName} onChange={e => setFormData({...formData, displayName: e.target.value})} className={`w-full bg-black/40 border border-white/10 rounded-2xl py-5 ${isRTL ? 'pr-14 pl-6 text-right' : 'pl-14 pr-6 text-left'} text-sm text-white focus:border-neon-purple focus:bg-black/60 outline-none transition-all placeholder-gray-800`} placeholder="Dr. Name" />
                    </div>
                  </div>

                  <div className="space-y-3 group">
                    <label className={`text-[10px] font-black text-gray-500 uppercase tracking-widest block ${isRTL ? 'mr-2' : 'ml-2'}`}>{t("Vault Password", "كلمة سر القبو")}</label>
                    <div className="relative">
                      <Lock size={20} className={`absolute ${isRTL ? 'right-5' : 'left-5'} top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-neon-pink transition-colors`} />
                      <input required type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className={`w-full bg-black/40 border border-white/10 rounded-2xl py-5 ${isRTL ? 'pr-14 pl-6 text-right' : 'pl-14 pr-6 text-left'} text-sm text-white focus:border-neon-pink focus:bg-black/60 outline-none transition-all placeholder-gray-800`} placeholder="••••••••" />
                    </div>
                  </div>
                </div>

                <button type="button" onClick={() => setStep(2)} disabled={!formData.username || !formData.password || !formData.displayName} className="w-full py-6 bg-white/10 border border-white/10 text-white font-black rounded-[2rem] hover:bg-white/20 transition-all text-xs uppercase tracking-[0.4em] flex items-center justify-center gap-4">
                  {t("NEXT STEP", "الخطوة التالية")} <ArrowRight size={20} className={isRTL ? 'rotate-180' : ''}/>
                </button>
              </div>
          )}

          {step === 2 && (
              <form onSubmit={handleFinalSubmit} className="space-y-8 animate-slide-up h-[500px] overflow-y-auto custom-scrollbar pr-2">
                  <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className={`text-[10px] font-black text-gray-500 uppercase tracking-widest block`}>{t("Clinic Name", "اسم العيادة")}</label>
                            <input required type="text" value={clinicName} onChange={e => setClinicName(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-neon-blue focus:bg-black/60 outline-none transition-all" />
                          </div>
                          <div className="space-y-2">
                            <label className={`text-[10px] font-black text-gray-500 uppercase tracking-widest block`}>{t("Doctor Name", "اسم الطبيب")}</label>
                            <input required type="text" value={doctorName} onChange={e => setDoctorName(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-neon-blue focus:bg-black/60 outline-none transition-all" />
                          </div>
                      </div>
                      
                      <div className="space-y-2">
                        <label className={`text-[10px] font-black text-gray-500 uppercase tracking-widest block`}>{t("Specialty", "التخصص")}</label>
                        <input required type="text" value={specialty} onChange={e => setSpecialty(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-neon-purple focus:bg-black/60 outline-none transition-all" />
                      </div>

                      <div className="space-y-2">
                          <label className={`text-[10px] font-black text-gray-500 uppercase tracking-widest block`}>{t("Phone Numbers", "أرقام الهواتف")}</label>
                          <div className="flex gap-2">
                              <input type="tel" value={tempPhone} onChange={e => setTempPhone(e.target.value)} className="flex-1 bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white outline-none" placeholder="+123..." />
                              <button type="button" onClick={addPhone} className="p-3 bg-white/10 rounded-xl hover:bg-neon-blue hover:text-black transition-colors"><Plus size={16}/></button>
                          </div>
                          <div className="flex flex-wrap gap-2">
                              {phones.map((p, i) => (
                                  <span key={i} className="text-xs bg-white/5 px-2 py-1 rounded flex items-center gap-2">{p} <button type="button" onClick={() => removePhone(i)}><Trash2 size={10} className="text-red-400"/></button></span>
                              ))}
                          </div>
                      </div>

                      <div className="space-y-2">
                          <label className={`text-[10px] font-black text-gray-500 uppercase tracking-widest block`}>{t("Addresses", "العناوين")}</label>
                          <div className="flex gap-2">
                              <input type="text" value={tempAddress} onChange={e => setTempAddress(e.target.value)} className="flex-1 bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white outline-none" placeholder="City, St..." />
                              <button type="button" onClick={addAddress} className="p-3 bg-white/10 rounded-xl hover:bg-neon-purple hover:text-white transition-colors"><Plus size={16}/></button>
                          </div>
                          <div className="flex flex-col gap-2">
                              {addresses.map((a, i) => (
                                  <span key={i} className="text-xs bg-white/5 px-2 py-1 rounded flex justify-between items-center">{a} <button type="button" onClick={() => removeAddress(i)}><Trash2 size={10} className="text-red-400"/></button></span>
                              ))}
                          </div>
                      </div>
                  </div>

                  <button disabled={isSubmitting} type="submit" className="w-full py-6 bg-neon-blue text-black font-black rounded-[2rem] shadow-glow-blue hover:scale-[1.02] active:scale-95 transition-all text-xs uppercase tracking-[0.4em] flex items-center justify-center gap-4 group overflow-hidden relative">
                    <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 pointer-events-none"></div>
                    {isSubmitting ? <Loader2 className="animate-spin" /> : <><Rocket size={22} className="group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform"/> {t("COMPLETE SYSTEM INITIALIZATION", "إكمال تهيئة النظام")}</>}
                  </button>
              </form>
          )}

          <div className="mt-6 text-center">
             <span className="text-[9px] text-gray-600 font-bold uppercase tracking-[0.4em] flex items-center justify-center gap-3">
                <ShieldCheck size={14} className="text-neon-blue" /> {t("SECURE ENROLLMENT", "تسجيل آمن")}
             </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSetup;

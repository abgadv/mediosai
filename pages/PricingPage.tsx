
import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { CheckCircle2, Rocket, Loader2, Phone, Lock, Mail as MailIcon, Activity, ChevronLeft, X, AlertCircle, ArrowRight } from 'lucide-react';

interface PricingPageProps {
  onBack: () => void;
  onTrial: () => void;
}

const PricingPage: React.FC<PricingPageProps> = ({ onBack, onTrial }) => {
  const { t, isRTL } = useLanguage();
  const { signupSaaS, error: authError, firebaseUser } = useAuth();
  const [isSignupOpen, setIsSignupOpen] = useState(false);
  const [isContactSalesOpen, setIsContactSalesOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '', name: '', phone: '' });
  const [selectedPlan, setSelectedPlan] = useState<'trial' | 'monthly' | 'annual'>('trial');

  const openSignup = (plan: 'trial' | 'monthly' | 'annual') => {
    setSelectedPlan(plan);
    if (firebaseUser && (plan === 'monthly' || plan === 'annual')) {
        handleExistingUserPayment(plan);
        return;
    }
    setIsSignupOpen(true);
  };

  const handleExistingUserPayment = (plan: 'monthly' | 'annual') => {
      const clinicId = firebaseUser?.uid;
      if (plan === 'monthly') {
          window.location.href = `https://checkouts.kashier.io/en/paymentpage?ppLink=PP-4168241201,test&clinicId=${clinicId}`;
      } else {
          window.location.href = `https://checkouts.kashier.io/en/paymentpage?ppLink=PP-4168241202,test&clinicId=${clinicId}`;
      }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signupSaaS(formData.email, formData.password, formData.name, formData.phone);
      if (selectedPlan === 'monthly' || selectedPlan === 'annual') {
          handleExistingUserPayment(selectedPlan);
      } else {
          onTrial(); 
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020203] text-white p-8 animate-fade-in selection:bg-neon-blue selection:text-black" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] bg-neon-blue/5 rounded-full blur-[120px] pointer-events-none"></div>
      
      <div className="max-w-7xl mx-auto relative z-10">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-white transition-all font-black uppercase text-xs tracking-widest mb-12 group">
          <ChevronLeft size={20} className={`transition-transform ${isRTL ? 'rotate-180 group-hover:translate-x-1' : 'group-hover:-translate-x-1'}`} /> 
          {t("Back Home", "العودة للرئيسية")}
        </button>

        <div className="text-center mb-16">
          <div className="inline-block px-4 py-1.5 rounded-full bg-neon-blue/10 border border-neon-blue/30 text-[10px] font-black uppercase tracking-[0.3em] text-neon-blue mb-6">
            {t("INVEST IN YOUR CLINIC", "خطة الاستثمار في عيادتك")}
          </div>
          <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter mb-6 leading-none">
            {t("Investment", "خطط")} <br /> <span className="text-neon-blue">{t("Plans", "الاشتراك")}</span>
          </h1>
          <p className="text-gray-500 font-bold uppercase tracking-widest text-sm mb-12">
            {t("SELECT THE OPTIMAL PATH FOR YOUR CLINIC'S GROWTH", "اختر المسار الأمثل للنمو الرقمي لعيادتك")}
          </p>

          <button 
            onClick={() => openSignup('trial')}
            className="px-12 py-5 bg-white/5 border border-neon-blue/40 text-neon-blue font-black rounded-3xl hover:bg-neon-blue hover:text-black transition-all shadow-glow-blue uppercase text-sm tracking-[0.2em] flex items-center gap-3 mx-auto mb-16"
          >
             <Rocket size={20}/> {t("START 14 DAYS FREE TRIAL", "ابدأ فترة التجربة ١٤ يوماً مجاناً")}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24 items-stretch">
          <div className="p-12 rounded-[3.5rem] bg-white/5 border border-white/10 flex flex-col hover:border-white/20 transition-all group relative overflow-hidden">
            <h4 className="text-2xl font-black mb-4 uppercase">{t("Monthly", "شهرياً")}</h4>
            <div className="mb-10">
              <span className="text-5xl font-black tracking-tighter text-white">1500</span>
              <span className="text-gray-500 ml-2 font-bold uppercase text-sm">{t("L.E / Month", "ج.م / شهر")}</span>
            </div>
            <ul className="space-y-4 mb-12 flex-1 text-[11px] text-gray-400 font-black uppercase tracking-widest">
              <li className="flex items-center gap-3 text-white"><CheckCircle2 size={18} className="text-neon-blue" /> {t("Full System Access", "وصول كامل للنظام")}</li>
              <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-neon-blue" /> {t("Aura AI Neural Engine", "محرك أورا للذكاء الاصطناعي")}</li>
              <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-neon-blue" /> {t("Advanced Clinical Suite", "جناح الكشف الطبي المتقدم")}</li>
              <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-neon-blue" /> {t("Multi User Control", "تحكم متعدد المستخدمين")}</li>
              <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-neon-blue" /> {t("Marketing Intelligence", "ذكاء تسويقي متقدم")}</li>
              <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-neon-blue" /> {t("Dedicated Cloud Sync", "تزامن سحابي مخصص")}</li>
            </ul>
            <button onClick={() => openSignup('monthly')} className="w-full py-5 bg-white text-black hover:bg-neon-blue transition-all rounded-3xl font-black text-[10px] uppercase tracking-widest shadow-xl">
                {t("Initialize Monthly", "تفعيل الشهري")}
            </button>
          </div>

          <div className="p-12 rounded-[3.5rem] bg-gradient-to-br from-neon-blue/10 to-neon-purple/10 border-2 border-neon-blue/40 flex flex-col relative scale-105 shadow-[0_0_50px_-10px_rgba(0,243,255,0.2)]">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-8 py-2 bg-neon-blue text-black rounded-full text-[10px] font-black uppercase tracking-widest shadow-glow-blue whitespace-nowrap">
                {t("SAVE 3000 L.E", "وفر ٣٠٠٠ ج.م")}
            </div>
            <h4 className="text-2xl font-black mb-4 uppercase text-neon-blue">{t("Annually", "سنوياً")}</h4>
            <div className="mb-2">
              <span className="text-6xl font-black tracking-tighter text-white">15000</span>
              <span className="text-gray-500 ml-2 font-bold uppercase text-sm">{t("L.E / Year", "ج.م / سنة")}</span>
            </div>
            <p className="text-[11px] text-gray-500 font-black mb-8 uppercase tracking-widest">({t("1250 L.E per month", "١٢٥٠ جنيهاً شهرياً")})</p>
            <ul className="space-y-4 mb-12 flex-1 text-[11px] text-white font-black uppercase tracking-widest">
              <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-neon-blue" /> {t("Full System Access", "وصول كامل للنظام")}</li>
              <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-neon-blue" /> {t("Aura AI Neural Engine", "محرك أورا للذكاء الاصطناعي")}</li>
              <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-neon-blue" /> {t("Advanced Clinical Suite", "جناح الكشف الطبي المتقدم")}</li>
              <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-neon-blue" /> {t("Multi User Control", "تحكم متعدد المستخدمين")}</li>
              <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-neon-blue" /> {t("Marketing Intelligence", "ذكاء تسويقي متقدم")}</li>
              <li className="flex items-center gap-3"><CheckCircle2 size={18} className="text-neon-blue" /> {t("Dedicated Cloud Sync", "تزامن سحابي مخصص")}</li>
            </ul>
            <button onClick={() => openSignup('annual')} className="w-full py-6 bg-neon-blue text-black rounded-3xl font-black text-[10px] uppercase tracking-widest transition-all shadow-glow-blue">
                {t("Initialize Annual", "تفعيل السنوي")}
            </button>
          </div>

          <div className="p-12 rounded-[3.5rem] bg-white/5 border border-white/10 flex flex-col hover:border-white/20 transition-all group">
            <h4 className="text-2xl font-black mb-4 uppercase">{t("Customized", "مخصص")}</h4>
            <div className="mb-10">
              <span className="text-4xl font-black tracking-tighter text-gray-400 uppercase">{t("Contact", "حسب الطلب")}</span>
            </div>
            <p className="text-gray-500 text-xs font-bold leading-relaxed mb-12 flex-1">
                {t("For large medical institutions and hospitals requiring fully customized technological solutions", "للمؤسسات الطبية الكبرى والمستشفيات التي تحتاج إلى حلول تقنية مخصصة بالكامل ودمج مع أنظمة خارجية")}
            </p>
            <button onClick={() => setIsContactSalesOpen(true)} className="w-full py-5 border border-white/10 text-white hover:bg-white/10 transition-all rounded-3xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3">
                {t("Contact Sales", "تواصل مع المبيعات")} <MailIcon size={16}/>
            </button>
          </div>
        </div>
      </div>

      {isContactSalesOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md p-6 animate-fade-in">
            <div className="absolute inset-0" onClick={() => setIsContactSalesOpen(false)}></div>
            <div className="relative w-full max-w-md glass-panel p-10 rounded-[3rem] border border-white/10 shadow-2xl animate-slide-up text-center">
                <button onClick={() => setIsContactSalesOpen(false)} className="absolute top-8 right-8 text-gray-500 hover:text-white transition-colors"><X size={24} /></button>
                
                <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-white/5 to-white/10 border border-white/10 flex items-center justify-center mx-auto mb-8 shadow-2xl">
                    <MailIcon size={40} className="text-white" />
                </div>

                <h3 className="text-3xl font-black uppercase tracking-tighter mb-4 text-white">
                {t("Enterprise Sales", "مبيعات المؤسسات")}
                </h3>
                
                <p className="text-gray-400 text-xs font-bold leading-relaxed mb-8 uppercase tracking-wider">
                {t("Reach out for custom integrations and large-scale deployments.", "تواصل معنا لعمليات الدمج المخصصة والنشر على نطاق واسع.")}
                </p>

                <div className="bg-black/40 p-6 rounded-3xl border border-white/5 mb-8 group cursor-pointer hover:border-white/20 transition-all" onClick={() => { navigator.clipboard.writeText('mediosaisystem@gmail.com'); alert('Email copied!'); }}>
                    <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-2">{t("Email Address", "البريد الإلكتروني")}</p>
                    <p className="text-white font-bold text-lg select-all">mediosaisystem@gmail.com</p>
                </div>

                <a href="mailto:mediosaisystem@gmail.com" className="w-full py-5 bg-white text-black font-black rounded-2xl hover:bg-neon-blue transition-all text-[11px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 shadow-glow-white hover:shadow-glow-blue">
                    {t("Send Email Now", "أرسل بريداً الآن")} <ArrowRight size={16} />
                </a>
            </div>
        </div>
      )}

      {isSignupOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md p-6 animate-fade-in">
           <div className="absolute inset-0" onClick={() => setIsSignupOpen(false)}></div>
           <div className="relative w-full max-w-xl glass-panel p-12 rounded-[3.5rem] border border-neon-blue/20 shadow-2xl animate-slide-up">
              <button onClick={() => setIsSignupOpen(false)} className="absolute top-8 right-8 text-gray-500 hover:text-white transition-colors"><X size={24} /></button>
              <div className="mb-12 text-center">
                <h3 className="text-4xl font-black uppercase tracking-tighter mb-4 text-white">
                  {selectedPlan === 'trial' ? t("TRIAL REGISTRATION", "تسجيل الفترة التجريبية") : t("COMPLETE SUBSCRIPTION", "إكمال عملية الاشتراك")}
                </h3>
                <p className="text-[11px] text-gray-400 font-black uppercase tracking-[0.2em]">
                  {t("FILL DETAILS TO INITIALIZE YOUR DIGITAL CLINIC", "يرجى ملء البيانات لإنشاء عيادتك الرقمية")}
                </p>
              </div>
              {authError && <div className="mb-8 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-xs font-bold flex items-center gap-3"><AlertCircle size={18}/> {authError}</div>}
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative group">
                      <Activity size={18} className={`absolute ${isRTL ? 'right-5' : 'left-5'} top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-neon-blue transition-colors`} />
                      <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className={`w-full bg-black/40 border border-white/10 rounded-2xl py-4 ${isRTL ? 'pr-14 pl-6 text-right' : 'pl-14 pr-6 text-left'} text-sm focus:border-neon-blue outline-none transition-all placeholder-gray-800`} placeholder={t("Clinic Name", "اسم العيادة")} />
                    </div>
                    <div className="relative group">
                      <Phone size={18} className={`absolute ${isRTL ? 'right-5' : 'left-5'} top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-neon-blue transition-colors`} />
                      <input required type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className={`w-full bg-black/40 border border-white/10 rounded-2xl py-4 ${isRTL ? 'pr-14 pl-6 text-right' : 'pl-14 pr-6 text-left'} text-sm focus:border-neon-blue outline-none transition-all placeholder-gray-800`} placeholder={t("Phone Number", "رقم الهاتف")} />
                    </div>
                </div>
                <div className="relative group">
                  <MailIcon size={18} className={`absolute ${isRTL ? 'right-5' : 'left-5'} top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-neon-blue transition-colors`} />
                  <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className={`w-full bg-black/40 border border-white/10 rounded-2xl py-4 ${isRTL ? 'pr-14 pl-6 text-right' : 'pl-14 pr-6 text-left'} text-sm focus:border-neon-blue outline-none transition-all placeholder-gray-800`} placeholder={t("Email Address", "البريد الإلكتروني")} />
                </div>
                <div className="relative group">
                  <Lock size={18} className={`absolute ${isRTL ? 'right-5' : 'left-5'} top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-neon-blue transition-colors`} />
                  <input required type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className={`w-full bg-black/40 border border-white/10 rounded-2xl py-4 ${isRTL ? 'pr-14 pl-6 text-right' : 'pl-14 pr-6 text-left'} text-sm focus:border-neon-blue outline-none transition-all placeholder-gray-800`} placeholder={t("Password", "كلمة المرور")} />
                </div>
                <button disabled={loading} type="submit" className="w-full py-5 bg-neon-blue text-black font-black rounded-2xl shadow-glow-blue hover:opacity-90 active:scale-95 transition-all text-[11px] uppercase tracking-[0.4em] flex items-center justify-center gap-3">
                  {loading ? <Loader2 className="animate-spin" size={18}/> : selectedPlan === 'trial' ? t("INITIALIZE TRIAL", "بدء الفترة التجريبية") : t("PROCEED TO PAYMENT", "متابعة لعملية الدفع")}
                </button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default PricingPage;

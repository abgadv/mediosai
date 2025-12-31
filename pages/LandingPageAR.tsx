
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  Activity, ArrowLeft, BarChart3, Mail, Lock, User, Phone,
  Sparkles, BrainCircuit, Rocket, Monitor, History, Languages, 
  ShieldCheck, Network, Database, Share2, X, Loader2, ChevronLeft, ChevronRight,
  ClipboardList, DollarSign, TrendingUp, Target, Mic, FileText, Printer, Shield, Eye, Users, Check,
  AlertCircle, EyeOff, Moon, Palette, UserPlus
} from 'lucide-react';
import PricingPage from './PricingPage';

const LandingPageAR: React.FC = () => {
  const { loginSaaS, signupSaaS, verifyOTP, requestPasswordResetOTP, verifyPasswordResetOTP, completePasswordReset, error: authError, firebaseUser, isVerified } = useAuth();
  const { setLanguage } = useLanguage();
  const [view, setView] = useState<'main' | 'pricing' | 'otp' | 'about'>('main');
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSignupOpen, setIsSignupOpen] = useState(false);
  const [resetFlow, setResetFlow] = useState<'none' | 'request' | 'otp' | 'password_input' | 'success'>('none');
  
  const [formData, setFormData] = useState({ email: '', password: '', name: '', phone: '' });
  const [loginData, setLoginData] = useState({ email: '', password: '', rememberMe: true });
  const [resetEmail, setResetEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const otpInputs = useRef<(HTMLInputElement | null)[]>([]);

  const [loading, setLoading] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      id: 1,
      title: "نظام إدارة عيادات ذكي مهندس من قبل أطباء",
      desc: "أحدث ثورة في ممارستك الطبية مع نظام شامل مدعوم بالذكاء الاصطناعي، من الأوامر الصوتية إلى الإدارة الآلية لتدفق المرضى.",
      icon: <BrainCircuit size={52} className="text-neon-blue" />,
    },
    {
      id: 2,
      title: "تحكم كامل مع مساعد أورا الذكي",
      desc: "تحكم في نظام عيادتك بالكامل من خلال أوامر صوتية أو نصية طبيعية. أورا يفهم سير عملك الطبي ويدير جدولك بدقة.",
      icon: <Mic size={52} className="text-neon-purple" />,
    },
    {
      id: 3,
      title: "نمو وتحليلات مبنية على الذكاء الاصطناعي",
      desc: "استفد من الإحصائيات المتقدمة لمراقبة أداء العيادة، وتحسين اتخاذ القرار، وتحسين الحملات التسويقية آلياً.",
      icon: <TrendingUp size={52} className="text-neon-green" />,
    }
  ];

  useEffect(() => {
    if (firebaseUser && !isVerified) setView('otp');
    const timer = setInterval(() => setCurrentSlide(prev => (prev + 1) % slides.length), 8000);
    return () => clearInterval(timer);
  }, [firebaseUser, isVerified, slides.length]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try { await loginSaaS(loginData.email, loginData.password, loginData.rememberMe); } 
    catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signupSaaS(formData.email, formData.password, formData.name, formData.phone);
      setView('otp');
      setIsSignupOpen(false);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try { await verifyOTP(otp.join('')); } 
    catch (err) { console.error(err); } 
    finally { setLoading(false); }
  };

  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
        await requestPasswordResetOTP(resetEmail);
        setResetFlow('otp');
        setOtp(['', '', '', '', '', '']);
    } catch (err: any) {
        console.error(err);
    } finally {
        setLoading(false);
    }
  };

  const handleResetVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
        await verifyPasswordResetOTP(resetEmail, otp.join(''));
        setResetFlow('password_input');
    } catch (err: any) {
        console.error(err);
    } finally {
        setLoading(false);
    }
  };

  const handlePasswordResetComplete = async (e: React.FormEvent) => {
      e.preventDefault();
      if (newPassword !== confirmPassword) return;
      setLoading(true);
      try {
          await completePasswordReset(resetEmail, otp.join(''), newPassword);
          setResetFlow('success');
      } catch (err) {
          console.error(err);
      } finally {
          setLoading(false);
      }
  };

  const openSignup = () => {
    setResetFlow('none');
    setIsSignupOpen(true);
    setIsLoginOpen(false);
  };

  if (view === 'pricing') return <PricingPage onBack={() => setView('main')} onTrial={() => openSignup()} />;

  if (view === 'otp') {
    return (
      <div className="min-h-screen bg-[#020203] text-white flex flex-col items-center justify-center p-8 font-arabic" dir="rtl">
        <div className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-neon-blue/5 rounded-full blur-[150px] animate-pulse-slow"></div>
        <div className="relative w-full max-w-lg glass-panel p-14 rounded-[3rem] border border-white/10 shadow-2xl text-center animate-slide-up">
            <div className="w-20 h-20 rounded-3xl bg-neon-blue/10 border border-neon-blue/30 flex items-center justify-center text-neon-blue mx-auto mb-10 shadow-glow-blue animate-float">
                <ShieldCheck size={40} />
            </div>
            <h2 className="text-3xl font-black uppercase tracking-tighter mb-4">التحقق من الهوية</h2>
            <p className="text-gray-400 text-sm font-medium mb-10 leading-relaxed">
              تم بدء بروتوكول الأمان. أدخل رمز المزامنة المكون من 6 أرقام المرسل إلى:
              <br /><span className="text-white font-bold mt-2 block">{firebaseUser?.email}</span>
            </p>
            <form onSubmit={handleVerify} className="space-y-10">
                <div className="flex justify-center gap-3" dir="ltr">
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={el => { otpInputs.current[idx] = el; }}
                      type="text" inputMode="numeric" maxLength={1} value={digit}
                      onChange={e => {
                        const val = e.target.value;
                        if (isNaN(Number(val)) && val !== '') return;
                        const newOtp = [...otp];
                        newOtp[idx] = val;
                        setOtp(newOtp);
                        if (val !== '' && idx < 5) otpInputs.current[idx + 1]?.focus();
                      }}
                      className="w-12 h-16 bg-white/5 border border-white/10 rounded-2xl text-center text-2xl font-black text-neon-blue focus:border-neon-blue focus:bg-white/10 outline-none transition-all"
                    />
                  ))}
                </div>
                <button disabled={loading || otp.includes('')} className="w-full py-5 bg-neon-blue text-black font-black rounded-2xl shadow-glow-blue hover:scale-[1.02] active:scale-95 transition-all text-xl">
                  {loading ? <Loader2 className="animate-spin mx-auto" /> : "تأكيد الهوية"}
                </button>
            </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020203] text-white selection:bg-neon-blue selection:text-black font-arabic overflow-x-hidden" dir="rtl">
      <nav className="fixed top-0 left-0 right-0 z-[100] border-b border-white/5 bg-black/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex justify-between items-center px-8 py-4">
          <div className="flex items-center gap-4">
            <button onClick={() => { setResetFlow('none'); setIsLoginOpen(true); }} className="flex items-center gap-2 px-5 py-2 rounded-full border border-white/10 text-white font-bold text-[10px] uppercase tracking-wider hover:bg-white/5 transition-all">
               <User size={14}/> دخول النظام
            </button>
            <button onClick={() => setLanguage('en')} className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-neon-blue transition-all flex items-center gap-2">
                <Languages size={18} /> <span className="text-[10px] font-black uppercase">English</span>
            </button>
          </div>
          <div className="hidden lg:flex items-center gap-8">
            <button onClick={() => setView('main')} className="text-sm font-black uppercase tracking-wider text-neon-blue">الرئيسية</button>
            <button onClick={() => setView('pricing')} className="text-sm font-black uppercase tracking-wider text-gray-400 hover:text-neon-blue transition-colors">الأسعار</button>
            <button onClick={() => setView('about')} className="text-sm font-black uppercase tracking-wider text-gray-400 hover:text-neon-blue transition-colors">من نحن</button>
            <button onClick={() => window.open('https://youtube.com', '_blank')} className="text-sm font-black uppercase tracking-wider text-neon-purple hover:text-neon-blue transition-colors flex items-center gap-2 border border-neon-purple/30 px-4 py-1 rounded-full group">
               <Eye size={14} className="group-hover:animate-pulse"/> استعراض
            </button>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xl md:text-2xl font-black tracking-tighter uppercase">Medi<span className="text-neon-blue">OS</span> <span className="text-neon-purple">AI</span></span>
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center shadow-glow-blue border border-white/20">
              <Activity size={20} className="text-white" />
            </div>
          </div>
        </div>
      </nav>

      {view === 'main' ? (
        <>
          <section className="relative h-screen flex items-center justify-center pt-16">
            <div className="absolute top-1/2 right-12 z-50">
               <button onClick={() => setCurrentSlide(prev => (prev + 1) % slides.length)} className="p-4 rounded-full bg-white/5 border border-white/10 text-gray-500 hover:text-neon-blue transition-all">
                 <ChevronRight size={32} />
               </button>
            </div>
            <div className="absolute top-1/2 left-12 z-50">
               <button onClick={() => setCurrentSlide(prev => (prev - 1 + slides.length) % slides.length)} className="p-4 rounded-full bg-white/5 border border-white/10 text-gray-500 hover:text-neon-blue transition-all">
                 <ChevronLeft size={32} />
               </button>
            </div>
            <div className="w-full max-w-4xl px-12 relative h-[500px] flex items-center justify-center">
              {slides.map((slide, index) => (
                <div key={slide.id} className={`absolute w-full flex flex-col items-center text-center transition-all duration-1000 ${index === currentSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
                  <div className="mb-8 p-9 rounded-[2.5rem] bg-white/5 border border-white/10 shadow-2xl animate-float">{slide.icon}</div>
                  <h1 className="text-4xl md:text-5xl font-black tracking-tight uppercase mb-6 leading-tight drop-shadow-xl">{slide.title}</h1>
                  <p className="text-lg text-gray-400 font-medium max-w-2xl leading-relaxed mb-10">{slide.desc}</p>
                  <button onClick={() => openSignup()} className="px-24 py-5 bg-neon-blue text-black font-black rounded-full shadow-glow-blue hover:scale-105 transition-all text-lg flex items-center gap-3">
                    ابدأ تجربتك المجانية <ArrowLeft size={22} />
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section id="features" className="py-32 px-8 max-w-7xl mx-auto border-t border-white/5">
            <div className="text-center mb-24">
                <h2 className="text-5xl md:text-6xl font-black uppercase tracking-tighter mb-4 text-glow">نواة طبية ذكية متكاملة</h2>
                <p className="text-gray-500 font-black uppercase tracking-[0.3em] text-[10px]">تكنولوجيا الجيل القادم لإدارة العيادات والمراكز الطبية</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <FeatureCard icon={<Mic size={28}/>} title="مساعد أورا الذكي" desc="تحكم في النظام بالكامل عبر الأوامر الصوتية أو النصية. أورا هو شريكك الرقمي في إدارة العيادة." color="purple" />
                <FeatureCard icon={<BarChart3 size={28}/>} title="تحليلات الذكاء الاصطناعي" desc="راقب أداء العيادة وحلل تدفق المرضى لتحسين اتخاذ القرار بناءً على إحصائيات تنبؤية دقيقة." color="blue" />
                <FeatureCard icon={<Rocket size={28}/>} title="تسويق ذكي آلي" desc="إنشاء وتحسين الحملات التسويقية آلياً من لوحة تحكم واحدة لزيادة معدلات الوصول والتحويل." color="green" />
                
                <FeatureCard icon={<Users size={28}/>} title="إدارة الانتظار الذكية" desc="تنظيم ذكي للمواعيد، طوابير الانتظار، وصالة الاستقبال لتقليل وقت فراغ المرضى وزيادة الكفاءة." color="blue" />
                <FeatureCard icon={<FileText size={28}/>} title="الجلسة الطبية المتكاملة" desc="إدارة كاملة لملف المريض، الروشتات، طلبات التحاليل، الأشعة، وسجل التاريخ الطبي الآمن." color="purple" />
                <FeatureCard icon={<Printer size={28}/>} title="تصدير وطباعة الروشتات" desc="طباعة فورية واحترافية للروشتات الطبية، طلبات المعامل، والأشعة بضغطة زر واحدة." color="green" />
                
                <FeatureCard icon={<DollarSign size={28}/>} title="محاسبة مالية ذكية" desc="نظام مالي متكامل لتحليل الإيرادات والمصروفات مرتبط ببيانات المرضى والمؤشرات الديموغرافية." color="blue" />
                <FeatureCard icon={<Network size={28}/>} title="لوحة تحكم موحدة" desc="إدارة قنوات التواصل الاجتماعي وحملات التسويق مباشرة من مركز قيادة مركزي واحد." color="purple" />
                <FeatureCard icon={<Shield size={28}/>} title="تخزين سحابي آمن" desc="تشفير من الدرجة المؤسسية لكافة سجلات المرضى وبيانات الفحوصات والتشخيصات الطبية." color="green" />

                <FeatureCard icon={<Moon size={28}/>} title="الوضع الليلي المريح" desc="واجهة محسنة خصيصاً لضمان أفضل رؤية وتقليل إجهاد العين أثناء ساعات العمل الطويلة." color="purple" />
                <FeatureCard icon={<Palette size={28}/>} title="تخصيص المطبوعات" desc="تحكم كامل في تصميم الروشتات أو رفع نماذجك المطبوعة مسبقاً للحصول على تجربة احترافية." color="blue" />
                <FeatureCard icon={<UserPlus size={28}/>} title="غرفة الطبيب المساعد" desc="فعل محطة عمل مخصصة للأطباء المساعدين لتجهيز بيانات المرضى والمزامنة الفورية مع الغرفة الرئيسية." color="green" />
            </div>
          </section>
        </>
      ) : (
        <AboutViewAR onBack={() => setView('main')} />
      )}

      {/* Auth Modals */}
      {isLoginOpen && (
        <AuthModalAR 
            mode="login" 
            resetFlow={resetFlow}
            setResetFlow={setResetFlow}
            onClose={() => setIsLoginOpen(false)} 
            onSubmit={handleLogin} 
            onResetRequest={handleResetRequest}
            onResetVerify={handleResetVerify}
            onPasswordResetComplete={handlePasswordResetComplete}
            data={loginData} 
            setData={setLoginData} 
            resetEmail={resetEmail}
            setResetEmail={setResetEmail}
            newPassword={newPassword}
            setNewPassword={setNewPassword}
            confirmPassword={confirmPassword}
            setConfirmPassword={setConfirmPassword}
            showPass={showPass}
            setShowPass={setShowPass}
            otp={otp}
            setOtp={setOtp}
            otpInputs={otpInputs}
            loading={loading} 
            error={authError}
        />
      )}
      {isSignupOpen && (
        <AuthModalAR 
            mode="signup" 
            resetFlow={resetFlow}
            setResetFlow={setResetFlow}
            onClose={() => setIsSignupOpen(false)} 
            onSubmit={handleSignup} 
            data={formData} 
            setData={setFormData} 
            loading={loading} 
            error={authError} 
            otp={otp}
            setOtp={setOtp}
            otpInputs={otpInputs}
        />
      )}
    </div>
  );
};

const FeatureCard = ({ icon, title, desc, color }: any) => (
    <div className="p-10 rounded-[2.5rem] bg-white/5 border border-white/5 hover:bg-white/[0.07] transition-all group overflow-hidden text-right">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border transition-all group-hover:scale-110 ${color === 'blue' ? 'text-neon-blue bg-neon-blue/5 border-neon-blue/20' : color === 'purple' ? 'text-neon-purple bg-neon-purple/5 border-neon-purple/20' : 'text-neon-green bg-neon-green/5 border-neon-green/20'}`}>{icon}</div>
        <h3 className="text-xl font-black text-white mb-3 uppercase tracking-tight group-hover:text-neon-blue transition-colors">{title}</h3>
        <p className="text-sm text-gray-500 font-medium leading-relaxed">{desc}</p>
    </div>
);

const AuthModalAR = ({ mode, resetFlow = 'none', setResetFlow, onClose, onSubmit, onResetRequest, onResetVerify, onPasswordResetComplete, data, setData, resetEmail, setResetEmail, newPassword, setNewPassword, confirmPassword, setConfirmPassword, showPass, setShowPass, otp, setOtp, otpInputs, loading, error }: any) => (
  <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md p-6 animate-fade-in" dir="rtl">
    <div className="relative w-full max-w-md glass-panel p-12 rounded-[3rem] border border-white/10 shadow-2xl animate-slide-up">
      <button onClick={onClose} className="absolute top-8 right-8 text-gray-500 hover:text-white transition-colors"><X size={24} /></button>
      
      <div className="mb-10 text-center">
        <h3 className="text-3xl font-black uppercase tracking-widest mb-2">
            {resetFlow === 'none' ? (mode === 'login' ? 'دخول النظام' : 'بدء الفترة التجريبية') : 'استعادة الحساب'}
        </h3>
        <p className="text-sm text-gray-500 font-black uppercase">
            {resetFlow === 'none' ? (mode === 'login' ? 'قم بتعريف هويتك للوصول' : '١٤ يوماً من الوصول الكامل - بدون فيزا') : 'تم بدء بروتوكول الأمان'}
        </p>
      </div>

      {error && <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-bold flex items-center gap-2 animate-shake"><AlertCircle size={14}/> {error}</div>}
      
      {resetFlow === 'none' && (
          <form onSubmit={onSubmit} className="space-y-5">
            {mode === 'signup' && (
              <>
                <input required type="text" value={data.name} onChange={e => setData({...data, name: e.target.value})} className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-6 text-sm focus:border-neon-blue outline-none text-right" placeholder="اسم العيادة" />
                <input required type="tel" value={data.phone} onChange={e => setData({...data, phone: e.target.value})} className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-6 text-sm focus:border-neon-blue outline-none text-left" dir="ltr" placeholder="رقم الهاتف" />
              </>
            )}
            <input required type="email" value={data.email} onChange={e => setData({...data, email: e.target.value})} className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-6 text-sm focus:border-neon-blue outline-none text-left" dir="ltr" placeholder="البريد الإلكتروني" />
            <input required type="password" value={data.password} onChange={e => setData({...data, password: e.target.value})} className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-6 text-sm focus:border-neon-blue outline-none text-left" dir="ltr" placeholder="كلمة المرور" />
            
            {mode === 'login' && (
              <div className="flex items-center justify-between text-sm font-black px-1">
                  <label className="flex items-center text-gray-400 cursor-pointer hover:text-white transition-colors gap-3 group select-none">
                      <div className="relative">
                          <input type="checkbox" checked={data.rememberMe} onChange={(e) => setData({...data, rememberMe: e.target.checked})} className="peer sr-only" />
                          <div className="w-5 h-5 border-2 border-white/10 rounded bg-black/40 peer-checked:bg-neon-blue peer-checked:border-neon-blue transition-all"></div>
                          <Check size={14} className="absolute top-0.5 right-0.5 text-black opacity-0 peer-checked:opacity-100 transition-opacity" />
                      </div>
                      <span>تذكرني</span>
                  </label>
                  <button type="button" onClick={() => setResetFlow('request')} className="text-neon-blue hover:text-white transition-colors text-xs">نسيت كلمة المرور؟</button>
              </div>
            )}

            <button disabled={loading} className="w-full py-5 bg-neon-blue text-black font-black rounded-2xl shadow-glow-blue hover:opacity-90 active:scale-95 transition-all text-lg">
              {loading ? <Loader2 className="animate-spin mx-auto" /> : mode === 'login' ? 'دخول آمن' : 'بدء الفترة المجانية'}
            </button>
          </form>
      )}

      {resetFlow === 'request' && (
          <form onSubmit={onResetRequest} className="space-y-6 text-right">
              <p className="text-sm text-gray-400 leading-relaxed text-center">أدخل بريد العيادة المسجل لاستلام رمز استعادة الحساب.</p>
              <input required type="email" dir="ltr" value={resetEmail} onChange={e => setResetEmail(e.target.value)} className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-6 text-sm focus:border-neon-purple outline-none text-left placeholder-gray-800" placeholder="البريد الإلكتروني" />
              <div className="flex gap-4">
                  <button type="button" onClick={() => setResetFlow('none')} className="flex-1 py-4 bg-white/5 text-white font-bold rounded-2xl text-xs uppercase tracking-widest hover:bg-white/10 transition-all">إلغاء</button>
                  <button disabled={loading} type="submit" className="flex-[2] py-4 bg-neon-purple text-white font-black rounded-2xl shadow-[0_0_15px_rgba(157,0,255,0.4)] hover:scale-[1.02] active:scale-95 transition-all text-lg tracking-widest">
                    {loading ? <Loader2 className="animate-spin mx-auto" /> : "إرسال رمز الاستعادة"}
                  </button>
              </div>
          </form>
      )}

      {resetFlow === 'otp' && (
          <form onSubmit={onResetVerify} className="space-y-10">
              <p className="text-sm text-gray-400 leading-relaxed text-center">تم إرسال الرمز إلى: <br/><span className="text-white font-bold">{resetEmail}</span></p>
              <div className="flex justify-center gap-3" dir="ltr">
                  {otp.map((digit: string, idx: number) => (
                    <input
                      key={idx}
                      ref={el => { if(otpInputs.current) otpInputs.current[idx] = el; }}
                      type="text" inputMode="numeric" maxLength={1} value={digit}
                      onChange={e => {
                        const val = e.target.value;
                        if (isNaN(Number(val)) && val !== '') return;
                        const newOtp = [...otp];
                        newOtp[idx] = val;
                        setOtp(newOtp);
                        if (val !== '' && idx < 5) otpInputs.current[idx + 1]?.focus();
                      }}
                      className="w-10 h-14 bg-white/5 border border-white/10 rounded-xl text-center text-xl font-black text-neon-purple focus:border-neon-purple outline-none transition-all"
                    />
                  ))}
                </div>
                <button disabled={loading || otp.includes('')} className="w-full py-5 bg-neon-purple text-white font-black rounded-2xl shadow-[0_0_20px_rgba(157,0,255,0.4)] hover:scale-[1.02] active:scale-95 transition-all text-lg">
                  {loading ? <Loader2 className="animate-spin mx-auto" /> : "تأكيد الرمز"}
                </button>
                <button type="button" onClick={() => setResetFlow('request')} className="w-full text-center text-sm text-gray-500 hover:text-white transition-colors font-black uppercase tracking-widest">تغيير البريد الإلكتروني</button>
          </form>
      )}

      {resetFlow === 'password_input' && (
          <form onSubmit={onPasswordResetComplete} className="space-y-6 text-right">
              <div className="text-center">
                  <p className="text-sm text-green-400 font-bold mb-2">تم التحقق من الرمز</p>
                  <p className="text-xs text-gray-400">قم بتعيين كلمة مرور نظام جديدة قوية.</p>
              </div>
              <div className="space-y-4">
                  <div className="relative group">
                    <Lock size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-neon-blue transition-colors" />
                    <input 
                        required 
                        type={showPass ? "text" : "password"} 
                        value={newPassword} 
                        onChange={e => setNewPassword(e.target.value)} 
                        className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pr-14 pl-12 text-sm focus:border-neon-blue outline-none text-right" 
                        placeholder="كلمة المرور الجديدة" 
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600 hover:text-white">
                        {showPass ? <EyeOff size={18}/> : <Eye size={18}/>}
                    </button>
                  </div>
                  <div className="relative group">
                    <ShieldCheck size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-neon-blue transition-colors" />
                    <input 
                        required 
                        type={showPass ? "text" : "password"} 
                        value={confirmPassword} 
                        onChange={e => setConfirmPassword(e.target.value)} 
                        className={`w-full bg-black/40 border rounded-2xl py-4 pr-14 pl-6 text-sm outline-none transition-all text-right ${confirmPassword ? (newPassword === confirmPassword ? 'border-green-500/30' : 'border-red-500/30') : 'border-white/5'}`} 
                        placeholder="تأكيد كلمة المرور" 
                    />
                  </div>
              </div>
              <button 
                disabled={loading || !newPassword || newPassword !== confirmPassword} 
                type="submit" 
                className="w-full py-5 bg-gradient-to-l from-neon-blue to-blue-600 text-black font-black rounded-2xl shadow-lg hover:scale-[1.02] active:scale-95 transition-all text-xl disabled:opacity-30"
              >
                  {loading ? <Loader2 className="animate-spin mx-auto" /> : "تحديث كلمة مرور النظام"}
              </button>
          </form>
      )}

      {resetFlow === 'success' && (
          <div className="text-center space-y-8 py-6 animate-fade-in">
              <div className="w-20 h-20 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center text-green-500 mx-auto shadow-[0_0_30px_rgba(34,197,94,0.3)] animate-float">
                  <Check size={40} />
              </div>
              <h4 className="text-2xl font-black text-white uppercase tracking-widest">تم تحديث البيانات</h4>
              <p className="text-sm text-gray-400 leading-relaxed px-4">تم تأكيد الهوية ومزامنة قاعدة البيانات. <br/><br/>كلمة المرور الجديدة مفعلة الآن. يرجى العودة لشاشة الدخول للبدء.</p>
              <button onClick={() => { setResetFlow('none'); onClose(); }} className="w-full py-5 bg-white text-black font-black rounded-2xl hover:bg-neon-blue transition-all text-lg shadow-xl">العودة لشاشة الدخول</button>
          </div>
      )}

    </div>
  </div>
);

const AboutViewAR = ({ onBack }: any) => (
    <div className="pt-40 pb-32 px-8 max-w-5xl mx-auto animate-fade-in space-y-12 text-right" dir="rtl">
        <div className="text-center space-y-4">
            <div className="inline-flex p-4 rounded-3xl bg-neon-blue/10 border border-neon-blue/20 mb-2 animate-float text-neon-blue"><Target size={40} /></div>
            <h1 className="text-6xl font-black uppercase tracking-tighter">رؤيتنا ورسالتنا</h1>
        </div>
        <div className="glass-panel p-12 rounded-[3.5rem] border border-white/10 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-1.5 h-full bg-gradient-to-b from-neon-blue to-neon-purple"></div>
            <div className="space-y-10">
                <h3 className="text-3xl font-black text-white underline decoration-neon-blue decoration-4 underline-offset-8 uppercase">رؤية متكاملة لإدارة العيادات</h3>
                <div className="space-y-6 text-xl text-gray-300 leading-relaxed font-medium">
                    <p>نحن فريق من شباب الأطباء المصريين الشغوفين بعلوم التكنولوجيا، والتصميم، والبرمجة، والحلول السحابية. انطلاقًا من إيماننا بأن الطبيب هو الأقدر على فهم احتياجات المنظومة الطبية، وبفضل جمعنا بين خبراتنا العملية كأطباء وخبراتنا التقنية المتقدمة، قمنا بتصميم نظام different ومتكامل يلبي احتياجات الأطباء والعيادات والمراكز الطبية بشكل عملي ومرن.</p>
                    <p>يهدف نظامنا إلى تبسيط إدارة العيادات، وتحسين تجربة الطبيب والمريض، ورفع كفاءة العمل اليومي من خلال حلول ذكية تعتمد على أحدث تقنيات الذكاء الاصطناعي والتحول الرقمي.</p>
                    <p>نحن لا نقدم مجرد برنامج، بل نقدم رؤية متكاملة لإدارة العيادات بشكل عصري يواكب تطور السوق الطبية ويمنح الأطباء الأدوات التي تساعدهم على التركيز فيما هو أهم: رعاية المرضى بأعلى جودة ممكنة.</p>
                </div>
            </div>
        </div>
        <div className="text-center pt-4">
            <button onClick={onBack} className="px-10 py-4 bg-white/5 border border-white/10 rounded-2xl text-gray-400 font-bold uppercase tracking-widest hover:text-neon-blue transition-all text-sm">العودة للرئيسية</button>
        </div>
    </div>
);

export default LandingPageAR;


import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  Activity, ArrowRight, BarChart3, Mail, Lock, User, Phone,
  Sparkles, BrainCircuit, Rocket, Monitor, History, Languages, 
  ShieldCheck, Network, Database, Share2, X, Loader2, ChevronLeft, ChevronRight,
  ClipboardList, DollarSign, TrendingUp, Target, Mic, FileText, Printer, Shield, Eye, Users, Check,
  AlertCircle, EyeOff, Moon, Palette, UserPlus
} from 'lucide-react';
import PricingPage from './PricingPage';

const LandingPageEN: React.FC = () => {
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
      title: "Doctor-Engineered AI Clinic Intelligence",
      desc: "Revolutionize your practice with a fully integrated AI ecosystem. From voice directives to automated patient flow, focus only on healing.",
      icon: <BrainCircuit size={52} className="text-neon-blue" />,
    },
    {
      id: 2,
      title: "Control with Aura AI Assistant",
      desc: "Direct your entire clinic through natural voice or text commands. Aura understands your medical workflow and manages your schedule seamlessly.",
      icon: <Mic size={52} className="text-neon-purple" />,
    },
    {
      id: 3,
      title: "AI-Driven Growth & Analytics",
      desc: "Leverage advanced statistics to analyze patient flow, improve decision-making, and optimize marketing campaigns automatically.",
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
    } catch (err) {
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
    } catch (err) {
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
      <div className="min-h-screen bg-[#020203] text-white flex flex-col items-center justify-center p-8 font-sans">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-neon-blue/5 rounded-full blur-[150px] animate-pulse-slow"></div>
        <div className="relative w-full max-w-lg glass-panel p-14 rounded-[3rem] border border-white/10 shadow-2xl text-center animate-slide-up">
            <div className="w-20 h-20 rounded-3xl bg-neon-blue/10 border border-neon-blue/30 flex items-center justify-center text-neon-blue mx-auto mb-10 shadow-glow-blue animate-float">
                <ShieldCheck size={40} />
            </div>
            <h2 className="text-3xl font-black uppercase tracking-tighter mb-4">Verify Identity</h2>
            <p className="text-gray-400 text-sm font-medium mb-10 leading-relaxed">
              Security protocol initiated. Enter the 6-digit synchronization code sent to:
              <br /><span className="text-white font-bold mt-2 block">{firebaseUser?.email}</span>
            </p>
            <form onSubmit={handleVerify} className="space-y-10">
                <div className="flex justify-center gap-3">
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
                <button disabled={loading || otp.includes('')} className="w-full py-5 bg-neon-blue text-black font-black rounded-2xl shadow-glow-blue hover:scale-[1.02] active:scale-95 transition-all">
                  {loading ? <Loader2 className="animate-spin mx-auto" /> : "CONFIRM IDENTITY"}
                </button>
            </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020203] text-white selection:bg-neon-blue selection:text-black font-sans overflow-x-hidden">
      <nav className="fixed top-0 left-0 right-0 z-[100] border-b border-white/5 bg-black/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex justify-between items-center px-8 py-4">
          <div className="flex items-center gap-4">
            <button onClick={() => { setResetFlow('none'); setIsLoginOpen(true); }} className="flex items-center gap-2 px-5 py-2 rounded-full border border-white/10 text-white font-bold text-[10px] uppercase tracking-wider hover:bg-white/5 transition-all">
               <User size={14}/> LOGIN
            </button>
            <button onClick={() => setLanguage('ar')} className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-neon-blue transition-all flex items-center gap-2">
                <Languages size={18} /> <span className="text-[10px] font-black uppercase">العربية</span>
            </button>
          </div>
          <div className="hidden lg:flex items-center gap-8">
            <button onClick={() => setView('main')} className="text-[10px] font-bold uppercase tracking-[0.2em] text-neon-blue">HOME</button>
            <button onClick={() => setView('pricing')} className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 hover:text-neon-blue transition-colors">PRICING</button>
            <button onClick={() => setView('about')} className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 hover:text-neon-blue transition-colors">ABOUT</button>
            <button onClick={() => window.open('https://youtube.com', '_blank')} className="text-[10px] font-bold uppercase tracking-[0.2em] text-neon-purple hover:text-neon-blue transition-colors flex items-center gap-2 border border-neon-purple/30 px-3 py-1 rounded-full group">
               <Eye size={12} className="group-hover:animate-pulse" /> DEMO
            </button>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xl font-black tracking-tighter uppercase">Medi<span className="text-neon-blue">OS</span> <span className="text-neon-purple">AI</span></span>
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center shadow-glow-blue">
              <Activity size={20} className="text-white" />
            </div>
          </div>
        </div>
      </nav>

      {view === 'main' ? (
        <>
          <section className="relative h-screen flex items-center justify-center pt-16">
            <div className="absolute top-1/2 left-12 z-50">
               <button onClick={() => setCurrentSlide(prev => (prev - 1 + slides.length) % slides.length)} className="p-4 rounded-full bg-white/5 border border-white/10 text-gray-500 hover:text-neon-blue transition-all">
                 <ChevronLeft size={32} />
               </button>
            </div>
            <div className="absolute top-1/2 right-12 z-50">
               <button onClick={() => setCurrentSlide(prev => (prev + 1) % slides.length)} className="p-4 rounded-full bg-white/5 border border-white/10 text-gray-500 hover:text-neon-blue transition-all">
                 <ChevronRight size={32} />
               </button>
            </div>
            <div className="w-full max-w-4xl px-12 relative h-[500px] flex items-center justify-center">
              {slides.map((slide, index) => (
                <div key={slide.id} className={`absolute w-full flex flex-col items-center text-center transition-all duration-1000 ${index === currentSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
                  <div className="mb-8 p-9 rounded-[2.5rem] bg-white/5 border border-white/10 shadow-2xl animate-float">{slide.icon}</div>
                  <h1 className="text-5xl font-black tracking-tighter uppercase mb-6 drop-shadow-xl">{slide.title}</h1>
                  <p className="text-lg text-gray-400 font-medium max-w-2xl leading-relaxed mb-10">{slide.desc}</p>
                  <button onClick={() => openSignup()} className="px-24 py-5 bg-neon-blue text-black font-black rounded-full shadow-glow-blue hover:scale-105 transition-all text-[11px] uppercase tracking-widest flex items-center gap-3">
                    GET STARTED <ArrowRight size={18} />
                  </button>
                </div>
              ))}
            </div>
          </section>

          <section id="features" className="py-32 px-8 max-w-7xl mx-auto border-t border-white/5">
            <div className="text-center mb-24">
                <h2 className="text-6xl font-black uppercase tracking-tighter mb-4 text-glow">Comprehensive AI Clinical Core</h2>
                <p className="text-gray-500 font-black uppercase tracking-[0.3em] text-[10px]">NEXT-GEN TECHNOLOGY FOR CLINIC GOVERNANCE</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <FeatureCard icon={<Mic size={28}/>} title="Aura AI Assistant" desc="Control the entire system using natural voice or text directives. Aura is your digital mission partner." color="purple" />
                <FeatureCard icon={<BarChart3 size={28}/>} title="AI-Driven Analytics" desc="Monitor clinic performance, analyze patient flow, and improve decision-making with predictive statistics." color="blue" />
                <FeatureCard icon={<Rocket size={28}/>} title="AI Marketing" desc="Automatically create and optimize marketing campaigns from one dashboard to maximize conversion." color="green" />
                
                <FeatureCard icon={<Users size={28}/>} title="Smart Queue Control" desc="AI-optimized appointments, queue, and waiting room orchestration to minimize patient idle time." color="blue" />
                <FeatureCard icon={<FileText size={28}/>} title="Advanced Medical Sheet" desc="Full medical session management including prescriptions, lab tests, imaging, and secure patient history." color="purple" />
                <FeatureCard icon={<Printer size={28}/>} title="Export & Print Rx" desc="Instantly generate and print professional prescriptions, lab requests, and radiology orders." color="green" />
                
                <FeatureCard icon={<DollarSign size={28}/>} title="Smart Accounting" desc="Complete financial management system synced with clinic performance and demographic metrics." color="blue" />
                <FeatureCard icon={<Network size={28}/>} title="Unified Dashboard" desc="Manage social media and marketing channels directly from one centralized mission control." color="purple" />
                <FeatureCard icon={<Shield size={28}/>} title="Secure Storage" desc="Enterprise-grade encryption for all patient medical records and diagnostic imaging history." color="green" />

                <FeatureCard icon={<Moon size={28}/>} title="Adaptive Dark Mode" desc="Optimized interface specifically designed for best visibility and reduced eye strain during long working hours." color="purple" />
                <FeatureCard icon={<Palette size={28}/>} title="Customizable Prints" desc="Fully customize your prescription layouts or upload your own pre-designed templates for a branded experience." color="blue" />
                <FeatureCard icon={<UserPlus size={28}/>} title="Assistant Doctor Room" desc="Enable a dedicated workstation for assistant doctors to prepare patient data and sync instantly with the main room." color="green" />
            </div>
          </section>
        </>
      ) : (
        <AboutViewEN onBack={() => setView('main')} />
      )}

      {/* Auth Modals */}
      {isLoginOpen && (
        <AuthModal 
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
        <AuthModal 
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
    <div className="p-10 rounded-[2.5rem] bg-white/5 border border-white/5 hover:bg-white/[0.07] transition-all group overflow-hidden">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border transition-all group-hover:scale-110 ${color === 'blue' ? 'text-neon-blue bg-neon-blue/5 border-neon-blue/20' : color === 'purple' ? 'text-neon-purple bg-neon-purple/5 border-neon-purple/20' : 'text-neon-green bg-neon-green/5 border-neon-green/20'}`}>{icon}</div>
        <h3 className="text-lg font-black text-white mb-3 uppercase tracking-tight group-hover:text-neon-blue transition-colors">{title}</h3>
        <p className="text-[13px] text-gray-500 font-medium leading-relaxed">{desc}</p>
    </div>
);

const AuthModal = ({ mode, resetFlow = 'none', setResetFlow, onClose, onSubmit, onResetRequest, onResetVerify, onPasswordResetComplete, data, setData, resetEmail, setResetEmail, newPassword, setNewPassword, confirmPassword, setConfirmPassword, showPass, setShowPass, otp, setOtp, otpInputs, loading, error }: any) => (
  <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md p-6 animate-fade-in">
    <div className="relative w-full max-w-md glass-panel p-12 rounded-[3rem] border border-white/10 shadow-2xl animate-slide-up">
      <button onClick={onClose} className="absolute top-8 right-8 text-gray-500 hover:text-white transition-colors"><X size={24} /></button>
      
      <div className="mb-10 text-center">
        <h3 className="text-2xl font-black uppercase tracking-widest mb-2">
            {resetFlow === 'none' ? (mode === 'login' ? 'Terminal Login' : 'Start Trial') : 'Identity Recovery'}
        </h3>
        <p className="text-[9px] text-gray-500 font-black uppercase">
            {resetFlow === 'none' ? (mode === 'login' ? 'Identify for system access' : '14 days full access - no credit card') : 'Security protocol initiated'}
        </p>
      </div>

      {error && <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-bold flex items-center gap-2 animate-shake"><AlertCircle size={14}/> {error}</div>}
      
      {resetFlow === 'none' && (
          <form onSubmit={onSubmit} className="space-y-4">
            {mode === 'signup' && (
              <>
                <input required type="text" value={data.name} onChange={e => setData({...data, name: e.target.value})} className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-6 text-sm focus:border-neon-blue outline-none placeholder-gray-800" placeholder="Clinic Name" />
                <input required type="tel" value={data.phone} onChange={e => setData({...data, phone: e.target.value})} className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-6 text-sm focus:border-neon-blue outline-none placeholder-gray-800" placeholder="Phone Number" />
              </>
            )}
            <input required type="email" value={data.email} onChange={e => setData({...data, email: e.target.value})} className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-6 text-sm focus:border-neon-blue outline-none placeholder-gray-800" placeholder="Email Address" />
            <input required type="password" value={data.password} onChange={e => setData({...data, password: e.target.value})} className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-6 text-sm focus:border-neon-blue outline-none placeholder-gray-800" placeholder="Password" />
            
            {mode === 'login' && (
              <div className="flex items-center justify-between px-1">
                <label className="flex items-center gap-3 cursor-pointer group select-none">
                    <div className="relative">
                        <input type="checkbox" className="sr-only peer" checked={data.rememberMe} onChange={(e) => setData({...data, rememberMe: e.target.checked})} />
                        <div className="w-5 h-5 rounded border-2 border-white/10 bg-black/40 peer-checked:bg-neon-blue peer-checked:border-neon-blue transition-all"></div>
                        <Check size={14} className="absolute top-0.5 left-0.5 text-black opacity-0 peer-checked:opacity-100 transition-opacity" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 group-hover:text-white transition-colors">Remember</span>
                </label>
                <button type="button" onClick={() => setResetFlow('request')} className="text-[10px] font-black text-neon-blue hover:text-white transition-colors uppercase tracking-widest">Forgot Password?</button>
              </div>
            )}

            <button disabled={loading} className="w-full py-5 bg-neon-blue text-black font-black rounded-2xl shadow-glow-blue hover:opacity-90 active:scale-95 transition-all text-[10px] uppercase tracking-[0.4em] flex items-center justify-center gap-3">
              {loading ? <Loader2 className="animate-spin" /> : mode === 'login' ? 'ENTER SYSTEM' : 'INITIALIZE TRIAL'}
            </button>
          </form>
      )}

      {resetFlow === 'request' && (
          <form onSubmit={onResetRequest} className="space-y-6">
              <p className="text-xs text-gray-400 leading-relaxed text-center">Enter your registered clinic email to receive a secure recovery OTP.</p>
              <input required type="email" value={resetEmail} onChange={e => setResetEmail(e.target.value)} className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-6 text-sm focus:border-neon-purple outline-none placeholder-gray-800" placeholder="Clinic Email Address" />
              <div className="flex gap-4">
                  <button type="button" onClick={() => setResetFlow('none')} className="flex-1 py-4 bg-white/5 text-white font-bold rounded-2xl text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all">Cancel</button>
                  <button disabled={loading} type="submit" className="flex-[2] py-4 bg-neon-purple text-white font-black rounded-2xl shadow-[0_0_15px_rgba(157,0,255,0.4)] hover:scale-[1.02] active:scale-95 transition-all text-[10px] uppercase tracking-widest">
                    {loading ? <Loader2 className="animate-spin mx-auto" /> : "SEND RECOVERY CODE"}
                  </button>
              </div>
          </form>
      )}

      {resetFlow === 'otp' && (
          <form onSubmit={onResetVerify} className="space-y-10">
              <p className="text-xs text-gray-400 leading-relaxed text-center">Code sent to: <br/><span className="text-white font-bold">{resetEmail}</span></p>
              <div className="flex justify-center gap-3">
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
                <button disabled={loading || otp.includes('')} className="w-full py-5 bg-neon-purple text-white font-black rounded-2xl shadow-[0_0_20px_rgba(157,0,255,0.4)] hover:scale-[1.02] active:scale-95 transition-all text-[10px] uppercase tracking-widest">
                  {loading ? <Loader2 className="animate-spin mx-auto" /> : "VERIFY CODE"}
                </button>
                <button type="button" onClick={() => setResetFlow('request')} className="w-full text-center text-[10px] text-gray-500 hover:text-white transition-colors font-black uppercase tracking-widest">Change Email</button>
          </form>
      )}

      {resetFlow === 'password_input' && (
          <form onSubmit={onPasswordResetComplete} className="space-y-6">
              <div className="text-center">
                  <p className="text-xs text-green-400 font-bold uppercase tracking-widest mb-2">Code Verified</p>
                  <p className="text-xs text-gray-400">Generate your new secure credentials.</p>
              </div>
              <div className="space-y-4">
                  <div className="relative group">
                    <Lock size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-neon-blue transition-colors" />
                    <input 
                        required 
                        type={showPass ? "text" : "password"} 
                        value={newPassword} 
                        onChange={e => setNewPassword(e.target.value)} 
                        className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-14 pr-12 text-sm focus:border-neon-blue outline-none placeholder-gray-800" 
                        placeholder="New Password" 
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-600 hover:text-white">
                        {showPass ? <EyeOff size={18}/> : <Eye size={18}/>}
                    </button>
                  </div>
                  <div className="relative group">
                    <ShieldCheck size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-neon-blue transition-colors" />
                    <input 
                        required 
                        type={showPass ? "text" : "password"} 
                        value={confirmPassword} 
                        onChange={e => setConfirmPassword(e.target.value)} 
                        className={`w-full bg-black/40 border rounded-2xl py-4 pl-14 pr-6 text-sm outline-none transition-all placeholder-gray-800 ${confirmPassword ? (newPassword === confirmPassword ? 'border-green-500/30' : 'border-red-500/30') : 'border-white/5'}`} 
                        placeholder="Confirm Password" 
                    />
                  </div>
              </div>
              <button 
                disabled={loading || !newPassword || newPassword !== confirmPassword} 
                type="submit" 
                className="w-full py-5 bg-gradient-to-r from-neon-blue to-blue-600 text-black font-black rounded-2xl shadow-glow-blue hover:scale-[1.02] active:scale-95 transition-all text-[10px] uppercase tracking-widest disabled:opacity-30"
              >
                  {loading ? <Loader2 className="animate-spin mx-auto" /> : "UPDATE SYSTEM PASSWORD"}
              </button>
          </form>
      )}

      {resetFlow === 'success' && (
          <div className="text-center space-y-8 py-6 animate-fade-in">
              <div className="w-20 h-20 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center text-green-500 mx-auto shadow-[0_0_30px_rgba(34,197,94,0.3)] animate-float">
                  <Check size={40} />
              </div>
              <h4 className="text-xl font-black text-white uppercase tracking-widest">Update Successful</h4>
              <p className="text-xs text-gray-400 leading-relaxed px-4">Identity confirmed and database synchronized. <br/><br/>Your new password is now active. Please return to the portal to sign in.</p>
              <button onClick={() => { setResetFlow('none'); onClose(); }} className="w-full py-5 bg-white text-black font-black rounded-2xl hover:bg-neon-blue transition-all text-[10px] uppercase tracking-widest shadow-xl">Back to Terminal</button>
          </div>
      )}

    </div>
  </div>
);

const AboutViewEN = ({ onBack }: any) => (
    <div className="pt-40 pb-32 px-8 max-w-5xl mx-auto animate-fade-in space-y-12">
        <div className="text-center space-y-4">
            <div className="inline-flex p-4 rounded-3xl bg-neon-blue/10 border border-neon-blue/20 mb-2 animate-float text-neon-blue"><Target size={40} /></div>
            <h1 className="text-6xl font-black uppercase tracking-tighter">About Us</h1>
        </div>
        <div className="glass-panel p-12 rounded-[3.5rem] border border-white/10 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-neon-blue to-neon-purple"></div>
            <div className="space-y-10">
                <h3 className="text-3xl font-black text-white underline decoration-neon-blue decoration-4 underline-offset-8 uppercase">A Unique Vision for Healthcare</h3>
                <div className="space-y-6 text-lg text-gray-300 leading-relaxed font-medium">
                    <p>We are a team of young Egyptian doctors passionate about technology, design, programming, and cloud solutions. Driven by our belief that doctors best understand the real needs of the medical field, and by combining our hands-on medical experience with advanced technological expertise, we have designed a unique and comprehensive system tailored to the needs of doctors, clinics, and medical centers.</p>
                    <p>Our system aims to simplify clinic management, enhance both doctor and patient experiences, and improve daily workflow efficiency through smart solutions powered by the latest advancements in artificial intelligence and digital transformation.</p>
                    <p>We do not offer just a software product — we deliver a complete vision for modern clinic management that keeps pace with the evolving medical market and empowers doctors to focus on what truly matters: providing the highest quality of patient care.</p>
                </div>
            </div>
        </div>
        <div className="text-center pt-4">
            <button onClick={onBack} className="px-10 py-4 bg-white/5 border border-white/10 rounded-2xl text-gray-400 font-bold uppercase tracking-widest hover:text-neon-blue transition-all text-[10px]">Return to Home</button>
        </div>
    </div>
);

export default LandingPageEN;

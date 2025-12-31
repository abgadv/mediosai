
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Lock, Activity, ArrowLeft, Info, X, Phone, Mail, Shield, Check } from 'lucide-react';

const LoginAR: React.FC = () => {
  const { loginSystem, loading, error } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); 
    setIsSubmitting(true); 
    try {
        await loginSystem(username, password, rememberMe); 
    } catch (err) {
        console.error("System login failed");
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex w-full bg-[#050505] overflow-hidden relative font-arabic" dir="rtl">
      <div className="absolute top-[-10%] right-[-5%] w-[40vw] h-[40vw] bg-neon-blue/10 rounded-full blur-[150px] animate-float"></div>
      <div className="absolute bottom-[-10%] left-[-5%] w-[40vw] h-[40vw] bg-neon-purple/10 rounded-full blur-[150px] animate-float" style={{ animationDelay: '-3s' }}></div>

      <div className="hidden lg:flex w-1/2 relative flex-col justify-center items-center p-16 z-10 border-l border-white/5">
         <div className="relative z-10 text-center space-y-10 max-w-lg">
            <div className="w-28 h-28 mx-auto rounded-3xl bg-gradient-to-tr from-neon-blue to-neon-purple flex items-center justify-center shadow-[0_0_60px_rgba(0,243,255,0.4)] animate-float border border-white/20 backdrop-blur-md">
                <Activity size={56} className="text-white drop-shadow-md" />
            </div>
            <div>
                <h1 className="text-7xl font-black text-white tracking-tighter mb-4 brand-text drop-shadow-lg">
                  MediOS <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-blue to-neon-purple">AI</span>
                </h1>
                <p className="text-gray-400 text-xl tracking-widest font-bold uppercase">نظام إدارة العيادات الذكي</p>
            </div>
            <div className="glass-panel p-8 rounded-2xl border border-white/10 backdrop-blur-xl relative overflow-hidden group">
                 <p className="text-2xl text-gray-200 font-medium leading-relaxed relative z-10">
                  "تمكين الرعاية الصحية باستخدام تكنولوجيا <span className="font-black text-neon-blue text-glow">الذكاء الاصطناعي</span> المدمجة."
                </p>
            </div>
         </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative z-20">
        <div className="relative w-full max-w-[420px]">
          <div className="glass-panel rounded-3xl p-10 shadow-2xl border border-white/10 relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-blue via-neon-purple to-neon-pink"></div>
             <div className="mb-10 text-right">
                <h2 className="text-4xl font-black text-white mb-2">دخول النظام</h2>
                <p className="text-gray-400 text-md font-bold">يرجى المصادقة للمتابعة</p>
             </div>

            {error && (
                <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3 animate-slide-up">
                    <Activity size={18} className="text-red-400 mt-0.5" />
                    <p className="text-red-200 text-sm font-bold">{error}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2 group">
                    <label className="text-sm uppercase font-black text-gray-500 mr-1 block">اسم المستخدم</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-gray-500 group-focus-within:text-neon-blue transition-colors">
                            <User size={18} />
                        </div>
                        <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-black/40 text-white pr-11 pl-4 py-4 rounded-xl border border-gray-700/50 focus:border-neon-blue/50 focus:bg-black/60 outline-none transition-all placeholder-gray-600 text-right" placeholder="أدخل المعرف..." required />
                    </div>
                </div>
                <div className="space-y-2 group">
                    <label className="text-sm uppercase font-black text-gray-500 mr-1 block">كلمة المرور</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-gray-500 group-focus-within:text-neon-purple transition-colors">
                            <Lock size={18} />
                        </div>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-black/40 text-white pr-11 pl-4 py-4 rounded-xl border border-gray-700/50 focus:border-neon-purple/50 focus:bg-black/60 outline-none transition-all placeholder-gray-600 text-right" placeholder="••••••••" required />
                    </div>
                </div>
                
                <div className="flex items-center justify-between text-sm pt-2 font-black">
                    <label className="flex items-center text-gray-400 cursor-pointer hover:text-white transition-colors gap-3 group select-none">
                        <div className="relative">
                            <input 
                                type="checkbox" 
                                checked={rememberMe} 
                                onChange={(e) => setRememberMe(e.target.checked)} 
                                className="peer sr-only" 
                            />
                            <div className="w-5 h-5 border-2 border-white/10 rounded bg-black/40 peer-checked:bg-neon-blue peer-checked:border-neon-blue transition-all"></div>
                            <Check size={14} className="absolute top-0.5 right-0.5 text-black opacity-0 peer-checked:opacity-100 transition-opacity" />
                        </div>
                        <span>تذكرني</span>
                    </label>
                    <button type="button" onClick={() => setShowHelp(true)} className="text-neon-blue/80 hover:text-neon-blue transition-colors">تحتاج مساعدة؟</button>
                </div>

                <button type="submit" disabled={isSubmitting || loading} className="w-full py-5 bg-gradient-to-r from-neon-blue via-blue-600 to-neon-purple text-white font-black rounded-xl shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all text-lg flex items-center justify-center gap-3">
                    {isSubmitting ? 'جاري التحقق...' : 'دخول آمن'} {!isSubmitting && <ArrowLeft size={20} />}
                </button>
            </form>
          </div>
        </div>
      </div>

      {(showAbout || showHelp) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in" dir="rtl">
           <div className="absolute inset-0" onClick={() => { setShowAbout(false); setShowHelp(false); }}></div>
           <div className="relative w-full max-w-2xl glass-panel rounded-3xl p-8 border border-white/10 shadow-2xl animate-slide-up overflow-hidden max-h-[90vh] overflow-y-auto custom-scrollbar">
                <button onClick={() => { setShowAbout(false); setShowHelp(false); }} className="absolute top-4 left-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors z-10"><X size={24} /></button>
                {showAbout && (
                    <div className="space-y-6 text-right">
                        <div className="text-center mb-8">
                            <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-neon-blue to-neon-purple mb-2">AB Graphics and More</h2>
                            <p className="text-gray-400 text-sm font-black uppercase tracking-widest">أطباء • مبرمجون • مبتكرون</p>
                        </div>
                        <div className="space-y-4 text-gray-300 leading-relaxed text-lg text-justify px-2">
                            <p>نحن فريق من الأطباء الشغوفين بالتكنولوجيا والتصميم وتطوير البرمجيات. نجمع بين خلفيتنا الطبية والخبرة التقنية المتقدمة لتقديم حلول شاملة في الإدارة والعلامات التجارية والتسويق المصممة خصيصاً للعيادات والمؤسسات الطبية.</p>
                        </div>
                    </div>
                )}
                {showHelp && (
                    <div className="space-y-6 text-center py-4">
                        <div className="w-16 h-16 rounded-full bg-neon-blue/10 flex items-center justify-center mx-auto mb-4 border border-neon-blue/20"><Activity size={32} className="text-neon-blue" /></div>
                        <h2 className="text-3xl font-black text-white">هل تحتاج للمساعدة؟</h2>
                        <div className="bg-white/5 rounded-2xl p-6 border border-white/10 max-w-sm mx-auto mt-6 text-right space-y-4">
                            <div><p className="text-[10px] text-gray-500 font-black mb-2">الدعم الفني</p><a href="mailto:abgraphics.adv@gmail.com" className="flex items-center gap-3 text-white hover:text-neon-blue transition-colors p-2 bg-black/20 rounded-lg"><Mail size={18} /> abgraphics.adv@gmail.com</a></div>
                        </div>
                    </div>
                )}
           </div>
        </div>
      )}
    </div>
  );
};

export default LoginAR;

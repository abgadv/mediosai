
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
// Added Check to the imported icons from lucide-react
import { User, Lock, Activity, ArrowRight, Info, X, Phone, Mail, LogOut, Shield, Check } from 'lucide-react';

const Login: React.FC = () => {
  const { loginSystem, logoutSaaS, loading, error, firebaseUser } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    <div className="min-h-screen flex w-full bg-[#050505] relative">
      
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-5%] w-[40vw] h-[40vw] bg-neon-blue/10 rounded-full blur-[150px] animate-float"></div>

      <div className="hidden lg:flex w-1/2 relative flex-col justify-center items-center p-16 z-10">
         <div className="relative z-10 text-center space-y-10 max-w-lg">
            <div className="w-28 h-28 mx-auto rounded-3xl bg-gradient-to-tr from-neon-blue to-neon-purple flex items-center justify-center shadow-glow-blue animate-float border border-white/20">
                <Activity size={56} className="text-white" />
            </div>
            
            <div>
                <h1 className="text-6xl font-black text-white tracking-tighter mb-4 brand-text">
                  Medi<span className="text-neon-blue">OS</span>
                </h1>
                <p className="text-gray-500 text-lg tracking-widest font-light uppercase">
                  Authenticated: <span className="text-white font-bold">{firebaseUser?.displayName}</span>
                </p>
            </div>
            
            <div className="glass-panel p-8 rounded-2xl border border-white/10 backdrop-blur-xl">
                 <p className="text-xl text-gray-300 font-light leading-relaxed">
                  "Individual staff authentication active. Please use your provided <span className="font-bold text-neon-blue">Clinic ID</span>."
                </p>
            </div>

            <button onClick={logoutSaaS} className="flex items-center gap-2 text-gray-600 hover:text-red-400 transition-colors mx-auto font-bold uppercase text-xs tracking-widest">
              <LogOut size={16} /> Exit SaaS Session
            </button>
         </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative z-20">
        <div className="relative w-full max-w-[420px]">
          
          <div className="glass-panel rounded-[2.5rem] p-12 border border-white/10 shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-neon-blue via-neon-purple to-neon-pink"></div>
             
             <div className="mb-10 text-center lg:text-left">
                <h2 className="text-3xl font-black text-white mb-2 tracking-tight uppercase">System Portal</h2>
                <p className="text-gray-500 text-sm font-bold uppercase tracking-widest">Identify Staff Member</p>
             </div>

            {error && (
                <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3 animate-slide-up">
                    <p className="text-red-400 text-xs font-black uppercase">{error}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2 group">
                    <label className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-black ml-1">Clinic Staff ID</label>
                    <div className="relative">
                        <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-neon-blue transition-colors" />
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full bg-black/40 text-white pl-12 pr-4 py-4 rounded-2xl border border-white/5 focus:border-neon-blue outline-none transition-all placeholder-gray-700"
                            placeholder="username..."
                            required
                        />
                    </div>
                </div>

                <div className="space-y-2 group">
                    <label className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-black ml-1">Password</label>
                    <div className="relative">
                        <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-neon-purple transition-colors" />
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-black/40 text-white pl-12 pr-4 py-4 rounded-2xl border border-white/5 focus:border-neon-purple outline-none transition-all placeholder-gray-700"
                            placeholder="••••••••"
                            required
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2 px-1">
                    <label className="flex items-center gap-3 cursor-pointer group select-none">
                        <div className="relative">
                            <input 
                                type="checkbox" 
                                className="sr-only peer" 
                                checked={rememberMe} 
                                onChange={(e) => setRememberMe(e.target.checked)} 
                            />
                            <div className="w-5 h-5 rounded border-2 border-white/10 bg-black/40 peer-checked:bg-neon-blue peer-checked:border-neon-blue transition-all"></div>
                            {/* Check component is now imported correctly */}
                            <Check size={14} className="absolute top-0.5 left-0.5 text-black opacity-0 peer-checked:opacity-100 transition-opacity" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 group-hover:text-white transition-colors">Remember Session</span>
                    </label>
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting || loading}
                    className="w-full py-5 bg-gradient-to-r from-neon-blue to-blue-600 text-black font-black rounded-2xl shadow-glow-blue hover:scale-[1.02] active:scale-95 transition-all text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-2"
                >
                    {isSubmitting ? 'SYNCING...' : 'ENTER DASHBOARD'} {!isSubmitting && <ArrowRight size={18} />}
                </button>
            </form>
          </div>
          
          <div className="mt-8 text-center opacity-40">
             <div className="flex items-center justify-center gap-2 text-[10px] text-gray-500 uppercase tracking-[0.3em] font-black">
                <Shield size={10} /> SECURE CLINIC SILO ACTIVE
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

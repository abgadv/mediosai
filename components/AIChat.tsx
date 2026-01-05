
import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { X, Send, Bot, Sparkles, User, Cpu, Loader2, Database, Shield, CheckCircle2, AlertCircle, Lock } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';

interface ChatHistoryItem {
  role?: string;
  parts?: any[];
}

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  actionPerformed?: string;
  error?: string;
}

interface AIChatProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
  onClearQuery?: () => void;
}

const AIChat: React.FC<AIChatProps> = ({ isOpen, onClose, initialQuery, onClearQuery }) => {
  const { language, isRTL, t } = useLanguage();
  const { systemUser } = useAuth();
  const { 
    appointments, transactions, doctorStatus, moderators, 
    addAppointment, addTransaction, setDoctorStatus 
  } = useData();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [history, setHistory] = useState<ChatHistoryItem[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const processedQueryRef = useRef<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const todayDate = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!systemUser) {
        setMessages([]);
        setHistory([]);
        processedQueryRef.current = null;
    }
  }, [systemUser]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [input]);

  const functions: FunctionDeclaration[] = [
    {
      name: 'add_appointment',
      description: 'Adds a new patient booking. User needs "front_desk" access.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          phone: { type: Type.STRING },
          age: { type: Type.STRING },
          residence: { type: Type.STRING },
          visitType: { type: Type.STRING, enum: ['New', 'Follow-up'] },
          source: { type: Type.STRING, enum: ['Social Media', 'Phone Call', 'Clinic Visit', 'Walk-in', 'Facebook', 'Instagram', 'Whatsapp'] },
          paid: { type: Type.NUMBER },
          notes: { type: Type.STRING },
          date: { type: Type.STRING, description: 'YYYY-MM-DD' },
          time: { type: Type.STRING, description: 'HH:mm' }
        },
        required: ['name', 'phone', 'source', 'date', 'time']
      }
    },
    {
      name: 'add_transaction',
      description: 'Records a financial transaction. User needs "accountant" access.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          description: { type: Type.STRING },
          amount: { type: Type.NUMBER },
          type: { type: Type.STRING, enum: ['income', 'expense'] },
          date: { type: Type.STRING }
        },
        required: ['description', 'amount', 'type', 'date']
      }
    },
    {
      name: 'set_doctor_status',
      description: 'Changes doctor availability. User needs "doctor" or "admin" role.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          status: { type: Type.STRING, enum: ['available', 'resting'] }
        },
        required: ['status']
      }
    }
  ];

  const callAura = async (newContents: ChatHistoryItem[]) => {
    if (!import.meta.env.VITE_GOOGLE_API_KEY) {
        throw new Error("API Key is missing in environment variables.");
    }
    
    const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GOOGLE_API_KEY });
    
    const now = new Date();
    const systemContext = {
        today: now.toISOString().split('T')[0],
        currentTime: now.toLocaleTimeString(),
        dayOfWeek: now.toLocaleDateString('en-US', { weekday: 'long' }),
        user: {
            name: systemUser?.displayName,
            role: systemUser?.role,
            permissions: systemUser?.permissions
        }
    };

    const dbContext = `
      DOCTOR STATUS: ${doctorStatus}
      ACTIVE MODERATORS: ${(moderators || []).map(m => m.name).join(', ')}
      TOTAL BOOKINGS: ${(appointments || []).length}
      BALANCE: ${(transactions || []).reduce((acc, t) => acc + (t.type === 'income' ? t.amount : -t.amount), 0)}
    `;

    return await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: newContents as any,
      config: {
        tools: [{ functionDeclarations: functions }],
        systemInstruction: `You are 'Aura', the operational AI for MediOS.
        
        TEMPORAL CONTEXT:
        - Today's Date: ${systemContext.today}
        - Current Time: ${systemContext.currentTime} (${systemContext.dayOfWeek})
        
        USER AUTHORITY:
        - User Name: ${systemContext.user.name}
        - User Role: ${systemContext.user.role}
        - Permissions JSON: ${JSON.stringify(systemContext.user.permissions)}
        
        STRICT SECURITY PROTOCOL:
        1. VALIDATE PERMISSIONS: Before calling a tool, check the "permissions" object. 
           - 'add_appointment' requires 'front_desk' access.
           - 'add_transaction' requires 'accountant' access.
           - 'set_doctor_status' requires 'admin' role or 'doctor' role.
        2. DENIAL: If a user asks for an action they lack permission for, POLITELY inform them that their current account tier does not have authorization for this command.
        3. DATA INTEGRITY: For appointments, always require Name, Phone, Source, Date, and Time.
        4. STYLE: Professional, concise, tech-forward. 
        5. Current Clinic Data: ${dbContext}`
      }
    });
  };

  const handleSend = async (text: string) => {
    if (!text.trim() || isTyping) return;
    
    const userMsgId = Date.now().toString();
    const newUserMsg: ChatMessage = { id: userMsgId, role: 'user', text };
    const newUserHistory: ChatHistoryItem = { role: 'user', parts: [{ text }] };
    
    setMessages(prev => [...prev, newUserMsg]);
    setHistory(prev => [...prev, newUserHistory]);
    setInput('');
    setIsTyping(true);

    let currentHistory = [...history, newUserHistory];

    try {
      let response = await callAura(currentHistory);
      
      if (response.candidates?.[0]?.content) {
        const modelContent = response.candidates[0].content;
        currentHistory.push(modelContent);

        if (response.functionCalls && response.functionCalls.length > 0) {
          const functionResponses = [];
          let actionLabel = '';
          let permissionDenied = false;

          for (const fc of response.functionCalls) {
            let result = "success";
            
            const perms = systemUser?.permissions || {};
            const role = systemUser?.role;

            if (fc.name === 'add_appointment' && !perms.front_desk?.access && role !== 'admin') {
                result = "ERROR: PERMISSION_DENIED. User lacks front_desk access.";
                permissionDenied = true;
            } else if (fc.name === 'add_transaction' && !perms.accountant?.access && role !== 'admin') {
                result = "ERROR: PERMISSION_DENIED. User lacks accountant access.";
                permissionDenied = true;
            } else if (fc.name === 'set_doctor_status' && role !== 'admin' && role !== 'doctor') {
                result = "ERROR: PERMISSION_DENIED. Only Doctors or Admins can toggle status.";
                permissionDenied = true;
            } else {
                try {
                  if (fc.name === 'add_appointment') {
                    await addAppointment(fc.args as any);
                    actionLabel = t(`Registered: ${fc.args.name}`, `تم تسجيل: ${fc.args.name}`);
                  } else if (fc.name === 'add_transaction') {
                    await addTransaction(fc.args as any);
                    actionLabel = t(`Logged: $${fc.args.amount}`, `تم تدوين: $${fc.args.amount}`);
                  } else if (fc.name === 'set_doctor_status') {
                    await setDoctorStatus(fc.args.status as 'available' | 'resting');
                    actionLabel = t(`Doctor: ${fc.args.status}`, `حالة الطبيب: ${fc.args.status}`);
                  }
                } catch (err) {
                  result = "error: " + (err as Error).message;
                }
            }

            functionResponses.push({
              id: fc.id,
              name: fc.name,
              response: { result }
            });
          }

          const functionTurn: ChatHistoryItem = { 
            role: 'tool', 
            parts: functionResponses.map(fr => ({ functionResponse: fr })) 
          };
          currentHistory.push(functionTurn);
          
          response = await callAura(currentHistory);
          if (response.candidates?.[0]?.content) {
            currentHistory.push(response.candidates[0].content);
          }

          setMessages(prev => [...prev, { 
            id: Date.now().toString(), 
            role: 'model', 
            text: response.text || '',
            actionPerformed: permissionDenied ? undefined : actionLabel,
            error: permissionDenied ? t("Unauthorized Action Requested", "طلب إجراء غير مصرح به") : undefined
          }]);
        } else {
          setMessages(prev => [...prev, { 
            id: Date.now().toString(), 
            role: 'model', 
            text: response.text || '' 
          }]);
        }
        
        setHistory(currentHistory);
      }
    } catch (error: any) {
      console.error("Aura Error", error);
      let errorMsg = t("Neural link unstable. Retrying connection...", "الرابط العصبي غير مستقر. جاري المحاولة...");
      if (error.message && error.message.includes("API Key is missing")) {
          errorMsg = "API Configuration Error: Key Missing.";
      }
      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        role: 'model', 
        text: errorMsg 
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend(input);
    }
  };

  useEffect(() => {
    if (isOpen && initialQuery && initialQuery !== processedQueryRef.current) {
        processedQueryRef.current = initialQuery;
        handleSend(initialQuery);
        if (onClearQuery) onClearQuery();
    }
  }, [isOpen, initialQuery]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isTyping]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="absolute inset-0" onClick={onClose}></div>
      <div className="w-full max-w-2xl h-[700px] glass-panel rounded-3xl flex flex-col border border-white/10 shadow-[0_0_80px_-20px_rgba(0,243,255,0.3)] relative overflow-hidden animate-slide-up bg-[#070708]/95">
        
        <div className="p-6 border-b border-white/5 bg-gradient-to-r from-neon-blue/10 via-transparent to-transparent flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-neon-blue/20 flex items-center justify-center border border-neon-blue/40 shadow-glow-blue animate-glow">
              <Bot size={28} className="text-neon-blue" />
            </div>
            <div className={isRTL ? 'text-right' : 'text-left'}>
              <h3 className="text-xl font-black text-white tracking-tight uppercase">
                {t('AURA SYSTEM CORE', 'نواة نظام أورا')}
              </h3>
              <p className="text-[9px] text-gray-500 font-bold uppercase tracking-[0.2em] flex items-center gap-1.5 mt-0.5">
                <Shield size={10} className="text-neon-blue" /> {t('ROLE-AWARE AUTHORIZATION ACTIVE', 'صلاحيات الدور نشطة')}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2.5 hover:bg-white/10 rounded-full text-gray-500 hover:text-white transition-all"><X size={24} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-black/20" ref={scrollRef}>
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-40 space-y-6">
              <span className="text-neon-blue animate-pulse-slow"><Sparkles size={64} /></span>
              <div className="max-w-sm">
                <p className="text-2xl font-black text-white">{t('Directive Mode Active.', 'وضع التوجيهات نشط.')}</p>
                <p className="text-sm text-gray-400 mt-2">
                  {t('Greetings, ', 'مرحباً، ')} <span className="text-neon-blue font-bold uppercase">{systemUser?.displayName}</span>. 
                  {t(' I am synced with your role and today\'s metrics.', ' أنا متزامن مع دورك ومؤشرات اليوم.')}
                </p>
              </div>
            </div>
          )}

          {(messages || []).map((msg) => (
            <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} animate-slide-up`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border-2 ${msg.role === 'user' ? 'bg-white/5 border-white/10' : 'bg-neon-blue/10 border-neon-blue/20'}`}>
                {msg.role === 'user' ? <User size={20} className="text-gray-400" /> : <Cpu size={20} className="text-neon-blue" />}
              </div>
              <div className="max-w-[85%] space-y-2">
                <div className={`p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-xl border ${msg.role === 'user' ? 'bg-white/5 border-white/10 text-gray-200 rounded-tr-none' : 'bg-neon-blue/5 border-neon-blue/20 text-gray-100 rounded-tl-none'}`}>
                  {msg.text}
                </div>
                {msg.actionPerformed && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-[10px] font-black uppercase tracking-widest animate-fade-in">
                    <CheckCircle2 size={12} /> {msg.actionPerformed}
                  </div>
                )}
                {msg.error && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-black uppercase tracking-widest animate-fade-in">
                    <Lock size={12} /> {msg.error}
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex gap-4 animate-fade-in">
              <div className="w-10 h-10 rounded-xl bg-neon-blue/10 border-2 border-neon-blue/20 flex items-center justify-center shrink-0">
                <Loader2 size={20} className="text-neon-blue animate-spin" />
              </div>
              <div className="p-4 rounded-2xl bg-neon-blue/5 border border-neon-blue/10 flex items-center justify-center gap-1.5 w-16 h-10">
                <span className="w-1 h-1 bg-neon-blue rounded-full animate-bounce"></span>
                <span className="w-1 h-1 bg-neon-blue rounded-full animate-bounce" style={{animationDelay:'0.2s'}}></span>
                <span className="w-1 h-1 bg-neon-blue rounded-full animate-bounce" style={{animationDelay:'0.4s'}}></span>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-white/10 bg-black/60 backdrop-blur-xl">
          <div className="relative flex items-end gap-3">
            <div className="relative flex-1">
                <textarea
                  ref={textareaRef}
                  rows={1}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={t('Issue a command (Enter to send, Shift+Enter for new line)...', 'أصدر أمراً (Enter للإرسال، Shift+Enter لسطر جديد)...')}
                  className={`w-full bg-white/5 border border-white/10 rounded-2xl py-4 text-sm text-white focus:border-neon-blue/50 focus:bg-white/10 outline-none transition-all placeholder-gray-600 shadow-inner resize-none custom-scrollbar min-h-[56px] max-h-[150px] ${isRTL ? 'pr-6 pl-14 text-right' : 'pl-6 pr-14 text-left'}`}
                  autoFocus
                />
            </div>
            <button 
              onClick={() => handleSend(input)}
              disabled={!input.trim() || isTyping}
              className={`mb-1.5 p-3 rounded-xl bg-neon-blue text-black hover:bg-white transition-all disabled:opacity-30 shadow-[0_0_15px_rgba(0,243,255,0.4)] active:scale-95 ${isRTL ? 'left-2' : 'right-2'}`}
            >
              <Send size={20} className={isRTL ? 'rotate-180' : ''} />
            </button>
          </div>
          <div className="mt-4 flex justify-between items-center px-2">
            <div className="flex gap-4">
                <span className="text-[9px] text-gray-600 font-black uppercase tracking-widest flex items-center gap-1.5"><Shield size={10} /> {t('ENCRYPTED', 'مشفر')}</span>
                <span className="text-[9px] text-gray-600 font-black uppercase tracking-widest flex items-center gap-1.5"><Database size={10} /> {todayDate}</span>
            </div>
            <span className="text-[9px] text-gray-600 font-black uppercase tracking-widest">{t('AURA v3.1', 'أورا v3.1')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIChat;

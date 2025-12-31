
import React, { useState, useEffect, useRef } from 'react';
import { collection, query, limit, addDoc, serverTimestamp, onSnapshot, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Message } from '../types';
import { Send, MessageSquare, X, Minimize2 } from 'lucide-react';

interface ChatProps {
    isOpen: boolean;
    onClose: () => void;
}

const Chat: React.FC<ChatProps> = ({ isOpen, onClose }) => {
  const { systemUser, firebaseUser } = useAuth();
  const { isRTL } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const clinicId = firebaseUser?.uid;

  useEffect(() => {
    if (!isOpen || !clinicId) return;

    const q = query(
      collection(db, "messages"),
      where('clinicId', '==', clinicId),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: Message[] = [];
      snapshot.forEach((doc) => {
        msgs.push({ id: doc.id, ...doc.data() } as Message);
      });
      
      msgs.sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeA - timeB;
      });
      
      setMessages(msgs);
      setTimeout(() => {
          if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
          }
      }, 100);
    }, (error) => {
      console.error("Chat sync error:", error);
    });

    return () => unsubscribe();
  }, [isOpen, clinicId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === '' || !clinicId) return;

    try {
      await addDoc(collection(db, "messages"), {
        text: newMessage,
        senderId: systemUser?.id || 'anonymous',
        senderName: systemUser?.displayName || 'Unknown',
        photoURL: systemUser?.photoURL,
        clinicId: clinicId,
        createdAt: serverTimestamp(),
      });
      setNewMessage('');
    } catch (error) {
      console.error("Error sending message: ", error);
    }
  };

  return (
    <div 
      className={`fixed bottom-8 ${isRTL ? 'left-6' : 'right-8'} z-[100] flex flex-col items-end pointer-events-none`}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Chat Window */}
      <div 
        className={`transition-all duration-500 cubic-bezier(0.16, 1, 0.3, 1) transform 
          ${isRTL ? 'origin-bottom-left' : 'origin-bottom-right'}
          ${isOpen ? 'scale-100 opacity-100 translate-y-0 pointer-events-auto' : 'scale-75 opacity-0 translate-y-10 pointer-events-none hidden'}
          w-[380px] h-[600px] glass-panel rounded-[2.5rem] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] flex flex-col border border-white/10 overflow-hidden mb-6`}
      >
        {/* Header */}
        <div className="bg-white/5 p-6 flex justify-between items-center border-b border-white/5 backdrop-blur-xl shrink-0">
          <div className="flex items-center gap-4">
            <div className="relative">
                <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_15px_#22c55e]"></div>
                <div className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-75"></div>
            </div>
            <div className={isRTL ? 'text-right' : 'text-left'}>
                <span className="font-black text-base text-white block tracking-tight leading-none mb-1">
                    {isRTL ? 'محادثة الفريق المباشرة' : 'Live Team Chat'}
                </span>
                <span className="text-[10px] text-neon-blue font-black block tracking-widest uppercase opacity-80">
                    {isRTL ? 'متصل الآن' : 'SECURE CHANNEL'}
                </span>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-white transition-all p-2.5 hover:bg-white/10 rounded-full group"
          >
            <Minimize2 size={20} className="group-hover:scale-110 transition-transform" />
          </button>
        </div>

        {/* Messages Container */}
        <div 
            ref={scrollRef} 
            className="flex-1 overflow-y-auto p-6 space-y-5 bg-black/40 custom-scrollbar scroll-smooth"
        >
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-30 px-10">
                <div className="p-5 rounded-full bg-white/5 mb-4 border border-white/5">
                    <MessageSquare size={40} className="text-gray-400" />
                </div>
                <p className="text-xs font-black uppercase tracking-widest leading-relaxed">
                    {isRTL ? 'بانتظار الرسالة الأولى من فريقك' : 'Secure silo active. Start a conversation.'}
                </p>
            </div>
          )}
          
          {messages.map((msg) => {
            const isMe = msg.senderId === systemUser?.id;
            return (
              <div key={msg.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'} animate-slide-up`}>
                <div className="w-10 h-10 rounded-2xl bg-gray-800 overflow-hidden flex-shrink-0 border border-white/10 shadow-xl group">
                    {msg.photoURL ? (
                        <img src={msg.photoURL} alt="user" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-sm text-white font-black bg-gradient-to-br from-gray-700 to-gray-900 uppercase">
                            {msg.senderName.charAt(0)}
                        </div>
                    )}
                </div>
                <div className={`flex flex-col ${isMe ? (isRTL ? 'items-start' : 'items-end') : (isRTL ? 'items-end' : 'items-start')} max-w-[75%]`}>
                  <div className="flex items-center gap-2 mb-1 px-1">
                      <span className="text-[10px] text-gray-500 font-black uppercase tracking-wider">{msg.senderName}</span>
                  </div>
                  <div 
                    className={`p-4 rounded-[1.5rem] text-sm leading-relaxed break-words shadow-2xl border transition-all duration-300
                    ${isMe 
                      ? 'bg-neon-blue/10 text-white border-neon-blue/40 rounded-tr-none' 
                      : 'bg-white/5 text-gray-200 border-white/10 rounded-tl-none hover:bg-white/10'}`}
                  >
                    {msg.text}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Input Footer */}
        <form 
            onSubmit={handleSendMessage} 
            className="p-5 border-t border-white/10 bg-black/60 backdrop-blur-2xl flex gap-3 items-center shrink-0 pointer-events-auto"
        >
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={isRTL ? 'أرسل رسالة للفريق...' : 'Type your message...'}
            className={`flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-sm focus:outline-none focus:border-neon-blue/50 text-white placeholder-gray-600 transition-all focus:bg-white/10 ${isRTL ? 'text-right' : 'text-left'}`}
          />
          <button 
            type="submit" 
            disabled={!newMessage.trim()}
            className="p-4 rounded-2xl bg-neon-blue text-black hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:scale-100 shadow-[0_0_20px_rgba(0,243,255,0.4)] hover:shadow-[0_0_30px_rgba(0,243,255,0.6)]"
          >
            <Send size={20} className={isRTL ? 'rotate-180' : ''} strokeWidth={2.5} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Send,
  Bot,
  Sparkles,
  User,
  Cpu,
  Loader2,
  Database,
  Shield,
  CheckCircle2,
  Lock,
} from "lucide-react";

import { useData } from "../contexts/DataContext";
import { useLanguage } from "../contexts/LanguageContext";
import { useAuth } from "../contexts/AuthContext";

/* ================= TYPES ================= */

interface ChatMessage {
  id: string;
  role: "user" | "model";
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

/* ================= COMPONENT ================= */

const AIChat: React.FC<AIChatProps> = ({
  isOpen,
  onClose,
  initialQuery,
  onClearQuery,
}) => {
  const { t, isRTL } = useLanguage();
  const { systemUser } = useAuth();
  const {
    appointments,
    transactions,
    doctorStatus,
    moderators,
  } = useData();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const processedQueryRef = useRef<string | null>(null);
  const sendingRef = useRef(false);

  const todayDate = new Date().toISOString().split("T")[0];

  /* ================= EFFECTS ================= */

  useEffect(() => {
    if (!systemUser) {
      setMessages([]);
      processedQueryRef.current = null;
      sendingRef.current = false;
      setIsTyping(false);
    }
  }, [systemUser]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        150
      )}px`;
    }
  }, [input]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isTyping]);

  useEffect(() => {
    if (
      isOpen &&
      initialQuery &&
      initialQuery !== processedQueryRef.current &&
      !sendingRef.current
    ) {
      processedQueryRef.current = initialQuery;
      handleSend(initialQuery);
      onClearQuery?.();
    }
  }, [isOpen, initialQuery]);

  /* ================= API CALL ================= */

  const callAura = async (text: string) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      // ✅ تحويل الرسائل لصيغة OpenAI
      const apiMessages = [
        ...messages.map((m) => ({
          role: m.role === "model" ? "assistant" : "user",
          content: m.text,
        })),
        { role: "user", content: text },
      ];

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          messages: apiMessages,
          meta: {
            doctorStatus,
            moderators,
            appointmentsCount: appointments.length,
            balance: transactions.reduce(
              (acc, t) => acc + (t.type === "income" ? t.amount : -t.amount),
              0
            ),
            user: systemUser,
            date: todayDate,
          },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "AI request failed");
      }

      return data.choices?.[0]?.message?.content || "No response";
    } finally {
      clearTimeout(timeout);
    }
  };

  /* ================= SEND ================= */

  const handleSend = async (text: string) => {
    if (!text.trim() || sendingRef.current) return;

    sendingRef.current = true;
    setIsTyping(true);

    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), role: "user", text },
    ]);

    setInput("");

    try {
      const reply = await callAura(text);

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "model",
          text: reply,
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "model",
          text: err.message || "AI Error",
          error: t(
            "Unauthorized or configuration error",
            "خطأ في الصلاحيات أو الإعدادات"
          ),
        },
      ]);
    } finally {
      sendingRef.current = false;
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  };

  if (!isOpen) return null;

  /* ================= UI ================= */

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-md"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="absolute inset-0" onClick={onClose} />

      <div className="w-full max-w-2xl h-[700px] bg-[#070708]/95 rounded-3xl flex flex-col border border-white/10 shadow-xl relative overflow-hidden">
        {/* HEADER */}
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-neon-blue/20 flex items-center justify-center">
              <Bot className="text-neon-blue" size={28} />
            </div>
            <div>
              <h3 className="text-white font-black uppercase">
                {t("AURA SYSTEM CORE", "نواة أورا")}
              </h3>
              <p className="text-[10px] text-gray-500 flex items-center gap-1">
                <Shield size={10} /> ROLE-AWARE AUTH ACTIVE
              </p>
            </div>
          </div>
          <button onClick={onClose}>
            <X className="text-gray-400 hover:text-white" />
          </button>
        </div>

        {/* MESSAGES */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
              <Sparkles size={64} className="text-neon-blue mb-4" />
              <p className="text-white font-black">
                {t("Directive Mode Active", "وضع التوجيهات نشط")}
              </p>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-4 ${
                msg.role === "user" ? "flex-row-reverse" : ""
              }`}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/5">
                {msg.role === "user" ? (
                  <User className="text-gray-400" />
                ) : (
                  <Cpu className="text-neon-blue" />
                )}
              </div>
              <div className="max-w-[85%] space-y-2">
                <div className="p-4 rounded-2xl bg-white/5 text-gray-100">
                  {msg.text}
                </div>
                {msg.error && (
                  <div className="text-red-400 text-[10px] flex items-center gap-1">
                    <Lock size={12} /> {msg.error}
                  </div>
                )}
                {msg.actionPerformed && (
                  <div className="text-green-400 text-[10px] flex items-center gap-1">
                    <CheckCircle2 size={12} /> {msg.actionPerformed}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-4">
              <Loader2 className="animate-spin text-neon-blue" />
              <span className="text-gray-400">Thinking...</span>
            </div>
          )}
        </div>

        {/* INPUT */}
        <div className="p-6 border-t border-white/10">
          <div className="flex gap-3">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t("Type a command…", "اكتب أمراً…")}
              className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-4 text-white resize-none"
            />
            <button
              onClick={() => handleSend(input)}
              disabled={!input.trim() || isTyping}
              className="p-4 bg-neon-blue text-black rounded-xl disabled:opacity-40"
            >
              <Send />
            </button>
          </div>

          <div className="mt-4 flex justify-between text-[10px] text-gray-500">
            <span className="flex items-center gap-1">
              <Database size={10} /> {todayDate}
            </span>
            <span>AURA v3.1</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIChat;

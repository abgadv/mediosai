
import React from 'react';
import { AlertTriangle, X, Check } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ 
  isOpen, onClose, onConfirm, 
  title, message, 
  confirmText = "Confirm", 
  cancelText = "Cancel",
  isDanger = false 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="absolute inset-0" onClick={onClose}></div>
      <div className="relative w-full max-w-md glass-panel rounded-2xl p-8 border border-white/10 shadow-[0_0_50px_-10px_rgba(0,0,0,0.5)] animate-slide-up transform scale-100 flex flex-col items-center text-center">
        
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors bg-white/5 p-2 rounded-full hover:bg-white/10">
          <X size={18} />
        </button>
        
        <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_-5px_currentColor] ${isDanger ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-neon-blue/10 text-neon-blue border border-neon-blue/20'}`}>
          <AlertTriangle size={40} strokeWidth={1.5} />
        </div>
        
        <h3 className="text-2xl font-black text-white mb-2 tracking-tight">{title}</h3>
        <p className="text-gray-400 text-sm leading-relaxed mb-8 px-2">
          {message}
        </p>
        
        <div className="flex gap-4 w-full">
          <button 
            onClick={onClose}
            className="flex-1 py-3.5 rounded-xl font-bold text-gray-400 bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white transition-all uppercase tracking-wider text-xs"
          >
            {cancelText}
          </button>
          <button 
            onClick={() => { onConfirm(); onClose(); }}
            className={`flex-1 py-3.5 rounded-xl font-bold text-white shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] uppercase tracking-wider text-xs flex items-center justify-center gap-2 ${isDanger ? 'bg-gradient-to-r from-red-600 to-red-500 shadow-red-500/20' : 'bg-gradient-to-r from-neon-blue to-cyan-500 shadow-neon-blue/20 text-black'}`}
          >
            {confirmText} <Check size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;

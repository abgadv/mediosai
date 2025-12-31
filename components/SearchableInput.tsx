
import React, { useState, useMemo } from 'react';

interface SearchableInputProps {
    value: string;
    onChange: (val: string) => void;
    onEnter?: () => void;
    placeholder?: string;
    className?: string;
    suggestions: string[];
}

const SearchableInput: React.FC<SearchableInputProps> = ({ value, onChange, onEnter, placeholder, className, suggestions }) => {
    const [showSuggestions, setShowSuggestions] = useState(false);
    
    const filteredSuggestions = useMemo(() => {
        if (!value || value.length < 1) return [];
        const lowerVal = value.toLowerCase();
        return suggestions
            .filter(s => s.toLowerCase().includes(lowerVal))
            .slice(0, 50);
    }, [value, suggestions]);

    return (
        <div className="relative w-full flex-1">
            <input
                type="text"
                value={value}
                onChange={(e) => { onChange(e.target.value); setShowSuggestions(true); }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                onKeyDown={(e) => { if (e.key === 'Enter' && onEnter) { e.preventDefault(); onEnter(); setShowSuggestions(false); } }}
                placeholder={placeholder}
                className={className}
            />
            {showSuggestions && filteredSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-2 bg-[#050505]/95 backdrop-blur-xl border border-neon-blue/30 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,243,255,0.2)] z-50 max-h-60 overflow-y-auto custom-scrollbar animate-fade-in">
                    {filteredSuggestions.map((suggestion, idx) => (
                        <div
                            key={idx}
                            className="px-4 py-3 text-sm text-gray-300 hover:bg-neon-blue/10 hover:text-white cursor-pointer transition-all border-b border-white/5 last:border-0 hover:pl-6 group flex items-center gap-2"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => { onChange(suggestion); setShowSuggestions(false); }}
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-600 group-hover:bg-neon-blue transition-colors"></span>
                            {suggestion}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SearchableInput;

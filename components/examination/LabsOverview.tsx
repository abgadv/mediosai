
import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { TestTube, X, Activity, LayoutGrid, Columns } from 'lucide-react';
import { Appointment, LabHistoryEntry } from '../../types';

interface LabsOverviewProps {
    clinicalData: Partial<Appointment>;
}

const LabsOverview: React.FC<LabsOverviewProps> = ({ clinicalData }) => {
    const [selectedLab, setSelectedLab] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    // Group labs by name
    const groupedLabs = useMemo(() => {
        const labs: Record<string, LabHistoryEntry[]> = {};
        
        clinicalData.labHistory?.forEach(entry => {
            const name = entry.name.trim();
            if (!labs[name]) {
                labs[name] = [];
            }
            labs[name].push(entry);
        });

        // Sort entries within each lab by date (newest first)
        Object.keys(labs).forEach(key => {
            labs[key].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        });

        return labs;
    }, [clinicalData.labHistory]);

    // Extract all unique dates for the matrix view
    const uniqueDates = useMemo(() => {
        const dates = new Set<string>();
        clinicalData.labHistory?.forEach(l => {
            if (l.date) dates.add(l.date);
        });
        // Sort newest first
        return Array.from(dates).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    }, [clinicalData.labHistory]);

    const labNames = useMemo(() => {
        return Object.keys(groupedLabs).sort();
    }, [groupedLabs]);

    // Data for the graph popup
    const graphData = useMemo(() => {
        if (!selectedLab || !groupedLabs[selectedLab]) return null;
        // Take last 5 records
        const recent = groupedLabs[selectedLab].slice(0, 5).reverse(); 
        
        return recent.map(r => ({
            date: r.date,
            value: parseFloat(r.value.replace(/[^0-9.-]/g, '')) || 0,
            rawValue: r.value
        }));
    }, [selectedLab, groupedLabs]);

    // Graph helpers
    const graphConfig = useMemo(() => {
        if (!graphData || graphData.length === 0) return { min: 0, max: 100, range: 100 };
        const values = graphData.map(d => d.value);
        const min = Math.min(...values);
        const max = Math.max(...values);
        const padding = (max - min) * 0.2 || 10; 
        return { 
            min: Math.floor(min - padding), 
            max: Math.ceil(max + padding), 
            range: Math.ceil(max + padding) - Math.floor(min - padding) || 10
        };
    }, [graphData]);

    const getY = (val: number) => {
        const height = 150;
        const { min, range } = graphConfig;
        if (range === 0) return height / 2;
        return height - ((val - min) / range) * height;
    };

    const getPoints = () => {
        if (!graphData || graphData.length === 0) return '';
        const width = 400;
        const step = width / (graphData.length - 1 || 1);
        
        return graphData.map((d, i) => {
            const x = i * step + 20;
            const y = getY(d.value) + 20;
            return `${x},${y}`;
        }).join(' ');
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6 animate-slide-up relative">
            <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
                <div className="flex justify-between items-center mb-8">
                    <h4 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                        <TestTube size={16} className="text-neon-blue"/> Recorded Labs History
                    </h4>
                    
                    {/* View Toggle */}
                    <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
                        <button 
                            onClick={() => setViewMode('grid')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all uppercase tracking-wider ${viewMode === 'grid' ? 'bg-neon-blue text-black' : 'text-gray-500 hover:text-white'}`}
                        >
                            <LayoutGrid size={14} /> Grid
                        </button>
                        <button 
                            onClick={() => setViewMode('list')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all uppercase tracking-wider ${viewMode === 'list' ? 'bg-neon-blue text-black' : 'text-gray-500 hover:text-white'}`}
                        >
                            <Columns size={14} /> List
                        </button>
                    </div>
                </div>

                {viewMode === 'grid' ? (
                    <div className="bg-black/20 rounded-2xl border border-white/5 overflow-hidden">
                        <table className="w-full text-left text-sm text-gray-400">
                            <thead className="bg-white/5 text-gray-500 uppercase font-bold text-xs">
                                <tr>
                                    <th className="p-4 w-1/3">Lab Name</th>
                                    <th className="p-4 w-1/3">Date History</th>
                                    <th className="p-4 w-1/3">Result History</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {labNames.map((labName) => {
                                    const entries = groupedLabs[labName];
                                    return (
                                        <tr key={labName} className="hover:bg-white/5 transition-colors group">
                                            <td className="p-4 align-top">
                                                <button 
                                                    onClick={() => setSelectedLab(labName)}
                                                    className="font-bold text-white text-lg hover:text-neon-blue transition-colors flex items-center gap-2"
                                                >
                                                    <Activity size={16} className="opacity-50 group-hover:opacity-100"/>
                                                    {labName}
                                                </button>
                                                <span className="text-[10px] text-gray-500 uppercase tracking-wider mt-1 block pl-6">
                                                    {entries.length} Record(s)
                                                </span>
                                            </td>
                                            <td className="p-4 align-top">
                                                <div className="flex flex-col gap-2">
                                                    {entries.map((entry, idx) => (
                                                        <div key={idx} className="font-mono text-gray-400 text-xs h-6 flex items-center">
                                                            {entry.date}
                                                        </div>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="p-4 align-top">
                                                <div className="flex flex-col gap-2">
                                                    {entries.map((entry, idx) => (
                                                        <div key={idx} className="text-neon-blue font-bold text-xs h-6 flex items-center bg-neon-blue/5 px-2 rounded w-fit border border-neon-blue/10">
                                                            {entry.value}
                                                        </div>
                                                    ))}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {labNames.length === 0 && (
                                    <tr><td colSpan={3} className="p-8 text-center italic">No lab history recorded.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="bg-black/20 rounded-2xl border border-white/5 overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left text-sm text-gray-400 border-collapse">
                            <thead className="bg-white/5 text-gray-500 uppercase font-bold text-xs">
                                <tr>
                                    <th className="p-4 border-r border-white/5 min-w-[200px] sticky left-0 bg-[#0a0a0a] z-10 shadow-[2px_0_5px_rgba(0,0,0,0.3)]">Lab Name</th>
                                    {uniqueDates.map(date => (
                                        <th key={date} className="p-4 border-r border-white/5 min-w-[120px] text-center font-mono">
                                            {date}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {labNames.map((labName) => {
                                    const entries = groupedLabs[labName];
                                    return (
                                        <tr key={labName} className="hover:bg-white/5 transition-colors group">
                                            <td className="p-4 border-r border-white/5 font-bold text-white sticky left-0 bg-[#0a0a0a] z-10 shadow-[2px_0_5px_rgba(0,0,0,0.3)]">
                                                <button 
                                                    onClick={() => setSelectedLab(labName)}
                                                    className="hover:text-neon-blue transition-colors flex items-center gap-2 w-full text-left"
                                                >
                                                    <Activity size={14} className="opacity-50 group-hover:opacity-100"/>
                                                    {labName}
                                                </button>
                                            </td>
                                            {uniqueDates.map(date => {
                                                const result = entries.find(e => e.date === date);
                                                return (
                                                    <td key={date} className="p-4 border-r border-white/5 text-center">
                                                        {result ? (
                                                            <span className="text-neon-blue font-bold px-2 py-1 bg-neon-blue/5 rounded border border-neon-blue/20">
                                                                {result.value}
                                                            </span>
                                                        ) : (
                                                            <span className="text-gray-700">-</span>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    );
                                })}
                                {labNames.length === 0 && (
                                    <tr><td colSpan={uniqueDates.length + 1} className="p-8 text-center italic">No lab history recorded.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Graph Popup via Portal */}
            {selectedLab && graphData && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="absolute inset-0" onClick={() => setSelectedLab(null)}></div>
                    <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 shadow-2xl w-full max-w-lg relative animate-slide-up">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-xl font-black text-white">{selectedLab}</h3>
                                <p className="text-xs text-gray-400">Trend Analysis (Last {graphData.length} records)</p>
                            </div>
                            <button onClick={() => setSelectedLab(null)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="relative h-48 w-full bg-white/5 rounded-xl border border-white/5 p-4 mb-4">
                            {graphData.length > 1 ? (
                                <svg className="w-full h-full overflow-visible" viewBox="0 0 440 190">
                                    <line x1="20" y1="20" x2="420" y2="20" stroke="#333" strokeDasharray="4"/>
                                    <line x1="20" y1="95" x2="420" y2="95" stroke="#333" strokeDasharray="4"/>
                                    <line x1="20" y1="170" x2="420" y2="170" stroke="#333" strokeDasharray="4"/>
                                    <polyline points={getPoints()} fill="none" stroke="#00f3ff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-[0_0_10px_rgba(0,243,255,0.5)]" />
                                    {graphData.map((d, i) => {
                                        const width = 400;
                                        const step = width / (graphData.length - 1 || 1);
                                        const x = i * step + 20;
                                        const y = getY(d.value) + 20;
                                        return (
                                            <g key={i} className="group">
                                                <circle cx={x} cy={y} r="5" fill="#050505" stroke="#00f3ff" strokeWidth="2" />
                                                <foreignObject x={x - 25} y={y - 35} width="50" height="30" className="overflow-visible opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <div className="bg-neon-blue text-black text-[10px] font-bold px-1.5 py-0.5 rounded text-center shadow-lg transform translate-y-1">
                                                        {d.value}
                                                    </div>
                                                </foreignObject>
                                                <text x={x} y="185" fill="#666" fontSize="10" textAnchor="middle" dy="10">{d.date}</text>
                                            </g>
                                        );
                                    })}
                                </svg>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                                    <Activity size={32} className="mb-2 opacity-50"/>
                                    <span className="text-xs">Need at least 2 records to graph trend.</span>
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-2">Detailed Values</p>
                            {graphData.slice().reverse().map((d, i) => (
                                <div key={i} className="flex justify-between items-center p-3 bg-black/40 rounded-lg border border-white/5">
                                    <span className="text-sm font-mono text-gray-400">{d.date}</span>
                                    <span className="text-sm font-bold text-neon-blue">{d.rawValue}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default LabsOverview;

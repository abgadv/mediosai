import React from 'react';
import { Users, Activity, Cigarette, Baby, Pill, Quote, Sun, Moon } from 'lucide-react';
import { Appointment } from '../../types';
import { formatDate } from '../../utils/formatters';
import { useTheme } from '../../contexts/ThemeContext';

interface PatientOverviewProps {
    clinicalData: Partial<Appointment>;
    aggregatedDrugHistory: any[];
}

const PatientOverview: React.FC<PatientOverviewProps> = ({ clinicalData = {} as Partial<Appointment>, aggregatedDrugHistory = [] }) => {
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';

    // Theme-based class helpers
    const cardBg = isDark ? 'bg-white/5 border-white/5' : 'bg-white border-slate-200 shadow-sm';
    const innerBg = isDark ? 'bg-black/20 border-white/5' : 'bg-slate-50 border-slate-100';
    const primaryText = isDark ? 'text-white' : 'text-slate-900';
    const secondaryText = isDark ? 'text-gray-400' : 'text-slate-600';
    const labelText = isDark ? 'text-gray-500' : 'text-slate-400';
    const tableHeaderBg = isDark ? 'bg-black/20' : 'bg-slate-100';

    return (
        <div className={`max-w-6xl mx-auto space-y-6 animate-slide-up p-8 rounded-[2.5rem] transition-colors duration-500 ${!isDark ? 'bg-[#f8fafc]' : ''}`}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className={`${cardBg} border rounded-2xl p-6 flex flex-col items-center text-center relative group transition-all`}>
                    {/* Theme Toggle Button Inside Overview */}
                    <button 
                        onClick={toggleTheme}
                        className={`absolute top-4 right-4 p-2.5 rounded-xl border transition-all shadow-lg active:scale-95 ${
                            isDark 
                            ? 'bg-black/40 border-white/10 text-gray-400 hover:text-neon-blue hover:border-neon-blue/50' 
                            : 'bg-white border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200'
                        }`}
                        title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                    >
                        {isDark ? <Sun size={18} className="animate-pulse" /> : <Moon size={18} />}
                    </button>

                    <div className={`w-24 h-24 rounded-full flex items-center justify-center border-2 mb-4 ${
                        isDark ? 'bg-gradient-to-br from-neon-blue/20 to-purple-500/20 border-white/10' : 'bg-blue-50 border-blue-100'
                    }`}>
                        <Users size={40} className={isDark ? 'text-white opacity-80' : 'text-blue-600'} />
                    </div>
                    <h3 className={`text-2xl font-black ${primaryText}`}>{clinicalData.name || 'Unknown'}</h3>
                    <p className={`${secondaryText} text-sm mt-1`}>{clinicalData.age || '?'} Years • {clinicalData.residence || 'N/A'}</p>
                    <div className="mt-4 flex gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${clinicalData.visitType === 'New' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-purple-500/10 text-purple-400 border-purple-500/20'}`}>{clinicalData.visitType || 'N/A'}</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${isDark ? 'bg-white/5 text-gray-300 border-white/10' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>{clinicalData.source || 'N/A'}</span>
                    </div>
                </div>

                <div className={`${cardBg} border rounded-2xl p-6 md:col-span-2 relative overflow-hidden transition-all`}>
                    <h4 className={`text-sm font-bold uppercase tracking-widest mb-4 flex items-center gap-2 ${labelText}`}><Activity size={16}/> ( INSIGHTS )</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className={`p-3 rounded-xl border ${innerBg}`}>
                                <span className={`text-[10px] font-bold uppercase block mb-2 ${labelText}`}>Vitals & Measurements</span>
                                <div className="grid grid-cols-3 gap-2 text-center">
                                    <div><span className={`text-[10px] block ${labelText}`}>BP</span><span className="text-blue-500 font-mono font-bold">{clinicalData.vitals?.bp || '-'}</span></div>
                                    <div><span className={`text-[10px] block ${labelText}`}>HR</span><span className="text-green-500 font-mono font-bold">{clinicalData.vitals?.hr || '-'}</span></div>
                                    <div><span className={`text-[10px] block ${labelText}`}>Temp</span><span className="text-orange-500 font-mono font-bold">{clinicalData.vitals?.temp || '-'}</span></div>
                                    <div><span className={`text-[10px] block ${labelText}`}>Wt</span><span className={`${primaryText} font-mono font-bold`}>{clinicalData.weight || '-'}</span></div>
                                    <div><span className={`text-[10px] block ${labelText}`}>Ht</span><span className={`${primaryText} font-mono font-bold`}>{clinicalData.height || '-'}</span></div>
                                    <div><span className={`text-[10px] block ${labelText}`}>Sugar</span><span className={`${primaryText} font-mono font-bold`}>{clinicalData.vitals?.sugar || '-'}</span></div>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div className={`flex justify-between items-center p-2 rounded border ${isDark ? 'border-white/5 bg-white/5' : 'border-slate-100 bg-slate-50'}`}>
                                <div className="flex items-center gap-2"><Cigarette size={14} className={labelText}/><span className={`text-xs ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>Smoking</span></div>
                                <span className={`text-xs font-bold ${clinicalData.isSmoker ? 'text-red-500' : 'text-green-600'}`}>{clinicalData.isSmoker ? `Yes (Idx: ${clinicalData.smokingDetails?.index || 0})` : 'No'}</span>
                            </div>
                            <div className={`flex justify-between items-center p-2 rounded border ${isDark ? 'border-white/5 bg-white/5' : 'border-slate-100 bg-slate-50'}`}>
                                <div className="flex items-center gap-2"><Users size={14} className={labelText}/><span className={`text-xs ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>Marital</span></div>
                                <span className={`text-xs font-bold ${primaryText}`}>{clinicalData.isMarried ? `Married (${clinicalData.marriageDetails?.childrenCount} kids)` : 'Single'}</span>
                            </div>
                            {(clinicalData.hasMenstrualHistory || clinicalData.isPregnant) && (
                                <div className={`flex justify-between items-center p-2 rounded border ${isDark ? 'border-pink-500/20 bg-pink-500/5' : 'border-pink-200 bg-pink-50'}`}>
                                    <div className="flex items-center gap-2"><Baby size={14} className="text-pink-500"/><span className={`text-xs ${isDark ? 'text-pink-300' : 'text-pink-700'}`}>Obs/Gyn</span></div>
                                    <span className={`text-xs font-bold ${isDark ? 'text-pink-200' : 'text-pink-600'}`}>{clinicalData.isPregnant ? `Pregnant (EDD: ${formatDate(clinicalData.pregnancyDetails?.edd)})` : `LMP: ${formatDate(clinicalData.menstrualHistory?.lmp)}`}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            
            <div className={`${cardBg} border rounded-2xl p-6 transition-all`}>
                <h4 className={`text-sm font-bold uppercase tracking-widest mb-4 flex items-center gap-2 ${labelText}`}>Detailed Past History</h4>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-3">
                        <p className="text-xs text-red-500 font-bold uppercase border-b border-red-500/20 pb-1 mb-2">Chronic Conditions</p>
                        {Object.entries(clinicalData.chronicConditions || {}).filter(([_, v]) => v).map(([cond]) => {
                            const details = clinicalData.chronicConditionDetails?.[cond];
                            return (
                                <div key={cond} className={`p-3 rounded-lg border ${innerBg}`}>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className={`font-bold text-sm ${isDark ? 'text-red-200' : 'text-red-700'}`}>{cond}</span>
                                        <span className={`text-[10px] ${labelText}`}>{formatDate(details?.diagnosedDate)}</span>
                                    </div>
                                    {details?.medications && details.medications.length > 0 ? (
                                        <div className="space-y-1">{details.medications.map((m, i) => (<div key={i} className={`text-xs flex gap-2 ${secondaryText}`}><span className={primaryText}>• {m.name}</span><span className="opacity-60">{m.frequency}</span></div>))}</div>
                                    ) : <span className={`text-[10px] italic ${isDark ? 'text-gray-600' : 'text-slate-400'}`}>No medications listed</span>}
                                </div>
                            );
                        })}
                        {Object.keys(clinicalData.chronicConditions || {}).filter(k => clinicalData.chronicConditions![k]).length === 0 && <span className={`text-sm italic ${secondaryText}`}>No chronic conditions.</span>}
                    </div>
                    <div className="space-y-4">
                        <div>
                            <p className="text-xs text-orange-500 font-bold uppercase border-b border-orange-500/20 pb-1 mb-2">Allergies</p>
                            <div className="flex flex-wrap gap-2">
                                {Object.entries(clinicalData.allergies || {}).filter(([_, v]) => v).map(([alg]) => (
                                    <div key={alg} className="group relative">
                                        <span className={`text-xs font-bold px-3 py-1.5 rounded border ${isDark ? 'text-white bg-orange-500/10 border-orange-500/20' : 'text-orange-700 bg-orange-50 border-orange-100'}`}>
                                            {alg}
                                        </span>
                                        {clinicalData.allergyComments?.[alg] && (
                                            <div className="absolute bottom-full left-0 mb-2 w-48 p-2 bg-black text-xs text-gray-300 rounded border border-white/10 hidden group-hover:block z-10">{clinicalData.allergyComments[alg]}</div>
                                        )}
                                    </div>
                                ))}
                                {Object.keys(clinicalData.allergies || {}).filter(k => clinicalData.allergies![k]).length === 0 && <span className={`text-sm italic ${secondaryText}`}>No known allergies.</span>}
                            </div>
                        </div>
                        {clinicalData.pastHistory && (
                            <div className="mt-4">
                                <p className={`text-xs font-bold uppercase mb-1 ${labelText}`}>General Notes</p>
                                <p className={`text-sm leading-relaxed p-3 rounded-lg border ${innerBg} ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>{clinicalData.pastHistory}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className={`${cardBg} border rounded-2xl p-6 transition-all`}>
                <h4 className={`text-sm font-bold uppercase tracking-widest mb-4 flex items-center gap-2 ${labelText}`}><Pill size={16}/> Drug History</h4>
                {aggregatedDrugHistory.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className={`${tableHeaderBg} text-xs uppercase ${labelText}`}>
                                <tr>
                                    <th className="p-3">Date</th>
                                    <th className="p-3">Drug</th>
                                    <th className="p-3">Freq/Dur</th>
                                    <th className="p-3">Source</th>
                                </tr>
                            </thead>
                            <tbody className={`divide-y ${isDark ? 'divide-white/5' : 'divide-slate-100'}`}>
                                {aggregatedDrugHistory.map((d, i) => (
                                    <tr key={i}>
                                        <td className={`p-3 font-mono text-xs opacity-60 ${secondaryText}`}>{formatDate(d.date)}</td>
                                        <td className={`p-3 font-medium ${primaryText}`}>{d.name}</td>
                                        <td className={`p-3 ${secondaryText}`}>{d.frequency} {d.duration ? `(${d.duration})` : ''}</td>
                                        <td className="p-3">
                                            <span className={`text-[10px] px-2 py-1 rounded border font-bold ${
                                                d.source === 'Chronic Condition' 
                                                ? (isDark ? 'bg-red-900/20 text-red-300 border-red-500/20' : 'bg-red-50 text-red-600 border-red-100')
                                                : (isDark ? 'bg-blue-900/20 text-blue-300 border-blue-500/20' : 'bg-blue-50 text-blue-600 border-blue-100')
                                            }`}>
                                                {d.source || 'History'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : <p className={`text-sm italic ${labelText}`}>No medication history.</p>}
            </div>

            <div className={`${cardBg} border rounded-2xl p-6 transition-all`}>
                    <div className="flex items-center gap-2 mb-4"><Quote size={16} className="text-blue-500"/><h4 className={`text-sm font-bold uppercase tracking-widest ${labelText}`}>Current Encounter</h4></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-6">
                            <div><span className="text-xs text-blue-500 font-bold uppercase block mb-1">Chief Complaint</span><p className={`text-sm leading-relaxed p-3 rounded-lg border min-h-[60px] whitespace-pre-wrap ${innerBg} ${primaryText}`}>{clinicalData.complaints || 'None recorded'}</p></div>
                            <div><span className="text-xs text-blue-500 font-bold uppercase block mb-1">Final Diagnosis</span><p className={`text-xl font-black p-3 rounded-lg border ${innerBg} ${primaryText}`}>{clinicalData.diagnosis || 'Pending...'}</p></div>
                        </div>
                        <div className="space-y-6">
                            <div><span className={`text-xs font-bold uppercase block mb-1 ${labelText}`}>Symptoms</span><p className={`text-sm leading-relaxed p-3 rounded-lg border min-h-[60px] whitespace-pre-wrap ${innerBg} ${secondaryText}`}>{clinicalData.symptoms || '-'}</p></div>
                            <div><span className={`text-xs font-bold uppercase block mb-1 ${labelText}`}>Signs</span><p className={`text-sm leading-relaxed p-3 rounded-lg border min-h-[60px] whitespace-pre-wrap ${innerBg} ${secondaryText}`}>{clinicalData.signs || '-'}</p></div>
                        </div>
                    </div>
            </div>
        </div>
    );
};

export default PatientOverview;
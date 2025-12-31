
import React, { useState } from 'react';
import { Pill, TestTube, Plus, XCircle, Printer } from 'lucide-react';
import { Appointment, PrescriptionItem, InvestigationItem } from '../../types';
import SearchableInput from '../SearchableInput';
import { LAB_TESTS_LIST } from '../../constants/medical';
import { DRUG_LIST } from '../../constants/drugs';
import { printPrescription, printInvestigations, printSessionRequests } from '../../utils/exportHelper';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';

interface RequestsViewProps {
    reqPrescription: PrescriptionItem[];
    setReqPrescription: React.Dispatch<React.SetStateAction<PrescriptionItem[]>>;
    reqLabs: InvestigationItem[];
    setReqLabs: React.Dispatch<React.SetStateAction<InvestigationItem[]>>;
    reqScans: InvestigationItem[];
    setReqScans: React.Dispatch<React.SetStateAction<InvestigationItem[]>>;
    clinicalData: Partial<Appointment>;
    setClinicalData: React.Dispatch<React.SetStateAction<Partial<Appointment>>>;
}

const RequestsView: React.FC<RequestsViewProps> = ({ 
    reqPrescription, setReqPrescription, 
    reqLabs, setReqLabs, 
    reqScans, setReqScans,
    clinicalData, setClinicalData
}) => {
    const { printSettings } = useData();
    const { systemUser } = useAuth();
    const [tempDrug, setTempDrug] = useState({ drug: '', frequency: '', duration: '' });
    const [tempLab, setTempLab] = useState('');
    const [tempScan, setTempScan] = useState('');
    const todayStr = new Date().toISOString().split('T')[0];
    const doctorName = systemUser?.displayName || 'Doctor';

    const addReqPrescription = () => { 
        if(tempDrug.drug) { 
            setReqPrescription([...reqPrescription, tempDrug]);
            setClinicalData(prev => ({
                ...prev,
                drugHistory: [
                    ...(prev.drugHistory || []),
                    { 
                        name: tempDrug.drug, 
                        frequency: tempDrug.frequency, 
                        duration: tempDrug.duration, 
                        date: todayStr, 
                        source: doctorName 
                    }
                ].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            }));
            setTempDrug({ drug: '', frequency: '', duration: '' }); 
        } 
    };

    const addReqLab = () => { 
        if(tempLab) { 
            setReqLabs([...reqLabs, { id: Date.now().toString(), name: tempLab }]); 
            setClinicalData(prev => ({
                ...prev,
                labHistory: [
                    ...(prev.labHistory || []),
                    { 
                        id: Date.now().toString(), 
                        name: tempLab, 
                        value: `Requested by ${doctorName}`, 
                        date: todayStr 
                    }
                ].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            }));
            setTempLab(''); 
        } 
    };

    const addReqScan = () => { 
        if(tempScan) { 
            setReqScans([...reqScans, { id: Date.now().toString(), name: tempScan }]); 
            setClinicalData(prev => ({
                ...prev,
                scanHistory: [
                    ...(prev.scanHistory || []),
                    { 
                        id: Date.now().toString(), 
                        name: tempScan, 
                        comment: `Requested by ${doctorName}`, 
                        date: todayStr 
                    }
                ].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            }));
            setTempScan(''); 
        } 
    };

    const handlePrintRx = () => {
        printPrescription(clinicalData.name || 'Patient', todayStr, reqPrescription, printSettings);
    };

    const handlePrintInv = () => {
        printInvestigations(clinicalData.name || 'Patient', todayStr, reqLabs, reqScans, printSettings);
    };

    const handlePrintAll = () => {
        const sessionSnapshot = {
            ...clinicalData,
            date: todayStr,
            prescription: reqPrescription,
            investigationItems: reqLabs,
            scans: reqScans
        } as Appointment;
        
        printSessionRequests(sessionSnapshot, printSettings);
    };

    return (
        <div className="max-w-6xl mx-auto flex flex-col gap-6 animate-slide-up h-full pb-8">
            <div className="flex justify-end shrink-0">
                <button 
                    onClick={handlePrintAll} 
                    className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-neon-blue to-cyan-500 text-black font-bold rounded-xl hover:shadow-[0_0_15px_rgba(0,243,255,0.4)] transition-all uppercase text-xs tracking-wider"
                >
                    <Printer size={16} /> Print All (Session)
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1 min-h-0">
                <div className="space-y-6 flex flex-col h-full">
                    <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="text-sm font-bold text-neon-blue uppercase flex items-center gap-2"><Pill size={16}/> Prescription</h4>
                            <button onClick={handlePrintRx} disabled={reqPrescription.length === 0} className="text-xs flex items-center gap-1 text-gray-400 hover:text-white transition-colors disabled:opacity-30"><Printer size={14} /> Print Rx</button>
                        </div>
                        <div className="grid grid-cols-12 gap-2 mb-4">
                            <div className="col-span-12 md:col-span-5">
                                <SearchableInput
                                    placeholder="Drug Name"
                                    className="w-full bg-black/40 border border-white/10 rounded p-2 text-sm text-white focus:border-neon-blue outline-none"
                                    value={tempDrug.drug}
                                    onChange={(val) => setTempDrug({...tempDrug, drug: val})}
                                    suggestions={DRUG_LIST}
                                />
                            </div>
                            <div className="col-span-6 md:col-span-4"><input placeholder="Frequency" className="w-full bg-black/40 border border-white/10 rounded p-2 text-sm text-white focus:border-neon-blue outline-none" value={tempDrug.frequency} onChange={e => setTempDrug({...tempDrug, frequency: e.target.value})} /></div>
                            <div className="col-span-6 md:col-span-3"><input placeholder="Duration" className="w-full bg-black/40 border border-white/10 rounded p-2 text-sm text-white focus:border-neon-blue outline-none" value={tempDrug.duration} onChange={e => setTempDrug({...tempDrug, duration: e.target.value})} /></div>
                        </div>
                        <button onClick={addReqPrescription} className="w-full py-2 bg-neon-blue/10 text-neon-blue border border-neon-blue/30 rounded-lg font-bold text-xs uppercase hover:bg-neon-blue hover:text-black transition-colors">Add Drug</button>
                        
                        <div className="mt-4 space-y-2 max-h-[250px] overflow-y-auto custom-scrollbar">
                            {reqPrescription.map((p, i) => (
                                <div key={i} className="flex justify-between items-center bg-black/20 p-2 rounded border border-white/5">
                                    <span className="text-sm font-bold text-gray-300">{p.drug} <span className="text-xs font-normal text-gray-500">({p.frequency} - {p.duration})</span></span>
                                    <button onClick={() => setReqPrescription(prev => prev.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-white"><XCircle size={14}/></button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                
                <div className="space-y-6 flex flex-col h-full">
                    <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="text-sm font-bold text-neon-blue uppercase flex items-center gap-2"><TestTube size={16}/> Lab & Scan Requests</h4>
                            <button onClick={handlePrintInv} disabled={reqLabs.length === 0 && reqScans.length === 0} className="text-xs flex items-center gap-1 text-gray-400 hover:text-white transition-colors disabled:opacity-30"><Printer size={14} /> Print Request</button>
                        </div>
                        
                        <div className="mb-6">
                            <label className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-2 block">Lab Tests</label>
                            <div className="flex gap-2 mb-2">
                                <SearchableInput 
                                    value={tempLab} 
                                    onChange={setTempLab}
                                    onEnter={addReqLab}
                                    suggestions={LAB_TESTS_LIST}
                                    placeholder="Search Lab Name..."
                                    className="w-full bg-black/40 border border-white/10 rounded p-2 text-sm text-white focus:border-neon-blue outline-none"
                                />
                                <button onClick={addReqLab} className="p-2 bg-white/5 hover:bg-neon-blue/20 text-neon-blue rounded border border-white/10 transition-colors"><Plus size={18}/></button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {reqLabs.map((l, i) => (
                                    <div key={i} className="px-3 py-1 bg-purple-500/10 text-purple-300 border border-purple-500/30 rounded-full text-xs flex items-center gap-2">
                                        {l.name} <button onClick={() => setReqLabs(prev => prev.filter((_, idx) => idx !== i))}><XCircle size={12}/></button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-2 block">Scans / Radiology</label>
                            <div className="flex gap-2 mb-2">
                                <input placeholder="Type Scan Name..." className="flex-1 bg-black/40 border border-white/10 rounded p-2 text-sm text-white focus:border-neon-blue outline-none" value={tempScan} onChange={e => setTempScan(e.target.value)} onKeyDown={e => e.key === 'Enter' && addReqScan()} />
                                <button onClick={addReqScan} className="p-2 bg-white/5 hover:bg-neon-blue/20 text-neon-blue rounded border border-white/10 transition-colors"><Plus size={18}/></button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {reqScans.map((s, i) => (
                                    <div key={i} className="px-3 py-1 bg-green-500/10 text-green-300 border border-green-500/30 rounded-full text-xs flex items-center gap-2">
                                        {s.name} <button onClick={() => setReqScans(prev => prev.filter((_, idx) => idx !== i))}><XCircle size={12}/></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white/5 p-6 rounded-2xl border border-white/5 flex-1">
                        <h4 className="text-sm font-bold text-neon-blue uppercase mb-2">Final Diagnosis</h4>
                        <textarea className="w-full h-full bg-black/40 border border-white/10 rounded-xl p-4 text-white text-lg font-medium outline-none focus:border-neon-blue resize-none" value={clinicalData.diagnosis} onChange={e => setClinicalData({...clinicalData, diagnosis: e.target.value})} placeholder="Enter diagnosis..." />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RequestsView;

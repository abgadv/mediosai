
import React, { useState, useRef } from 'react';
import { Appointment, MedicationEntry, ScanHistoryEntry } from '../../types';
import SearchableInput from '../SearchableInput';
import ConfirmationModal from '../ConfirmationModal';
// Added ClipboardList to the imports below
import { 
  Activity, AlertTriangle, Baby, Heart, Cigarette, Edit2, Trash2, 
  Upload, Eye, Download, X, ChevronLeft, ChevronRight, XCircle, Plus, ClipboardList
} from 'lucide-react';
import { LAB_TESTS_LIST, CHRONIC_CONDITIONS_LIST, ALLERGIES_LIST } from '../../constants/medical';
import { DRUG_LIST } from '../../constants/drugs';
import { formatDate } from '../../utils/formatters';

interface PatientSheetProps {
    clinicalData: Partial<Appointment>;
    setClinicalData: React.Dispatch<React.SetStateAction<Partial<Appointment>>>;
    activeSheetTab: string;
    setActiveSheetTab: (tab: string) => void;
    aggregatedDrugHistory: any[];
}

const PatientSheet: React.FC<PatientSheetProps> = ({ 
    clinicalData, setClinicalData, 
    activeSheetTab, setActiveSheetTab,
    aggregatedDrugHistory
}) => {
    // Local State for inputs
    const [newLab, setNewLab] = useState({ name: '', value: '', date: '' });
    const [newScan, setNewScan] = useState({ name: '', comment: '', date: '' });
    const [newDrugHist, setNewDrugHist] = useState({ name: '', frequency: '', duration: '', date: '' });
    const [scanFiles, setScanFiles] = useState<File[]>([]);
    const [scanPreviewUrls, setScanPreviewUrls] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [previewScan, setPreviewScan] = useState<ScanHistoryEntry | null>(null);
    const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
    const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean, type: 'lab' | 'scan' | 'drug', index: number } | null>(null);

    // Other inputs
    const [otherChronicInput, setOtherChronicInput] = useState('');
    const [otherAllergyInput, setOtherAllergyInput] = useState('');

    // --- Handlers ---
    const updateVitals = (key: string, val: string) => {
        setClinicalData(prev => ({ ...prev, vitals: { ...prev.vitals, [key]: val } }));
    };

    const updateChronicCondition = (condition: string, checked: boolean) => {
        setClinicalData(prev => {
            const newState = { ...prev };
            if (!newState.chronicConditions) newState.chronicConditions = {};
            newState.chronicConditions[condition] = checked;
            
            if (checked) {
                if (!newState.chronicConditionDetails) newState.chronicConditionDetails = {};
                if (!newState.chronicConditionDetails[condition]) {
                    newState.chronicConditionDetails[condition] = { diagnosedDate: '', medications: [] };
                }
            } else {
                if (newState.chronicConditionDetails?.[condition]) {
                   const { [condition]: removed, ...remaining } = newState.chronicConditionDetails;
                   newState.chronicConditionDetails = remaining;
                }
            }
            return newState;
        });
    };

    const addOtherChronic = () => {
        if (otherChronicInput.trim()) {
            updateChronicCondition(otherChronicInput.trim(), true);
            setOtherChronicInput('');
        }
    };

    const addOtherAllergy = () => {
        if (otherAllergyInput.trim()) {
            updateAllergy(otherAllergyInput.trim(), true);
            setOtherAllergyInput('');
        }
    };

    const updateConditionMed = (condition: string, medIndex: number, field: keyof MedicationEntry, val: string) => {
        setClinicalData(prev => {
            const newState = { ...prev };
            if (newState.chronicConditionDetails?.[condition]?.medications?.[medIndex]) {
                newState.chronicConditionDetails[condition].medications[medIndex] = {
                    ...newState.chronicConditionDetails[condition].medications[medIndex],
                    [field]: val
                };
            }
            return newState;
        });
    };

    const addConditionMed = (condition: string) => {
        setClinicalData(prev => {
            const newState = { ...prev };
            if (newState.chronicConditionDetails?.[condition]) {
                if (!newState.chronicConditionDetails[condition].medications) {
                    newState.chronicConditionDetails[condition].medications = [];
                }
                newState.chronicConditionDetails[condition].medications.push({
                    name: '', frequency: '', duration: '', date: '', source: 'Chronic'
                });
            }
            return newState;
        });
    };

    const updateAllergy = (allergy: string, checked: boolean) => {
        setClinicalData(prev => {
            const newAllergies = { ...prev.allergies, [allergy]: checked };
            if (!checked) {
                const { [allergy]: remComment, ...remainingComments } = prev.allergyComments || {};
                return { ...prev, allergies: newAllergies, allergyComments: remainingComments };
            }
            return { ...prev, allergies: newAllergies };
        });
    };

    const calculateSmokingIndex = (amount: string, duration: string) => {
        const amt = parseFloat(amount) || 0;
        const dur = parseFloat(duration) || 0;
        return (amt * dur).toFixed(1);
    };

    const calculateMarriageDuration = (dateStr: string) => {
        if (!dateStr) return '';
        const start = new Date(dateStr);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const years = Math.floor(diffDays / 365);
        return years > 0 ? `${years} years` : `${diffDays} days`;
    };

    const addLabHistory = () => {
        if (newLab.name && newLab.value) {
            setClinicalData(prev => ({
                ...prev,
                labHistory: [...(prev.labHistory || []), { id: Date.now().toString(), ...newLab }].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            }));
            setNewLab({ name: '', value: '', date: '' });
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles: File[] = Array.from(e.target.files);
            setScanFiles(prev => [...prev, ...newFiles]);
            
            const base64Promises = newFiles.map(file => {
                return new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.readAsDataURL(file);
                    reader.onload = () => resolve(reader.result as string);
                    reader.onerror = error => reject(error);
                });
            });

            try {
                const newBase64s = await Promise.all(base64Promises);
                setScanPreviewUrls(prev => [...prev, ...newBase64s]);
                
                if (!newScan.name && newFiles[0]) {
                    const fileName = newFiles[0].name.split('.').slice(0, -1).join('.');
                    setNewScan(prev => ({ ...prev, name: fileName }));
                }
            } catch (error) {
                console.error("Error reading files", error);
            }
        }
    };

    const removeFile = (index: number) => {
        setScanFiles(prev => prev.filter((_, i) => i !== index));
        setScanPreviewUrls(prev => prev.filter((_, i) => i !== index));
    };

    const addScanHistory = () => {
        if (newScan.name) {
            const attachmentUrls = [...scanPreviewUrls];
            setClinicalData(prev => ({
                ...prev,
                scanHistory: [...(prev.scanHistory || []), { 
                    id: Date.now().toString(), 
                    ...newScan,
                    attachmentUrls: attachmentUrls.length > 0 ? attachmentUrls : undefined
                }].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            }));
            setNewScan({ name: '', comment: '', date: '' });
            setScanFiles([]);
            setScanPreviewUrls([]);
            if(fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const addDrugHistory = () => {
        if (newDrugHist.name) {
            setClinicalData(prev => ({
                ...prev,
                drugHistory: [...(prev.drugHistory || []), { ...newDrugHist, source: 'History' }].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            }));
            setNewDrugHist({ name: '', frequency: '', duration: '', date: '' });
        }
    };

    const confirmDelete = () => {
        if (!deleteConfirmation) return;
        if (deleteConfirmation.type === 'lab') {
            setClinicalData(prev => ({ ...prev, labHistory: prev.labHistory?.filter((_, i) => i !== deleteConfirmation.index) }));
        } else if (deleteConfirmation.type === 'scan') {
            setClinicalData(prev => ({ ...prev, scanHistory: prev.scanHistory?.filter((_, i) => i !== deleteConfirmation.index) }));
        } else if (deleteConfirmation.type === 'drug') {
             setClinicalData(prev => ({ ...prev, drugHistory: prev.drugHistory?.filter((_, i) => i !== deleteConfirmation.index) }));
        }
        setDeleteConfirmation(null);
    };

    const handleDeleteLab = (index: number) => setDeleteConfirmation({ isOpen: true, type: 'lab', index });
    const handleDeleteScan = (index: number) => setDeleteConfirmation({ isOpen: true, type: 'scan', index });
    const handleDeleteDrug = (index: number) => setDeleteConfirmation({ isOpen: true, type: 'drug', index });

    const handleEditLab = (index: number) => {
        const item = clinicalData.labHistory?.[index];
        if (item) {
            setNewLab({ name: item.name, value: item.value, date: item.date });
            setClinicalData(prev => ({ ...prev, labHistory: prev.labHistory?.filter((_, i) => i !== index) }));
        }
    };

    const handleEditScan = (index: number) => {
        const item = clinicalData.scanHistory?.[index];
        if (item) {
            setNewScan({ name: item.name, comment: item.comment, date: item.date });
            if(item.attachmentUrls) {
                setScanPreviewUrls(item.attachmentUrls);
            }
            setClinicalData(prev => ({ ...prev, scanHistory: prev.scanHistory?.filter((_, i) => i !== index) }));
        }
    };

    const handleEditDrug = (index: number) => {
        const item = clinicalData.drugHistory?.[index];
        if (item) {
            setNewDrugHist({ name: item.name, frequency: item.frequency, duration: item.duration, date: item.date });
            setClinicalData(prev => ({ ...prev, drugHistory: prev.drugHistory?.filter((_, i) => i !== index) }));
        }
    };

    const openPreview = (scan: ScanHistoryEntry) => {
        if (scan.attachmentUrls && scan.attachmentUrls.length > 0) {
            setPreviewScan(scan);
            setCurrentSlideIndex(0);
        }
    };
    const nextSlide = () => { if (!previewScan?.attachmentUrls) return; setCurrentSlideIndex((prev) => (prev + 1) % previewScan.attachmentUrls!.length); };
    const prevSlide = () => { if (!previewScan?.attachmentUrls) return; setCurrentSlideIndex((prev) => (prev - 1 + previewScan.attachmentUrls!.length) % previewScan.attachmentUrls!.length); };

    const allChronicConditions = Array.from(new Set([
        ...CHRONIC_CONDITIONS_LIST, 
        ...Object.keys(clinicalData.chronicConditions || {}).filter(k => !CHRONIC_CONDITIONS_LIST.includes(k))
    ]));

    const allAllergies = Array.from(new Set([
        ...ALLERGIES_LIST, 
        ...Object.keys(clinicalData.allergies || {}).filter(k => !ALLERGIES_LIST.includes(k))
    ]));

    return (
        <>
            <div className="flex border-b border-white/10 bg-black/20 overflow-x-auto shrink-0 animate-fade-in">
                {['Personal Data', 'Past History', 'Labs History', 'Scans History', 'Drug History', 'Complaints'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveSheetTab(tab)}
                        className={`px-6 py-3 text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap border-b-2 ${
                            activeSheetTab === tab ? 'border-white text-white bg-white/5' : 'border-transparent text-gray-500 hover:text-gray-300'
                        }`}
                    >
                        {tab}
                    </button>
                ))}
                {clinicalData.hasMenstrualHistory && (
                    <button onClick={() => setActiveSheetTab('Menstrual History')} className={`px-6 py-3 text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap border-b-2 ${activeSheetTab === 'Menstrual History' ? 'border-pink-500 text-pink-500 bg-pink-500/5' : 'border-transparent text-gray-500 hover:text-white'}`}>Menstrual History</button>
                )}
                {clinicalData.isPregnant && (
                    <button onClick={() => setActiveSheetTab('Pregnancy')} className={`px-6 py-3 text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap border-b-2 ${activeSheetTab === 'Pregnancy' ? 'border-pink-500 text-pink-500 bg-pink-500/5' : 'border-transparent text-gray-500 hover:text-white'}`}>Pregnancy</button>
                )}
            </div>

            <div className="mt-6">
                {activeSheetTab === 'Personal Data' && (
                    <div className="space-y-8 max-w-5xl mx-auto animate-slide-up">
                        <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2"><Activity size={14}/> Measurements & Vitals</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
                                <div className="lg:col-span-1"><label className="text-[10px] text-gray-500 block mb-1">Weight (kg)</label><input type="number" className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white text-sm focus:border-neon-blue outline-none" value={clinicalData.weight} onChange={e => setClinicalData({...clinicalData, weight: e.target.value})} /></div>
                                <div className="lg:col-span-1"><label className="text-[10px] text-gray-500 block mb-1">Height (cm)</label><input type="number" className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white text-sm focus:border-neon-blue outline-none" value={clinicalData.height} onChange={e => setClinicalData({...clinicalData, height: e.target.value})} /></div>
                                {['BP','HR','Temp','RR','Sugar'].map(v => (
                                    <div key={v} className="lg:col-span-1"><label className="text-[10px] text-gray-500 block mb-1">{v}</label><input className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white text-sm focus:border-neon-blue outline-none text-center" value={clinicalData.vitals?.[v.toLowerCase() as keyof typeof clinicalData.vitals] || ''} onChange={e => updateVitals(v.toLowerCase(), e.target.value)} /></div>
                                ))}
                            </div>
                        </div>
                        <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
                            <div className="flex items-center gap-4 mb-4"><input type="checkbox" checked={clinicalData.isSmoker || false} onChange={e => setClinicalData({...clinicalData, isSmoker: e.target.checked})} className="w-5 h-5 accent-neon-blue cursor-pointer" /><label className="text-sm font-bold text-white">Smoker?</label></div>
                            {clinicalData.isSmoker && (<div className="grid grid-cols-3 gap-4 pl-9 animate-fade-in"><div><label className="text-[10px] text-gray-500 block mb-1">Cigarettes/Day</label><input type="number" className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white text-sm focus:border-neon-blue outline-none" value={clinicalData.smokingDetails?.amount} onChange={e => setClinicalData(prev => ({...prev, smokingDetails: { ...prev.smokingDetails, amount: e.target.value, index: calculateSmokingIndex(e.target.value, prev.smokingDetails?.duration || '0') } as any}))} /></div><div><label className="text-[10px] text-gray-500 block mb-1">Duration (Years)</label><input type="number" className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white text-sm focus:border-neon-blue outline-none" value={clinicalData.smokingDetails?.duration} onChange={e => setClinicalData(prev => ({...prev, smokingDetails: { ...prev.smokingDetails, duration: e.target.value, index: calculateSmokingIndex(prev.smokingDetails?.amount || '0', e.target.value) } as any}))} /></div><div className="bg-black/20 rounded-lg p-2 border border-white/5 flex flex-col justify-center items-center"><span className="text-[10px] text-gray-500 uppercase font-bold">Smoking Index</span><span className="text-lg font-black text-neon-blue">{clinicalData.smokingDetails?.index || 0}</span></div></div>)}
                        </div>
                        <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
                            <div className="flex items-center gap-4 mb-4"><input type="checkbox" checked={clinicalData.isMarried || false} onChange={e => setClinicalData({...clinicalData, isMarried: e.target.checked})} className="w-5 h-5 accent-neon-blue cursor-pointer" /><label className="text-sm font-bold text-white">Married?</label></div>
                            {clinicalData.isMarried && (<div className="grid grid-cols-3 gap-4 pl-9 animate-fade-in"><div><label className="text-[10px] text-gray-500 block mb-1">Marriage Date</label><input type="date" className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white text-sm focus:border-neon-blue outline-none" value={clinicalData.marriageDetails?.marriageDate} onChange={e => setClinicalData(prev => ({...prev, marriageDetails: { ...prev.marriageDetails, marriageDate: e.target.value, duration: calculateMarriageDuration(e.target.value) } as any}))} /></div><div><label className="text-[10px] text-gray-500 block mb-1">Children Count</label><input type="number" className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white text-sm focus:border-neon-blue outline-none" value={clinicalData.marriageDetails?.childrenCount} onChange={e => setClinicalData(prev => ({...prev, marriageDetails: { ...prev.marriageDetails, childrenCount: e.target.value } as any}))} /></div><div className="bg-black/20 rounded-lg p-2 border border-white/5 flex flex-col justify-center items-center"><span className="text-[10px] text-gray-500 uppercase font-bold">Duration</span><span className="text-lg font-black text-neon-blue">{clinicalData.marriageDetails?.duration || '-'}</span></div></div>)}
                        </div>
                        <div className="bg-white/5 p-6 rounded-2xl border border-white/5 flex gap-8">
                            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" className="w-4 h-4 accent-pink-500" checked={clinicalData.hasMenstrualHistory || false} onChange={e => setClinicalData({...clinicalData, hasMenstrualHistory: e.target.checked})} /><span className="text-sm font-bold text-gray-300">Menstrual History</span></label>
                            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" className="w-4 h-4 accent-pink-500" checked={clinicalData.isPregnant || false} onChange={e => setClinicalData({...clinicalData, isPregnant: e.target.checked})} /><span className="text-sm font-bold text-gray-300">Pregnancy</span></label>
                        </div>
                    </div>
                )}

                {activeSheetTab === 'Past History' && (
                    <div className="max-w-6xl mx-auto space-y-8 animate-slide-up">
                        <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
                            <div className="flex justify-between items-center mb-6">
                                <h4 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2"><Activity size={16} className="text-red-400"/> Chronic Conditions</h4>
                                <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-xl border border-white/5 shadow-inner">
                                    <Plus size={14} className="text-neon-blue ml-2"/>
                                    <input 
                                        type="text" 
                                        value={otherChronicInput} 
                                        onChange={e => setOtherChronicInput(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && addOtherChronic()}
                                        placeholder="Add Other Condition..." 
                                        className="bg-transparent border-none text-xs text-white p-1.5 focus:outline-none w-48 placeholder-gray-600"
                                    />
                                    <button onClick={addOtherChronic} className="px-3 py-1 bg-neon-blue text-black font-black text-[10px] rounded-lg hover:bg-white transition-all uppercase tracking-tighter">Add</button>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {allChronicConditions.map(cond => (
                                    <div key={cond} className={`p-4 rounded-xl border transition-all ${clinicalData.chronicConditions?.[cond] ? 'bg-red-500/10 border-red-500/30 shadow-[0_0_15px_-5px_rgba(239,68,68,0.1)]' : 'bg-black/20 border-white/5 hover:border-white/10'}`}>
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="flex items-center gap-3 cursor-pointer group">
                                                <input type="checkbox" className="w-5 h-5 accent-red-500 cursor-pointer" checked={clinicalData.chronicConditions?.[cond] || false} onChange={e => updateChronicCondition(cond, e.target.checked)} />
                                                <span className={`text-sm font-bold group-hover:text-white transition-colors ${clinicalData.chronicConditions?.[cond] ? 'text-red-400' : 'text-gray-400'}`}>{cond}</span>
                                            </label>
                                            {!CHRONIC_CONDITIONS_LIST.includes(cond) && (
                                                <button onClick={() => updateChronicCondition(cond, false)} className="text-gray-600 hover:text-red-400 transition-colors p-1"><Trash2 size={14}/></button>
                                            )}
                                        </div>
                                        {clinicalData.chronicConditions?.[cond] && (
                                            <div className="pl-8 mt-4 space-y-3 animate-fade-in border-l border-red-500/20">
                                                <div>
                                                    <label className="text-[9px] text-gray-500 uppercase font-black tracking-widest block mb-1">Diagnosis Date</label>
                                                    <input type="date" className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:border-red-500 transition-all" 
                                                        value={clinicalData.chronicConditionDetails?.[cond]?.diagnosedDate || ''}
                                                        onChange={e => setClinicalData(prev => ({...prev, chronicConditionDetails: { ...prev.chronicConditionDetails, [cond]: { ...prev.chronicConditionDetails?.[cond], diagnosedDate: e.target.value, medications: prev.chronicConditionDetails?.[cond]?.medications || [] } as any} }))}
                                                    />
                                                </div>
                                                <div>
                                                    <div className="flex justify-between items-center mb-2">
                                                        <label className="text-[9px] text-gray-500 uppercase font-black tracking-widest">Active Medications</label>
                                                        <button onClick={() => addConditionMed(cond)} className="text-[9px] bg-red-500/20 text-red-400 px-2 py-1 rounded-md hover:bg-red-500 hover:text-white font-black transition-all flex items-center gap-1"><Plus size={10}/> ADD</button>
                                                    </div>
                                                    {clinicalData.chronicConditionDetails?.[cond]?.medications?.map((med, idx) => (
                                                        <div key={idx} className="grid grid-cols-2 gap-2 mb-2 group/med">
                                                            <input placeholder="Drug Name" className="bg-black/60 border border-white/10 rounded px-2 py-1.5 text-[11px] text-white focus:border-red-400 outline-none" value={med.name} onChange={e => updateConditionMed(cond, idx, 'name', e.target.value)} />
                                                            <input placeholder="Frequency" className="bg-black/60 border border-white/10 rounded px-2 py-1.5 text-[11px] text-white focus:border-red-400 outline-none" value={med.frequency} onChange={e => updateConditionMed(cond, idx, 'frequency', e.target.value)} />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
                            <div className="flex justify-between items-center mb-6">
                                <h4 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2"><AlertTriangle size={16} className="text-orange-400"/> Allergies & Reactions</h4>
                                <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-xl border border-white/5 shadow-inner">
                                    <Plus size={14} className="text-neon-blue ml-2"/>
                                    <input 
                                        type="text" 
                                        value={otherAllergyInput} 
                                        onChange={e => setOtherAllergyInput(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && addOtherAllergy()}
                                        placeholder="Add Other Allergy..." 
                                        className="bg-transparent border-none text-xs text-white p-1.5 focus:outline-none w-48 placeholder-gray-600"
                                    />
                                    <button onClick={addOtherAllergy} className="px-3 py-1 bg-neon-blue text-black font-black text-[10px] rounded-lg hover:bg-white transition-all uppercase tracking-tighter">Add</button>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {allAllergies.map(alg => (
                                    <div key={alg} className={`p-4 rounded-xl border transition-all ${clinicalData.allergies?.[alg] ? 'bg-orange-500/10 border-orange-500/30 shadow-[0_0_15px_-5px_rgba(249,115,22,0.1)]' : 'bg-black/20 border-white/5 hover:border-white/10'}`}>
                                        <div className="flex justify-between items-center">
                                            <label className="flex items-center gap-3 cursor-pointer group">
                                                <input type="checkbox" className="w-5 h-5 accent-orange-500 cursor-pointer" checked={clinicalData.allergies?.[alg] || false} onChange={e => updateAllergy(alg, e.target.checked)} />
                                                <span className={`text-sm font-bold group-hover:text-white transition-colors ${clinicalData.allergies?.[alg] ? 'text-orange-400' : 'text-gray-400'}`}>{alg}</span>
                                            </label>
                                            {!ALLERGIES_LIST.includes(alg) && (
                                                <button onClick={() => updateAllergy(alg, false)} className="text-gray-600 hover:text-orange-400 transition-colors p-1"><Trash2 size={14}/></button>
                                            )}
                                        </div>
                                        {clinicalData.allergies?.[alg] && (
                                            <div className="mt-3 animate-fade-in pl-8 border-l border-orange-500/20">
                                                <input placeholder="Describe reaction / severity..." className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-2 text-xs text-white focus:border-orange-500 outline-none" value={clinicalData.allergyComments?.[alg] || ''} onChange={e => setClinicalData(prev => ({...prev, allergyComments: { ...prev.allergyComments, [alg]: e.target.value }}))} />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2"><ClipboardList size={14}/> General Surgical & Medical History</h4>
                            <textarea className="w-full bg-black/40 border border-white/10 rounded-2xl p-6 text-white text-base outline-none focus:border-neon-blue focus:bg-black/60 transition-all resize-y min-h-[150px] custom-scrollbar shadow-inner" rows={6} value={clinicalData.pastHistory} onChange={e => setClinicalData({...clinicalData, pastHistory: e.target.value})} placeholder="Document any significant medical events, previous surgeries, or complications..." />
                        </div>
                    </div>
                )}

                {activeSheetTab === 'Labs History' && (
                    <div className="max-w-5xl mx-auto space-y-6 animate-slide-up">
                        <div className="bg-white/5 p-6 rounded-2xl border border-white/5 flex gap-4 items-end">
                            <div className="flex-1"><label className="text-[10px] text-gray-500 block mb-1 uppercase font-bold">Lab Name</label>
                            <SearchableInput 
                                value={newLab.name} 
                                onChange={(val) => setNewLab({...newLab, name: val})} 
                                suggestions={LAB_TESTS_LIST}
                                placeholder="Lab Name"
                                className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white text-sm focus:border-neon-blue outline-none"
                            />
                            </div>
                            <div className="flex-1"><label className="text-[10px] text-gray-500 block mb-1 uppercase font-bold">Value / Result</label><input className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white text-sm focus:border-neon-blue outline-none" value={newLab.value} onChange={e => setNewLab({...newLab, value: e.target.value})} /></div>
                            <div className="w-40"><label className="text-[10px] text-gray-500 block mb-1 uppercase font-bold">Date</label><input type="date" className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white text-sm focus:border-neon-blue outline-none" value={newLab.date} onChange={e => setNewLab({...newLab, date: e.target.value})} /></div>
                            <button onClick={addLabHistory} className="px-6 py-3 bg-neon-blue text-black font-bold rounded-lg uppercase text-xs hover:bg-cyan-400 transition-colors">Add</button>
                        </div>
                        <div className="bg-black/20 rounded-2xl border border-white/5 overflow-hidden">
                            <table className="w-full text-left text-sm text-gray-400">
                                <thead className="bg-white/5 text-gray-500 uppercase font-bold text-xs"><tr><th className="p-4">Date</th><th className="p-4">Lab Name</th><th className="p-4">Result</th><th className="p-4 text-right">Actions</th></tr></thead>
                                <tbody className="divide-y divide-white/5">
                                    {clinicalData.labHistory?.map((lab, i) => (
                                        <tr key={i} className="hover:bg-white/5 transition-colors">
                                            <td className="p-4 font-mono text-gray-500">{lab.date}</td>
                                            <td className="p-4 text-white font-bold">{lab.name}</td>
                                            <td className="p-4 text-neon-blue">{lab.value}</td>
                                            <td className="p-4 text-right flex justify-end gap-2">
                                                <button onClick={() => handleEditLab(i)} className="p-1.5 bg-blue-500/10 text-blue-400 rounded hover:bg-blue-500/20 transition-colors"><Edit2 size={14}/></button>
                                                <button onClick={() => handleDeleteLab(i)} className="p-1.5 bg-red-500/10 text-red-400 rounded hover:bg-red-500/20 transition-colors"><Trash2 size={14}/></button>
                                            </td>
                                        </tr>
                                    ))}
                                    {(!clinicalData.labHistory || clinicalData.labHistory.length === 0) && <tr><td colSpan={4} className="p-8 text-center italic">No lab history recorded.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeSheetTab === 'Scans History' && (
                    <div className="max-w-5xl mx-auto space-y-6 animate-slide-up">
                        <div className="bg-white/5 p-6 rounded-2xl border border-white/5 flex flex-col gap-4">
                            <div className="flex flex-wrap gap-4 items-end">
                                <div className="flex-1 min-w-[200px]"><label className="text-[10px] text-gray-500 block mb-1 uppercase font-bold">Scan Name</label><input className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white text-sm focus:border-neon-blue outline-none" value={newScan.name} onChange={e => setNewScan({...newScan, name: e.target.value})} /></div>
                                <div className="flex-[2] min-w-[200px]"><label className="text-[10px] text-gray-500 block mb-1 uppercase font-bold">Findings / Comment</label><input className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white text-sm focus:border-neon-blue outline-none" value={newScan.comment} onChange={e => setNewScan({...newScan, comment: e.target.value})} /></div>
                                <div className="w-40"><label className="text-[10px] text-gray-500 block mb-1 uppercase font-bold">Date</label><input type="date" className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white text-sm focus:border-neon-blue outline-none" value={newScan.date} onChange={e => setNewScan({...newScan, date: e.target.value})} /></div>
                                <div className="flex gap-2">
                                    <input type="file" multiple ref={fileInputRef} className="hidden" onChange={handleFileChange} />
                                    <button onClick={() => fileInputRef.current?.click()} className="p-3 bg-white/5 text-gray-400 rounded-lg hover:text-white hover:bg-white/10 transition-colors" title="Upload Files">
                                        <Upload size={18} />
                                    </button>
                                    <button onClick={addScanHistory} className="px-6 py-3 bg-neon-blue text-black font-bold rounded-lg uppercase text-xs hover:bg-cyan-400 transition-colors">Add</button>
                                </div>
                            </div>
                            
                            {scanFiles.length > 0 && (
                                <div className="w-full p-4 bg-black/20 border border-white/5 rounded-xl mt-2 animate-fade-in">
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2">Attached Files ({scanFiles.length})</p>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {scanPreviewUrls.map((url, index) => (
                                            <div key={index} className="relative group rounded-lg overflow-hidden border border-white/10 aspect-video bg-black">
                                                <img src={url} alt="Preview" className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity gap-2">
                                                    <button onClick={() => window.open(url, '_blank')} className="p-1.5 bg-white/10 rounded-lg hover:bg-white/30 text-white transition-colors"><Eye size={14}/></button>
                                                    <button onClick={() => removeFile(index)} className="p-1.5 bg-red-500/20 rounded-lg hover:bg-red-500/50 text-red-400 hover:text-white transition-colors"><Trash2 size={14}/></button>
                                                </div>
                                                <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-1 text-[9px] text-white truncate px-2">{scanFiles[index].name}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        <div className="bg-black/20 rounded-2xl border border-white/5 overflow-hidden">
                            <table className="w-full text-left text-sm text-gray-400">
                                <thead className="bg-white/5 text-gray-500 uppercase font-bold text-xs"><tr><th className="p-4">Date</th><th className="p-4">Scan Name</th><th className="p-4">Findings</th><th className="p-4 text-right">Actions</th></tr></thead>
                                <tbody className="divide-y divide-white/5">
                                    {clinicalData.scanHistory?.map((scan, i) => (
                                        <tr key={i} className="hover:bg-white/5 transition-colors">
                                            <td className="p-4 font-mono text-gray-500">{scan.date}</td>
                                            <td className="p-4 text-white font-bold">{scan.name}</td>
                                            <td className="p-4 text-gray-300">{scan.comment}</td>
                                            <td className="p-4 text-right flex justify-end gap-2">
                                                {scan.attachmentUrls && scan.attachmentUrls.length > 0 && (
                                                    <button onClick={() => openPreview(scan)} className="p-1.5 bg-green-500/10 text-green-400 rounded hover:bg-green-500/20 transition-colors flex items-center gap-1" title="View Scans">
                                                        <Eye size={14}/>
                                                        {scan.attachmentUrls.length > 1 && <span className="text-[9px] font-bold">{scan.attachmentUrls.length}</span>}
                                                    </button>
                                                )}
                                                <button onClick={() => handleEditScan(i)} className="p-1.5 bg-blue-500/10 text-blue-400 rounded hover:bg-blue-500/20 transition-colors"><Edit2 size={14}/></button>
                                                <button onClick={() => handleDeleteScan(i)} className="p-1.5 bg-red-500/10 text-red-400 rounded hover:bg-red-500/20 transition-colors"><Trash2 size={14}/></button>
                                            </td>
                                        </tr>
                                    ))}
                                    {(!clinicalData.scanHistory || clinicalData.scanHistory.length === 0) && <tr><td colSpan={4} className="p-8 text-center italic">No scan history recorded.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeSheetTab === 'Drug History' && (
                    <div className="max-w-5xl mx-auto space-y-6 animate-slide-up">
                        <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Add Medication History</h4>
                            <div className="flex flex-wrap gap-4 items-end">
                                <div className="flex-[2]">
                                    <SearchableInput 
                                        placeholder="Drug Name"
                                        className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white text-sm focus:border-neon-blue outline-none"
                                        value={newDrugHist.name}
                                        onChange={(val) => setNewDrugHist({...newDrugHist, name: val})}
                                        suggestions={DRUG_LIST}
                                    />
                                </div>
                                <div className="flex-1"><input placeholder="Frequency" className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white text-sm focus:border-neon-blue outline-none" value={newDrugHist.frequency} onChange={e => setNewDrugHist({...newDrugHist, frequency: e.target.value})} /></div>
                                <div className="flex-1"><input placeholder="Duration" className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white text-sm focus:border-neon-blue outline-none" value={newDrugHist.duration} onChange={e => setNewDrugHist({...newDrugHist, duration: e.target.value})} /></div>
                                <div className="w-40"><input type="date" className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white text-sm focus:border-neon-blue outline-none" value={newDrugHist.date} onChange={e => setNewDrugHist({...newDrugHist, date: e.target.value})} /></div>
                                <button onClick={addDrugHistory} className="px-6 py-3 bg-neon-blue text-black font-bold rounded-lg uppercase text-xs hover:bg-cyan-400 transition-colors">Add</button>
                            </div>
                        </div>
                        <div className="bg-black/20 rounded-2xl border border-white/5 overflow-hidden">
                            <table className="w-full text-left text-sm text-gray-400">
                                <thead className="bg-white/5 text-gray-500 uppercase font-bold text-xs"><tr><th className="p-4">Date</th><th className="p-4">Drug Name</th><th className="p-4">Frequency</th><th className="p-4">Duration</th><th className="p-4">Source</th><th className="p-4 text-right">Actions</th></tr></thead>
                                <tbody className="divide-y divide-white/5">
                                    {aggregatedDrugHistory.map((drug, i) => (
                                        <tr key={i} className="hover:bg-white/5">
                                            <td className="p-4 font-mono text-gray-500">{formatDate(drug.date)}</td>
                                            <td className="p-4 text-white font-bold">{drug.name}</td>
                                            <td className="p-4">{drug.frequency}</td>
                                            <td className="p-4">{drug.duration}</td>
                                            <td className="p-4"><span className={`text-[10px] px-2 py-1 rounded uppercase font-bold border ${drug.source === 'Chronic Condition' ? 'bg-red-900/20 text-red-300 border-red-500/20' : 'bg-blue-900/20 text-blue-300 border-blue-500/20'}`}>{drug.source || 'History'}</span></td>
                                            <td className="p-4 text-right">
                                                {drug.source === 'History' && (
                                                    <div className="flex justify-end gap-2">
                                                        <button onClick={() => handleEditDrug(drug.originalIndex as number)} className="p-1.5 bg-blue-500/10 text-blue-400 rounded hover:bg-blue-500/20 transition-colors"><Edit2 size={14}/></button>
                                                        <button onClick={() => handleDeleteDrug(drug.originalIndex as number)} className="p-1.5 bg-red-500/10 text-red-400 rounded hover:bg-red-500/20 transition-colors"><Trash2 size={14}/></button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {aggregatedDrugHistory.length === 0 && <tr><td colSpan={6} className="p-8 text-center italic">No drug history recorded.</td></tr>}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeSheetTab === 'Complaints' && (
                    <div className="max-w-5xl mx-auto space-y-6 animate-slide-up">
                        <div className="grid grid-cols-1 gap-6">
                            <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
                                <label className="text-xs font-bold text-neon-blue uppercase tracking-widest block mb-2">Complaints</label>
                                <textarea rows={4} className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white text-sm outline-none focus:border-neon-blue resize-y min-h-[100px]" value={clinicalData.complaints} onChange={e => setClinicalData({...clinicalData, complaints: e.target.value})} placeholder="Main complaint..." />
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
                                    <label className="text-xs font-bold text-neon-blue uppercase tracking-widest block mb-2">Symptoms</label>
                                    <textarea rows={6} className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white text-sm outline-none focus:border-neon-blue resize-y min-h-[150px]" value={clinicalData.symptoms} onChange={e => setClinicalData({...clinicalData,symptoms: e.target.value})} placeholder="Patient reports..." />
                                </div>
                                <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
                                    <label className="text-xs font-bold text-neon-blue uppercase tracking-widest block mb-2">Signs</label>
                                    <textarea rows={6} className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white text-sm outline-none focus:border-neon-blue resize-y min-h-[150px]" value={clinicalData.signs} onChange={e => setClinicalData({...clinicalData, signs: e.target.value})} placeholder="Doctor observes..." />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {previewScan && previewScan.attachmentUrls && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-fade-in">
                    <div className="absolute inset-0" onClick={() => setPreviewScan(null)}></div>
                    <div className="w-full max-w-5xl bg-black border border-white/10 rounded-2xl shadow-2xl relative flex flex-col overflow-hidden max-h-[90vh]">
                        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5 z-20">
                            <div>
                                <h3 className="text-lg font-bold text-white">{previewScan.name}</h3>
                                <p className="text-xs text-gray-400">{previewScan.date} • {previewScan.attachmentUrls.length} Files</p>
                            </div>
                            <button onClick={() => setPreviewScan(null)} className="p-2 hover:bg-white/10 rounded-full text-white transition-colors"><X size={24}/></button>
                        </div>
                        <div className="flex-1 relative bg-black flex items-center justify-center p-4 min-h-[400px]">
                            {previewScan.attachmentUrls.length > 1 && (
                                <>
                                    <button onClick={prevSlide} className="absolute left-4 z-10 p-3 bg-black/50 hover:bg-black/80 text-white rounded-full transition-all border border-white/20"><ChevronLeft size={32}/></button>
                                    <button onClick={nextSlide} className="absolute right-4 z-10 p-3 bg-black/50 hover:bg-black/80 text-white rounded-full transition-all border border-white/20"><ChevronRight size={32}/></button>
                                </>
                            )}
                            <img 
                                src={previewScan.attachmentUrls[currentSlideIndex]} 
                                alt={`Scan ${currentSlideIndex + 1}`} 
                                className="max-w-full max-h-full object-contain rounded-lg shadow-lg" 
                            />
                            <div className="absolute bottom-4 bg-black/60 px-4 py-2 rounded-full text-white text-sm font-bold border border-white/10 backdrop-blur-md">
                                {currentSlideIndex + 1} / {previewScan.attachmentUrls.length}
                            </div>
                        </div>
                        {previewScan.attachmentUrls.length > 1 && (
                            <div className="p-4 border-t border-white/10 bg-white/5 flex gap-2 overflow-x-auto custom-scrollbar z-20">
                                {previewScan.attachmentUrls.map((url, idx) => (
                                    <div 
                                        key={idx} 
                                        onClick={() => setCurrentSlideIndex(idx)}
                                        className={`w-20 h-14 rounded-lg overflow-hidden cursor-pointer border-2 transition-all shrink-0 ${currentSlideIndex === idx ? 'border-neon-blue opacity-100 scale-105' : 'border-transparent opacity-60 hover:opacity-100 hover:border-white/30'}`}
                                    >
                                        <img src={url} alt="thumb" className="w-full h-full object-cover" />
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="absolute top-20 right-6 z-30">
                             <a 
                                href={previewScan.attachmentUrls[currentSlideIndex]} 
                                download={`Scan_${previewScan.name}_${currentSlideIndex+1}`}
                                className="p-3 bg-black/60 hover:bg-neon-blue hover:text-black text-white rounded-full border border-white/20 hover:border-neon-blue transition-all flex items-center justify-center shadow-lg"
                                title="Download Current File"
                             >
                                 <Download size={20} />
                             </a>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmationModal
                isOpen={!!deleteConfirmation}
                onClose={() => setDeleteConfirmation(null)}
                onConfirm={confirmDelete}
                title="Confirm Deletion"
                message={`Are you sure you want to delete this ${deleteConfirmation?.type} record? This action cannot be undone.`}
                confirmText="Yes, Delete"
                isDanger={true}
            />
        </>
    );
};

export default PatientSheet;

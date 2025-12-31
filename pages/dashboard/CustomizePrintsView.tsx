import React, { useState, useRef, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import { 
  Save, Loader2, Layout, Eraser, RotateCcw, 
  Type, Move, Maximize2, Trash2, FileText, User, 
  Image as ImageIcon, Calendar, Hash, Plus, AlignLeft, AlignCenter, AlignRight,
  Download, Building, Phone, MapPin, Activity, Stethoscope
} from 'lucide-react';
import { PrintSettings, PrintElement, Appointment } from '../../types';
import { generatePDF } from '../../utils/exportHelper';

const CustomizePrintsView: React.FC = () => {
    const { printSettings, updatePrintSettings } = useData();
    const [activeTab, setActiveTab] = useState<'rx' | 'requests' | 'reports'>('rx');
    const [localSettings, setLocalSettings] = useState<PrintSettings>(printSettings);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success'>('idle');
    const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'designer' | 'clinic_data'>('designer');
    
    // Clinic Data Editing State
    const [tempPhone, setTempPhone] = useState('');
    const [tempAddress, setTempAddress] = useState('');

    // Drag & Resize State
    const paperRef = useRef<HTMLDivElement>(null);
    const [dragState, setDragState] = useState<{ 
        id: string, 
        type: 'move' | 'resize', 
        startX: number, 
        startY: number, 
        initialX: number, 
        initialY: number, 
        initialW: number, 
        initialH: number 
    } | null>(null);

    const hiddenUploadRef = useRef<HTMLInputElement>(null);
    const hiddenLogoInput = useRef<HTMLInputElement>(null);

    // Sync local state with context on load
    useEffect(() => {
        setLocalSettings(printSettings);
    }, [printSettings]);

    const currentConfig = localSettings[activeTab];
    const selectedElement = currentConfig.elements.find(el => el.id === selectedElementId);

    // --- ACTIONS ---

    const addElement = (type: 'text' | 'image' | 'data_block', content?: string) => {
        const newEl: PrintElement = {
            id: `el_${Date.now()}`,
            type,
            x: 10,
            y: 10,
            w: type === 'data_block' ? 80 : 30,
            h: type === 'data_block' ? 60 : 5,
            content: content || 'New Text',
            fontSize: 12,
            fontWeight: 'normal',
            align: 'left',
            zIndex: 10,
            dataLayout: 1, // Default layout
            showSectionHeader: true
        };
        updateElements([...currentConfig.elements, newEl]);
        setSelectedElementId(newEl.id);
    };

    const updateElements = (newElements: PrintElement[]) => {
        setLocalSettings(prev => ({
            ...prev,
            [activeTab]: { ...prev[activeTab], elements: newElements }
        }));
    };

    const updateSelectedElement = (updates: Partial<PrintElement>) => {
        if (!selectedElementId) return;
        const updated = currentConfig.elements.map(el => el.id === selectedElementId ? { ...el, ...updates } : el);
        updateElements(updated);
    };

    const deleteSelectedElement = () => {
        if (!selectedElementId) return;
        const updated = currentConfig.elements.filter(el => el.id !== selectedElementId);
        updateElements(updated);
        setSelectedElementId(null);
    };

    const handleBackgroundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setLocalSettings(prev => ({
                    ...prev,
                    [activeTab]: { ...prev[activeTab], backgroundUrl: reader.result as string }
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const newEl: PrintElement = {
                    id: `img_${Date.now()}`,
                    type: 'image',
                    x: 5, y: 5, w: 20, h: 15,
                    content: reader.result as string,
                    zIndex: 5
                };
                updateElements([...currentConfig.elements, newEl]);
                setSelectedElementId(newEl.id);
            };
            reader.readAsDataURL(file);
        }
    };

    const loadGenericDesign = () => {
        if(window.confirm("Load Generic Standard Design? This will replace current elements.")) {
            // Standard Generic Layout (Hardcoded from turn 1)
            const genericElements: PrintElement[] = [
                // Header
                { id: 'clinic_name', type: 'text', x: 0, y: 3, w: 100, h: 5, content: '{{CLINIC_NAME}}', fontSize: 22, fontWeight: 'bold', align: 'center', zIndex: 10 },
                { id: 'dr_name', type: 'text', x: 0, y: 8, w: 100, h: 4, content: '{{DOCTOR_NAME}}', fontSize: 14, fontWeight: 'bold', align: 'center', zIndex: 10 },
                { id: 'specialty', type: 'text', x: 0, y: 12, w: 100, h: 4, content: '{{SPECIALTY}}', fontSize: 10, align: 'center', zIndex: 10 },
                
                // Patient Info Bar (Top of Data)
                { id: 'patient_label', type: 'text', x: 5, y: 18, w: 15, h: 4, content: 'Patient Name:', fontSize: 11, fontWeight: 'bold', align: 'left', zIndex: 10 },
                { id: 'patient_val', type: 'text', x: 20, y: 18, w: 40, h: 4, content: '{{PATIENT_NAME}}', fontSize: 11, align: 'left', zIndex: 10 },
                { id: 'date_label', type: 'text', x: 65, y: 18, w: 10, h: 4, content: 'Date:', fontSize: 11, fontWeight: 'bold', align: 'right', zIndex: 10 },
                { id: 'date_val', type: 'text', x: 76, y: 18, w: 20, h: 4, content: '{{DATE}}', fontSize: 11, align: 'left', zIndex: 10 },
                
                // Separator Line
                { id: 'sep_line', type: 'text', x: 5, y: 21, w: 90, h: 2, content: '__________________________________________________________________________________________', fontSize: 10, align: 'center', zIndex: 5 },

                // Data Block
                { id: 'data_block', type: 'data_block', x: 5, y: 25, w: 90, h: 60, content: ':: DATA SPACE ::', fontSize: 12, align: 'left', zIndex: 1, dataLayout: 1 },
                
                // Footer
                { id: 'footer_line', type: 'text', x: 5, y: 88, w: 90, h: 2, content: '__________________________________________________________________________________________', fontSize: 10, align: 'center', zIndex: 5 },
                { id: 'footer_address', type: 'text', x: 5, y: 91, w: 90, h: 4, content: '{{ADDRESSES}}', fontSize: 9, align: 'center', zIndex: 10 },
                { id: 'footer_phones', type: 'text', x: 5, y: 94, w: 90, h: 4, content: '{{PHONES}}', fontSize: 9, fontWeight: 'bold', align: 'center', zIndex: 10 }
            ];

            setLocalSettings(prev => ({
                ...prev,
                [activeTab]: {
                    ...prev[activeTab],
                    backgroundUrl: undefined,
                    elements: genericElements
                }
            }));
            setSelectedElementId(null);
        }
    };

    const clearCanvas = () => {
        if(window.confirm("Are you sure you want to delete all elements?")) {
            setLocalSettings(prev => ({
                ...prev,
                [activeTab]: {
                    ...prev[activeTab],
                    backgroundUrl: undefined,
                    elements: []
                }
            }));
            setSelectedElementId(null);
        }
    };

    const saveChanges = async () => {
        setSaveStatus('saving');
        await updatePrintSettings(localSettings);
        setSaveStatus('success');
        setTimeout(() => setSaveStatus('idle'), 2000);
    };

    const downloadSample = async () => {
        const dummyPatient: Partial<Appointment> = {
            name: "John Doe Sample",
            date: new Date().toLocaleDateString(),
            age: "35",
            prescription: [
                { drug: 'Amoxicillin 500mg', frequency: '1 tab / 8h', duration: '5 days' },
                { drug: 'Paracetamol 500mg', frequency: '1 tab / 6h', duration: '3 days' }
            ],
            investigationItems: [{ id: '1', name: 'CBC' }, { id: '2', name: 'Liver Function Test' }],
            scans: [{ id: '3', name: 'Chest X-Ray' }],
            weight: '75', height: '175', vitals: { bp: '120/80', hr: '72', temp: '36.5' }
        };
        await generatePDF(dummyPatient, currentConfig, localSettings, `Sample_${activeTab}`, activeTab);
    };

    // --- Clinic Data Management ---
    const addPhone = () => { if(tempPhone) { setLocalSettings(prev => ({...prev, phones: [...prev.phones, tempPhone]})); setTempPhone(''); }};
    const removePhone = (idx: number) => { setLocalSettings(prev => ({...prev, phones: prev.phones.filter((_,i) => i !== idx)})); };
    const addAddress = () => { if(tempAddress) { setLocalSettings(prev => ({...prev, addresses: [...prev.addresses, tempAddress]})); setTempAddress(''); }};
    const removeAddress = (idx: number) => { setLocalSettings(prev => ({...prev, addresses: prev.addresses.filter((_,i) => i !== idx)})); };

    // --- DRAG LOGIC ---

    const handleMouseDown = (e: React.MouseEvent, id: string, type: 'move' | 'resize') => {
        e.preventDefault(); 
        e.stopPropagation(); 
        
        const el = currentConfig.elements.find(el => el.id === id);
        if (!el) return;
        
        setSelectedElementId(id);
        setDragState({
            id, type, startX: e.clientX, startY: e.clientY,
            initialX: el.x, initialY: el.y, initialW: el.w, initialH: el.h
        });
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!dragState || !paperRef.current) return;
            e.preventDefault();

            const paperRect = paperRef.current.getBoundingClientRect();
            const deltaXPct = ((e.clientX - dragState.startX) / paperRect.width) * 100;
            const deltaYPct = ((e.clientY - dragState.startY) / paperRect.height) * 100;

            if (dragState.type === 'move') {
                const newX = Math.max(0, Math.min(100 - dragState.initialW, dragState.initialX + deltaXPct));
                const newY = Math.max(0, Math.min(100 - dragState.initialH, dragState.initialY + deltaYPct));
                
                setLocalSettings(prev => ({
                    ...prev,
                    [activeTab]: {
                        ...prev[activeTab],
                        elements: prev[activeTab].elements.map(el => el.id === dragState.id ? { ...el, x: newX, y: newY } : el)
                    }
                }));
            } else {
                const newW = Math.max(5, dragState.initialW + deltaXPct);
                const newH = Math.max(2, dragState.initialH + deltaYPct);
                
                setLocalSettings(prev => ({
                    ...prev,
                    [activeTab]: {
                        ...prev[activeTab],
                        elements: prev[activeTab].elements.map(el => el.id === dragState.id ? { ...el, w: newW, h: newH } : el)
                    }
                }));
            }
        };

        const handleMouseUp = () => setDragState(null);

        if (dragState) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [dragState, activeTab]);

    // --- RENDER HELPERS ---

    const getPaperDims = () => {
        return currentConfig.paperSize === 'A4' ? { w: 595, h: 842 } : { w: 420, h: 595 }; 
    };
    const dims = getPaperDims();

    const resolvePlaceholder = (text: string) => {
        if (!text) return '';
        const today = new Date().toLocaleDateString();
        return text
            .replace('{{CLINIC_NAME}}', localSettings.clinicName || 'Clinic Name')
            .replace('{{DOCTOR_NAME}}', localSettings.doctorName || 'Dr. Name')
            .replace('{{SPECIALTY}}', localSettings.specialty || 'Specialty')
            .replace('{{DATE}}', today)
            .replace('{{PATIENT_NAME}}', 'John Doe')
            .replace('{{AGE}}', '30Y')
            .replace('{{PHONES}}', localSettings.phones.length ? localSettings.phones.join(' | ') : '0123456789')
            .replace('{{ADDRESSES}}', localSettings.addresses.length ? localSettings.addresses.join(' - ') : '123 Medical St, City')
            // Vitals placeholders
            .replace('{{WEIGHT}}', '75kg')
            .replace('{{HEIGHT}}', '175cm')
            .replace('{{BP}}', '120/80')
            .replace('{{HR}}', '72')
            .replace('{{TEMP}}', '36.5')
            .replace('{{O2}}', '98%');
    };

    const renderDataBlockPreview = (el: PrintElement) => {
        const fontSize = el.fontSize || 12;
        const showHeader = el.showSectionHeader !== false;
        
        if (activeTab === 'rx') {
            const layout = el.dataLayout || 1;
            return (
                <div style={{ width: '100%', height: '100%' }}>
                    {showHeader && <div style={{ fontWeight: '900', fontSize: `${fontSize * 1.5}px`, marginBottom: '10px', fontStyle: 'italic', color: 'black' }}>Rx</div>}
                    
                    {/* All Layouts use Drug | Freq | Duration */}
                    {layout === 1 && (
                        <table className="w-full border-collapse" style={{ fontFamily: 'sans-serif' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#f0f0f0' }}>
                                    <th style={{ border: '1px solid black', padding: '4px', textAlign: 'center', verticalAlign: 'middle', fontSize: `${fontSize}px`, color: 'black', width: '50%' }}>Drug Name</th>
                                    <th style={{ border: '1px solid black', padding: '4px', textAlign: 'center', verticalAlign: 'middle', fontSize: `${fontSize}px`, color: 'black', width: '25%' }}>Frequency</th>
                                    <th style={{ border: '1px solid black', padding: '4px', textAlign: 'center', verticalAlign: 'middle', fontSize: `${fontSize}px`, color: 'black', width: '25%' }}>Duration</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[1,2,3].map(i => (
                                    <tr key={i}>
                                        <td style={{ border: '1px solid black', padding: '4px', textAlign: 'center', verticalAlign: 'middle', fontWeight: 'bold', fontSize: `${fontSize}px`, color: 'black' }}>Drug Name {i} (500mg)</td>
                                        <td style={{ border: '1px solid black', padding: '4px', textAlign: 'center', verticalAlign: 'middle', fontSize: `${fontSize}px`, color: 'black' }}>1 tab / 8h</td>
                                        <td style={{ border: '1px solid black', padding: '4px', textAlign: 'center', verticalAlign: 'middle', fontSize: `${fontSize}px`, color: 'black' }}>5 Days</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}

                    {layout === 2 && (
                        <table className="w-full border-collapse" style={{ fontFamily: 'sans-serif' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid black' }}>
                                    <th style={{ padding: '4px', textAlign: 'center', verticalAlign: 'middle', fontSize: `${fontSize}px`, color: 'black', width: '50%' }}>Drug Name</th>
                                    <th style={{ padding: '4px', textAlign: 'center', verticalAlign: 'middle', fontSize: `${fontSize}px`, color: 'black', width: '25%' }}>Frequency</th>
                                    <th style={{ padding: '4px', textAlign: 'center', verticalAlign: 'middle', fontSize: `${fontSize}px`, color: 'black', width: '25%' }}>Duration</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[1,2,3].map(i => (
                                    <tr key={i} style={{ borderBottom: '1px solid #ccc' }}>
                                        <td style={{ padding: '6px 4px', textAlign: 'center', verticalAlign: 'middle', fontWeight: 'bold', fontSize: `${fontSize}px`, color: 'black' }}>Drug Name {i} (500mg)</td>
                                        <td style={{ padding: '6px 4px', textAlign: 'center', verticalAlign: 'middle', fontSize: `${fontSize}px`, color: 'black' }}>1 tab / 8h</td>
                                        <td style={{ padding: '6px 4px', textAlign: 'center', verticalAlign: 'middle', fontSize: `${fontSize}px`, color: 'black' }}>5 Days</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}

                    {layout === 3 && (
                        <table className="w-full border-collapse" style={{ fontFamily: 'sans-serif' }}>
                            <thead>
                                <tr style={{ backgroundColor: 'black', color: 'white' }}>
                                    <th style={{ padding: '4px 8px', textAlign: 'center', verticalAlign: 'middle', fontSize: `${fontSize}px`, width: '50%' }}>DRUG</th>
                                    <th style={{ padding: '4px 8px', textAlign: 'center', verticalAlign: 'middle', fontSize: `${fontSize}px`, width: '25%' }}>FREQ</th>
                                    <th style={{ padding: '4px 8px', textAlign: 'center', verticalAlign: 'middle', fontSize: `${fontSize}px`, width: '25%' }}>DUR</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[1,2,3].map(i => (
                                    <tr key={i} style={{ backgroundColor: i % 2 === 0 ? 'white' : '#f5f5f5' }}>
                                        <td style={{ padding: '6px 8px', textAlign: 'center', verticalAlign: 'middle', fontWeight: '900', fontSize: `${fontSize}px`, color: 'black' }}>Drug Name {i} (500mg)</td>
                                        <td style={{ padding: '6px 8px', textAlign: 'center', verticalAlign: 'middle', fontSize: `${fontSize}px`, color: 'black' }}>1 tab / 8h</td>
                                        <td style={{ padding: '6px 8px', textAlign: 'center', verticalAlign: 'middle', fontSize: `${fontSize}px`, color: 'black' }}>5 Days</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            );
        } else if (activeTab === 'requests') {
            return (
                <div style={{ fontSize: `${fontSize}px`, width: '100%', height: '100%', color: 'black' }}>
                    {showHeader && <div style={{ fontWeight: 'bold', textDecoration: 'underline', marginBottom: '10px', fontSize: `${fontSize * 1.2}px` }}>Requested Investigations</div>}
                    <ul style={{ listStyleType: 'disc', paddingLeft: '20px', fontWeight: 'bold' }}>
                        <li>CBC (Complete Blood Count)</li>
                        <li>Lipid Profile</li>
                        <li>Liver Function Tests (ALT, AST)</li>
                        <li>Chest X-Ray (PA View)</li>
                    </ul>
                </div>
            );
        } else {
            return (
                <div style={{ fontSize: `${fontSize}px`, width: '100%', height: '100%', color: 'black' }}>
                    {showHeader && <div style={{ fontWeight: '900', textAlign: 'center', fontSize: `${fontSize * 1.4}px`, marginBottom: '20px' }}>MEDICAL REPORT</div>}
                    <p style={{ lineHeight: '1.6', textAlign: 'justify' }}>
                        This is to certify that Mr. John Doe (30Y) was examined on {new Date().toLocaleDateString()}.
                        <br/><br/>
                        <strong>Diagnosis:</strong> Acute Bronchitis.
                        <br/><br/>
                        <strong>Recommendation:</strong> The patient requires rest for 3 days and has been prescribed necessary medication.
                    </p>
                </div>
            );
        }
    };

    return (
        <div className="h-[calc(100vh-100px)] flex gap-6 overflow-hidden animate-fade-in font-sans" dir="ltr">
            
            {/* CONTROLS SIDEBAR */}
            <div className="w-96 flex flex-col bg-[#0f0f11] border border-white/10 rounded-2xl shadow-2xl overflow-hidden shrink-0">
                <div className="p-5 border-b border-white/10 bg-white/5 flex gap-4">
                    <button onClick={() => setViewMode('designer')} className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase transition-all ${viewMode === 'designer' ? 'bg-neon-blue text-black' : 'text-gray-400 hover:text-white'}`}>Layout</button>
                    <button onClick={() => setViewMode('clinic_data')} className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase transition-all ${viewMode === 'clinic_data' ? 'bg-neon-blue text-black' : 'text-gray-400 hover:text-white'}`}>Clinic Data</button>
                </div>

                <div className="p-5 space-y-6 overflow-y-auto custom-scrollbar flex-1">
                    {viewMode === 'designer' && (
                        <>
                            {/* Tabs */}
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Document Type</label>
                                <div className="flex bg-black p-1 rounded-xl border border-white/10">
                                    {[
                                        { id: 'rx', label: 'Rx (A5)' },
                                        { id: 'requests', label: 'Req (A5)' },
                                        { id: 'reports', label: 'Rep (A4)' }
                                    ].map(t => (
                                        <button
                                            key={t.id}
                                            onClick={() => { setActiveTab(t.id as any); setSelectedElementId(null); }}
                                            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === t.id ? 'bg-neon-blue text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
                                        >
                                            {t.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Insert Elements */}
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Insert Elements</label>
                                <div className="grid grid-cols-3 gap-2 mb-2">
                                    <button onClick={() => addElement('text', '{{CLINIC_NAME}}')} className="flex flex-col items-center justify-center p-2 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg text-[10px] text-blue-400 border border-blue-500/20 transition-colors h-16"><Building size={16} className="mb-1"/> Clinic Name</button>
                                    <button onClick={() => addElement('text', '{{DOCTOR_NAME}}')} className="flex flex-col items-center justify-center p-2 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg text-[10px] text-blue-400 border border-blue-500/20 transition-colors h-16"><User size={16} className="mb-1"/> Dr Name</button>
                                    <button onClick={() => addElement('text', '{{PHONES}}')} className="flex flex-col items-center justify-center p-2 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg text-[10px] text-blue-400 border border-blue-500/20 transition-colors h-16"><Phone size={16} className="mb-1"/> Phones</button>
                                    <button onClick={() => addElement('text', '{{ADDRESSES}}')} className="flex flex-col items-center justify-center p-2 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg text-[10px] text-blue-400 border border-blue-500/20 transition-colors h-16"><MapPin size={16} className="mb-1"/> Address</button>
                                    <button onClick={() => addElement('text', '{{DATE}}')} className="flex flex-col items-center justify-center p-2 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg text-[10px] text-blue-400 border border-blue-500/20 transition-colors h-16"><Calendar size={16} className="mb-1"/> Date</button>
                                    <button onClick={() => addElement('text', '{{PATIENT_NAME}}')} className="flex flex-col items-center justify-center p-2 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg text-[10px] text-blue-400 border border-blue-500/20 transition-colors h-16"><User size={16} className="mb-1"/> Patient</button>
                                </div>
                                <div className="grid grid-cols-2 gap-2 mb-2">
                                    <button onClick={() => addElement('text')} className="flex items-center gap-2 p-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-white border border-white/5 transition-colors"><Type size={14} /> Text Box</button>
                                    <button onClick={() => hiddenLogoInput.current?.click()} className="flex items-center gap-2 p-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-white border border-white/5 transition-colors"><ImageIcon size={14} /> Logo</button>
                                    <button onClick={() => addElement('data_block', ':: DATA SPACE ::')} className="col-span-2 flex items-center justify-center gap-2 p-2 bg-purple-500/10 hover:bg-purple-500/20 rounded-lg text-xs text-purple-400 border border-purple-500/20 transition-colors"><FileText size={14} /> Insert Data Block</button>
                                    <input type="file" ref={hiddenLogoInput} className="hidden" accept="image/*" onChange={handleLogoUpload} />
                                </div>
                                
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 block mt-4">Patient Vitals</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['Weight', 'Height', 'BP', 'HR', 'Temp', 'O2'].map(v => (
                                        <button key={v} onClick={() => addElement('text', `{{${v.toUpperCase()}}}`)} className="p-2 bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-bold rounded hover:bg-green-500/20">{v}</button>
                                    ))}
                                </div>
                            </div>

                            {/* Background */}
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Paper Background</label>
                                <div className="flex gap-2">
                                    <button onClick={() => hiddenUploadRef.current?.click()} className="flex-1 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white hover:bg-white/10 flex items-center justify-center gap-2"><Layout size={14}/> Upload</button>
                                    <button onClick={() => setLocalSettings(prev => ({...prev, [activeTab]: { ...prev[activeTab], backgroundUrl: undefined }}))} className="px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 hover:bg-red-500/20"><Eraser size={14}/></button>
                                    <input type="file" className="hidden" ref={hiddenUploadRef} accept="image/*" onChange={handleBackgroundUpload} />
                                </div>
                            </div>

                            {/* Selected Element Properties */}
                            {selectedElement && (
                                <div className="p-4 bg-white/5 border border-white/10 rounded-xl animate-slide-up">
                                    <div className="flex justify-between items-center mb-3">
                                        <span className="text-xs font-bold text-neon-blue uppercase">Edit Element</span>
                                        <button onClick={deleteSelectedElement} className="text-red-400 hover:bg-red-500/20 p-1.5 rounded transition-colors"><Trash2 size={14}/></button>
                                    </div>
                                    
                                    {selectedElement.type === 'text' && (
                                        <div className="space-y-3">
                                            <textarea 
                                                rows={3}
                                                value={selectedElement.content} 
                                                onChange={e => updateSelectedElement({ content: e.target.value })} 
                                                className="w-full bg-black/40 border border-white/10 rounded p-2 text-xs text-white outline-none focus:border-neon-blue resize-none" 
                                                placeholder="Text Content" 
                                            />
                                            <div className="flex gap-2">
                                                <input type="number" value={selectedElement.fontSize} onChange={e => updateSelectedElement({ fontSize: Number(e.target.value) })} className="w-16 bg-black/40 border border-white/10 rounded p-2 text-xs text-white outline-none focus:border-neon-blue" placeholder="Size" />
                                                <div className="flex bg-black/40 rounded border border-white/10 flex-1">
                                                    {['left', 'center', 'right'].map((align: any) => (
                                                        <button key={align} onClick={() => updateSelectedElement({ align })} className={`flex-1 flex justify-center items-center ${selectedElement.align === align ? 'bg-white/20 text-white' : 'text-gray-500'}`}>
                                                            {align === 'left' ? <AlignLeft size={12}/> : align === 'center' ? <AlignCenter size={12}/> : <AlignRight size={12}/>}
                                                        </button>
                                                    ))}
                                                </div>
                                                <button onClick={() => updateSelectedElement({ fontWeight: selectedElement.fontWeight === 'bold' ? 'normal' : 'bold' })} className={`px-3 border border-white/10 rounded ${selectedElement.fontWeight === 'bold' ? 'bg-white/20 text-white' : 'bg-black/40 text-gray-500'}`}>B</button>
                                            </div>
                                        </div>
                                    )}
                                    {selectedElement.type === 'data_block' && (
                                        <div className="space-y-3">
                                            <div className="flex flex-col gap-1">
                                                <label className="text-[10px] font-bold text-gray-500">Font Size</label>
                                                <input type="number" value={selectedElement.fontSize} onChange={e => updateSelectedElement({ fontSize: Number(e.target.value) })} className="w-full bg-black/40 border border-white/10 rounded p-2 text-xs text-white outline-none focus:border-neon-blue" />
                                            </div>
                                            {activeTab === 'rx' && (
                                                <>
                                                    <div className="flex flex-col gap-1">
                                                        <label className="text-[10px] font-bold text-gray-500">Layout Style</label>
                                                        <div className="flex gap-2 bg-black/40 p-1 rounded border border-white/10">
                                                            {[1,2,3].map(layout => (
                                                                <button key={layout} onClick={() => updateSelectedElement({ dataLayout: layout })} className={`flex-1 py-1 text-xs font-bold rounded ${selectedElement.dataLayout === layout ? 'bg-neon-blue text-black' : 'text-gray-400 hover:text-white'}`}>{layout}</button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <input type="checkbox" id="headerToggle" checked={selectedElement.showSectionHeader !== false} onChange={e => updateSelectedElement({ showSectionHeader: e.target.checked })} className="w-4 h-4 accent-neon-blue cursor-pointer" />
                                                        <label htmlFor="headerToggle" className="text-xs text-gray-300 cursor-pointer">Show "Rx" Header</label>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}

                    {viewMode === 'clinic_data' && (
                        <div className="space-y-6 animate-slide-up">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Clinic Name</label>
                                <input type="text" value={localSettings.clinicName} onChange={e => setLocalSettings(prev => ({...prev, clinicName: e.target.value}))} className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm text-white focus:border-neon-blue outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Doctor Name</label>
                                <input type="text" value={localSettings.doctorName} onChange={e => setLocalSettings(prev => ({...prev, doctorName: e.target.value}))} className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm text-white focus:border-neon-blue outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Specialty</label>
                                <input type="text" value={localSettings.specialty} onChange={e => setLocalSettings(prev => ({...prev, specialty: e.target.value}))} className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-sm text-white focus:border-neon-blue outline-none" />
                            </div>
                            
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Phone Numbers</label>
                                <div className="space-y-2">
                                    {localSettings.phones.map((p, i) => (
                                        <div key={i} className="flex gap-2">
                                            <input type="text" value={p} onChange={e => { const newPhones = [...localSettings.phones]; newPhones[i] = e.target.value; setLocalSettings(prev => ({...prev, phones: newPhones})); }} className="flex-1 bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white focus:border-neon-blue outline-none" />
                                            <button onClick={() => removePhone(i)} className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20"><Trash2 size={14}/></button>
                                        </div>
                                    ))}
                                    <div className="flex gap-2">
                                        <input type="text" value={tempPhone} onChange={e => setTempPhone(e.target.value)} placeholder="Add Phone..." className="flex-1 bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white focus:border-neon-blue outline-none" />
                                        <button onClick={addPhone} className="p-2 bg-neon-blue/10 text-neon-blue rounded-lg hover:bg-neon-blue/20"><Plus size={14}/></button>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Addresses</label>
                                <div className="space-y-2">
                                    {localSettings.addresses.map((a, i) => (
                                        <div key={i} className="flex gap-2">
                                            <input type="text" value={a} onChange={e => { const newAddrs = [...localSettings.addresses]; newAddrs[i] = e.target.value; setLocalSettings(prev => ({...prev, addresses: newAddrs})); }} className="flex-1 bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white focus:border-neon-blue outline-none" />
                                            <button onClick={() => removeAddress(i)} className="p-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20"><Trash2 size={14}/></button>
                                        </div>
                                    ))}
                                    <div className="flex gap-2">
                                        <input type="text" value={tempAddress} onChange={e => setTempAddress(e.target.value)} placeholder="Add Address..." className="flex-1 bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white focus:border-neon-blue outline-none" />
                                        <button onClick={addAddress} className="p-2 bg-neon-blue/10 text-neon-blue rounded-lg hover:bg-neon-blue/20"><Plus size={14}/></button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="pt-4 border-t border-white/10 space-y-3">
                        {viewMode === 'designer' && (
                            <>
                                <button onClick={downloadSample} className="w-full py-3 bg-green-500/10 text-green-400 border border-green-500/20 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-green-500/20 flex items-center justify-center gap-2">
                                    <Download size={16} /> Download Sample PDF
                                </button>
                                <div className="flex gap-2">
                                    <button onClick={loadGenericDesign} className="flex-1 py-3 bg-white/5 text-gray-400 border border-white/10 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-white/10 flex items-center justify-center gap-2">
                                        <RotateCcw size={16} /> Load Generic
                                    </button>
                                    <button onClick={clearCanvas} className="flex-1 py-3 bg-white/5 text-red-400 border border-white/10 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-red-500/10 flex items-center justify-center gap-2">
                                        <Eraser size={16} /> Clear
                                    </button>
                                </div>
                            </>
                        )}
                        <button onClick={saveChanges} className="w-full py-4 bg-neon-blue text-black rounded-xl text-sm font-black uppercase tracking-widest hover:bg-white transition-colors flex items-center justify-center gap-2 shadow-lg hover:shadow-neon-blue/20">
                            {saveStatus === 'saving' ? <Loader2 className="animate-spin" /> : <Save size={18} />} {saveStatus === 'saving' ? 'Saving...' : 'Save Configuration'}
                        </button>
                    </div>
                </div>
            </div>

            {/* LIVE PREVIEW CANVAS */}
            <div 
                className="flex-1 bg-[#050505] relative flex items-center justify-center overflow-auto p-10 rounded-2xl border border-white/5 shadow-inner" 
                onMouseDown={(e) => {
                    if (e.target === e.currentTarget || e.target === paperRef.current) {
                        setSelectedElementId(null);
                    }
                }}
            >
                <div 
                    ref={paperRef}
                    className="bg-white shadow-[0_0_100px_rgba(0,0,0,0.5)] relative transition-all duration-300 ease-out origin-center"
                    style={{
                        width: `${dims.w}px`,
                        height: `${dims.h}px`,
                        backgroundImage: currentConfig.backgroundUrl ? `url(${currentConfig.backgroundUrl})` : 'none',
                        backgroundSize: '100% 100%',
                        transform: 'scale(0.85)', 
                    }}
                >
                    {currentConfig.elements.map(el => (
                        <div
                            key={el.id}
                            className={`absolute group cursor-move hover:outline hover:outline-1 hover:outline-blue-400 ${selectedElementId === el.id ? 'outline outline-2 outline-neon-blue z-50' : `z-${el.zIndex || 10}`}`}
                            style={{
                                left: `${el.x}%`,
                                top: `${el.y}%`,
                                width: `${el.w}%`,
                                height: `${el.h}%`,
                                color: '#000000',
                                zIndex: el.zIndex || 10
                            }}
                            onMouseDown={(e) => handleMouseDown(e, el.id, 'move')}
                        >
                            {el.type === 'text' && (
                                <div style={{ 
                                    fontSize: `${el.fontSize}px`, 
                                    fontWeight: el.fontWeight, 
                                    textAlign: el.align, 
                                    width: '100%', height: '100%', 
                                    overflow: 'hidden', whiteSpace: 'pre-wrap', lineHeight: '1.2' 
                                }}>
                                    {resolvePlaceholder(el.content || '')}
                                </div>
                            )}
                            
                            {el.type === 'image' && (
                                <img src={el.content} alt="img" className="w-full h-full object-contain pointer-events-none" />
                            )}

                            {el.type === 'data_block' && (
                                <div className="w-full h-full border-2 border-dashed border-gray-300 bg-gray-50/50 flex flex-col p-2 overflow-hidden text-left relative">
                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block text-center mb-1 absolute top-0 left-0 right-0 bg-white/80">Print Area (Example)</span>
                                    <div className="mt-4 h-full">
                                        {renderDataBlockPreview(el)}
                                    </div>
                                </div>
                            )}

                            {selectedElementId === el.id && (
                                <div 
                                    className="absolute bottom-0 right-0 w-4 h-4 bg-neon-blue cursor-se-resize z-50 rounded-tl shadow-md"
                                    onMouseDown={(e) => handleMouseDown(e, el.id, 'resize')}
                                ></div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CustomizePrintsView;
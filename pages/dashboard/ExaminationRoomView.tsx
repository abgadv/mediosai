
import React, { useState, useMemo, useContext, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import TiltCard from '../../components/TiltCard';
import { DashboardUIContext } from '../../contexts/DashboardUIContext';
import { Appointment, PrescriptionItem, InvestigationItem, ChronicConditionDetail } from '../../types';
import { 
  Stethoscope, Power, Users, ClipboardList, CheckCircle, 
  XCircle, Save, Loader2, Ban, Printer, Eye,
  Pill, TestTube, FileSpreadsheet, Images, LayoutDashboard
} from 'lucide-react';
import { generatePatientReportPDF } from '../../utils/exportHelper';

// Sub-views
import PatientOverview from '../../components/examination/PatientOverview';
import LabsOverview from '../../components/examination/LabsOverview';
import ScansOverview from '../../components/examination/ScansOverview';
import RequestsView from '../../components/examination/RequestsView';
import PatientSheet from '../../components/examination/PatientSheet';

const ExaminationRoomView: React.FC = () => {
    const { firebaseUser } = useAuth();
    const { 
        appointments, doctorStatus, setDoctorStatus, callingPatientId, setCallingPatientId, 
        updateAppointmentStatus, updateAppointment, isBookingPaused, toggleBookingPause,
        printSettings, hasAssistantDoctor
    } = useData();
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const { setHeaderHidden } = useContext(DashboardUIContext);
    
    // UI State
    const [activeMainTab, setActiveMainTab] = useState('SHEET');
    const [activeSheetTab, setActiveSheetTab] = useState('Personal Data');
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success'>('idle');

    // Clinical Data State (Main Source of Truth)
    const [clinicalData, setClinicalData] = useState<Partial<Appointment>>({});
    
    // Preview State for Assistant's Work
    const [previewPatient, setPreviewPatient] = useState<Appointment | null>(null);
    const [previewClinicalData, setPreviewClinicalData] = useState<Partial<Appointment>>({});
    const [previewSheetTab, setPreviewSheetTab] = useState('Personal Data');
    
    // Requests State
    const [reqPrescription, setReqPrescription] = useState<PrescriptionItem[]>([]);
    const [reqLabs, setReqLabs] = useState<InvestigationItem[]>([]);
    const [reqScans, setReqScans] = useState<InvestigationItem[]>([]);

    const currentPatient = useMemo(() => appointments.find(a => a.status === 'in-exam'), [appointments]);
    const nextPatients = useMemo(() => appointments.filter(a => a.status === 'checked-in').sort((a, b) => (a.queueOrder ?? 9999) - (b.queueOrder ?? 9999)), [appointments]);

    const clinicName = firebaseUser?.displayName || 'Clinic Core';

    useEffect(() => {
        setHeaderHidden(showDetailsModal || !!previewPatient);
        
        if (showDetailsModal && currentPatient) {
            hydrateClinicalData(currentPatient, setClinicalData);
            setReqPrescription(currentPatient.prescription || []);
            setReqLabs(currentPatient.investigationItems || []);
            setReqScans(currentPatient.scans || []);
        }
    }, [showDetailsModal, currentPatient, setHeaderHidden, appointments, previewPatient]);

    const hydrateClinicalData = (patient: Appointment, setter: React.Dispatch<React.SetStateAction<Partial<Appointment>>>) => {
        let initialData = { ...patient };
        const hasStaticData = initialData.chronicConditions || initialData.pastHistory || initialData.allergies;
        
        if (!hasStaticData) {
            const previousVisits = appointments
                .filter(a => a.phone === patient.phone && a.status === 'completed' && a.id !== patient.id)
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            if (previousVisits.length > 0) {
                const lastVisit = previousVisits[0];
                initialData = {
                    ...initialData,
                    weight: lastVisit.weight,
                    height: lastVisit.height,
                    isSmoker: lastVisit.isSmoker,
                    smokingDetails: lastVisit.smokingDetails,
                    isMarried: lastVisit.isMarried,
                    marriageDetails: lastVisit.marriageDetails,
                    hasMenstrualHistory: lastVisit.hasMenstrualHistory,
                    menstrualHistory: lastVisit.menstrualHistory,
                    isPregnant: lastVisit.isPregnant,
                    pregnancyDetails: lastVisit.pregnancyDetails,
                    chronicConditions: lastVisit.chronicConditions,
                    chronicConditionDetails: lastVisit.chronicConditionDetails,
                    allergies: lastVisit.allergies,
                    allergyComments: lastVisit.allergyComments,
                    pastHistory: lastVisit.pastHistory,
                    drugHistory: lastVisit.drugHistory || [],
                    labHistory: lastVisit.labHistory || [],
                    scanHistory: lastVisit.scanHistory || []
                };
            }
        }
        setter(initialData);
    };

    const handlePreviewClick = (patient: Appointment) => {
        setPreviewPatient(patient);
        hydrateClinicalData(patient, setPreviewClinicalData);
    };

    const handleSaveSession = async () => {
        if (currentPatient) {
            setSaveStatus('saving');
            await updateAppointment(currentPatient.id, {
                ...clinicalData,
                prescription: reqPrescription,
                investigationItems: reqLabs,
                scans: reqScans
            });
            setSaveStatus('success');
            setTimeout(() => setSaveStatus('idle'), 2000);
        }
    };

    const handleCompleteExam = () => {
        handleSaveSession();
        if (currentPatient) updateAppointmentStatus(currentPatient.id, 'completed');
        setShowDetailsModal(false);
    };

    const handleCallPatient = (patient: Appointment) => {
        setCallingPatientId(patient.id);
    };

    const handlePrintAll = () => {
        if (!currentPatient) return;
        // Collect current session snapshot for printing
        const sessionData: Appointment = {
            ...currentPatient,
            ...clinicalData,
            prescription: reqPrescription,
            investigationItems: reqLabs,
            scans: reqScans
        } as Appointment;
        generatePatientReportPDF(sessionData, printSettings);
    };

    const aggregatedDrugHistory = useMemo(() => {
        const historyDrugs = (clinicalData.drugHistory || []).map((d, i) => ({ ...d, originalIndex: i, source: 'History' }));
        const chronicDrugs: any[] = [];
        
        if (clinicalData.chronicConditionDetails) {
            Object.entries(clinicalData.chronicConditionDetails).forEach(([cond, detail]) => {
                const d = detail as ChronicConditionDetail;
                if (d.medications) {
                    d.medications.forEach(med => {
                        if (med.name) {
                            chronicDrugs.push({ 
                                ...med, 
                                date: d.diagnosedDate || '', 
                                source: 'Chronic Condition',
                                conditionName: cond 
                            });
                        }
                    });
                }
            });
        }
        
        return [...historyDrugs, ...chronicDrugs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [clinicalData.drugHistory, clinicalData.chronicConditionDetails]);

    // Separate aggregated history for preview modal
    const previewAggregatedDrugHistory = useMemo(() => {
        const historyDrugs = (previewClinicalData.drugHistory || []).map((d, i) => ({ ...d, originalIndex: i, source: 'History' }));
        const chronicDrugs: any[] = [];
        if (previewClinicalData.chronicConditionDetails) {
            Object.entries(previewClinicalData.chronicConditionDetails).forEach(([cond, detail]) => {
                const d = detail as ChronicConditionDetail;
                if (d.medications) {
                    d.medications.forEach(med => {
                        if (med.name) {
                            chronicDrugs.push({ ...med, date: d.diagnosedDate || '', source: 'Chronic Condition', conditionName: cond });
                        }
                    });
                }
            });
        }
        return [...historyDrugs, ...chronicDrugs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [previewClinicalData.drugHistory, previewClinicalData.chronicConditionDetails]);

    return (
        <div className={`space-y-6 animate-fade-in ${isBookingPaused ? 'p-1 rounded-3xl border-2 border-red-500/50 bg-red-900/5' : ''}`}>
            <TiltCard className="p-6 flex flex-wrap gap-4 items-stretch justify-between border-white/10" noTilt glowColor="cyan">
                <div className="flex items-center gap-6">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border shadow-lg ${doctorStatus === 'available' ? 'border-green-500/50 text-green-500 bg-green-500/10' : 'border-red-500/50 text-red-500 bg-red-500/10'}`}>
                        <Stethoscope size={32} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-white">{clinicName}</h2>
                        <p className={`font-bold text-xs tracking-widest uppercase mt-1 ${doctorStatus === 'available' ? 'text-green-500' : 'text-red-500'}`}>Status: {doctorStatus}</p>
                    </div>
                </div>
                <div className="flex gap-4 items-center">
                    <button onClick={toggleBookingPause} className={`px-4 py-2 rounded-xl font-bold border flex items-center gap-2 text-xs uppercase ${isBookingPaused ? 'bg-green-500/10 text-green-400 border-green-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'}`}>
                        {isBookingPaused ? <CheckCircle size={14} /> : <Ban size={14} />} {isBookingPaused ? 'Resume' : 'Stop Booking'}
                    </button>
                    <button onClick={() => setDoctorStatus(doctorStatus === 'available' ? 'resting' : 'available')} className={`px-6 py-2 rounded-xl font-bold border flex items-center gap-2 text-xs uppercase ${doctorStatus === 'available' ? 'bg-red-500/10 text-red-400 border-red-500/30' : 'bg-green-500/10 text-green-400 border-green-500/30'}`}>
                        <Power size={14} /> {doctorStatus === 'available' ? 'Go Resting' : 'Go Available'}
                    </button>
                </div>
            </TiltCard>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <TiltCard className={`min-h-[400px] flex flex-col justify-center items-center relative overflow-hidden border-white/5 ${currentPatient ? 'bg-black/40' : 'bg-black/20'}`} glowColor="cyan">
                        {currentPatient ? (
                            <div className="w-full h-full p-8 flex flex-col items-center justify-between z-10">
                                <div className="flex flex-col items-center">
                                    <div className="w-20 h-20 rounded-full bg-black/50 border-2 border-neon-blue flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(0,243,255,0.2)]">
                                        <Users size={32} className="text-white" />
                                    </div>
                                    <h1 className="text-3xl font-black text-white mb-1">{currentPatient.name}</h1>
                                    <p className="text-sm text-gray-400">{currentPatient.age ? `${currentPatient.age} yrs` : 'N/A'} • {currentPatient.visitType}</p>
                                </div>
                                <div className="flex gap-4 mt-8">
                                    <button onClick={() => setShowDetailsModal(true)} className="px-8 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-bold text-sm hover:bg-neon-blue/10 hover:border-neon-blue/50 transition-all flex items-center gap-2">
                                        <ClipboardList size={18} /> Open Sheet
                                    </button>
                                    <button onClick={handleCompleteExam} className="px-8 py-3 bg-gradient-to-r from-neon-blue to-cyan-600 rounded-xl text-black font-extrabold text-sm hover:shadow-[0_0_20px_rgba(0,243,255,0.4)] transition-all flex items-center gap-2">
                                        <CheckCircle size={18} /> Complete
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center text-gray-500">
                                <Stethoscope size={48} className="mx-auto mb-4 opacity-20" />
                                <h3 className="text-xl font-bold">Room Available</h3>
                                <p className="text-sm">Call a patient to start</p>
                            </div>
                        )}
                    </TiltCard>
                </div>
                <div className="space-y-4">
                    <TiltCard className="p-0 bg-black/20 h-full border-white/10 flex flex-col" glowColor="purple">
                        <div className="p-4 border-b border-white/5 flex justify-between items-center">
                            <h3 className="font-bold text-white flex items-center gap-2"><Users size={16} className="text-neon-purple"/> Waiting Room</h3>
                            <span className="text-xs bg-neon-purple/20 text-neon-purple px-2 py-0.5 rounded font-bold">{nextPatients.length}</span>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                            {nextPatients.map((pt, idx) => (
                                <div key={pt.id} className={`p-3 rounded-lg border transition-all ${callingPatientId === pt.id ? 'bg-neon-purple/10 border-neon-purple' : 'bg-white/5 border-white/5'}`}>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-bold text-white text-sm">#{idx + 1} {pt.name}</span>
                                        <span className="text-[10px] bg-black/30 px-1.5 rounded text-gray-400">{pt.time}</span>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        {hasAssistantDoctor && pt.isSheeted && (
                                            <button 
                                                onClick={() => handlePreviewClick(pt)} 
                                                className="w-full py-1.5 bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500/20 rounded text-[10px] font-bold flex items-center justify-center gap-2 transition-colors"
                                            >
                                                <Eye size={12} /> Preview Sheet
                                            </button>
                                        )}
                                        {callingPatientId === pt.id ? (
                                            <div className="text-xs font-bold text-neon-purple animate-pulse text-center w-full py-1">CALLING...</div>
                                        ) : (
                                            <button onClick={() => handleCallPatient(pt)} disabled={!!currentPatient} className="w-full py-1.5 bg-white/5 hover:bg-neon-purple/20 text-xs font-bold text-gray-400 hover:text-white rounded transition-colors disabled:opacity-30">CALL PATIENT</button>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {nextPatients.length === 0 && <div className="text-center text-gray-600 text-xs py-8">Queue Empty</div>}
                        </div>
                    </TiltCard>
                </div>
            </div>

            {/* PREVIEW MODAL (Assistant Sheet) */}
            {previewPatient && (
                <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in">
                    <div className="w-full h-full glass-panel rounded-2xl flex flex-col border border-white/10 shadow-2xl relative overflow-hidden max-w-5xl max-h-[90vh]">
                        <div className="flex justify-between items-center p-6 border-b border-white/10 bg-black/40 shrink-0">
                            <div>
                                <h2 className="text-xl font-black text-white flex items-center gap-3">
                                    <ClipboardList size={24} className="text-green-400" />
                                    {previewPatient.name} 
                                    <span className="text-xs font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20 uppercase tracking-wider">Sheet Preview</span>
                                </h2>
                                <p className="text-xs text-gray-400 mt-1">Assistant Data Review</p>
                            </div>
                            <button onClick={() => setPreviewPatient(null)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"><XCircle size={24}/></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-black/10">
                            <PatientSheet 
                                clinicalData={previewClinicalData} 
                                setClinicalData={setPreviewClinicalData} // Updates local preview state only
                                activeSheetTab={previewSheetTab}
                                setActiveSheetTab={setPreviewSheetTab}
                                aggregatedDrugHistory={previewAggregatedDrugHistory}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* FULL SCREEN SHEET MODAL (Main Doctor) */}
            {showDetailsModal && currentPatient && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in">
                    <div className="w-full h-full glass-panel rounded-2xl flex flex-col border border-white/10 shadow-2xl relative overflow-hidden">
                        
                        {/* Header */}
                        <div className="flex justify-between items-center p-6 border-b border-white/10 bg-black/40 shrink-0">
                            <div>
                                <h2 className="text-2xl font-black text-white">{currentPatient.name} <span className="text-sm font-medium text-gray-400 ml-2">{currentPatient.age || 'N/A'} yrs • {currentPatient.visitType}</span></h2>
                                <p className="text-xs text-neon-blue font-mono mt-1">Session ID: {currentPatient.id.slice(0,8)} • {new Date().toLocaleDateString()}</p>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={handlePrintAll} className="px-6 py-2 bg-white/10 border border-white/20 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-white/20 transition-all text-white">
                                    <Printer size={16}/> Print All
                                </button>
                                <button onClick={handleSaveSession} disabled={saveStatus === 'saving'} className={`px-6 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${saveStatus === 'success' ? 'bg-green-500 text-white' : 'bg-neon-blue text-black hover:bg-cyan-400'}`}>
                                    {saveStatus === 'saving' ? <Loader2 size={16} className="animate-spin"/> : <Save size={16}/>} {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'success' ? 'Saved' : 'Save'}
                                </button>
                                <button onClick={() => setShowDetailsModal(false)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"><XCircle size={24}/></button>
                            </div>
                        </div>

                        {/* Main Tabs */}
                        <div className="flex border-b border-white/10 bg-black/40 shrink-0">
                            {[
                                { id: 'SHEET', icon: <FileSpreadsheet size={14} /> },
                                { id: 'Patient Overview', icon: <LayoutDashboard size={14} /> },
                                { id: 'Labs Overview', icon: <TestTube size={14} /> },
                                { id: 'Scans Overview', icon: <Images size={14} /> },
                                { id: 'Investigations & Rx', icon: <Pill size={14} /> }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveMainTab(tab.id)}
                                    className={`px-6 py-4 text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap border-b-2 flex items-center gap-2 ${
                                        activeMainTab === tab.id ? 'border-neon-blue text-neon-blue bg-neon-blue/5' : 'border-transparent text-gray-500 hover:text-white hover:bg-white/5'
                                    }`}
                                >
                                    {tab.icon} {tab.id}
                                </button>
                            ))}
                        </div>

                        {/* Content Body */}
                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-black/10">
                            {activeMainTab === 'SHEET' && (
                                <PatientSheet 
                                    clinicalData={clinicalData} 
                                    setClinicalData={setClinicalData}
                                    activeSheetTab={activeSheetTab}
                                    setActiveSheetTab={setActiveSheetTab}
                                    aggregatedDrugHistory={aggregatedDrugHistory}
                                />
                            )}
                            {activeMainTab === 'Patient Overview' && (
                                <PatientOverview 
                                    clinicalData={clinicalData}
                                    aggregatedDrugHistory={aggregatedDrugHistory}
                                />
                            )}
                            {activeMainTab === 'Labs Overview' && (
                                <LabsOverview clinicalData={clinicalData} />
                            )}
                            {activeMainTab === 'Scans Overview' && (
                                <ScansOverview clinicalData={clinicalData} setClinicalData={setClinicalData} />
                            )}
                            {activeMainTab === 'Investigations & Rx' && (
                                <RequestsView 
                                    reqPrescription={reqPrescription}
                                    setReqPrescription={setReqPrescription}
                                    reqLabs={reqLabs}
                                    setReqLabs={setReqLabs}
                                    reqScans={reqScans}
                                    setReqScans={setReqScans}
                                    clinicalData={clinicalData}
                                    setClinicalData={setClinicalData}
                                />
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExaminationRoomView;


import React, { useState, useMemo, useContext, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import TiltCard from '../../components/TiltCard';
import { DashboardUIContext } from '../../contexts/DashboardUIContext';
import { Appointment, ChronicConditionDetail } from '../../types';
import { 
  Users, Power, Ban, ArrowRightCircle, CheckCircle, 
  Stethoscope, Activity, ArrowLeft
} from 'lucide-react';

// Sub-views from Examination Room reused
import PatientSheet from '../../components/examination/PatientSheet';

const AssistantDoctorView: React.FC = () => {
    const { 
        appointments, 
        updateAppointmentStatus, updateAppointment, 
        assistantDoctorStatus, setAssistantDoctorStatus,
        callingPatientIdAssistant, setCallingPatientIdAssistant
    } = useData();
    const { firebaseUser } = useAuth();
    const { t, isRTL } = useLanguage();
    
    // UI State
    const [activeSheetTab, setActiveSheetTab] = useState('Personal Data');
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success'>('idle');

    // Clinical Data State (Local copy for editing)
    const [clinicalData, setClinicalData] = useState<Partial<Appointment>>({});

    const currentPatient = useMemo(() => appointments.find(a => a.status === 'in-assistant'), [appointments]);
    
    // Include checked-in unsheeted patients
    const nextPatients = useMemo(() => appointments.filter(a => a.status === 'checked-in' && !a.isSheeted).sort((a, b) => (a.queueOrder ?? 9999) - (b.queueOrder ?? 9999)), [appointments]);

    useEffect(() => {
        if (currentPatient) {
            let initialData = { ...currentPatient };
            // Load previous history if available and not yet set for this appointment
            const hasStaticData = initialData.chronicConditions || initialData.pastHistory || initialData.allergies;
            if (!hasStaticData) {
                const previousVisits = appointments
                    .filter(a => a.phone === currentPatient.phone && a.status === 'completed' && a.id !== currentPatient.id)
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
            setClinicalData(initialData);
        }
    }, [currentPatient, appointments]);

    const handleSaveSession = async () => {
        if (currentPatient) {
            setSaveStatus('saving');
            await updateAppointment(currentPatient.id, clinicalData);
            setSaveStatus('success');
            setTimeout(() => setSaveStatus('idle'), 2000);
        }
    };

    const handleCallPatient = (patient: Appointment) => {
        setCallingPatientIdAssistant(patient.id);
    };

    const handleFinish = async () => {
        if (currentPatient) {
            await handleSaveSession();
            setCallingPatientIdAssistant(null); // Ensure calling stops
            // Send back to lobby, but marked as sheeted
            await updateAppointment(currentPatient.id, { 
                status: 'checked-in', 
                isSheeted: true 
            });
        }
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
                            chronicDrugs.push({ ...med, date: d.diagnosedDate || '', source: 'Chronic Condition', conditionName: cond });
                        }
                    });
                }
            });
        }
        return [...historyDrugs, ...chronicDrugs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [clinicalData.drugHistory, clinicalData.chronicConditionDetails]);

    return (
        <div className="h-full flex flex-col space-y-6 animate-fade-in" dir={isRTL ? 'rtl' : 'ltr'}>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0">
                
                {/* LEFT COLUMN: ROOM CONTROLS & QUEUE */}
                <div className="lg:col-span-1 space-y-4 h-full flex flex-col">
                    {/* Room Status Card moved here */}
                    <TiltCard className="p-6 flex flex-col items-center justify-center text-center gap-4 border-white/10 shrink-0" noTilt glowColor="cyan">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border shadow-lg ${assistantDoctorStatus === 'available' ? 'border-green-500/50 text-green-500 bg-green-500/10' : 'border-red-500/50 text-red-500 bg-red-500/10'}`}>
                            <Stethoscope size={28} />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-white leading-tight">{t("Assistant Room", "غرفة الطبيب المساعد")}</h2>
                            <p className={`font-bold text-[10px] tracking-widest uppercase mt-1 ${assistantDoctorStatus === 'available' ? 'text-green-500' : 'text-red-500'}`}>{assistantDoctorStatus}</p>
                        </div>
                        <button onClick={() => setAssistantDoctorStatus(assistantDoctorStatus === 'available' ? 'resting' : 'available')} className={`w-full py-3 rounded-xl font-bold border flex items-center justify-center gap-2 text-[10px] uppercase ${assistantDoctorStatus === 'available' ? 'bg-red-500/10 text-red-400 border-red-500/30' : 'bg-green-500/10 text-green-400 border-green-500/30'}`}>
                            <Power size={12} /> {assistantDoctorStatus === 'available' ? t('Go Resting', 'وضع الاستراحة') : t('Go Available', 'وضع متاح')}
                        </button>
                    </TiltCard>

                    {/* Waiting Queue */}
                    <TiltCard className="p-0 bg-black/20 flex-1 border-white/10 flex flex-col min-h-0" glowColor="purple">
                        <div className="p-4 border-b border-white/5 flex justify-between items-center shrink-0">
                            <h3 className="font-bold text-white flex items-center gap-2 text-sm"><Users size={14} className="text-neon-purple"/> {t("Waiting", "الانتظار")}</h3>
                            <span className="text-[10px] bg-neon-purple/20 text-neon-purple px-2 py-0.5 rounded font-bold">{nextPatients.length}</span>
                        </div>
                        <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                            {nextPatients.map((pt, idx) => (
                                <div key={pt.id} className={`p-3 rounded-lg border transition-all ${callingPatientIdAssistant === pt.id ? 'bg-neon-purple/10 border-neon-purple' : 'bg-white/5 border-white/5'}`}>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-bold text-white text-xs">#{idx + 1} {pt.name}</span>
                                        <span className="text-[9px] bg-black/30 px-1.5 rounded text-gray-400">{pt.time}</span>
                                    </div>
                                    {callingPatientIdAssistant === pt.id ? (
                                        <div className="text-[10px] font-bold text-neon-purple animate-pulse text-center flex-1 py-1.5 flex items-center justify-center border border-neon-purple/30 rounded">{t("CALLING...", "ينادي...")}</div>
                                    ) : (
                                        <button onClick={() => handleCallPatient(pt)} disabled={!!currentPatient} className="w-full py-1.5 bg-white/5 hover:bg-neon-purple/20 text-[10px] font-bold text-gray-400 hover:text-white rounded transition-colors disabled:opacity-30">
                                            {t("CALL", "مناداة")}
                                        </button>
                                    )}
                                </div>
                            ))}
                            {nextPatients.length === 0 && <div className="text-center text-gray-600 text-[10px] py-8">{t("Queue Empty", "القائمة فارغة")}</div>}
                        </div>
                    </TiltCard>
                </div>

                {/* RIGHT COLUMN: MAIN SHEET AREA */}
                <div className="lg:col-span-3 h-full min-h-0">
                    <TiltCard className={`h-full flex flex-col relative overflow-hidden border-white/5 ${currentPatient ? 'bg-black/40' : 'bg-black/20'}`} glowColor="cyan">
                        {currentPatient ? (
                            <div className="flex flex-col h-full">
                                <div className="p-6 border-b border-white/10 flex justify-between items-center bg-black/20 shrink-0">
                                    <div>
                                        <h2 className="text-2xl font-black text-white">{currentPatient.name}</h2>
                                        <p className="text-sm text-gray-400">{currentPatient.age || 'N/A'} yrs • {currentPatient.visitType}</p>
                                    </div>
                                    <div className="flex gap-3">
                                        <button onClick={handleSaveSession} className="px-6 py-2 bg-neon-blue/10 border border-neon-blue/30 text-neon-blue rounded-xl font-bold text-sm hover:bg-neon-blue hover:text-black transition-all">
                                            {saveStatus === 'saving' ? t('Saving...', 'جاري الحفظ') : t('Save Draft', 'حفظ مسودة')}
                                        </button>
                                        <button onClick={handleFinish} className="px-6 py-2 bg-green-500 text-white rounded-xl font-bold text-sm hover:shadow-[0_0_15px_rgba(34,197,94,0.4)] transition-all flex items-center gap-2">
                                            <CheckCircle size={16} /> {t("Finish", "إنهاء")}
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-black/10">
                                    <PatientSheet 
                                        clinicalData={clinicalData} 
                                        setClinicalData={setClinicalData}
                                        activeSheetTab={activeSheetTab}
                                        setActiveSheetTab={setActiveSheetTab}
                                        aggregatedDrugHistory={aggregatedDrugHistory}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-gray-500">
                                <Stethoscope size={64} className="mb-4 opacity-20" />
                                <h3 className="text-2xl font-bold">{t("Assistant Room Ready", "الغرفة جاهزة")}</h3>
                                <p className="text-sm">{t("Call a patient from the queue to start sheet.", "قم بمناداة مريض للبدء.")}</p>
                            </div>
                        )}
                    </TiltCard>
                </div>
            </div>
        </div>
    );
};

export default AssistantDoctorView;

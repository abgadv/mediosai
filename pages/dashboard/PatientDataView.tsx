
import React, { useState, useMemo, useContext, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import TiltCard from '../../components/TiltCard';
import { DashboardUIContext } from '../../contexts/DashboardUIContext';
import { Appointment } from '../../types';
import { formatDate } from '../../utils/formatters';
import { FolderOpen, Search, XCircle, FileDown, Eye, ChevronDown, ChevronUp, Save, CheckCircle, Pill, Activity, Printer } from 'lucide-react';
import { generatePatientReportPDF } from '../../utils/exportHelper';

const PatientDataView: React.FC = () => {
    const { appointments, updateAppointment, printSettings } = useData();
    const [search, setSearch] = useState('');
    const [selectedPatientPhone, setSelectedPatientPhone] = useState<string | null>(null);
    const { setHeaderHidden } = useContext(DashboardUIContext);
    
    const [expandedId, setExpandedId] = useState<string | null>(null);

    useEffect(() => {
        setHeaderHidden(!!selectedPatientPhone);
    }, [selectedPatientPhone, setHeaderHidden]);

    const patients = useMemo(() => {
        const uniquePatients: Record<string, any> = {};
        appointments.forEach(appt => {
            if (!uniquePatients[appt.phone]) {
                uniquePatients[appt.phone] = {
                    name: appt.name,
                    phone: appt.phone,
                    age: appt.age,
                    residence: appt.residence,
                    totalVisits: 0,
                    totalPaid: 0,
                    lastVisit: appt.date,
                    history: []
                };
            }
            uniquePatients[appt.phone].totalVisits += 1;
            uniquePatients[appt.phone].totalPaid += (Number(appt.paid) || 0);
            if (new Date(appt.date) > new Date(uniquePatients[appt.phone].lastVisit)) {
                uniquePatients[appt.phone].lastVisit = appt.date;
            }
            uniquePatients[appt.phone].history.push(appt);
        });
        return Object.values(uniquePatients).filter((p: any) => 
            p.name.toLowerCase().includes(search.toLowerCase()) || 
            p.phone.includes(search)
        );
    }, [appointments, search]);

    const patientDetails = useMemo(() => {
        if (!selectedPatientPhone) return null;
        const patient = patients.find(p => p.phone === selectedPatientPhone);
        if (patient) {
            patient.history.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
        }
        return patient;
    }, [selectedPatientPhone, patients]);

    const handlePrintReport = (appt: Appointment) => {
        generatePatientReportPDF(appt, printSettings);
    };

    return (
        <div className="space-y-6 animate-fade-in pb-12">
            <TiltCard className="p-6 border-white/5" glowColor="cyan">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold flex items-center gap-3 text-white">
                        <div className="p-2 bg-neon-blue/10 rounded-lg text-neon-blue"><FolderOpen size={24} /></div> Patient Registry
                    </h3>
                    <div className="relative group w-64">
                        <Search size={16} className="absolute left-3 top-3 text-gray-500 group-focus-within:text-neon-blue transition-colors" />
                        <input 
                            type="text" 
                            placeholder="Search Name or Phone..." 
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:border-neon-blue outline-none transition-colors"
                        />
                    </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-white/10 bg-black/20">
                    <table className="w-full text-left text-sm text-gray-400">
                        <thead className="bg-white/5 text-gray-300 uppercase font-bold text-xs tracking-wider">
                            <tr>
                                <th className="p-4">Patient Name</th>
                                <th className="p-4">Phone</th>
                                <th className="p-4">Total Visits</th>
                                <th className="p-4">Last Visit</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {patients.map((patient: any) => (
                                <tr key={patient.phone} className="hover:bg-white/5 transition-colors group">
                                    <td className="p-4 font-bold text-white group-hover:text-neon-blue transition-colors text-base">{patient.name}</td>
                                    <td className="p-4 font-mono">{patient.phone}</td>
                                    <td className="p-4"><span className="bg-white/10 px-2.5 py-1 rounded-md text-xs font-bold">{patient.totalVisits}</span></td>
                                    <td className="p-4">{formatDate(patient.lastVisit)}</td>
                                    <td className="p-4 text-right">
                                        <button onClick={() => setSelectedPatientPhone(patient.phone)} className="px-5 py-2 bg-neon-blue/10 text-neon-blue border border-neon-blue/30 rounded-lg hover:bg-neon-blue/20 transition-all text-xs font-bold uppercase tracking-wide">Patient History</button>
                                    </td>
                                </tr>
                            ))}
                            {patients.length === 0 && <tr><td colSpan={5} className="p-12 text-center text-gray-600 italic">No matching patient records found.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </TiltCard>

            {selectedPatientPhone && patientDetails && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
                    <div className="w-full max-w-4xl h-[85vh] glass-panel rounded-2xl flex flex-col border border-white/10 shadow-2xl animate-slide-up overflow-hidden">
                        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                            <div>
                                <h2 className="text-2xl font-black text-white">{patientDetails.name}</h2>
                                <p className="text-sm text-gray-400 font-mono mt-1">{patientDetails.phone} • {patientDetails.residence || 'No Residence Data'}</p>
                            </div>
                            <button onClick={() => setSelectedPatientPhone(null)} className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"><XCircle size={24}/></button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-black/20">
                            {patientDetails.history.map((appt: Appointment) => {
                                const isExpanded = expandedId === appt.id;
                                return (
                                    <div key={appt.id} className="relative pl-4">
                                        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-white/10"></div>
                                        <div className="absolute left-[-4px] top-6 w-2.5 h-2.5 rounded-full bg-neon-blue shadow-[0_0_10px_rgba(0,243,255,0.5)]"></div>
                                        
                                        <div className={`bg-white/5 border rounded-xl transition-all overflow-hidden ${isExpanded ? 'border-neon-blue/30 bg-white/10 shadow-[0_0_20px_-5px_rgba(0,243,255,0.1)]' : 'border-white/5 hover:border-white/10'}`}>
                                            <div 
                                                className="flex flex-col md:flex-row justify-between md:items-center p-5 cursor-pointer hover:bg-white/5 transition-colors gap-4"
                                                onClick={() => setExpandedId(prev => prev === appt.id ? null : appt.id)}
                                            >
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-3">
                                                        <div className="font-black text-white text-lg">{formatDate(appt.date)}</div>
                                                        <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase border ${appt.visitType === 'New' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' : 'bg-purple-500/20 text-purple-300 border-purple-500/30'}`}>{appt.visitType}</span>
                                                    </div>
                                                    <div className="text-xs text-gray-500 font-medium">{appt.diagnosis || 'Diagnosis Pending'}</div>
                                                </div>
                                                <div className="flex items-center gap-3 self-end md:self-auto">
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); handlePrintReport(appt); }}
                                                        className="px-4 py-2 bg-neon-blue/10 hover:bg-neon-blue text-neon-blue hover:text-black rounded-lg text-[10px] font-black flex items-center gap-2 transition-all border border-neon-blue/30 uppercase tracking-widest"
                                                    >
                                                        <Printer size={14}/> Print PDF
                                                    </button>
                                                    {isExpanded ? <ChevronUp size={20} className="text-gray-500"/> : <ChevronDown size={20} className="text-gray-500"/>}
                                                </div>
                                            </div>

                                            {isExpanded && (
                                                <div className="p-6 pt-0 border-t border-white/5 bg-black/20 animate-fade-in space-y-6">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
                                                        <div className="space-y-4">
                                                            <div>
                                                                <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest block mb-2">Chief Complaint</span>
                                                                <p className="text-sm text-gray-300 leading-relaxed bg-white/5 p-4 rounded-xl border border-white/5">{appt.complaints || 'No complaints recorded.'}</p>
                                                            </div>
                                                            <div>
                                                                <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest block mb-2">Final Diagnosis</span>
                                                                <p className="text-base font-black text-neon-blue uppercase">{appt.diagnosis || '-'}</p>
                                                            </div>
                                                        </div>
                                                        <div className="space-y-4">
                                                            {appt.prescription && appt.prescription.length > 0 && (
                                                                <div className="bg-green-500/5 p-4 rounded-xl border border-green-500/20">
                                                                    <span className="text-[10px] text-green-400 uppercase font-black tracking-widest mb-3 block">Rx - Prescribed Medication</span>
                                                                    <div className="space-y-2">
                                                                        {appt.prescription.map((p, i) => (
                                                                            <div key={i} className="flex justify-between text-xs p-2 bg-black/20 rounded-lg border border-white/5">
                                                                                <span className="font-bold text-white">{p.drug}</span>
                                                                                <span className="text-gray-500">{p.frequency}</span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {appt.vitals && (
                                                                <div className="grid grid-cols-3 gap-2">
                                                                     <div className="bg-white/5 p-2 rounded-lg text-center border border-white/5">
                                                                         <span className="text-[8px] text-gray-600 block uppercase font-black">BP</span>
                                                                         <span className="text-xs font-bold text-white">{appt.vitals.bp || '-'}</span>
                                                                     </div>
                                                                     <div className="bg-white/5 p-2 rounded-lg text-center border border-white/5">
                                                                         <span className="text-[8px] text-gray-600 block uppercase font-black">HR</span>
                                                                         <span className="text-xs font-bold text-white">{appt.vitals.hr || '-'}</span>
                                                                     </div>
                                                                     <div className="bg-white/5 p-2 rounded-lg text-center border border-white/5">
                                                                         <span className="text-[8px] text-gray-600 block uppercase font-black">Temp</span>
                                                                         <span className="text-xs font-bold text-white">{appt.vitals.temp || '-'}</span>
                                                                     </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PatientDataView;

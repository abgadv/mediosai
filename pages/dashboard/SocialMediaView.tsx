
import React, { useState, useMemo, useContext, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import TiltCard from '../../components/TiltCard';
import { DashboardUIContext } from '../../contexts/DashboardUIContext';
import { exportToExcel } from '../../utils/exportHelper';
import { Shift, Moderator, Appointment } from '../../types';
import { formatDate } from '../../utils/formatters';
import { 
  Activity, Shield, Briefcase, RefreshCw, FileDown, 
  UserCheck, Clock, LogOut, Edit2, XCircle, Plus, Trash2,
  Users, Timer, AlertCircle
} from 'lucide-react';

const SocialMediaView: React.FC = () => {
    const [subTab, setSubTab] = useState<'Overview' | 'Moderator' | 'Manager'>('Overview');
    const { setHeaderHidden } = useContext(DashboardUIContext);
    const { systemUser, firebaseUser } = useAuth();
    const { 
        moderators, shifts, moderatorSessions, appointments, addAppointment, updateAppointment,
        addModerator, updateModerator, deleteModerator,
        addShift, updateShift, deleteShift,
        checkInModerator, checkOutModerator, isBookingPaused
    } = useData();
    
    const todayStr = new Date().toISOString().split('T')[0];

    // Manager State
    const [newModName, setNewModName] = useState('');
    const [newShift, setNewShift] = useState<Omit<Shift, 'id'>>({ name: '', startTime: '09:00', endTime: '17:00' });
    const [editingMod, setEditingMod] = useState<Moderator | null>(null);
    const [editingShift, setEditingShift] = useState<Shift | null>(null);
    const [showModModal, setShowModModal] = useState(false);
    const [showShiftModal, setShowShiftModal] = useState(false);

    // Moderator State
    const [sessionStep, setSessionStep] = useState<'check-in' | 'working'>('check-in');
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [checkInForm, setCheckInForm] = useState({
        date: todayStr,
        moderatorId: '',
        shiftId: '',
        isCovering: false,
        coveringForId: ''
    });
    const [modBooking, setModBooking] = useState({
        date: todayStr,
        time: '10:00',
        name: '',
        phone: '',
        contactingNumber: '',
        source: 'Facebook' as 'Facebook' | 'Instagram' | 'Whatsapp' | 'Other',
        notes: ''
    });

    // Persistent Session Restoration Logic
    useEffect(() => {
        if (!firebaseUser) return;
        const savedId = localStorage.getItem(`active_mod_session_${firebaseUser.uid}`);
        if (savedId) {
            // Find the session in our live data
            const session = moderatorSessions.find(s => s.id === savedId);
            // If found and not checked out, restore it
            if (session && !session.checkOutTime) {
                setCurrentSessionId(savedId);
                setSessionStep('working');
                setSubTab('Moderator'); // Auto-switch to moderator tab if session is active
            } else if (session && session.checkOutTime) {
                // If it was checked out elsewhere, clear local storage
                localStorage.removeItem(`active_mod_session_${firebaseUser.uid}`);
            }
        }
    }, [moderatorSessions, firebaseUser]);

    // Overview State
    const [showEditBookingModal, setShowEditBookingModal] = useState(false);
    const [editingBooking, setEditingBooking] = useState<Partial<Appointment>>({});
    const [overviewTab, setOverviewTab] = useState<'Performance' | 'Bookings'>('Performance');
    
    // Filters
    const [perfDateFrom, setPerfDateFrom] = useState('');
    const [perfDateTo, setPerfDateTo] = useState('');
    const [perfModFilter, setPerfModFilter] = useState('');
    const [perfShiftFilter, setPerfShiftFilter] = useState('');
    const [sbFilterDateFrom, setSbFilterDateFrom] = useState('');
    const [sbFilterDateTo, setSbFilterDateTo] = useState('');
    const [sbFilterSource, setSbFilterSource] = useState('All');
    const [sbFilterMod, setSbFilterMod] = useState('All');
    const [sbFilterStatus, setSbFilterStatus] = useState('All');

    useEffect(() => {
        setHeaderHidden(showEditBookingModal || showModModal || showShiftModal);
    }, [showEditBookingModal, showModModal, showShiftModal, setHeaderHidden]);

    const isActionDisabled = isBookingPaused && systemUser?.role !== 'admin';

    const handleModSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!newModName.trim()) return;
        if(editingMod) {
            await updateModerator(editingMod.id, newModName);
        } else {
            await addModerator(newModName);
        }
        setNewModName('');
        setEditingMod(null);
        setShowModModal(false);
    };

    const handleShiftSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!newShift.name || !newShift.startTime || !newShift.endTime) return;
        if(editingShift) {
            await updateShift(editingShift.id, newShift);
        } else {
            await addShift(newShift);
        }
        setNewShift({ name: '', startTime: '09:00', endTime: '17:00' });
        setEditingShift(null);
        setShowShiftModal(false);
    };

    // --- Moderator Handlers ---
    const handleCheckIn = async () => {
        if(!checkInForm.moderatorId || !checkInForm.shiftId || !firebaseUser) return;
        const selectedShift = shifts.find(s => s.id === checkInForm.shiftId);
        const selectedMod = moderators.find(m => m.id === checkInForm.moderatorId);
        const coveringMod = checkInForm.isCovering ? moderators.find(m => m.id === checkInForm.coveringForId) : null;
        if(!selectedShift || !selectedMod) return;
        
        const now = new Date();
        const currentTimeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        const isLate = currentTimeStr > selectedShift.startTime;
        
        const id = await checkInModerator({
            date: checkInForm.date,
            moderatorId: selectedMod.id,
            moderatorName: selectedMod.name,
            shiftId: selectedShift.id,
            shiftName: selectedShift.name,
            checkInTime: currentTimeStr,
            isCovering: checkInForm.isCovering,
            coveringForName: coveringMod?.name || '',
            checkInStatus: isLate ? 'Late' : 'On Time'
        });
        
        // Persist session ID locally
        localStorage.setItem(`active_mod_session_${firebaseUser.uid}`, id);
        setCurrentSessionId(id);
        setSessionStep('working');
    };

    const handleCheckOut = () => {
        if(!currentSessionId || !firebaseUser) return;
        const session = moderatorSessions.find(s => s.id === currentSessionId);
        if(!session) return;
        const shift = shifts.find(s => s.id === session.shiftId);
        const now = new Date();
        const currentTimeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        let status: 'On Time' | 'Early Leave' = 'On Time';
        if(shift && currentTimeStr < shift.endTime) status = 'Early Leave';
        
        checkOutModerator(currentSessionId, currentTimeStr, status);
        
        // Clear persistent session
        localStorage.removeItem(`active_mod_session_${firebaseUser.uid}`);
        setSessionStep('check-in');
        setCurrentSessionId(null);
    };

    const handleModBooking = () => {
        if (modBooking.date === todayStr && isActionDisabled) {
            alert("Booking is stopped for today. Entry rejected.");
            return;
        }
        if(modBooking.name && modBooking.phone && currentSessionId) {
            const session = moderatorSessions.find(s => s.id === currentSessionId);
            addAppointment({
                date: modBooking.date,
                time: modBooking.time,
                name: modBooking.name,
                phone: modBooking.phone,
                contactingNumber: modBooking.contactingNumber,
                source: modBooking.source,
                paid: 0,
                notes: modBooking.notes,
                status: 'booked',
                createdBy: session?.moderatorName || 'System',
                sessionId: currentSessionId
            });
            setModBooking({ date: todayStr, time: '10:00', name: '', phone: '', contactingNumber: '', source: 'Facebook', notes: '' });
            alert("Booking Added Successfully to Desk!");
        }
    };

    // --- Memos & Derived Data ---
    const performanceData = useMemo(() => { 
        return moderatorSessions.map(session => { 
            const bookingsCount = appointments.filter(a => a.sessionId === session.id).length; 
            return { ...session, totalBookings: bookingsCount }; 
        }); 
    }, [moderatorSessions, appointments]);

    const filteredPerformanceData = useMemo(() => { 
        return performanceData.filter(session => { 
            const dateMatch = (!perfDateFrom || session.date >= perfDateFrom) && (!perfDateTo || session.date <= perfDateTo); 
            const modMatch = !perfModFilter || session.moderatorId === perfModFilter; 
            const shiftMatch = !perfShiftFilter || session.shiftId === perfShiftFilter; 
            return dateMatch && modMatch && shiftMatch; 
        }); 
    }, [performanceData, perfDateFrom, perfDateTo, perfModFilter, perfShiftFilter]);

    const socialBookings = useMemo(() => { 
        return appointments.filter(a => { 
            const isSocial = ['Facebook', 'Instagram', 'Whatsapp', 'Other', 'Social Media'].includes(a.source); 
            if(!isSocial) return false; 
            const dateMatch = (!sbFilterDateFrom || a.date >= sbFilterDateFrom) && (!sbFilterDateTo || a.date <= sbFilterDateTo); 
            const sourceMatch = sbFilterSource === 'All' || a.source === sbFilterSource; 
            const modMatch = sbFilterMod === 'All' || (a.createdBy && a.createdBy === sbFilterMod); 
            const statusMatch = sbFilterStatus === 'All' || a.status === sbFilterStatus; 
            return dateMatch && sourceMatch && modMatch && statusMatch; 
        }); 
    }, [appointments, sbFilterDateFrom, sbFilterDateTo, sbFilterSource, sbFilterMod, sbFilterStatus]);

    const currentSession = useMemo(() => moderatorSessions.find(s => s.id === currentSessionId), [moderatorSessions, currentSessionId]);
    const mySessionBookings = useMemo(() => { if(!currentSession) return []; return appointments.filter(a => a.sessionId === currentSession.id); }, [appointments, currentSession]);

    return (
     <div className="space-y-6 animate-fade-in">
       <div className="flex flex-wrap gap-4 mb-8"> 
         {[ 
           { id: 'Overview', icon: <Activity size={20} /> }, 
           { id: 'Moderator', icon: <Shield size={20} /> }, 
           { id: 'Manager', icon: <Briefcase size={20} /> } 
         ].map((tab) => ( 
           <button 
             key={tab.id} 
             onClick={() => setSubTab(tab.id as any)} 
             className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all duration-300 ${subTab === tab.id ? 'bg-neon-purple text-black shadow-[0_0_15px_-3px_rgba(157,0,255,0.4)] transform -translate-y-1' : 'bg-black/30 border border-white/5 text-gray-400 hover:text-white hover:bg-white/5' }`} 
           > 
             {tab.icon} {tab.id} 
           </button> 
         ))} 
       </div>

        {subTab === 'Overview' && (
            <div className="space-y-6 animate-fade-in">
                 <div className="flex gap-4 border-b border-white/10 pb-0"> 
                   <button onClick={() => setOverviewTab('Performance')} className={`px-6 py-3 font-bold transition-all text-sm uppercase tracking-wide border-b-2 ${overviewTab === 'Performance' ? 'text-neon-purple border-neon-purple drop-shadow-[0_0_8px_rgba(157,0,255,0.4)]' : 'text-gray-500 border-transparent hover:text-white'}`}>Moderator Performance</button> 
                   <button onClick={() => setOverviewTab('Bookings')} className={`px-6 py-3 font-bold transition-all text-sm uppercase tracking-wide border-b-2 ${overviewTab === 'Bookings' ? 'text-neon-purple border-neon-purple drop-shadow-[0_0_8px_rgba(157,0,255,0.4)]' : 'text-gray-500 border-transparent hover:text-white'}`}>Moderators Bookings</button> 
                 </div>
                 
                 {overviewTab === 'Performance' && ( 
                   <TiltCard className="p-0 border-white/5 overflow-hidden" glowColor="purple"> 
                     <div className="flex flex-wrap items-end gap-4 p-6 bg-black/20 border-b border-white/5"> 
                       <div className="flex flex-col gap-1.5"> <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Date From</label> <input type="date" value={perfDateFrom} onChange={e => setPerfDateFrom(e.target.value)} className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-neon-purple outline-none transition-colors" /> </div> 
                       <div className="flex flex-col gap-1.5"> <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Date To</label> <input type="date" value={perfDateTo} onChange={e => setPerfDateTo(e.target.value)} className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-neon-purple outline-none transition-colors" /> </div> 
                       <div className="flex flex-col gap-1.5 min-w-[150px]"> <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Moderator</label> <select value={perfModFilter} onChange={e => setPerfModFilter(e.target.value)} className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-neon-purple outline-none transition-colors appearance-none"> <option value="">All Moderators</option> {moderators.map(m => <option key={m.id} value={m.id}>{m.name}</option>)} </select> </div> 
                       <div className="flex flex-col gap-1.5 min-w-[150px]"> <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Shift</label> <select value={perfShiftFilter} onChange={e => setPerfShiftFilter(e.target.value)} className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-neon-purple outline-none transition-colors appearance-none"> <option value="">All Shifts</option> {shifts.map(s => <option key={s.id} value={s.id}>{s.name}</option>)} </select> </div> 
                       <button onClick={() => { setPerfDateFrom(''); setPerfDateTo(''); setPerfModFilter(''); setPerfShiftFilter(''); }} className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-lg text-sm font-bold flex items-center gap-2 transition-colors border border-white/5"> <RefreshCw size={16} /> </button> </div> 
                     <table className="w-full text-left text-sm text-gray-400"> 
                       <thead className="bg-white/5 text-gray-300 uppercase font-bold text-xs tracking-wider"> <tr> <th className="p-4">Entry Date</th> <th className="p-4">Moderator Name</th> <th className="p-4">Shift</th> <th className="p-4">Check In</th> <th className="p-4">Check Out</th> <th className="p-4">Status</th> <th className="p-4">Bookings</th> </tr> </thead> 
                       <tbody className="divide-y divide-white/5"> {filteredPerformanceData.map(session => ( 
                         <tr key={session.id} className="hover:bg-white/5 transition-colors"> 
                           <td className="p-4">{formatDate(session.date)}</td> 
                           <td className="p-4 font-medium text-white"> {session.moderatorName} {session.isCovering && <span className="block text-[10px] text-yellow-500 bg-yellow-500/10 px-1.5 py-0.5 rounded w-fit mt-1 border border-yellow-500/20">Covering {session.coveringForName}</span>} </td> 
                           <td className="p-4">{session.shiftName}</td> <td className="p-4 font-mono">{session.checkInTime}</td> <td className="p-4 font-mono">{session.checkOutTime || '-'}</td> 
                           <td className="p-4"> 
                             <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase border ${session.checkInStatus === 'Late' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-green-500/10 text-green-400 border-green-500/20'}`}>{session.checkInStatus}</span> {session.checkOutStatus === 'Early Leave' && <span className="ml-2 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase bg-red-500/10 text-red-400 border border-red-500/20">Early Leave</span>} 
                           </td> 
                           <td className="p-4 text-neon-purple font-black text-xl drop-shadow-[0_0_5px_rgba(157,0,255,0.4)]">{session.totalBookings}</td> 
                         </tr> 
                       ))} {filteredPerformanceData.length === 0 && <tr><td colSpan={7} className="p-12 text-center text-gray-500 italic">No session data found for selected filters.</td></tr>} </tbody> 
                     </table> 
                   </TiltCard> 
                 )}
                 
                 {overviewTab === 'Bookings' && ( 
                   <TiltCard className="p-0 border-white/5 overflow-hidden" glowColor="purple"> 
                     <div className="flex flex-wrap items-end gap-4 p-6 bg-black/20 border-b border-white/5"> 
                       <div className="flex flex-col gap-1.5"> <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Date From</label> <input type="date" value={sbFilterDateFrom} onChange={e => setSbFilterDateFrom(e.target.value)} className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-neon-purple outline-none transition-colors" /> </div> 
                       <div className="flex flex-col gap-1.5"> <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Date To</label> <input type="date" value={sbFilterDateTo} onChange={e => setSbFilterDateTo(e.target.value)} className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-neon-purple outline-none transition-colors" /> </div> 
                       <div className="flex flex-col gap-1.5 min-w-[120px]"> <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Source</label> <select value={sbFilterSource} onChange={e => setSbFilterSource(e.target.value)} className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-neon-purple outline-none transition-colors appearance-none"> <option value="All">All Sources</option> <option value="Facebook">Facebook</option> <option value="Instagram">Instagram</option> <option value="Whatsapp">Whatsapp</option> <option value="Other">Other</option> </select> </div> 
                       <div className="flex flex-col gap-1.5 min-w-[150px]"> <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Moderator</label> <select value={sbFilterMod} onChange={e => setSbFilterMod(e.target.value)} className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-neon-purple outline-none transition-colors appearance-none"> <option value="All">All Moderators</option> {moderators.map(m => <option key={m.id} value={m.name}>{m.name}</option>)} </select> </div> 
                       <div className="flex flex-col gap-1.5 min-w-[120px]"> <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Status</label> <select value={sbFilterStatus} onChange={e => setSbFilterStatus(e.target.value)} className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-neon-purple outline-none transition-colors appearance-none"> <option value="All">All Status</option> <option value="booked">Booked</option> <option value="checked-in">Checked In</option> <option value="completed">Completed</option> <option value="cancelled">Cancelled</option> </select> </div> 
                       <button onClick={() => { setSbFilterDateFrom(''); setSbFilterDateTo(''); setSbFilterSource('All'); setSbFilterMod('All'); setSbFilterStatus('All'); }} className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-lg text-sm font-bold flex items-center gap-2 transition-colors border border-white/5"> <RefreshCw size={16} /> </button> 
                       <div className="flex-1 text-right"> <button onClick={() => { const dataToExport = socialBookings.map(a => ({ Date: formatDate(a.date), ClientName: a.name, Source: a.source, Moderator: a.createdBy || 'Unknown', Status: a.status })); exportToExcel(dataToExport, `Moderator_Bookings_${todayStr}`); }} className="flex items-center gap-2 px-5 py-2.5 bg-green-600/10 text-green-400 border border-green-500/30 rounded-xl hover:bg-green-600/20 transition-all font-bold text-xs uppercase tracking-wide ml-auto"> <FileDown size={18} /> Excel </button> </div> 
                     </div> 
                     <table className="w-full text-left text-sm text-gray-400"> 
                       <thead className="bg-white/5 text-gray-300 uppercase font-bold text-xs tracking-wider"> <tr> <th className="p-4">Date</th> <th className="p-4">Client Name</th> <th className="p-4">Source</th> <th className="p-4">Moderator</th> <th className="p-4">Status</th> </tr> </thead> 
                       <tbody className="divide-y divide-white/5"> {socialBookings.map(appt => ( 
                         <tr key={appt.id} className="hover:bg-white/5 transition-colors"> <td className="p-4 font-mono">{formatDate(appt.date)}</td> <td className="p-4 text-white font-medium text-base">{appt.name}</td> <td className="p-4"><span className="px-2.5 py-1 border border-white/10 bg-white/5 rounded-md text-xs">{appt.source}</span></td> <td className="p-4 text-neon-purple font-medium">{appt.createdBy || 'Unknown'}</td> <td className="p-4"><span className="px-3 py-1 bg-gray-800/50 rounded-full text-xs font-bold uppercase tracking-wider text-gray-300 border border-gray-700">{appt.status}</span></td> </tr> ))} {socialBookings.length === 0 && <tr><td colSpan={5} className="p-12 text-center text-gray-500 italic">No social bookings found matching filters.</td></tr>} </tbody> 
                     </table> 
                   </TiltCard> 
                 )}
            </div>
        )}

        {subTab === 'Moderator' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mx-auto max-w-6xl animate-fade-in">
                {sessionStep === 'check-in' ? ( 
                  <TiltCard className="p-10 border-neon-purple/30 shadow-[0_0_50px_-15px_rgba(157,0,255,0.2)] lg:col-span-2 max-w-2xl mx-auto" glowColor="purple"> 
                    <h3 className="text-3xl font-black text-white mb-8 flex items-center gap-3"> <div className="p-2 bg-neon-purple/20 rounded-xl text-neon-purple"><UserCheck size={32} /></div> Moderator Check-In </h3> 
                    <div className="space-y-6"> 
                      <div> <label className="block text-xs uppercase text-gray-400 font-bold mb-2 tracking-wider">Date</label> <input type="date" value={checkInForm.date} onChange={e => setCheckInForm({...checkInForm, date: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white focus:border-neon-purple transition-all outline-none" /> </div> 
                      <div> <label className="block text-xs uppercase text-gray-400 font-bold mb-2 tracking-wider">Name</label> <select value={checkInForm.moderatorId} onChange={e => setCheckInForm({...checkInForm, moderatorId: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white focus:border-neon-purple transition-all outline-none appearance-none cursor-pointer"> <option value="" className="bg-gray-900">Select Name...</option> {moderators.map(m => <option key={m.id} value={m.id} className="bg-gray-900">{m.name}</option>)} </select> </div> 
                      <div> <label className="block text-xs uppercase text-gray-400 font-bold mb-2 tracking-wider">Shift</label> <select value={checkInForm.shiftId} onChange={e => setCheckInForm({...checkInForm, shiftId: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white focus:border-neon-purple transition-all outline-none appearance-none cursor-pointer"> <option value="" className="bg-gray-900">Select Shift...</option> {shifts.map(s => <option key={s.id} value={s.id} className="bg-gray-900">{s.name} ({s.startTime} - {s.endTime})</option>)} </select> </div> 
                      <div className="flex items-center gap-3 bg-white/5 p-4 rounded-xl border border-white/5"> <input type="checkbox" checked={checkInForm.isCovering} onChange={e => setCheckInForm({...checkInForm, isCovering: e.target.checked})} className="w-5 h-5 accent-neon-purple rounded cursor-pointer" /> <label className="text-sm font-bold text-white tracking-wide">Is Covering?</label> </div> 
                      {checkInForm.isCovering && ( <div className="animate-slide-up"> <label className="block text-xs uppercase text-gray-400 font-bold mb-2 tracking-wider">Covering For</label> <select value={checkInForm.coveringForId} onChange={e => setCheckInForm({...checkInForm, coveringForId: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white focus:border-neon-purple transition-all outline-none appearance-none"> <option value="" className="bg-gray-900">Select Moderator...</option> {moderators.map(m => <option key={m.id} value={m.id} className="bg-gray-900">{m.name}</option>)} </select> </div> )} 
                      <button onClick={handleCheckIn} className="w-full py-4 mt-6 bg-gradient-to-r from-neon-purple to-pink-600 rounded-xl text-white font-extrabold text-lg hover:shadow-[0_0_30px_rgba(188,19,254,0.4)] transition-all flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98]"> <Clock size={20} /> START SESSION </button> 
                    </div> 
                  </TiltCard> 
                ) : ( 
                  <> 
                    <TiltCard className="p-8 border-green-500/30 relative overflow-hidden shadow-[0_0_40px_-10px_rgba(34,197,94,0.2)]" glowColor="green"> 
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-emerald-400 animate-pulse-slow"></div> 
                      <div className="flex items-center justify-between mb-8"> <div> <h3 className="text-2xl font-black text-white mb-1">Session Active</h3> <p className="text-gray-400 text-sm">Logged in as <span className="text-white font-bold">{currentSession?.moderatorName}</span></p> </div> <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_10px_#22c55e] animate-pulse"></div> </div> 
                      
                      {isBookingPaused && (
                          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3">
                              <AlertCircle size={18} className="text-red-400" />
                              <span className="text-xs text-red-200 font-bold uppercase tracking-wider">Booking Suspended Globally</span>
                          </div>
                      )}

                      <div className="space-y-4 mb-8 p-6 bg-black/30 rounded-2xl border border-white/10 backdrop-blur-sm"> 
                        <h4 className="font-bold text-neon-purple mb-4 uppercase tracking-widest text-xs">New Booking Entry</h4> 
                        <div className="grid grid-cols-2 gap-4"> 
                          <input type="date" value={modBooking.date} onChange={e => setModBooking({...modBooking, date: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3.5 text-white mb-2 focus:border-neon-purple transition-colors outline-none" /> 
                          <input type="time" value={modBooking.time} onChange={e => setModBooking({...modBooking, time: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3.5 text-white mb-2 focus:border-neon-purple transition-colors outline-none" /> 
                        </div> 
                        <input type="text" placeholder="Client Name" value={modBooking.name} onChange={e => setModBooking({...modBooking, name: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3.5 text-white mb-2 focus:border-neon-purple transition-colors outline-none" /> 
                        <div className="grid grid-cols-2 gap-4">
                            <input type="tel" placeholder="Phone Number" value={modBooking.phone} onChange={e => setModBooking({...modBooking, phone: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3.5 text-white mb-2 focus:border-neon-purple transition-colors outline-none" /> 
                            <input type="tel" placeholder="Contacting Number" value={modBooking.contactingNumber} onChange={e => setModBooking({...modBooking, contactingNumber: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3.5 text-white mb-2 focus:border-neon-purple transition-colors outline-none" /> 
                        </div>
                        <select value={modBooking.source} onChange={e => setModBooking({...modBooking, source: e.target.value as any})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3.5 text-white mb-2 focus:border-neon-purple transition-colors outline-none appearance-none"> <option value="Facebook" className="bg-gray-900">Facebook</option> <option value="Instagram" className="bg-gray-900">Instagram</option> <option value="Whatsapp" className="bg-gray-900">Whatsapp</option> <option value="Other" className="bg-gray-900">Other</option> </select> 
                        <textarea placeholder="Notes (Optional)" value={modBooking.notes} onChange={e => setModBooking({...modBooking, notes: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3.5 text-white mb-2 focus:border-neon-purple transition-colors outline-none resize-none" rows={3} /> 
                        
                        <button 
                            onClick={handleModBooking} 
                            disabled={modBooking.date === todayStr && isActionDisabled}
                            className={`w-full py-3.5 border rounded-xl font-bold transition-all mt-2 
                                ${modBooking.date === todayStr && isActionDisabled 
                                    ? 'bg-gray-800 text-gray-500 border-gray-700 cursor-not-allowed' 
                                    : 'bg-neon-purple/10 text-neon-purple border-neon-purple/50 hover:bg-neon-purple hover:text-white hover:shadow-[0_0_20px_rgba(157,0,255,0.4)]'
                                }`}
                        > 
                            + ADD BOOKING 
                        </button> 
                      </div> 
                      <button onClick={handleCheckOut} className="w-full py-4 bg-red-500/10 text-red-400 border border-red-500/30 rounded-xl font-bold hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2 hover:shadow-[0_0_20px_rgba(239,68,68,0.4)]"> <LogOut size={20} /> CHECK OUT </button> 
                    </TiltCard> 
                    <TiltCard className="p-6 border-white/5 flex flex-col h-full bg-black/20" glowColor="purple"> 
                      <h3 className="text-lg font-bold text-white mb-6 uppercase tracking-wider flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-neon-purple"></div> Session Log</h3> 
                      <div className="flex-1 overflow-y-auto space-y-3 max-h-[500px] custom-scrollbar pr-2"> {mySessionBookings.map(booking => ( 
                        <div key={booking.id} className="p-4 rounded-xl bg-white/5 border border-white/5 flex justify-between items-center group hover:border-neon-purple/40 hover:bg-white/10 transition-all"> 
                          <div> <h4 className="font-bold text-gray-200 group-hover:text-white transition-colors">{booking.name}</h4> <p className="text-xs text-gray-500 mt-0.5">{booking.phone} {booking.contactingNumber && `| C: ${booking.contactingNumber}`} • <span className="text-neon-purple">{booking.source}</span></p> </div> 
                          <button onClick={() => { setEditingBooking({...booking}); setShowEditBookingModal(true); }} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors" > <Edit2 size={16} /> </button> 
                        </div> ))} {mySessionBookings.length === 0 && ( <div className="text-center py-16 text-gray-600 text-sm flex flex-col items-center gap-3"> <Activity size={24} className="opacity-20"/> <span>No bookings recorded yet.</span> </div> )} 
                      </div> 
                    </TiltCard> 
                  </> 
                )}
            </div>
        )}

        {subTab === 'Manager' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
                {/* Moderator Management */}
                <TiltCard className="p-8 border-white/5" glowColor="purple">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="text-xl font-bold flex items-center gap-3 text-white">
                            <div className="p-2 bg-neon-purple/10 rounded-lg text-neon-purple shadow-[0_0_10px_rgba(157,0,255,0.3)]"><Users size={24} /></div> Moderators
                        </h3>
                        <button 
                            onClick={() => { setEditingMod(null); setNewModName(''); setShowModModal(true); }}
                            className="p-2 bg-neon-purple text-white rounded-lg hover:bg-white hover:text-black transition-all shadow-lg"
                        >
                            <Plus size={20} />
                        </button>
                    </div>

                    <div className="space-y-3">
                        {moderators.map(mod => (
                            <div key={mod.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors group">
                                <span className="font-bold text-white text-lg group-hover:text-neon-purple transition-colors">{mod.name}</span>
                                <div className="flex gap-2">
                                    <button onClick={() => { setEditingMod(mod); setNewModName(mod.name); setShowModModal(true); }} className="p-2 text-blue-400 hover:text-white bg-blue-500/10 rounded-lg transition-colors"><Edit2 size={16} /></button>
                                    <button onClick={() => deleteModerator(mod.id)} className="p-2 text-red-400 hover:text-white bg-red-500/10 rounded-lg transition-colors"><Trash2 size={16} /></button>
                                </div>
                            </div>
                        ))}
                        {moderators.length === 0 && <div className="text-center py-10 text-gray-600 italic">No moderators added.</div>}
                    </div>
                </TiltCard>

                {/* Shift Management */}
                <TiltCard className="p-8 border-white/5" glowColor="cyan">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="text-xl font-bold flex items-center gap-3 text-white">
                            <div className="p-2 bg-neon-blue/10 rounded-lg text-neon-blue shadow-[0_0_10px_rgba(0,243,255,0.3)]"><Clock size={24} /></div> Shifts
                        </h3>
                        <button 
                            onClick={() => { setEditingShift(null); setNewShift({ name: '', startTime: '09:00', endTime: '17:00' }); setShowShiftModal(true); }}
                            className="p-2 bg-neon-blue text-black rounded-lg hover:bg-white transition-all shadow-lg"
                        >
                            <Plus size={20} />
                        </button>
                    </div>

                    <div className="space-y-3">
                        {shifts.map(shift => (
                            <div key={shift.id} className="p-4 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-all group">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-black text-white uppercase tracking-wider text-sm group-hover:text-neon-blue transition-colors">{shift.name}</span>
                                    <div className="flex gap-2">
                                        <button onClick={() => { setEditingShift(shift); setNewShift({ ...shift }); setShowShiftModal(true); }} className="p-2 text-blue-400 hover:text-white bg-blue-500/10 rounded-lg transition-colors"><Edit2 size={16} /></button>
                                        <button onClick={() => deleteShift(shift.id)} className="p-2 text-red-400 hover:text-white bg-red-500/10 rounded-lg transition-colors"><Trash2 size={16} /></button>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-gray-400 font-mono text-xs">
                                    <Clock size={12} /> {shift.startTime} - {shift.endTime}
                                </div>
                            </div>
                        ))}
                        {shifts.length === 0 && <div className="text-center py-10 text-gray-600 italic">No shifts configured.</div>}
                    </div>
                </TiltCard>
            </div>
        )}

      {/* Edit Booking Modal */}
      {showEditBookingModal && ( <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in"> <div className="w-full max-w-md glass-panel rounded-2xl p-8 border border-neon-purple/20 shadow-[0_0_50px_-10px_rgba(157,0,255,0.2)] animate-slide-up"> <div className="flex justify-between items-center mb-8 pb-4 border-b border-white/10"> <h3 className="text-2xl font-bold text-white tracking-tight">Edit Booking</h3> <button onClick={() => setShowEditBookingModal(false)} className="text-gray-400 hover:text-white bg-white/5 p-2 rounded-full hover:bg-white/10 transition-colors"><XCircle /></button> </div> <div className="space-y-5"> <input type="text" placeholder="Client Name" value={editingBooking.name || ''} onChange={e => setEditingBooking({...editingBooking, name: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3.5 text-white focus:border-neon-purple outline-none transition-colors" /> <div className="grid grid-cols-2 gap-4"> <input type="tel" placeholder="Phone Number" value={editingBooking.phone || ''} onChange={e => setEditingBooking({...editingBooking, phone: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3.5 text-white focus:border-neon-purple outline-none transition-colors" /> <input type="tel" placeholder="Contacting Number" value={editingBooking.contactingNumber || ''} onChange={e => setEditingBooking({...editingBooking, contactingNumber: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3.5 text-white focus:border-neon-purple outline-none transition-colors" /> </div> <select value={editingBooking.source} onChange={e => setEditingBooking({...editingBooking, source: e.target.value as any})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3.5 text-white focus:border-neon-purple outline-none appearance-none"> <option value="Facebook" className="bg-gray-900">Facebook</option> <option value="Instagram" className="bg-gray-900">Instagram</option> <option value="Whatsapp" className="bg-gray-900">Whatsapp</option> <option value="Other" className="bg-gray-900">Other</option> </select> <textarea placeholder="Notes" value={editingBooking.notes || ''} onChange={e => setEditingBooking({...editingBooking, notes: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3.5 text-white focus:border-neon-purple outline-none transition-colors resize-none" rows={3} /> <button onClick={() => { if(editingBooking.id && editingBooking.name) { updateAppointment(editingBooking.id, editingBooking); setShowEditBookingModal(false); setEditingBooking({}); } }} className="w-full py-4 bg-gradient-to-r from-neon-purple to-pink-600 rounded-xl text-white font-extrabold text-lg hover:shadow-[0_0_20px_rgba(188,19,254,0.4)] transition-all"> UPDATE BOOKING </button> </div> </div> </div> )}

      {/* Moderator Manager Modal */}
      {showModModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
              <div className="w-full max-md glass-panel rounded-2xl p-8 border border-neon-purple/20 shadow-2xl animate-slide-up">
                  <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
                      <h3 className="text-xl font-bold text-white">{editingMod ? 'Edit Moderator' : 'Add New Moderator'}</h3>
                      <button onClick={() => setShowModModal(false)} className="text-gray-400 hover:text-white transition-colors"><XCircle /></button>
                  </div>
                  <form onSubmit={handleModSubmit} className="space-y-6">
                      <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-[0.2em] mb-2 ml-1">Moderator Full Name</label>
                          <input 
                              type="text" 
                              autoFocus
                              value={newModName} 
                              onChange={e => setNewModName(e.target.value)}
                              className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-neon-purple transition-all"
                              placeholder="Enter name..."
                          />
                      </div>
                      <button type="submit" className="w-full py-4 bg-neon-purple text-white font-black rounded-xl hover:opacity-90 transition-all uppercase tracking-widest">
                          {editingMod ? 'Update Moderator' : 'Save Moderator'}
                      </button>
                  </form>
              </div>
          </div>
      )}

      {/* Shift Manager Modal */}
      {showShiftModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
              <div className="w-full max-w-md glass-panel rounded-2xl p-8 border border-neon-blue/20 shadow-2xl animate-slide-up">
                  <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-4">
                      <h3 className="text-xl font-bold text-white">{editingShift ? 'Edit Shift' : 'Add New Shift'}</h3>
                      <button onClick={() => setShowShiftModal(false)} className="text-gray-400 hover:text-white transition-colors"><XCircle /></button>
                  </div>
                  <form onSubmit={handleShiftSubmit} className="space-y-6">
                      <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-[0.2em] mb-2 ml-1">Shift Name</label>
                          <input 
                              type="text" 
                              autoFocus
                              value={newShift.name} 
                              onChange={e => setNewShift({...newShift, name: e.target.value})}
                              className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-neon-blue transition-all"
                              placeholder="e.g. Night Shift"
                          />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase tracking-[0.2em] mb-2 ml-1">Start Time</label>
                              <input 
                                  type="time" 
                                  value={newShift.startTime} 
                                  onChange={e => setNewShift({...newShift, startTime: e.target.value})}
                                  className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-neon-blue transition-all"
                              />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase tracking-[0.2em] mb-2 ml-1">End Time</label>
                              <input 
                                  type="time" 
                                  value={newShift.endTime} 
                                  onChange={e => setNewShift({...newShift, endTime: e.target.value})}
                                  className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-neon-blue transition-all"
                              />
                          </div>
                      </div>
                      <button type="submit" className="w-full py-4 bg-neon-blue text-black font-black rounded-xl hover:opacity-90 transition-all uppercase tracking-widest">
                          {editingShift ? 'Update Shift' : 'Save Shift'}
                      </button>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default SocialMediaView;

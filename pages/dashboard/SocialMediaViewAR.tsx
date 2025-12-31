
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
  Users, AlertCircle
} from 'lucide-react';

const SocialMediaViewAR: React.FC = () => {
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
        source: 'Facebook' as any,
        notes: ''
    });

    // Persistent Session Restoration Logic (AR)
    useEffect(() => {
        if (!firebaseUser) return;
        const savedId = localStorage.getItem(`active_mod_session_${firebaseUser.uid}`);
        if (savedId) {
            const session = moderatorSessions.find(s => s.id === savedId);
            if (session && !session.checkOutTime) {
                setCurrentSessionId(savedId);
                setSessionStep('working');
                setSubTab('Moderator'); 
            } else if (session && session.checkOutTime) {
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

    // --- Manager Handlers ---
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
            alert("تم إيقاف الحجز لهذا اليوم.");
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
            alert("تمت إضافة الحجز بنجاح!");
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
     <div className="space-y-6 animate-fade-in font-arabic" dir="rtl">
       <div className="flex flex-wrap gap-4 mb-8"> 
         {[ 
           { id: 'Overview', label: 'نظرة عامة', icon: <Activity size={20} /> }, 
           { id: 'Moderator', label: 'صفحة المسوق', icon: <Shield size={20} /> }, 
           { id: 'Manager', label: 'الإدارة', icon: <Briefcase size={20} /> } 
         ].map((tab) => ( 
           <button 
             key={tab.id} 
             onClick={() => setSubTab(tab.id as any)} 
             className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all duration-300 ${subTab === tab.id ? 'bg-neon-purple text-black shadow-lg transform -translate-y-1' : 'bg-black/30 border border-white/5 text-gray-400 hover:text-white hover:bg-white/5' }`} 
           > 
             {tab.icon} {tab.label} 
           </button> 
         ))} 
       </div>

        {subTab === 'Overview' && (
            <div className="space-y-6 animate-fade-in">
                 <div className="flex gap-6 border-b border-white/10 pb-0"> 
                   <button onClick={() => setOverviewTab('Performance')} className={`px-6 py-3 font-bold transition-all text-sm uppercase tracking-wide border-b-2 ${overviewTab === 'Performance' ? 'text-neon-purple border-neon-purple drop-shadow-[0_0_8px_rgba(157,0,255,0.4)]' : 'text-gray-500 border-transparent hover:text-white'}`}>أداء المسوقين</button> 
                   <button onClick={() => setOverviewTab('Bookings')} className={`px-6 py-3 font-bold transition-all text-sm uppercase tracking-wide border-b-2 ${overviewTab === 'Bookings' ? 'text-neon-purple border-neon-purple drop-shadow-[0_0_8px_rgba(157,0,255,0.4)]' : 'text-gray-500 border-transparent hover:text-white'}`}>حجوزات المسوقين</button> 
                 </div>
                 
                 {overviewTab === 'Performance' && ( 
                   <TiltCard className="p-0 border-white/5 overflow-hidden" glowColor="purple"> 
                     <div className="flex flex-wrap items-end gap-4 p-6 bg-black/20 border-b border-white/5"> 
                       <div className="flex flex-col gap-1.5 text-right"> <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">من تاريخ</label> <input type="date" value={perfDateFrom} onChange={e => setPerfDateFrom(e.target.value)} className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-neon-purple outline-none transition-colors" /> </div> 
                       <div className="flex flex-col gap-1.5 text-right"> <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">إلى تاريخ</label> <input type="date" value={perfDateTo} onChange={e => setPerfDateTo(e.target.value)} className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-neon-purple outline-none transition-colors" /> </div> 
                       <div className="flex flex-col gap-1.5 min-w-[150px] text-right"> <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">المسوق</label> <select value={perfModFilter} onChange={e => setPerfModFilter(e.target.value)} className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-neon-purple outline-none transition-colors appearance-none"> <option value="">كل المسوقين</option> {moderators.map(m => <option key={m.id} value={m.id}>{m.name}</option>)} </select> </div> 
                       <div className="flex flex-col gap-1.5 min-w-[150px] text-right"> <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">الوردية</label> <select value={perfShiftFilter} onChange={e => setPerfShiftFilter(e.target.value)} className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-neon-purple outline-none transition-colors appearance-none"> <option value="">كل الورديات</option> {shifts.map(s => <option key={s.id} value={s.id}>{s.name}</option>)} </select> </div> 
                       <button onClick={() => { setPerfDateFrom(''); setPerfDateTo(''); setPerfModFilter(''); setPerfShiftFilter(''); }} className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-lg text-sm font-bold flex items-center gap-2 transition-colors border border-white/5"> <RefreshCw size={16} /> </button> </div> 
                     <table className="w-full text-right text-sm text-gray-400"> 
                       <thead className="bg-white/5 text-gray-300 uppercase font-bold text-xs tracking-wider"> <tr> <th className="p-4">تاريخ الدخول</th> <th className="p-4">اسم المسوق</th> <th className="p-4">الوردية</th> <th className="p-4">وقت الدخول</th> <th className="p-4">وقت الخروج</th> <th className="p-4">الحالة</th> <th className="p-4">الحجوزات</th> </tr> </thead> 
                       <tbody className="divide-y divide-white/5 font-bold"> {filteredPerformanceData.map(session => ( 
                         <tr key={session.id} className="hover:bg-white/5 transition-colors"> 
                           <td className="p-4">{formatDate(session.date)}</td> 
                           <td className="p-4 text-white"> {session.moderatorName} {session.isCovering && <span className="block text-[10px] text-yellow-500 bg-yellow-500/10 px-1.5 py-0.5 rounded w-fit mt-1 border border-yellow-500/20">بديل لـ {session.coveringForName}</span>} </td> 
                           <td className="p-4">{session.shiftName}</td> <td className="p-4 font-mono">{session.checkInTime}</td> <td className="p-4 font-mono">{session.checkOutTime || '-'}</td> 
                           <td className="p-4"> 
                             <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase border ${session.checkInStatus === 'Late' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-green-500/10 text-green-400 border-green-500/20'}`}>{session.checkInStatus === 'Late' ? 'متأخر' : 'في الموعد'}</span> {session.checkOutStatus === 'Early Leave' && <span className="mr-2 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase bg-red-500/10 text-red-400 border border-red-500/20">خروج مبكر</span>} 
                           </td> 
                           <td className="p-4 text-neon-purple font-black text-xl drop-shadow-[0_0_5px_rgba(157,0,255,0.4)]">{session.totalBookings}</td> 
                         </tr> 
                       ))} {filteredPerformanceData.length === 0 && <tr><td colSpan={7} className="p-12 text-center text-gray-500 italic">لا توجد بيانات جلسات للمرشحات المختارة.</td></tr>} </tbody> 
                     </table> 
                   </TiltCard> 
                 )}
                 
                 {overviewTab === 'Bookings' && ( 
                   <TiltCard className="p-0 border-white/5 overflow-hidden" glowColor="purple"> 
                     <div className="flex flex-wrap items-end gap-4 p-6 bg-black/20 border-b border-white/5"> 
                       <div className="flex flex-col gap-1.5 text-right"> <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">من تاريخ</label> <input type="date" value={sbFilterDateFrom} onChange={e => setSbFilterDateFrom(e.target.value)} className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-neon-purple outline-none transition-colors" /> </div> 
                       <div className="flex flex-col gap-1.5 text-right"> <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">إلى تاريخ</label> <input type="date" value={sbFilterDateTo} onChange={e => setSbFilterDateTo(e.target.value)} className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-neon-purple outline-none transition-colors" /> </div> 
                       <div className="flex flex-col gap-1.5 min-w-[120px] text-right"> <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">المصدر</label> <select value={sbFilterSource} onChange={e => setSbFilterSource(e.target.value)} className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-neon-purple outline-none transition-colors appearance-none"> <option value="All">كل المصادر</option> <option value="Facebook">Facebook</option> <option value="Instagram">Instagram</option> <option value="Whatsapp">Whatsapp</option> <option value="Other">أخرى</option> </select> </div> 
                       <div className="flex flex-col gap-1.5 min-w-[150px] text-right"> <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">المسوق</label> <select value={sbFilterMod} onChange={e => setSbFilterMod(e.target.value)} className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-neon-purple outline-none transition-colors appearance-none"> <option value="All">كل المسوقين</option> {moderators.map(m => <option key={m.id} value={m.name}>{m.name}</option>)} </select> </div> 
                       <div className="flex flex-col gap-1.5 min-w-[120px] text-right"> <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">الحالة</label> <select value={sbFilterStatus} onChange={e => setSbFilterStatus(e.target.value)} className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-neon-purple outline-none transition-colors appearance-none"> <option value="All">كل الحالات</option> <option value="booked">محجوز</option> <option value="checked-in">وصل العيادة</option> <option value="completed">مكتمل</option> <option value="cancelled">ملغي</option> </select> </div> 
                       <button onClick={() => { setSbFilterDateFrom(''); setSbFilterDateTo(''); setSbFilterSource('All'); setSbFilterMod('All'); setSbFilterStatus('All'); }} className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-lg text-sm font-bold flex items-center gap-2 transition-colors border border-white/5"> <RefreshCw size={16} /> </button> 
                       <div className="flex-1 text-left"> <button onClick={() => { const dataToExport = socialBookings.map(a => ({ Date: formatDate(a.date), ClientName: a.name, Source: a.source, Moderator: a.createdBy || 'Unknown', Status: a.status })); exportToExcel(dataToExport, `Moderator_Bookings_${todayStr}`); }} className="flex items-center gap-2 px-5 py-2.5 bg-green-600/10 text-green-400 border border-green-500/30 rounded-xl hover:bg-green-600/20 transition-all font-bold text-xs uppercase tracking-wide mr-auto"> <FileDown size={18} /> Excel </button> </div> 
                     </div> 
                     <table className="w-full text-right text-sm text-gray-400"> 
                       <thead className="bg-white/5 text-gray-300 uppercase font-bold text-xs tracking-wider"> <tr> <th className="p-4">التاريخ</th> <th className="p-4">اسم العميل</th> <th className="p-4">المصدر</th> <th className="p-4">المسوق</th> <th className="p-4">الحالة</th> </tr> </thead> 
                       <tbody className="divide-y divide-white/5 font-bold"> {socialBookings.map(appt => ( 
                         <tr key={appt.id} className="hover:bg-white/5 transition-colors"> <td className="p-4 font-mono">{formatDate(appt.date)}</td> <td className="p-4 text-white text-base">{appt.name}</td> <td className="p-4"><span className="px-2.5 py-1 border border-white/10 bg-white/5 rounded-md text-xs">{appt.source}</span></td> <td className="p-4 text-neon-purple font-medium">{appt.createdBy || 'Unknown'}</td> <td className="p-4"><span className="px-3 py-1 bg-gray-800/50 rounded-full text-xs font-bold uppercase tracking-wider text-gray-300 border border-gray-700">{appt.status}</span></td> </tr> ))} {socialBookings.length === 0 && <tr><td colSpan={5} className="p-12 text-center text-gray-500 italic">لا توجد حجوزات سوشيال ميديا تطابق المرشحات.</td></tr>} </tbody> 
                     </table> 
                   </TiltCard> 
                 )}
            </div>
        )}

        {subTab === 'Moderator' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mx-auto max-w-6xl animate-fade-in">
                {sessionStep === 'check-in' ? ( 
                  <TiltCard className="p-10 border-neon-purple/30 shadow-2xl lg:col-span-2 max-w-2xl mx-auto text-right" glowColor="purple"> 
                    <h3 className="text-3xl font-black text-white mb-8 flex items-center gap-4"> <div className="p-2 bg-neon-purple/20 rounded-xl text-neon-purple"><UserCheck size={32} /></div> تسجيل دخول المسوق </h3> 
                    <div className="space-y-6"> 
                      <div> <label className="block text-xs uppercase text-gray-400 font-bold mb-2 tracking-wider">التاريخ</label> <input type="date" value={checkInForm.date} onChange={e => setCheckInForm({...checkInForm, date: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white focus:border-neon-purple transition-all outline-none" /> </div> 
                      <div> <label className="block text-xs uppercase text-gray-400 font-bold mb-2 tracking-wider">الاسم</label> <select value={checkInForm.moderatorId} onChange={e => setCheckInForm({...checkInForm, moderatorId: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white focus:border-neon-purple transition-all outline-none appearance-none cursor-pointer"> <option value="" className="bg-gray-900">اختر الاسم...</option> {moderators.map(m => <option key={m.id} value={m.id} className="bg-gray-900">{m.name}</option>)} </select> </div> 
                      <div> <label className="block text-xs uppercase text-gray-400 font-bold mb-2 tracking-wider">الوردية</label> <select value={checkInForm.shiftId} onChange={e => setCheckInForm({...checkInForm, shiftId: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white focus:border-neon-purple transition-all outline-none appearance-none cursor-pointer"> <option value="" className="bg-gray-900">اختر الوردية...</option> {shifts.map(s => <option key={s.id} value={s.id} className="bg-gray-900">{s.name} ({s.startTime} - {s.endTime})</option>)} </select> </div> 
                      <div className="flex items-center gap-3 bg-white/5 p-4 rounded-xl border border-white/5"> <input type="checkbox" checked={checkInForm.isCovering} onChange={e => setCheckInForm({...checkInForm, isCovering: e.target.checked})} className="w-5 h-5 accent-neon-purple rounded cursor-pointer" /> <label className="text-sm font-bold text-white tracking-wide">هل أنت بديل لزميل آخر؟</label> </div> 
                      {checkInForm.isCovering && ( <div className="animate-slide-up"> <label className="block text-xs uppercase text-gray-400 font-bold mb-2 tracking-wider">اسم الزميل الغائب</label> <select value={checkInForm.coveringForId} onChange={e => setCheckInForm({...checkInForm, coveringForId: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white focus:border-neon-purple transition-all outline-none appearance-none"> <option value="" className="bg-gray-900">اختر المسوق...</option> {moderators.map(m => <option key={m.id} value={m.id} className="bg-gray-900">{m.name}</option>)} </select> </div> )} 
                      <button onClick={handleCheckIn} className="w-full py-5 mt-6 bg-gradient-to-r from-neon-purple to-pink-600 rounded-xl text-white font-extrabold text-lg hover:shadow-2xl transition-all flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98]"> <Clock size={24} /> ابدأ جلسة العمل </button> 
                    </div> 
                  </TiltCard> 
                ) : ( 
                  <> 
                    <TiltCard className="p-8 border-green-500/30 relative overflow-hidden shadow-2xl text-right" glowColor="green"> 
                      <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-l from-green-500 to-emerald-400 animate-pulse-slow"></div> 
                      <div className="flex items-center justify-between mb-8"> <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_10px_#22c55e] animate-pulse"></div> <div className="text-right"> <h3 className="text-2xl font-black text-white mb-1">الجلسة نشطة</h3> <p className="text-gray-400 text-sm">تم الدخول بواسطة <span className="text-white font-bold">{currentSession?.moderatorName}</span></p> </div> </div> 
                      
                      {isBookingPaused && (
                          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3">
                              <AlertCircle size={18} className="text-red-400" />
                              <span className="text-xs text-red-200 font-bold uppercase tracking-wider">نظام الحجز متوقف من الإدارة حالياً</span>
                          </div>
                      )}

                      <div className="space-y-4 mb-8 p-6 bg-black/30 rounded-2xl border border-white/10 backdrop-blur-sm text-right"> 
                        <h4 className="font-bold text-neon-purple mb-4 uppercase tracking-widest text-xs">إدخال حجز جديد</h4> 
                        <div className="grid grid-cols-2 gap-4" dir="ltr"> 
                          <input type="date" value={modBooking.date} onChange={e => setModBooking({...modBooking, date: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3.5 text-white mb-2 focus:border-neon-purple transition-colors outline-none" /> 
                          <input type="time" value={modBooking.time} onChange={e => setModBooking({...modBooking, time: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3.5 text-white mb-2 focus:border-neon-purple transition-colors outline-none" /> 
                        </div> 
                        <input type="text" placeholder="اسم العميل" value={modBooking.name} onChange={e => setModBooking({...modBooking, name: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3.5 text-white mb-2 focus:border-neon-purple transition-colors outline-none text-right" /> 
                        <div className="grid grid-cols-2 gap-4" dir="ltr">
                            <input type="tel" placeholder="رقم الهاتف" value={modBooking.phone} onChange={e => setModBooking({...modBooking, phone: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3.5 text-white mb-2 focus:border-neon-purple transition-colors outline-none" /> 
                            <input type="tel" placeholder="رقم التواصل" value={modBooking.contactingNumber} onChange={e => setModBooking({...modBooking, contactingNumber: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3.5 text-white mb-2 focus:border-neon-purple transition-colors outline-none" /> 
                        </div>
                        <select value={modBooking.source} onChange={e => setModBooking({...modBooking, source: e.target.value as any})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3.5 text-white mb-2 focus:border-neon-purple transition-colors outline-none appearance-none cursor-pointer"> <option value="Facebook" className="bg-gray-900">Facebook</option> <option value="Instagram" className="bg-gray-900">Instagram</option> <option value="Whatsapp" className="bg-gray-900">Whatsapp</option> <option value="Other" className="bg-gray-900">أخرى</option> </select> 
                        <textarea placeholder="ملاحظات (اختياري)" value={modBooking.notes} onChange={e => setModBooking({...modBooking, notes: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3.5 text-white mb-2 focus:border-neon-purple transition-colors outline-none resize-none text-right" rows={3} /> 
                        
                        <button 
                            onClick={handleModBooking} 
                            disabled={modBooking.date === todayStr && isActionDisabled}
                            className={`w-full py-4 border rounded-xl font-black transition-all mt-2 
                                ${modBooking.date === todayStr && isActionDisabled 
                                    ? 'bg-gray-800 text-gray-500 border-gray-700 cursor-not-allowed' 
                                    : 'bg-neon-purple/10 text-neon-purple border-neon-purple/50 hover:bg-neon-purple hover:text-white hover:shadow-2xl'
                                }`}
                        > 
                            + تسجيل الحجز بالنظام 
                        </button> 
                      </div> 
                      <button onClick={handleCheckOut} className="w-full py-4 bg-red-500/10 text-red-400 border border-red-500/30 rounded-xl font-black hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-3"> <LogOut size={20} /> خروج من الجلسة </button> 
                    </TiltCard> 
                    <TiltCard className="p-6 border-white/5 flex flex-col h-full bg-black/20 text-right" glowColor="purple"> 
                      <h3 className="text-xl font-black text-white mb-6 uppercase tracking-wider flex items-center gap-3 justify-end"><div className="w-2 h-2 rounded-full bg-neon-purple shadow-[0_0_8px_#9d00ff]"></div> سجل الجلسة الحالية</h3> 
                      <div className="flex-1 overflow-y-auto space-y-3 max-h-[500px] custom-scrollbar pl-2"> {mySessionBookings.map(booking => ( 
                        <div key={booking.id} className="p-4 rounded-xl bg-white/5 border border-white/5 flex justify-between items-center group hover:border-neon-purple/40 hover:bg-white/10 transition-all"> 
                          <button onClick={() => { setEditingBooking({...booking}); setShowEditBookingModal(true); }} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors" > <Edit2 size={16} /> </button> 
                          <div className="text-right"> <h4 className="font-bold text-gray-200 group-hover:text-white transition-colors">{booking.name}</h4> <p className="text-xs text-gray-500 mt-0.5" dir="ltr">{booking.phone} • <span className="text-neon-purple">{booking.source}</span></p> </div> 
                        </div> ))} {mySessionBookings.length === 0 && ( <div className="text-center py-16 text-gray-600 text-sm flex flex-col items-center gap-3"> <Activity size={24} className="opacity-20"/> <span>لا توجد تسجيلات حتى الآن.</span> </div> )} 
                      </div> 
                    </TiltCard> 
                  </> 
                )}
            </div>
        )}

        {subTab === 'Manager' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in text-right">
                {/* Moderator Management */}
                <TiltCard className="p-8 border-white/5" glowColor="purple">
                    <div className="flex justify-between items-center mb-8">
                        <button 
                            onClick={() => { setEditingMod(null); setNewModName(''); setShowModModal(true); }}
                            className="p-2 bg-neon-purple text-white rounded-lg hover:bg-white hover:text-black transition-all shadow-lg"
                        >
                            <Plus size={24} />
                        </button>
                        <h3 className="text-2xl font-black flex items-center gap-4 text-white">
                            قائمة المسوقين <div className="p-2 bg-neon-purple/10 rounded-lg text-neon-purple"><Users size={28} /></div> 
                        </h3>
                    </div>

                    <div className="space-y-4">
                        {moderators.map(mod => (
                            <div key={mod.id} className="flex items-center justify-between p-5 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors group">
                                <div className="flex gap-3">
                                    <button onClick={() => { setEditingMod(mod); setNewModName(mod.name); setShowModModal(true); }} className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-xl transition-all"><Edit2 size={18} /></button>
                                    <button onClick={() => deleteModerator(mod.id)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-xl transition-all"><Trash2 size={18} /></button>
                                </div>
                                <span className="font-black text-white text-xl group-hover:text-neon-purple transition-colors">{mod.name}</span>
                            </div>
                        ))}
                    </div>
                </TiltCard>

                {/* Shift Management */}
                <TiltCard className="p-8 border-white/5" glowColor="cyan">
                    <div className="flex justify-between items-center mb-8">
                        <button 
                            onClick={() => { setEditingShift(null); setNewShift({ name: '', startTime: '09:00', endTime: '17:00' }); setShowShiftModal(true); }}
                            className="p-2 bg-neon-blue text-black rounded-lg hover:bg-white transition-all shadow-lg"
                        >
                            <Plus size={24} />
                        </button>
                        <h3 className="text-2xl font-black flex items-center gap-4 text-white">
                            إدارة الورديات <div className="p-2 bg-neon-blue/10 rounded-lg text-neon-blue"><Clock size={28} /></div>
                        </h3>
                    </div>

                    <div className="space-y-4">
                        {shifts.map(shift => (
                            <div key={shift.id} className="p-5 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all group">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex gap-3">
                                        <button onClick={() => { setEditingShift(shift); setNewShift({ ...shift }); setShowShiftModal(true); }} className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-xl transition-all"><Edit2 size={18} /></button>
                                        <button onClick={() => deleteShift(shift.id)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-xl transition-all"><Trash2 size={18} /></button>
                                    </div>
                                    <span className="font-black text-white uppercase tracking-wider text-lg group-hover:text-neon-blue transition-colors">{shift.name}</span>
                                </div>
                                <div className="flex items-center gap-3 text-gray-400 font-mono text-xs justify-end">
                                    {shift.startTime} - {shift.endTime} <Clock size={14} />
                                </div>
                            </div>
                        ))}
                    </div>
                </TiltCard>
            </div>
        )}

      {/* Modals */}
      {showEditBookingModal && ( <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in" dir="rtl"> <div className="w-full max-w-md glass-panel rounded-2xl p-8 border border-neon-purple/20 shadow-2xl animate-slide-up text-right"> <div className="flex justify-between items-center mb-8 pb-4 border-b border-white/10"> <h3 className="text-2xl font-bold text-white tracking-tight">تعديل بيانات الحجز</h3> <button onClick={() => setShowEditBookingModal(false)} className="text-gray-400 hover:text-white bg-white/5 p-2 rounded-full hover:bg-white/10 transition-colors"><XCircle size={28}/></button> </div> <div className="space-y-5"> <input type="text" placeholder="اسم العميل" value={editingBooking.name || ''} onChange={e => setEditingBooking({...editingBooking, name: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3.5 text-white focus:border-neon-purple outline-none transition-colors text-right" /> <div className="grid grid-cols-2 gap-4" dir="ltr"> <input type="tel" placeholder="رقم الهاتف" value={editingBooking.phone || ''} onChange={e => setEditingBooking({...editingBooking, phone: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3.5 text-white focus:border-neon-purple outline-none transition-colors" /> <input type="tel" placeholder="رقم التواصل" value={editingBooking.contactingNumber || ''} onChange={e => setEditingBooking({...editingBooking, contactingNumber: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3.5 text-white focus:border-neon-purple outline-none transition-colors" /> </div> <select value={editingBooking.source} onChange={e => setEditingBooking({...editingBooking, source: e.target.value as any})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3.5 text-white focus:border-neon-purple outline-none appearance-none"> <option value="Facebook" className="bg-gray-900">Facebook</option> <option value="Instagram" className="bg-gray-900">Instagram</option> <option value="Whatsapp" className="bg-gray-900">Whatsapp</option> <option value="Other" className="bg-gray-900">أخرى</option> </select> <textarea placeholder="ملاحظات" value={editingBooking.notes || ''} onChange={e => setEditingBooking({...editingBooking, notes: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3.5 text-white focus:border-neon-purple outline-none transition-colors resize-none text-right" rows={3} /> <button onClick={() => { if(editingBooking.id && editingBooking.name) { updateAppointment(editingBooking.id, editingBooking); setShowEditBookingModal(false); setEditingBooking({}); } }} className="w-full py-5 bg-gradient-to-r from-neon-purple to-pink-600 rounded-xl text-white font-black text-xl hover:shadow-2xl transition-all"> تحديث البيانات </button> </div> </div> </div> )}

      {showModModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in" dir="rtl">
              <div className="w-full max-w-md glass-panel rounded-3xl p-10 border border-neon-purple/20 shadow-2xl animate-slide-up text-right">
                  <div className="flex justify-between items-center mb-10 border-b border-white/10 pb-6">
                      <h3 className="text-2xl font-black text-white">{editingMod ? 'تعديل بيانات المسوق' : 'إضافة مسوق جديد'}</h3>
                      <button onClick={() => setShowModModal(false)} className="p-2 bg-white/5 rounded-full text-gray-400 hover:text-white transition-colors"><XCircle size={28}/></button>
                  </div>
                  <form onSubmit={handleModSubmit} className="space-y-8">
                      <div>
                          <label className="block text-sm font-black text-gray-500 uppercase tracking-widest mb-3 mr-2">الاسم الكامل للمسوق</label>
                          <input 
                              type="text" 
                              autoFocus
                              value={newModName} 
                              onChange={e => setNewModName(e.target.value)}
                              className="w-full bg-black/40 border-2 border-white/10 rounded-2xl p-5 text-xl text-white outline-none focus:border-neon-purple transition-all text-right"
                              placeholder="أدخل الاسم هنا..."
                          />
                      </div>
                      <button type="submit" className="w-full py-5 bg-neon-purple text-white font-black rounded-2xl hover:opacity-90 shadow-xl transition-all text-xl">
                          {editingMod ? 'تحديث البيانات' : 'حفظ المسوق'}
                      </button>
                  </form>
              </div>
          </div>
      )}

      {showShiftModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in" dir="rtl">
              <div className="w-full max-w-md glass-panel rounded-3xl p-10 border border-neon-blue/20 shadow-2xl animate-slide-up text-right">
                  <div className="flex justify-between items-center mb-10 border-b border-white/10 pb-6">
                      <h3 className="text-2xl font-black text-white">{editingShift ? 'تعديل الوردية' : 'إضافة وردية عمل'}</h3>
                      <button onClick={() => setShowShiftModal(false)} className="p-2 bg-white/5 rounded-full text-gray-400 hover:text-white transition-colors"><XCircle size={28}/></button>
                  </div>
                  <form onSubmit={handleShiftSubmit} className="space-y-8">
                      <div>
                          <label className="block text-sm font-black text-gray-500 mb-3 mr-2">اسم الوردية</label>
                          <input 
                              type="text" 
                              autoFocus
                              value={newShift.name} 
                              onChange={e => setNewShift({...newShift, name: e.target.value})}
                              className="w-full bg-black/40 border-2 border-white/10 rounded-2xl p-5 text-xl text-white outline-none focus:border-neon-blue transition-all text-right"
                              placeholder="مثلاً: الوردية الصباحية"
                          />
                      </div>
                      <div className="grid grid-cols-2 gap-8" dir="ltr">
                          <div>
                              <label className="block text-xs font-black text-gray-500 mb-3 ml-2 uppercase text-right">وقت الانتهاء</label>
                              <input 
                                  type="time" 
                                  value={newShift.endTime} 
                                  onChange={e => setNewShift({...newShift, endTime: e.target.value})}
                                  className="w-full bg-black/40 border-2 border-white/10 rounded-2xl p-4 text-xl text-white outline-none focus:border-neon-blue transition-all"
                              />
                          </div>
                          <div>
                              <label className="block text-xs font-black text-gray-500 mb-3 ml-2 uppercase text-right">وقت البدء</label>
                              <input 
                                  type="time" 
                                  value={newShift.startTime} 
                                  onChange={e => setNewShift({...newShift, startTime: e.target.value})}
                                  className="w-full bg-black/40 border-2 border-white/10 rounded-2xl p-4 text-xl text-white outline-none focus:border-neon-blue transition-all"
                              />
                          </div>
                      </div>
                      <button type="submit" className="w-full py-5 bg-neon-blue text-black font-black rounded-2xl hover:opacity-90 shadow-xl transition-all text-xl">
                          {editingShift ? 'تحديث الوردية' : 'حفظ الوردية'}
                      </button>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default SocialMediaViewAR;

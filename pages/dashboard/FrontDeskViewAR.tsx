
import React, { useState, useMemo, useContext, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import TiltCard from '../../components/TiltCard';
import { DashboardUIContext } from '../../contexts/DashboardUIContext';
import { exportToExcel } from '../../utils/exportHelper';
import { Appointment } from '../../types';
import { formatDate } from '../../utils/formatters';
import ConfirmationModal from '../../components/ConfirmationModal';
import { 
  Monitor, Video, Search, RefreshCw, FileDown, Plus, Edit2, 
  CheckCircle, XOctagon, Trash2, UserPlus, GripVertical, Clock, 
  ArrowLeftCircle, Users, Power, Megaphone, Stethoscope, XCircle,
  AlertCircle, Ban, Activity, UserCheck, ClipboardList
} from 'lucide-react';

const FrontDeskViewAR: React.FC = () => {
  const [subTab, setSubTab] = useState('المكتب');
  const { systemUser } = useAuth();
  const { setHeaderHidden } = useContext(DashboardUIContext);
  const { 
    appointments, addAppointment, updateAppointment, 
    updateAppointmentStatus, reorderQueue, deleteAppointment, 
    doctorStatus, callingPatientId, isBookingPaused,
    hasAssistantDoctor, assistantDoctorStatus, callingPatientIdAssistant
  } = useData();
  
  const todayStr = new Date().toISOString().split('T')[0];
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sourceFilter, setSourceFilter] = useState('All');
  const [searchName, setSearchName] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [visitTypeFilter, setVisitTypeFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Appointment>>({ 
    date: todayStr, 
    time: '09:00', 
    source: 'Phone Call', 
    status: 'booked',
    visitType: 'New'
  });
  
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  useEffect(() => {
    setHeaderHidden(showModal);
  }, [showModal, setHeaderHidden]);

  const canAdd = (systemUser?.role === 'admin' || systemUser?.permissions?.front_desk?.access === true);
  const canDelete = (systemUser?.role === 'admin' || systemUser?.permissions?.front_desk?.actions?.delete_booking);
  
  const isActionDisabled = isBookingPaused;

  const filteredAppointments = useMemo(() => {
    return appointments.filter(appt => {
        const matchesNameOrPhone = appt.name.toLowerCase().includes(searchName.toLowerCase()) || appt.phone.includes(searchName);
        const matchesSource = sourceFilter === 'All' || appt.source === sourceFilter;
        const matchesStatus = statusFilter === 'All' || appt.status === statusFilter;
        const matchesVisitType = visitTypeFilter === 'All' || appt.visitType === visitTypeFilter;
        const matchesDateFrom = dateFrom ? appt.date >= dateFrom : true;
        const matchesDateTo = dateTo ? appt.date <= dateTo : true;
        return matchesNameOrPhone && matchesSource && matchesStatus && matchesVisitType && matchesDateFrom && matchesDateTo;
    });
  }, [appointments, searchName, sourceFilter, statusFilter, visitTypeFilter, dateFrom, dateTo]);

  const deskCounts = { 
    total: filteredAppointments.length, 
    checkIn: filteredAppointments.filter(a => a.status === 'checked-in').length, 
    today: filteredAppointments.filter(a => a.date === todayStr).length 
  };
  
  const openAddModal = () => { 
      if (isActionDisabled) {
          alert("توقف الطبيب عن استقبال حالات جديدة اليوم.");
          return;
      }
      setEditId(null); 
      setFormData({ 
          date: todayStr, 
          time: '09:00', 
          source: 'Phone Call', 
          status: 'booked', 
          visitType: 'New',
          age: '',
          residence: '',
          phone: '',
          contactingNumber: ''
      }); 
      setShowModal(true); 
  };
  
  const openEditModal = (appt: Appointment) => { 
      setEditId(appt.id); 
      setFormData({ ...appt }); 
      setShowModal(true); 
  };
  
  const handleModalSubmit = (e: React.FormEvent) => { 
      e.preventDefault(); 
      if(formData.name && formData.phone) { 
          if (formData.date === todayStr && isActionDisabled && !editId) {
             alert("توقف الطبيب عن استقبال حالات جديدة اليوم.");
             return;
          }
          if (editId) { 
              updateAppointment(editId, formData); 
          } else { 
              addAppointment(formData as any); 
          } 
          setShowModal(false); 
          setEditId(null); 
          setFormData({ date: todayStr, time: '09:00', source: 'Phone Call', status: 'booked', visitType: 'New' }); 
      } 
  };
  
  const handleWalkIn = () => { 
      if (isActionDisabled) {
          alert("توقف الطبيب عن استقبال حالات جديدة اليوم.");
          return;
      }
      const now = new Date(); 
      setEditId(null); 
      setFormData({ 
          date: now.toISOString().split('T')[0], 
          time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }), 
          name: '', 
          phone: '', 
          contactingNumber: '',
          source: 'Walk-in', 
          paid: 0, 
          notes: '', 
          status: 'checked-in',
          checkInTime: now.getTime(),
          visitType: 'New',
          age: '',
          residence: ''
      }); 
      setShowModal(true); 
  };
  
  const resetFilters = () => { setDateFrom(''); setDateTo(''); setSourceFilter('All'); setStatusFilter('All'); setVisitTypeFilter('All'); setSearchName(''); };
  const setFilterToday = () => { setDateFrom(todayStr); setDateTo(todayStr); };
  
  // Show Checked-in AND In-Assistant (Sheetting) in the Live Queue
  const liveQueue = useMemo(() => 
    appointments
        .filter(a => a.status === 'checked-in' || a.status === 'in-assistant')
        .sort((a, b) => (a.queueOrder ?? 9999) - (b.queueOrder ?? 9999) || (a.checkInTime || 0) - (b.checkInTime || 0)), 
  [appointments]);

  const currentExam = useMemo(() => appointments.find(a => a.status === 'in-exam'), [appointments]);
  const callingPatient = useMemo(() => appointments.find(a => a.id === callingPatientId && a.status === 'checked-in'), [appointments, callingPatientId]);
  
  const currentAssistantPatient = useMemo(() => appointments.find(a => a.status === 'in-assistant'), [appointments]);
  const callingAssistantPatient = useMemo(() => appointments.find(a => a.id === callingPatientIdAssistant && a.status === 'checked-in'), [appointments, callingPatientIdAssistant]);

  const handleDragStart = (e: React.DragEvent, index: number) => { e.dataTransfer.setData('index', index.toString()); };
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); };
  const handleDrop = (e: React.DragEvent, targetIndex: number) => { const startIndex = Number(e.dataTransfer.getData('index')); reorderQueue(startIndex, targetIndex); };
  
  const moveToExam = (appt: Appointment) => { 
      if (doctorStatus === 'resting') return; 
      if (currentExam) { 
          updateAppointmentStatus(currentExam.id, 'completed'); 
      } 
      updateAppointmentStatus(appt.id, 'in-exam'); 
  };

  const moveToAssistant = (appt: Appointment) => {
      // Keep patient visible in live queue by status filter logic, just change status
      updateAppointmentStatus(appt.id, 'in-assistant');
  };

  const handleDeleteClick = (id: string) => {
      setDeleteId(id);
  };

  const confirmDelete = () => {
      if (deleteId) {
          deleteAppointment(deleteId);
          setDeleteId(null);
      }
  };

  const handleDownloadExcel = () => {
      const dataToExport = filteredAppointments.map(a => ({
          'الرقم': a.no,
          'التاريخ': formatDate(a.date),
          'الوقت': a.time,
          'الاسم': a.name,
          'العمر': a.age || '-',
          'السكن': a.residence || '-',
          'النوع': a.visitType === 'New' ? 'كشف جديد' : 'متابعة',
          'الهاتف': a.phone,
          'رقم التواصل': a.contactingNumber || '-',
          'المصدر': a.source,
          'المدفوع': a.paid,
          'الحالة': a.status,
          'ملاحظات': a.notes
      }));
      exportToExcel(dataToExport, `قائمة_الحجوزات_${todayStr}`);
  };

  return (
    <div className="space-y-6 font-arabic" dir="rtl">
      <div className="flex flex-wrap gap-4 mb-8">
        {[ { id: 'المكتب', icon: <Monitor size={20} /> }, { id: 'البث المباشر', icon: <Video size={20} /> } ].map((tab) => ( 
            <button 
                key={tab.id} 
                onClick={() => setSubTab(tab.id)} 
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all duration-300 ${subTab === tab.id ? 'bg-neon-blue text-black shadow-[0_0_15px_-3px_rgba(0,243,255,0.4)] transform -translate-y-1' : 'bg-black/30 border border-white/5 text-gray-400 hover:text-white hover:bg-white/5' }`}
            > 
                {tab.icon} {tab.id} 
            </button> 
        ))}
      </div>

      {isBookingPaused && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 flex items-center gap-5 animate-pulse">
              <div className="w-12 h-12 rounded-2xl bg-red-500/20 flex items-center justify-center text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]">
                  <AlertCircle size={28} />
              </div>
              <div className="text-right">
                  <h4 className="font-black text-red-400 uppercase tracking-[0.1em] text-lg">توقف الطبيب عن استقبال المرضى</h4>
                  <p className="text-sm text-red-200/80 font-medium italic">تم تعطيل نظام الحجز حالياً من قبل الطبيب.</p>
              </div>
          </div>
      )}

      {subTab === 'المكتب' && (
        <div className="animate-fade-in space-y-6">
             <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                {/* Filters */}
                <TiltCard className="p-6 flex flex-col justify-center space-y-2 lg:col-span-3 border-white/10" noTilt>
                    <div className="flex flex-wrap items-end gap-4 text-right">
                        <div className="flex flex-col gap-1.5"> <label className="text-xs text-gray-500 font-bold uppercase tracking-wider">من تاريخ</label> <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-neon-blue outline-none transition-colors" /> </div>
                        <div className="flex flex-col gap-1.5"> <label className="text-xs text-gray-500 font-bold uppercase tracking-wider">إلى تاريخ</label> <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-neon-blue outline-none transition-colors" /> </div>
                        <div className="flex flex-col gap-1.5"> <label className="text-xs text-gray-500 font-bold uppercase tracking-wider">المصدر</label> <select value={sourceFilter} onChange={e => setSourceFilter(e.target.value)} className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-neon-blue outline-none transition-colors min-w-[120px] appearance-none"> <option value="All" className="bg-gray-900">جميع المصادر</option> <option value="Social Media" className="bg-gray-900">سوشيال ميديا</option> <option value="Phone Call" className="bg-gray-900">مكالمة هاتفية</option> <option value="Clinic Visit" className="bg-gray-900">زيارة عيادة</option> <option value="Walk-in" className="bg-gray-900">دخول مباشر</option> </select> </div>
                        <div className="flex flex-col gap-1.5"> <label className="text-xs text-gray-500 font-bold uppercase tracking-wider">الحالة</label> <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-neon-blue outline-none transition-colors min-w-[100px] appearance-none"> <option value="All" className="bg-gray-900">جميع الحالات</option> <option value="booked" className="bg-gray-900">محجوز</option> <option value="checked-in" className="bg-gray-900">وصل العيادة</option> <option value="in-exam" className="bg-gray-900">بالداخل</option> <option value="completed" className="bg-gray-900">مكتمل</option> <option value="cancelled" className="bg-gray-900">ملغي</option> </select> </div>
                        <div className="flex flex-col gap-1.5"> <label className="text-xs text-gray-500 font-bold uppercase tracking-wider">النوع</label> <select value={visitTypeFilter} onChange={e => setVisitTypeFilter(e.target.value)} className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-neon-blue outline-none transition-colors min-w-[100px] appearance-none"> <option value="All" className="bg-gray-900">الكل</option> <option value="New" className="bg-gray-900">كشف جديد</option> <option value="Follow-up" className="bg-gray-900">متابعة</option> </select> </div>
                        <div className="flex flex-col gap-1.5 flex-1 min-w-[150px]"> <label className="text-xs text-gray-500 font-bold uppercase tracking-wider">بحث</label> <div className="relative group"> <Search size={16} className="absolute right-3 top-2.5 text-gray-500 group-focus-within:text-neon-blue transition-colors" /> <input type="text" value={searchName} onChange={e => setSearchName(e.target.value)} placeholder="الاسم أو الهاتف..." className="w-full bg-black/40 border border-white/10 rounded-lg pr-10 pl-3 py-2 text-sm text-white focus:border-neon-blue outline-none transition-colors focus:bg-black/60" /> </div> </div>
                         <div className="flex gap-2"> <button onClick={resetFilters} className="p-2.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors border border-white/5" title="إعادة ضبط"> <RefreshCw size={18} /> </button> </div>
                    </div>
                </TiltCard>
                <div className="grid grid-cols-3 gap-3">
                     <div className="bg-neon-blue/5 border border-neon-blue/20 rounded-2xl p-4 text-center flex flex-col justify-center items-center shadow-[0_0_15px_-5px_rgba(0,243,255,0.1)] hover:bg-neon-blue/10 transition-colors group"> <span className="text-3xl font-black text-white group-hover:drop-shadow-[0_0_5px_rgba(0,243,255,0.5)] transition-all">{deskCounts.total}</span> <span className="text-[10px] text-neon-blue uppercase font-bold tracking-widest mt-1">الإجمالي</span> </div>
                     <div className="bg-purple-500/5 border border-purple-500/20 rounded-2xl p-4 text-center flex flex-col justify-center items-center shadow-[0_0_15px_-5px_rgba(168,85,247,0.1)] hover:bg-purple-500/10 transition-colors group"> <span className="text-3xl font-black text-white group-hover:drop-shadow-[0_0_5px_rgba(168,85,247,0.5)] transition-all">{deskCounts.checkIn}</span> <span className="text-[10px] text-purple-400 uppercase font-bold tracking-widest mt-1">بالانتظار</span> </div>
                     <div onClick={setFilterToday} className="bg-green-500/5 border border-green-500/20 rounded-2xl p-4 text-center flex flex-col justify-center items-center shadow-[0_0_15px_-5px_rgba(34,197,94,0.1)] hover:bg-green-500/10 transition-colors group cursor-pointer"> <span className="text-3xl font-black text-white group-hover:drop-shadow-[0_0_5px_rgba(34,197,94,0.5)] transition-all">{deskCounts.today}</span> <span className="text-[10px] text-green-400 uppercase font-bold tracking-widest mt-1 group-hover:underline">اليوم</span> </div>
                </div>
            </div>
            {/* Table */}
            <TiltCard className="p-0 overflow-hidden border-white/5" glowColor="cyan">
                 <div className="flex justify-between items-center p-6 border-b border-white/5 bg-black/20 relative z-10"> 
                     <h3 className="text-xl font-bold text-neon-blue flex items-center gap-2"><Monitor size={20} /> قائمة الحجوزات</h3> 
                     <div className="flex gap-3">
                        <button onClick={handleDownloadExcel} className="flex items-center gap-2 px-4 py-2 bg-green-600/10 text-green-400 border border-green-500/30 rounded-lg hover:bg-green-600/20 transition-colors font-bold text-xs uppercase tracking-wide">
                            <FileDown size={16} /> تصدير
                        </button>
                        {canAdd && (
                            <button 
                                onClick={openAddModal} 
                                disabled={isActionDisabled}
                                className={`flex items-center gap-2 px-5 py-2 rounded-lg text-black font-bold transition-all text-xs uppercase tracking-wide
                                    ${isActionDisabled 
                                        ? 'bg-gray-800 text-gray-500 cursor-not-allowed opacity-40 border border-gray-700' 
                                        : 'bg-gradient-to-l from-neon-blue to-cyan-600 hover:shadow-[0_0_15px_rgba(0,243,255,0.4)] hover:scale-105 active:scale-95'
                                    }`}
                            > 
                                <Plus size={16} /> إضافة حجز 
                            </button>
                        )}
                     </div>
                 </div>
                 <div className="overflow-x-auto relative z-10">
                    <table className="w-full text-right text-sm text-gray-400">
                      <thead className="bg-white/5 text-gray-300 uppercase font-bold text-xs tracking-wider"> 
                          <tr> 
                              <th className="p-4">م</th> 
                              <th className="p-4">التاريخ / الوقت</th> 
                              <th className="p-4">اسم المريض</th> 
                              <th className="p-4">النوع</th>
                              <th className="p-4">السكن</th>
                              <th className="p-4">الهاتف</th> 
                              <th className="p-4">المصدر</th> 
                              <th className="p-4">المدفوع</th> 
                              <th className="p-4">ملاحظات</th> 
                              <th className="p-4">الحالة</th> 
                              <th className="p-4 text-center">الإجراءات</th> 
                          </tr> 
                      </thead>
                      <tbody className="divide-y divide-white/5 font-bold">
                        {filteredAppointments.map((appt) => (
                          <tr key={appt.id} className="hover:bg-white/5 transition-colors group">
                            <td className="p-4 font-mono text-xs opacity-60">{appt.no}</td>
                            <td className="p-4"><div className="text-white">{formatDate(appt.date)}</div><div className="text-[10px] text-gray-500 font-mono mt-0.5">{appt.time}</div></td>
                            <td className="p-4">
                                <div className="font-medium text-white group-hover:text-neon-blue transition-colors text-base">{appt.name}</div>
                                <div className="text-[10px] text-gray-500 mt-0.5">العمر: {appt.age ? `${appt.age} سنة` : '-'}</div>
                            </td>
                            <td className="p-4">
                                <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded border ${appt.visitType === 'New' ? 'text-neon-blue border-neon-blue/30 bg-neon-blue/10' : 'text-purple-400 border-purple-400/30 bg-purple-400/10'}`}>
                                    {appt.visitType === 'New' ? 'جديد' : 'متابعة'}
                                </span>
                            </td>
                            <td className="p-4 text-xs text-gray-300">{appt.residence || '-'}</td>
                            <td className="p-4">
                                <div className="font-mono text-gray-400">{appt.phone}</div>
                                {appt.contactingNumber && (
                                    <div className="text-[10px] text-gray-500 mt-0.5">تواصل: {appt.contactingNumber}</div>
                                )}
                            </td>
                            <td className="p-4"><span className="px-2.5 py-1 rounded-md border border-white/10 bg-white/5 text-[10px] font-medium">{appt.source}</span></td>
                            <td className="p-4 text-green-400 font-mono font-bold">${appt.paid}</td>
                            <td className="p-4 max-w-[150px] truncate text-xs italic text-gray-500" title={appt.notes}>{appt.notes || '-'}</td>
                            <td className="p-4"> 
                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border
                                    ${appt.status === 'checked-in' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 
                                      appt.status === 'booked' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 
                                      appt.status === 'in-exam' ? 'bg-red-500/10 text-red-400 border-red-500/20 animate-pulse' : 
                                      appt.status === 'in-assistant' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20 animate-pulse' : 
                                      appt.status === 'completed' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 
                                      'bg-gray-700/30 text-gray-500 border-gray-600/30'} 
                                `}> {appt.status === 'booked' ? 'محجوز' : appt.status === 'checked-in' ? 'وصل' : appt.status === 'in-exam' ? 'بالداخل' : appt.status} </span> 
                            </td>
                            <td className="p-4 text-center"> 
                                <div className="flex items-center justify-center gap-2">
                                    <button onClick={() => openEditModal(appt)} className="p-1.5 text-blue-400 hover:text-white bg-blue-500/10 hover:bg-blue-500/30 rounded-lg transition-colors" title="تعديل"> <Edit2 size={16} /> </button> 
                                    {appt.status === 'booked' && ( <button onClick={() => updateAppointmentStatus(appt.id, 'checked-in')} className="p-1.5 text-purple-400 hover:text-white bg-purple-500/10 hover:bg-purple-500/30 rounded-lg transition-colors" title="تسجيل وصول"> <CheckCircle size={16}/> </button> )} 
                                    {appt.status !== 'cancelled' && appt.status !== 'completed' && (
                                        <button onClick={() => updateAppointmentStatus(appt.id, 'cancelled')} className="p-1.5 text-orange-400 hover:text-white bg-orange-500/10 hover:bg-orange-500/30 rounded-lg transition-colors" title="إلغاء"><XOctagon size={16}/></button>
                                    )}
                                    {canDelete && <button onClick={() => handleDeleteClick(appt.id)} className="p-1.5 text-red-400 hover:text-white bg-red-500/10 hover:bg-red-500/30 rounded-lg transition-colors" title="حذف"><Trash2 size={16} /></button>}
                                </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {filteredAppointments.length === 0 && ( <div className="text-center py-12 text-gray-500 italic">لا توجد حجوزات تطابق الفلاتر.</div> )}
                 </div>
            </TiltCard>
        </div>
      )}
      {subTab === 'البث المباشر' && (
        <div className="animate-fade-in grid grid-cols-1 lg:grid-cols-3 gap-6">
           <div className="lg:col-span-2 space-y-4">
              <div className="flex justify-between items-center mb-2"> 
                <h3 className="text-xl font-bold flex items-center gap-3 text-white"> 
                  <div className="p-1.5 bg-neon-blue/10 rounded-lg text-neon-blue"><Video size={20} /></div> قائمة الانتظار المباشرة (بالعيادة) 
                </h3> 
                <div className="flex gap-2"> 
                  {doctorStatus === 'resting' && ( 
                    <div className="flex items-center gap-2 bg-red-500/10 px-4 py-1.5 rounded-full border border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.2)]"> 
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span> 
                      <span className="text-xs font-bold text-red-400 tracking-wider">الطبيب في استراحة</span> 
                    </div> 
                  )} 
                  {canAdd && (
                    <button 
                      onClick={handleWalkIn} 
                      disabled={isActionDisabled}
                      className={`flex items-center gap-2 px-5 py-2 rounded-lg font-bold transition-all text-xs uppercase tracking-wider
                        ${isActionDisabled 
                          ? 'bg-gray-800 text-gray-500 cursor-not-allowed opacity-40 border border-gray-700' 
                          : 'bg-purple-600/10 border border-purple-500/30 text-purple-300 hover:bg-purple-600/30 hover:shadow-[0_0_15px_-5px_rgba(147,51,234,0.3)]'
                        }`}
                    > 
                      <UserPlus size={16} /> دخول مباشر 
                    </button>
                  )} 
                </div> 
              </div>
              <div className="space-y-3">
                  {liveQueue.map((appt, index) => {
                      const isBeingCalled = callingPatientId === appt.id || callingPatientIdAssistant === appt.id;
                      
                      return (
                      <div key={appt.id} draggable onDragStart={(e) => handleDragStart(e, index)} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, index)} className={`p-4 rounded-xl flex justify-between items-center cursor-move transition-all duration-300 group border relative overflow-hidden ${isBeingCalled ? 'bg-neon-blue/10 border-neon-blue/50 shadow-[0_0_20px_-5px_rgba(0,243,255,0.3)] scale-[1.02] z-10' : 'bg-white/5 border-white/5 hover:border-white/20 hover:bg-white/10' }`}>
                         {isBeingCalled && <div className="absolute inset-0 bg-neon-blue/5 animate-pulse-slow pointer-events-none"></div>}
                         <div className="flex items-center gap-5 relative z-10"> 
                             <div className="text-gray-600 group-hover:text-gray-400 cursor-grab active:cursor-grabbing transition-colors"><GripVertical size={20} /></div> 
                             <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-lg border-2 shadow-lg transition-all ${isBeingCalled ? 'bg-neon-blue text-black border-neon-blue shadow-[0_0_15px_rgba(0,243,255,0.5)]' : 'bg-gray-800 text-gray-400 border-gray-700 group-hover:border-gray-500 group-hover:text-white' }`}> {index + 1} </div> 
                             <div className="text-right"> <h4 className={`font-bold text-lg flex items-center gap-3 ${isBeingCalled ? 'text-neon-blue text-glow' : 'text-white'}`}> {appt.name} {isBeingCalled && <span className="text-[10px] text-black font-black px-2 py-0.5 bg-neon-blue rounded uppercase tracking-widest shadow-lg animate-pulse">ينادي</span>} {appt.status === 'in-assistant' && <span className="text-[9px] bg-cyan-500/20 text-cyan-400 border border-cyan-500/40 px-2 py-0.5 rounded flex items-center gap-1 uppercase tracking-wider"><ClipboardList size={10}/> مع المساعد</span>} {appt.isSheeted && <span className="text-[9px] bg-green-500/20 text-green-400 border border-green-500/40 px-2 py-0.5 rounded flex items-center gap-1 uppercase tracking-wider"><CheckCircle size={10}/> تم التجهيز</span>} </h4> <p className="text-xs text-gray-500 font-mono mt-1 flex items-center gap-1"> وصل العيادة: {new Date(appt.checkInTime || 0).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} <Clock size={10}/></p> </div> 
                         </div>
                         <div className="flex items-center gap-4 relative z-10"> 
                             {/* Assistant Button AR */}
                             {hasAssistantDoctor && (
                                <button 
                                    onClick={() => moveToAssistant(appt)} 
                                    disabled={appt.isSheeted || appt.status === 'in-assistant' || assistantDoctorStatus === 'resting'} 
                                    className={`px-3 py-2 rounded-lg border transition-all text-xs font-bold uppercase tracking-wider flex items-center gap-2 
                                        ${appt.isSheeted || appt.status === 'in-assistant' || assistantDoctorStatus === 'resting'
                                            ? 'bg-gray-800 text-gray-600 border-gray-700 cursor-not-allowed opacity-50' 
                                            : 'bg-purple-500/10 text-purple-400 border-purple-500/30 hover:bg-purple-500/20'
                                        }`}
                                    title={appt.isSheeted ? "تمت زيارة المساعد بالفعل" : (assistantDoctorStatus === 'resting' ? "الطبيب المساعد في استراحة" : "إدخال لغرفة المساعد")}
                                > 
                                    {appt.isSheeted ? 'تم التجهيز' : <>إلى المساعد <ArrowLeftCircle size={14} /></>}
                                </button>
                             )}
                             <button onClick={() => moveToExam(appt)} disabled={doctorStatus === 'resting'} className={`px-4 py-2 rounded-lg border transition-all text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${doctorStatus === 'resting' ? 'bg-gray-800 text-gray-600 border-gray-700 cursor-not-allowed opacity-50' : 'bg-green-500/10 text-green-400 border-green-500/30 hover:bg-green-500/20 hover:shadow-[0_0_15px_-5px_rgba(34,197,94,0.4)]' }`}> دخول الغرفة <ArrowLeftCircle size={14} /> </button> 
                         </div>
                      </div>
                  );
                  })}
                  {liveQueue.length === 0 && ( <div className="p-10 text-center border-2 border-dashed border-white/10 rounded-2xl text-gray-500 flex flex-col items-center justify-center gap-2"> <Users size={32} className="opacity-20"/> <span className="text-sm">القائمة فارغة. قم بتسجيل وصول المرضى من "المكتب".</span> </div> )}
              </div>
           </div>
           <div className="space-y-6">
                <TiltCard className="p-0 border-neon-blue/30 shadow-[0_0_30px_-10px_rgba(0,243,255,0.15)] overflow-hidden" glowColor="cyan">
                    <div className="p-4 bg-gradient-to-l from-neon-blue/20 to-transparent border-b border-neon-blue/20 flex items-center gap-3"> <div className={`w-3 h-3 rounded-full shadow-[0_0_10px_currentColor] animate-pulse ${doctorStatus === 'resting' ? 'bg-red-500 text-red-500' : currentExam ? 'bg-red-500 text-red-500' : 'bg-green-500 text-green-500'}`}> </div> <h3 className="text-lg font-black text-white tracking-widest uppercase">حالة الغرفة</h3> </div>
                    <div className="p-6">
                        {doctorStatus === 'resting' ? ( <div className="h-72 flex flex-col items-center justify-center text-gray-500 bg-red-500/5 rounded-xl border border-red-500/10"> <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mb-4 animate-pulse"><Power size={40} className="text-red-500" /></div> <p className="text-xl font-bold text-red-500 tracking-wider">الطبيب في استراحة</p> </div> ) : currentExam ? ( <div className="text-center py-6 animate-in fade-in zoom-in duration-500"> <div className="w-32 h-32 mx-auto bg-black/40 rounded-full flex items-center justify-center mb-6 border-4 border-red-500 relative shadow-[0_0_30px_rgba(239,68,68,0.3)]"> <Users size={48} className="text-white relative z-10" /> <div className="absolute inset-0 border-4 border-transparent border-t-red-500 rounded-full animate-spin"></div> </div> <h3 className="text-red-500 text-sm font-bold mb-2 uppercase tracking-[0.2em] animate-pulse">فحص جاري الآن</h3> <h2 className="text-3xl font-black text-white mb-2 tracking-tight">{currentExam.name}</h2> <p className="text-gray-400 text-sm font-medium mb-8 bg-white/5 inline-block px-3 py-1 rounded-full">{currentExam.source}</p> <div className="grid grid-cols-2 gap-4 text-right bg-black/30 p-5 rounded-xl border border-white/5"> <div className="text-right"> <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">ملاحظات</span> <p className="text-sm text-gray-300 truncate mt-1">{currentExam.notes || '-'}</p> </div> <div className="text-right"> <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">الهاتف</span> <p className="text-sm text-gray-300 mt-1 font-mono">{currentExam.phone}</p> </div> </div> </div> ) : callingPatient ? ( <div className="text-center py-6 animate-in fade-in zoom-in duration-500"> <div className="w-32 h-32 mx-auto bg-neon-blue/10 rounded-full flex items-center justify-center mb-6 border-4 border-neon-blue relative shadow-[0_0_40px_rgba(0,243,255,0.3)]"> <Megaphone size={48} className="text-neon-blue relative z-10" /> <div className="absolute inset-0 border-4 border-transparent border-t-neon-blue rounded-full animate-spin"></div> </div> <h3 className="text-neon-blue text-sm font-bold mb-2 uppercase tracking-[0.2em] animate-pulse">جاري مناداة المريض</h3> <h2 className="text-4xl font-black text-white mb-2 text-glow">{callingPatient.name}</h2> <p className="text-gray-400 text-sm font-medium mb-8">يرجى التوجه إلى غرفة الكشف</p> </div> ) : ( <div className="h-72 flex flex-col items-center justify-center text-gray-500 bg-green-500/5 rounded-xl border border-green-500/10"> <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mb-4"><Stethoscope size={40} className="text-green-500" /></div> <p className="text-2xl font-bold text-green-500 tracking-wider animate-pulse">متاح الآن</p> <p className="text-xs mt-2 uppercase tracking-widest opacity-60">في انتظار المريض التالي</p> </div> )}
                    </div>
                </TiltCard>

                {/* Assistant Doctor Status Card AR */}
                {hasAssistantDoctor && (
                    <TiltCard className="p-0 border-neon-purple/30 shadow-[0_0_30px_-10px_rgba(157,0,255,0.15)] overflow-hidden" glowColor="purple">
                        <div className="p-4 bg-gradient-to-l from-neon-purple/20 to-transparent border-b border-neon-purple/20 flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full shadow-[0_0_10px_currentColor] animate-pulse ${assistantDoctorStatus === 'resting' ? 'bg-red-500 text-red-500' : currentAssistantPatient ? 'bg-orange-500 text-orange-500' : 'bg-green-500 text-green-500'}`}></div>
                            <h3 className="text-lg font-black text-white tracking-widest uppercase">حالة المساعد</h3>
                        </div>
                        <div className="p-6">
                            {assistantDoctorStatus === 'resting' ? (
                                <div className="h-48 flex flex-col items-center justify-center text-gray-500 bg-red-500/5 rounded-xl border border-red-500/10">
                                    <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4 animate-pulse"><Power size={32} className="text-red-500" /></div>
                                    <p className="text-lg font-bold text-red-500 tracking-wider">في استراحة</p>
                                </div>
                            ) : currentAssistantPatient ? (
                                <div className="text-center py-6 animate-in fade-in zoom-in duration-500">
                                    <div className="w-24 h-24 mx-auto bg-black/40 rounded-full flex items-center justify-center mb-4 border-4 border-orange-500 relative shadow-[0_0_30px_rgba(249,115,22,0.3)]">
                                        <Users size={32} className="text-white relative z-10" />
                                        <div className="absolute inset-0 border-4 border-transparent border-t-orange-500 rounded-full animate-spin"></div>
                                    </div>
                                    <h3 className="text-orange-500 text-xs font-bold mb-2 uppercase tracking-[0.2em] animate-pulse">جلسة مساعد جارية</h3>
                                    <h2 className="text-2xl font-black text-white mb-2 tracking-tight">{currentAssistantPatient.name}</h2>
                                </div>
                            ) : callingAssistantPatient ? (
                                <div className="text-center py-6 animate-in fade-in zoom-in duration-500">
                                    <div className="w-24 h-24 mx-auto bg-neon-purple/10 rounded-full flex items-center justify-center mb-4 border-4 border-neon-purple relative shadow-[0_0_40px_rgba(157,0,255,0.3)]">
                                        <Megaphone size={32} className="text-neon-purple relative z-10" />
                                        <div className="absolute inset-0 border-4 border-transparent border-t-neon-purple rounded-full animate-spin"></div>
                                    </div>
                                    <h3 className="text-neon-purple text-xs font-bold mb-2 uppercase tracking-[0.2em] animate-pulse">المساعد ينادي</h3>
                                    <h2 className="text-2xl font-black text-white mb-2 text-glow">{callingAssistantPatient.name}</h2>
                                </div>
                            ) : (
                                <div className="h-48 flex flex-col items-center justify-center text-gray-500 bg-green-500/5 rounded-xl border border-green-500/10">
                                    <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4"><Activity size={32} className="text-green-500" /></div>
                                    <p className="text-lg font-bold text-green-500 tracking-wider animate-pulse">متاح الآن</p>
                                </div>
                            )}
                        </div>
                    </TiltCard>
                )}
           </div>
        </div>
      )}
      
      {showModal && (
          // ... modal code same as before
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in" dir="rtl"> 
            <div className="w-full max-w-lg glass-panel rounded-2xl p-8 border border-neon-blue/20 shadow-[0_0_50px_-10px_rgba(0,243,255,0.2)] animate-slide-up"> 
                <div className="flex justify-between items-center mb-8 pb-4 border-b border-white/10"> 
                    <h3 className="text-2xl font-bold text-white tracking-tight">{editId ? 'تعديل حجز' : 'إضافة حجز جديد'}</h3> 
                    <button onClick={() => setShowModal(false)} className="p-2 bg-white/5 rounded-full text-gray-400 hover:text-white transition-colors"><XCircle size={28}/></button> 
                </div> 
                <form onSubmit={handleModalSubmit} className="space-y-6"> 
                    <div className="space-y-4">
                        <h4 className="text-neon-blue font-bold text-xs uppercase tracking-widest border-b border-white/10 pb-2 mb-3">بيانات المريض</h4>
                        <div className="grid grid-cols-12 gap-4">
                             <div className="col-span-8 text-right">
                                <label className="block text-xs text-gray-400 font-bold uppercase tracking-wider mb-2 mr-1">اسم المريض</label>
                                <input type="text" required placeholder="الاسم بالكامل" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-neon-blue focus:bg-black/60 transition-all placeholder-gray-600 text-right" />
                             </div>
                             <div className="col-span-4 text-right">
                                <label className="block text-xs text-gray-400 font-bold uppercase tracking-wider mb-2 mr-1">العمر</label>
                                <input type="text" placeholder="العمر" value={formData.age || ''} onChange={e => setFormData({...formData, age: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-neon-blue focus:bg-black/60 transition-all placeholder-gray-600 text-right" />
                             </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                             <div className="text-right">
                                <label className="block text-xs text-gray-400 font-bold uppercase tracking-wider mb-2 mr-1">رقم الهاتف</label>
                                <input type="tel" required placeholder="01xxxxxxxxx" value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-neon-blue focus:bg-black/60 transition-all placeholder-gray-600 text-left" dir="ltr" />
                             </div>
                             <div className="text-right">
                                <label className="block text-xs text-gray-400 font-bold uppercase tracking-wider mb-2 mr-1">رقم التواصل</label>
                                <input type="tel" placeholder="01xxxxxxxxx" value={formData.contactingNumber || ''} onChange={e => setFormData({...formData, contactingNumber: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-neon-blue focus:bg-black/60 transition-all placeholder-gray-600 text-left" dir="ltr" />
                             </div>
                        </div>
                        <div className="text-right">
                                <label className="block text-xs text-gray-400 font-bold uppercase tracking-wider mb-2 mr-1">محل الإقامة</label>
                                <input type="text" placeholder="المنطقة / المدينة" value={formData.residence || ''} onChange={e => setFormData({...formData, residence: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-neon-blue focus:bg-black/60 transition-all placeholder-gray-600 text-right" />
                        </div>
                    </div>
                    <div className="space-y-4">
                        <h4 className="text-neon-blue font-bold text-xs uppercase tracking-widest border-b border-white/10 pb-2 mb-3">تفاصيل الموعد</h4>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="text-right">
                                <label className="block text-xs text-gray-400 font-bold uppercase tracking-wider mb-2 mr-1">التاريخ</label>
                                <input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-neon-blue focus:bg-black/60 transition-all" />
                            </div>
                            <div className="text-right">
                                <label className="block text-xs text-gray-400 font-bold uppercase tracking-wider mb-2 mr-1">الوقت</label>
                                <input type="time" required value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-neon-blue focus:bg-black/60 transition-all" />
                            </div>
                            <div className="text-right">
                                 <label className="block text-xs text-gray-400 font-bold uppercase tracking-wider mb-2 mr-1">نوع الزيارة</label>
                                 <select value={formData.visitType || 'New'} onChange={e => setFormData({...formData, visitType: e.target.value as any})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-neon-blue focus:bg-black/60 transition-all appearance-none cursor-pointer">
                                     <option value="New" className="bg-gray-900">كشف جديد</option>
                                     <option value="Follow-up" className="bg-gray-900">متابعة</option>
                                 </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="text-right">
                                <label className="block text-xs text-gray-400 font-bold uppercase tracking-wider mb-2 mr-1">المصدر</label>
                                <select value={formData.source} onChange={e => setFormData({...formData, source: e.target.value as any})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-neon-blue focus:bg-black/60 transition-all appearance-none cursor-pointer">
                                     <option value="Phone Call" className="bg-gray-900">مكالمة هاتفية</option>
                                     <option value="Social Media" className="bg-gray-900">سوشيال ميديا</option>
                                     <option value="Clinic Visit" className="bg-gray-900">زيارة عيادة</option>
                                     <option value="Walk-in" className="bg-gray-900">دخول مباشر</option>
                                </select>
                            </div>
                            <div className="text-right">
                                <label className="block text-xs text-gray-400 font-bold uppercase tracking-wider mb-2 mr-1">المبلغ المدفوع ($)</label>
                                <input type="number" placeholder="0" value={formData.paid || ''} onChange={e => setFormData({...formData, paid: Number(e.target.value)})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-neon-blue focus:bg-black/60 transition-all placeholder-gray-600 text-right" />
                            </div>
                        </div>
                        <div className="text-right">
                            <label className="block text-xs text-gray-400 font-bold uppercase tracking-wider mb-2 mr-1">ملاحظات</label>
                            <textarea rows={2} placeholder="معلومات إضافية..." value={formData.notes || ''} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white text-sm outline-none focus:border-neon-blue focus:bg-black/60 transition-all placeholder-gray-600 text-right" />
                        </div>
                    </div>
                    <button type="submit" className="w-full py-4 mt-4 bg-gradient-to-l from-neon-blue to-cyan-600 rounded-xl text-black font-extrabold text-xl shadow-[0_0_20px_rgba(0,243,255,0.3)] hover:shadow-[0_0_30px_rgba(0,243,255,0.5)] transform hover:-translate-y-1 transition-all"> {editId ? 'تحديث البيانات' : 'تأكيد الحجز'} </button> 
                </form> 
            </div> 
        </div> 
      )}

      {/* Confirmation Modal in Arabic */}
      <ConfirmationModal 
          isOpen={!!deleteId}
          onClose={() => setDeleteId(null)}
          onConfirm={confirmDelete}
          title="حذف الحجز"
          message="هل أنت متأكد من حذف هذا الحجز؟ هذا الإجراء نهائي ولا يمكن التراجع عنه."
          confirmText="نعم، حذف"
          cancelText="إلغاء"
          isDanger={true}
      />
    </div>
  );
};

export default FrontDeskViewAR;

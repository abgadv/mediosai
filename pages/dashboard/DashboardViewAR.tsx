
import React, { useMemo, useState, useEffect, useContext } from 'react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import TiltCard from '../../components/TiltCard';
import { DashboardUIContext } from '../../contexts/DashboardUIContext';
import { formatDate } from '../../utils/formatters';
import { 
  Users, DollarSign, Stethoscope, Power, Clock, Activity, Sparkles, 
  Megaphone, Hourglass, Ban, TrendingUp, Cpu, Waves, ExternalLink,
  MapPin, UserPlus, PieChart
} from 'lucide-react';

const DashboardViewAR: React.FC = () => {
    const { firebaseUser } = useAuth();
    const { 
        appointments, doctorStatus, 
        callingPatientId, isBookingPaused, toggleBookingPause,
        setDoctorStatus
    } = useData();
    
    const { setActiveTab } = useContext(DashboardUIContext);
    const today = new Date().toISOString().split('T')[0];
    const clinicName = firebaseUser?.displayName || 'العيادة';

    const [aiMetricIndex, setAiMetricIndex] = useState(0);
    useEffect(() => {
        const interval = setInterval(() => setAiMetricIndex((prev) => (prev + 1) % 5), 4000); 
        return () => clearInterval(interval);
    }, []);

    const stats = useMemo(() => {
        const bookingsToday = appointments.filter(a => a.date === today).length;
        const checkedInToday = appointments.filter(a => a.date === today && (a.status === 'checked-in' || a.status === 'in-exam' || a.status === 'completed')).length;
        const queuingNow = appointments
            .filter(a => a.status === 'checked-in')
            .sort((a, b) => (a.queueOrder ?? 9999) - (b.queueOrder ?? 9999));
        const revenueToday = appointments
            .filter(a => a.date === today)
            .reduce((acc, curr) => acc + (Number(curr.paid) || 0), 0);
        const currentExam = appointments.find(a => a.status === 'in-exam');
        const callingPatient = appointments.find(a => a.id === callingPatientId && a.status === 'checked-in');
        const newPatients = appointments.filter(a => a.visitType === 'New').length;
        const total = appointments.length || 1;
        const loyaltyRate = Math.round(((total - newPatients) / total) * 100);
        return { bookingsToday, checkedInToday, queuingNow, revenueToday, currentExam, callingPatient, loyaltyRate, total };
    }, [appointments, today, callingPatientId]);

    const { bookingsToday, checkedInToday, queuingNow, revenueToday, currentExam, callingPatient, loyaltyRate, total } = stats;

    const operationalMetrics = useMemo(() => {
        const efficiency = (appointments.filter(a => a.status === 'completed').length / total) * 100;
        const avgPaid = revenueToday / (bookingsToday || 1);
        const hourCounts = Array(12).fill(0);
        appointments.filter(a => a.date === today).forEach(a => {
            const h = parseInt(a.time.split(':')[0]);
            if (h >= 8 && h < 20) hourCounts[h - 8]++;
        });
        return { efficiency, avgPaid, hourCounts };
    }, [appointments, bookingsToday, revenueToday, total, today]);

    const leadsDemographics = useMemo(() => {
        const counts: Record<string, number> = {};
        let ageUnder30 = 0;
        let ageOver30 = 0;
        let totalWithResidence = 0;
        let totalWithAge = 0;

        appointments.forEach(a => {
            if (a.residence) {
                const res = a.residence.trim();
                if (res) {
                    counts[res] = (counts[res] || 0) + (Number(a.paid) > 0 ? 1 : 0);
                    totalWithResidence++;
                }
            }
            if (a.age) {
                const age = parseInt(a.age);
                if (!isNaN(age)) {
                    if (age < 30) ageUnder30++;
                    else ageOver30++;
                    totalWithAge++;
                }
            }
        });

        const geo = Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 2)
            .map(([name, count]) => ({
                name,
                percent: Math.round((count / (totalWithResidence || 1)) * 100)
            }));

        const ageSplit = totalWithAge > 0 ? {
            young: Math.round((ageUnder30 / totalWithAge) * 100),
            mature: Math.round((ageOver30 / totalWithAge) * 100)
        } : { young: 50, mature: 50 };

        return { geo, ageSplit };
    }, [appointments]);

    const aiInsights = useMemo(() => {
        const insights = [];
        if (queuingNow.length > 5) insights.push({ type: 'alert', text: "تم رصد تكدس في صالة الانتظار. يُنصح بتحسين وقت التنقل." });
        if (revenueToday > 2000) insights.push({ type: 'success', text: "سرعة الإيرادات مرتفعة. المؤشرات تشير إلى يوم استثنائي." });
        if (isBookingPaused) insights.push({ type: 'warning', text: "نظام الحجز متوقف. تم الوصول للسعة القصوى المحددة." });
        if (insights.length === 0) insights.push({ type: 'info', text: "إيقاع العيادة مستقر. يتم الحفاظ على تدفق المرضى المثالي." });
        return insights;
    }, [queuingNow.length, revenueToday, isBookingPaused]);

    const currentAiMetric = useMemo(() => {
        const metrics = [
            { label: 'حمل النظام', val: queuingNow.length, max: 10, status: queuingNow.length > 7 ? 'حرج' : 'مستقر', color: 'bg-neon-blue' },
            { label: 'الكفاءة', val: Math.round(operationalMetrics.efficiency), max: 100, status: 'نشط', color: 'bg-green-500' },
            { label: 'سرعة الدخل', val: revenueToday, max: 5000, status: 'مثالي', color: 'bg-neon-purple' },
            { label: 'ولاء المرضى', val: loyaltyRate, max: 100, status: 'مرتفع', color: 'bg-cyan-400' },
            { label: 'مزامنة الحجز', val: 99, max: 100, status: 'نشط', color: 'bg-neon-pink' }
        ];
        return metrics[aiMetricIndex];
    }, [aiMetricIndex, queuingNow.length, operationalMetrics.efficiency, revenueToday, loyaltyRate]);

    const maxTraffic = Math.max(...operationalMetrics.hourCounts) || 1;
    const roomState = useMemo(() => {
        if (doctorStatus === 'resting') return { label: 'استراحة', color: 'text-red-500', icon: <Ban />, glow: 'red' };
        if (currentExam) return { label: 'قيد الفحص', color: 'text-orange-500', icon: <Users />, glow: 'red' };
        if (callingPatient) return { label: 'جاري المناداة', color: 'text-neon-blue', icon: <Megaphone />, glow: 'cyan' };
        return { label: 'متاح', color: 'text-green-500', icon: <Stethoscope />, glow: 'green' };
    }, [doctorStatus, currentExam, callingPatient]);

    return (
        <div className="space-y-6 animate-fade-in pb-12 font-arabic" dir="rtl">
           {/* Row 1: AI Master Banner */}
           <TiltCard className="p-1 relative overflow-hidden bg-black/40 border-white/10" noTilt glowColor="cyan">
                <div className="absolute inset-0 bg-gradient-to-l from-neon-blue/5 via-transparent to-neon-purple/5 z-0"></div>
                <div className="relative z-10 flex flex-col lg:flex-row items-stretch gap-6 p-6">
                    <div className="flex items-center gap-6 lg:border-l border-white/10 lg:pl-8">
                        <div className="relative">
                            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-neon-blue to-neon-purple p-[1px] shadow-[0_0_30px_rgba(0,243,255,0.3)] animate-float">
                                <div className="w-full h-full bg-black rounded-3xl flex items-center justify-center">
                                    <Cpu size={40} className="text-white" />
                                </div>
                            </div>
                            <div className="absolute -bottom-1 -left-1 w-6 h-6 bg-green-500 rounded-full border-4 border-[#0a0a0a] animate-pulse shadow-[0_0_10px_#22c55e]"></div>
                        </div>
                        <div className="text-right">
                            <h3 className="text-xl font-black text-white tracking-tighter uppercase">نواة أورا الذكية</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <div className="px-2 py-0.5 rounded bg-neon-blue/10 border border-neon-blue/20 text-[10px] font-black text-neon-blue uppercase tracking-widest">نشط</div>
                                <span className="text-[10px] text-gray-500 font-mono">الاستقرار: 99.9%</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col justify-center gap-2 min-h-[60px] text-right">
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
                            <Sparkles size={14} className="text-neon-blue" /> التوجيهات الذكية
                        </div>
                        <div className="space-y-1">
                            {aiInsights.map((insight, idx) => (
                                <div key={idx} className="flex items-center gap-3 text-sm animate-slide-up">
                                    <div className={`w-1.5 h-1.5 rounded-full ${insight.type === 'alert' ? 'bg-red-500 shadow-[0_0_8px_red]' : insight.type === 'warning' ? 'bg-orange-500 shadow-[0_0_8px_orange]' : 'bg-neon-blue shadow-[0_0_8px_#00f3ff]'}`}></div>
                                    <p className="text-gray-200 font-medium truncate max-w-lg">{insight.text}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="min-w-[200px] flex flex-col justify-center bg-white/5 p-4 rounded-2xl border border-white/10">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{currentAiMetric.label}</span>
                            <span className="text-[10px] font-bold text-white bg-white/10 px-1.5 rounded">{currentAiMetric.status}</span>
                        </div>
                        <div className="h-2 bg-black/40 rounded-full overflow-hidden border border-white/5 relative">
                            <div className={`h-full ${currentAiMetric.color} transition-all duration-1000 ease-out shadow-[0_0_10px_currentColor]`} style={{ width: `${(currentAiMetric.val / currentAiMetric.max) * 100}%` }}></div>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                             <div className="flex gap-1">
                                {[0,1,2,3,4].map(i => (
                                    <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i === aiMetricIndex ? 'bg-white scale-125' : 'bg-gray-700'}`}></div>
                                ))}
                             </div>
                        </div>
                    </div>
                </div>
           </TiltCard>

           {/* Row 2: Master KPIs */}
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <TiltCard className="p-6 flex items-center justify-between group" glowColor="cyan">
                    <div className="text-right">
                        <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em]">تدفق المرضى</p>
                        <h3 className="text-4xl font-black mt-1 text-white">{bookingsToday}</h3>
                        <div className="flex items-center gap-2 mt-2">
                            <div className="px-2 py-0.5 rounded bg-neon-blue/10 border border-neon-blue/20 text-[10px] font-bold text-neon-blue">+{Math.round(bookingsToday * 0.4)}% متوسط</div>
                        </div>
                    </div>
                    <div className="w-14 h-14 rounded-2xl bg-neon-blue/5 flex items-center justify-center text-neon-blue border border-neon-blue/20 group-hover:scale-110 transition-transform">
                        <Users size={28} />
                    </div>
                </TiltCard>

                <TiltCard className="p-6 flex items-center justify-between group" glowColor="purple">
                    <div className="text-right">
                        <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em]">إجمالي الإيرادات</p>
                        <h3 className="text-4xl font-black mt-1 text-white">${revenueToday.toLocaleString()}</h3>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="text-[10px] text-gray-400 font-medium">${operationalMetrics.avgPaid.toFixed(0)} متوسط لكل حالة</span>
                        </div>
                    </div>
                    <div className="w-14 h-14 rounded-2xl bg-neon-purple/5 flex items-center justify-center text-neon-purple border border-neon-purple/20 group-hover:scale-110 transition-transform">
                        <DollarSign size={28} />
                    </div>
                </TiltCard>

                <TiltCard className="p-6 flex items-center justify-between group" glowColor="red">
                    <div className="text-right">
                        <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em]">حجم الانتظار</p>
                        <h3 className="text-4xl font-black mt-1 text-white">{queuingNow.length}</h3>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="text-[10px] text-red-400 font-bold bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">الانتظار: ~١٥ د</span>
                        </div>
                    </div>
                    <div className="w-14 h-14 rounded-2xl bg-red-500/5 flex items-center justify-center text-red-500 border border-red-500/20 group-hover:scale-110 transition-transform">
                        <Hourglass size={28} />
                    </div>
                </TiltCard>

                <TiltCard className="p-6 flex flex-col justify-center group overflow-hidden relative pointer-events-none" glowColor={roomState.glow as any}>
                    <div className="relative z-10 flex items-center justify-between">
                        <div className="text-right">
                            <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em]">حالة الغرفة</p>
                            <h3 className={`text-2xl font-black mt-1 uppercase ${roomState.color} ${roomState.label === 'جاري المناداة' ? 'animate-pulse' : ''}`}>{roomState.label}</h3>
                        </div>
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center border shadow-lg transition-all ${doctorStatus === 'available' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                            {doctorStatus === 'available' ? <Power size={24} /> : <Ban size={24} />}
                        </div>
                    </div>
                    {(currentExam || callingPatient) && (
                        <div className={`mt-4 p-2 bg-white/5 rounded-lg border border-white/5 flex items-center justify-between ${roomState.label === 'جاري المناداة' ? 'animate-pulse border-neon-blue/30' : ''}`}>
                            <p className="text-[10px] text-white font-bold truncate">{(currentExam || callingPatient)?.name}</p>
                            <span className={`text-[8px] px-1 rounded uppercase font-black ${roomState.label === 'جاري المناداة' ? 'bg-neon-blue text-black' : 'bg-red-500 text-white'}`}>
                              {roomState.label}
                            </span>
                        </div>
                    )}
                </TiltCard>
           </div>

           {/* Row 3: Live Pulse & Leads Center */}
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <TiltCard className="lg:col-span-2 p-8 border-white/5" glowColor="cyan">
                    <div className="flex justify-between items-center mb-8">
                        <div className="text-right">
                            <h3 className="text-xl font-bold text-white flex items-center gap-3 uppercase tracking-tighter">
                                <Waves size={20} className="text-neon-blue" /> نبض الحركة
                            </h3>
                            <p className="text-xs text-gray-500 mt-1 uppercase font-bold tracking-widest">كثافة تدفق المرضى اليوم</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-neon-blue shadow-[0_0_8px_#00f3ff] animate-pulse"></div>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">مباشر</span>
                        </div>
                    </div>
                    <div className="h-64 flex items-end justify-between gap-4 px-2" dir="ltr">
                        {operationalMetrics.hourCounts.map((count, idx) => (
                            <div key={idx} className="flex-1 flex flex-col items-center group h-full justify-end">
                                <div className="w-full bg-gradient-to-t from-neon-blue/5 to-neon-blue/40 rounded-t-xl relative border-t border-x border-neon-blue/20 transition-all duration-700 group-hover:from-neon-blue/30 group-hover:to-neon-blue/60" style={{ height: `${(count / maxTraffic) * 100}%` }}>
                                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] font-black px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-all border border-white/10">{count}</div>
                                </div>
                                <span className="text-[9px] text-gray-600 font-black mt-3 font-mono">{idx + 8}H</span>
                            </div>
                        ))}
                    </div>
                </TiltCard>

                <TiltCard className="p-8 border-white/5 flex flex-col" glowColor="purple">
                    <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-3 uppercase tracking-tighter text-right">
                        <Activity size={20} className="text-neon-purple" /> بيانات العملاء
                    </h3>
                    <div className="space-y-6 flex-1 text-right">
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs font-black text-gray-400 uppercase tracking-widest">
                                <span>معدل المتابعة</span>
                                <span className="text-neon-purple">{loyaltyRate}%</span>
                            </div>
                            <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                <div className="h-full bg-neon-purple shadow-[0_0_10px_#9d00ff]" style={{ width: `${loyaltyRate}%` }}></div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs font-black text-gray-400 uppercase tracking-widest">
                                <span>معدل التحويل</span>
                                <span className="text-green-500">92%</span>
                            </div>
                            <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                <div className="h-full bg-green-500" style={{ width: '92%' }}></div>
                            </div>
                        </div>
                        <div className="mt-8 pt-6 border-t border-white/5">
                             <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4">ديموغرافية المرضى</p>
                             <div className="space-y-4">
                                 {/* Geo Density */}
                                 <div className="space-y-2">
                                     <p className="text-[9px] text-gray-600 uppercase font-black tracking-widest">أعلى المناطق</p>
                                     {leadsDemographics.geo.length > 0 ? leadsDemographics.geo.map((loc, i) => (
                                         <div key={loc.name} className="flex items-center justify-between group">
                                             <div className="flex items-center gap-2">
                                                 <MapPin size={12} className="text-neon-purple" />
                                                 <span className="text-xs text-gray-300 font-medium">{loc.name}</span>
                                             </div>
                                             <span className="text-[10px] font-bold text-white bg-white/5 px-2 py-0.5 rounded border border-white/5">{loc.percent}%</span>
                                         </div>
                                     )) : <p className="text-[10px] text-gray-600 italic">لا توجد بيانات سكن</p>}
                                 </div>

                                 {/* Age Split */}
                                 <div className="space-y-2">
                                     <p className="text-[9px] text-gray-600 uppercase font-black tracking-widest">توزيع الفئات العمرية</p>
                                     <div className="flex gap-1 h-3 rounded-full overflow-hidden bg-gray-800 border border-white/5" dir="ltr">
                                         <div className="h-full bg-neon-blue shadow-[0_0_10px_rgba(0,243,255,0.4)]" style={{ width: `${leadsDemographics.ageSplit.young}%` }}></div>
                                         <div className="h-full bg-neon-purple shadow-[0_0_10px_rgba(157,0,255,0.4)]" style={{ width: `${leadsDemographics.ageSplit.mature}%` }}></div>
                                     </div>
                                     <div className="flex justify-between text-[9px] font-black uppercase text-gray-500">
                                         <span className="text-neon-blue">أقل من ٣٠ سنة: {leadsDemographics.ageSplit.young}%</span>
                                         <span className="text-neon-purple">أكبر من ٣٠ سنة: {leadsDemographics.ageSplit.mature}%</span>
                                     </div>
                                 </div>
                             </div>
                        </div>
                    </div>
                </TiltCard>
           </div>

           {/* Row 4: Monitor & Growth */}
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <TiltCard className="lg:col-span-2 p-0 overflow-hidden border-neon-blue/20" glowColor="cyan">
                    <div className="p-4 bg-gradient-to-l from-neon-blue/10 via-transparent to-transparent border-b border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                             <div className="p-1.5 bg-neon-blue/20 rounded-lg text-neon-blue animate-pulse"><Megaphone size={18} /></div>
                             <h3 className="font-black text-white tracking-widest uppercase text-sm">بث مباشر</h3>
                        </div>
                        <button onClick={() => window.open(`${window.location.origin}${window.location.pathname}?view=live`, '_blank')} className="flex items-center gap-2 px-4 py-1.5 bg-neon-blue text-black rounded-lg hover:bg-white hover:scale-105 transition-all text-[10px] font-black uppercase tracking-widest border border-neon-blue">
                            <ExternalLink size={14} /> عرض
                        </button>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-black/40 text-right">
                         <div className="space-y-3">
                             <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-2 justify-end">التالي في الدور <span className="w-1.5 h-1.5 rounded-full bg-neon-blue"></span></p>
                             {queuingNow.slice(0, 3).map((pt, i) => (
                                 <div key={pt.id} className={`flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 group hover:border-neon-blue/30 transition-all ${callingPatientId === pt.id ? 'border-neon-blue bg-neon-blue/10' : ''}`}>
                                     <span className="text-[10px] font-mono text-gray-500">{pt.time}</span>
                                     <div className="flex items-center gap-3">
                                         <span className={`text-sm font-bold transition-colors ${callingPatientId === pt.id ? 'text-neon-blue' : 'text-gray-200 group-hover:text-white'}`}>{pt.name}</span>
                                         <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold transition-colors text-xs ${callingPatientId === pt.id ? 'bg-neon-blue text-black' : 'bg-gray-800 text-gray-400 group-hover:text-neon-blue'}`}>{i+1}</div>
                                     </div>
                                 </div>
                             ))}
                             {queuingNow.length === 0 && <p className="text-xs text-gray-600 italic py-4">صالة الانتظار فارغة حالياً.</p>}
                         </div>
                         <div className="flex flex-col justify-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                             <div className="flex items-center gap-4 justify-end">
                                 <div className="text-right">
                                     <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">جاري المناداة</p>
                                     <p className={`text-lg font-black ${callingPatient ? 'text-neon-blue text-glow animate-pulse' : 'text-white'}`}>{callingPatient?.name || '---'}</p>
                                 </div>
                                 <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${callingPatient ? 'bg-neon-blue/20 text-neon-blue animate-pulse' : 'bg-gray-800 text-gray-600'}`}><Activity size={24} /></div>
                             </div>
                         </div>
                    </div>
                </TiltCard>

                <TiltCard className="p-6 bg-gradient-to-br from-neon-purple/10 to-transparent border-white/10" noTilt>
                    <div className="flex items-center gap-4 mb-4 justify-end">
                        <div className="text-right">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">توجيهات النمو</p>
                            <h4 className="text-lg font-bold text-white tracking-tight">إستراتيجية {clinicName}</h4>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-neon-purple/20 flex items-center justify-center text-neon-purple shrink-0"><TrendingUp size={24} className="animate-pulse" /></div>
                    </div>
                    <p className="text-sm text-gray-400 leading-relaxed text-right">
                        بمعدل ولاء حالي يبلغ <span className="text-neon-purple font-bold">{loyaltyRate}%</span>، تقترح أورا تكثيف رسائل المتابعة الآلية لزيادة معدل العودة للعيادة.
                    </p>
                    <div className="mt-6 pt-6 border-t border-white/5 grid grid-cols-2 gap-4">
                        <div className="text-right">
                            <p className="text-[10px] text-gray-500 font-bold uppercase">الكفاءة</p>
                            <p className="text-xl font-black text-white">{Math.round(operationalMetrics.efficiency)}%</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] text-gray-500 font-bold uppercase">التشبع</p>
                            <p className="text-xl font-black text-neon-blue">{queuingNow.length > 5 ? 'مرتفع' : 'منخفض'}</p>
                        </div>
                    </div>
                </TiltCard>
           </div>
        </div>
    );
};

export default DashboardViewAR;

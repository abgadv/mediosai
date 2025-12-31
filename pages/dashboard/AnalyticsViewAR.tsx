
import React, { useState, useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import TiltCard from '../../components/TiltCard';
import { 
  BarChart2, FileDown, Clock, TrendingUp, DollarSign, Activity, 
  PieChart, Heart, AlertOctagon, Calendar, Repeat, Stethoscope
} from 'lucide-react';

const AnalyticsViewAR: React.FC = () => {
    const { appointments, transactions } = useData();
    const [timeFilter, setTimeFilter] = useState<'7days' | '30days' | 'thisMonth' | 'custom'>('thisMonth');
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');

    const filteredData = useMemo(() => {
        const now = new Date();
        let startDate = new Date();
        let endDate = new Date();
        if (timeFilter === '7days') startDate.setDate(now.getDate() - 7);
        else if (timeFilter === '30days') startDate.setDate(now.getDate() - 30);
        else if (timeFilter === 'thisMonth') startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        else if (timeFilter === 'custom' && customStart && customEnd) { startDate = new Date(customStart); endDate = new Date(customEnd); endDate.setHours(23, 59, 59, 999); }
        return appointments.filter(a => { const d = new Date(a.date); return d >= startDate && d <= endDate; });
    }, [appointments, timeFilter, customStart, customEnd]);

    const filteredTransactions = useMemo(() => {
        const now = new Date();
        let startDate = new Date();
        let endDate = new Date();
        if (timeFilter === '7days') startDate.setDate(now.getDate() - 7);
        else if (timeFilter === '30days') startDate.setDate(now.getDate() - 30);
        else if (timeFilter === 'thisMonth') startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        else if (timeFilter === 'custom' && customStart && customEnd) { startDate = new Date(customStart); endDate = new Date(customEnd); endDate.setHours(23, 59, 59, 999); }
        return transactions.filter(t => { const d = new Date(t.date); return d >= startDate && d <= endDate; });
    }, [transactions, timeFilter, customStart, customEnd]);

    const demographics = useMemo(() => {
        let returning = 0; let newPatients = 0; const uniquePatients = new Set();
        filteredData.forEach(a => { uniquePatients.add(a.phone); if(a.visitType === 'Follow-up') returning++; else newPatients++; });
        const totalPatients = newPatients + returning;
        const retentionRate = totalPatients > 0 ? Math.round((returning / totalPatients) * 100) : 0;
        const avgVisits = uniquePatients.size > 0 ? (totalPatients / uniquePatients.size).toFixed(1) : '0';
        return { retention: { new: newPatients, returning, rate: retentionRate }, avgVisits, totalPatients };
    }, [filteredData]);

    const financial = useMemo(() => {
        const apptRevenue = filteredData.reduce((acc, curr) => acc + (Number(curr.paid) || 0), 0);
        const otherIncome = filteredTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + Number(t.amount), 0);
        const totalIncome = apptRevenue + otherIncome;
        const totalExpense = filteredTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + Number(t.amount), 0);
        const netProfit = totalIncome - totalExpense;
        const profitMargin = totalIncome > 0 ? Math.round((netProfit / totalIncome) * 100) : 0;
        const payingPatients = filteredData.filter(a => a.paid > 0).length;
        const atv = payingPatients > 0 ? Math.round(apptRevenue / payingPatients) : 0;
        return { totalIncome, totalExpense, netProfit, profitMargin, atv };
    }, [filteredData, filteredTransactions]);

    const operations = useMemo(() => {
        const total = filteredData.length;
        const completed = filteredData.filter(a => a.status === 'completed').length;
        const cancelled = filteredData.filter(a => a.status === 'cancelled').length;
        const booked = filteredData.filter(a => a.status === 'booked').length;
        const checkedIn = filteredData.filter(a => a.status === 'checked-in').length;
        const cancellationRate = total > 0 ? Math.round((cancelled / total) * 100) : 0;
        const days = ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];
        const dayCounts = Array(7).fill(0);
        filteredData.forEach(a => { const dayIdx = new Date(a.date).getDay(); dayCounts[dayIdx]++; });
        const busiestDay = days[dayCounts.indexOf(Math.max(...dayCounts))];
        return { completed, cancelled, booked, checkedIn, cancellationRate, dayCounts, busiestDay, days, total };
    }, [filteredData]);

    const marketing = useMemo(() => {
        const sourceRev: Record<string, number> = {}; const sourceCount: Record<string, number> = {};
        filteredData.forEach(a => { sourceRev[a.source] = (sourceRev[a.source] || 0) + (Number(a.paid) || 0); sourceCount[a.source] = (sourceCount[a.source] || 0) + 1; });
        const sortedByRev = Object.entries(sourceRev).sort((a,b) => b[1] - a[1]);
        const maxSourceRev = sortedByRev.length > 0 ? sortedByRev[0][1] : 1;
        return { sourceRev: sortedByRev, maxSourceRev, sourceCount };
    }, [filteredData]);

    return (
        <div className="space-y-8 animate-fade-in font-arabic" dir="rtl">
            <TiltCard className="p-4 flex flex-wrap gap-4 items-center justify-between border-white/10" noTilt>
                <div className="flex gap-2 bg-black/40 p-1.5 rounded-xl border border-white/5">
                    {['7days', '30days', 'thisMonth', 'custom'].map(f => (
                        <button key={f} onClick={() => setTimeFilter(f as any)} className={`px-6 py-2 rounded-lg text-sm font-black transition-all ${timeFilter === f ? 'bg-neon-blue text-black shadow-[0_0_15px_rgba(243,255,0,0.4)]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
                            {f === 'thisMonth' ? 'هذا الشهر' : f === '7days' ? '٧ أيام' : f === '30days' ? '٣٠ يوم' : 'مخصص'}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-4">
                    {timeFilter === 'custom' && (
                        <div className="flex gap-2 items-center" dir="ltr">
                            <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white" />
                            <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white" />
                        </div>
                    )}
                </div>
            </TiltCard>

            <h3 className="text-xl font-black text-white flex items-center gap-3"><DollarSign className="text-green-400" size={24}/> الأداء المالي</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <TiltCard className="p-8 border-white/5 group text-right" glowColor="purple">
                    <p className="text-gray-400 text-sm font-black uppercase">إجمالي الدخل</p>
                    <h3 className="text-4xl font-black mt-3 text-white">${financial.totalIncome.toLocaleString()}</h3>
                </TiltCard>
                <TiltCard className="p-8 border-white/5 group text-right" glowColor="red">
                    <p className="text-gray-400 text-sm font-black uppercase">إجمالي المصروفات</p>
                    <h3 className="text-4xl font-black mt-3 text-red-400">${financial.totalExpense.toLocaleString()}</h3>
                </TiltCard>
                <TiltCard className="p-8 border-white/5 group text-right" glowColor="green">
                    <p className="text-gray-400 text-sm font-black uppercase">صافي الربح</p>
                    <h3 className="text-4xl font-black mt-3 text-green-400">${financial.netProfit.toLocaleString()}</h3>
                    <span className="text-xs text-gray-500 font-bold uppercase mt-1 block">الهامش: {financial.profitMargin}%</span>
                </TiltCard>
                <TiltCard className="p-8 border-white/5 group text-right" glowColor="cyan">
                    <p className="text-gray-400 text-sm font-black uppercase">متوسط القيمة</p>
                    <h3 className="text-4xl font-black mt-3 text-neon-blue">${financial.atv}</h3>
                    <span className="text-xs text-gray-500 font-bold uppercase mt-1 block">لكل حالة</span>
                </TiltCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <TiltCard className="p-8 border-white/5 text-right" glowColor="purple">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="text-2xl font-black text-white flex items-center gap-3">
                            <div className="p-2 bg-neon-purple/10 rounded-xl text-neon-purple"><Heart size={24}/></div> ولاء المرضى
                        </h3>
                        <div className="px-4 py-1.5 bg-neon-purple/10 border border-neon-purple/30 rounded-xl text-sm font-bold text-neon-purple">المتوسط: {demographics.avgVisits}</div>
                    </div>
                    <div className="flex gap-6 items-end h-48 mb-8 px-4" dir="ltr">
                        <div className="flex-1 flex flex-col justify-end gap-3 group h-full">
                            <div className="text-center font-black text-blue-400 text-xl">{demographics.retention.new}</div>
                            <div className="w-full bg-blue-500/20 rounded-t-2xl border-t border-x border-blue-500/30 relative h-full">
                                <div className="absolute bottom-0 left-0 w-full bg-blue-500 rounded-t-2xl opacity-60 transition-all duration-1000" style={{ height: `${(demographics.retention.new / (operations.total || 1)) * 100}%` }}></div>
                            </div>
                            <div className="text-center text-[10px] text-gray-500 font-black uppercase tracking-widest">جديد</div>
                        </div>
                        <div className="flex-1 flex flex-col justify-end gap-3 group h-full">
                            <div className="text-center font-black text-neon-purple text-xl">{demographics.retention.returning}</div>
                            <div className="w-full bg-neon-purple/20 rounded-t-2xl border-t border-x border-neon-purple/30 relative h-full">
                                <div className="absolute bottom-0 left-0 w-full bg-neon-purple rounded-t-2xl opacity-60 transition-all duration-1000" style={{ height: `${(demographics.retention.returning / (operations.total || 1)) * 100}%` }}></div>
                            </div>
                            <div className="text-center text-[10px] text-gray-500 font-black uppercase tracking-widest">متابعة</div>
                        </div>
                    </div>
                    <div className="bg-black/30 rounded-2xl p-6 flex items-center justify-between border border-white/10">
                        <div className="flex items-center gap-4">
                            <Repeat size={24} className="text-gray-400" />
                            <div className="text-right">
                                <p className="text-xs text-gray-500 font-black uppercase">معدل العودة</p>
                                <p className="text-white font-bold text-md">المرضى الدائمون %</p>
                            </div>
                        </div>
                        <span className="text-4xl font-black text-white">{demographics.retention.rate}%</span>
                    </div>
                </TiltCard>

                <TiltCard className="p-8 border-white/5 text-right" glowColor="cyan">
                    <h3 className="text-2xl font-black text-white mb-8 flex items-center gap-3">
                        <div className="p-2 bg-neon-blue/10 rounded-xl text-neon-blue"><PieChart size={24}/></div> حالة المواعيد
                    </h3>
                    <div className="flex items-center gap-12">
                        <div className="relative w-48 h-48 rounded-full flex-shrink-0 animate-pulse-slow" 
                             style={{ background: `conic-gradient(#22c55e 0% ${ (operations.completed/operations.total)*100 }%, #ef4444 ${ (operations.completed/operations.total)*100 }% ${ ((operations.completed + operations.cancelled)/operations.total)*100 }%, #3b82f6 ${ ((operations.completed + operations.cancelled)/operations.total)*100 }% 100%)` }}>
                             <div className="absolute inset-3 bg-[#0a0a0a] rounded-full flex items-center justify-center">
                                 <div className="text-center">
                                     <span className="block text-3xl font-black text-white">{operations.total}</span>
                                     <span className="text-[10px] text-gray-500 uppercase font-black">إجمالي</span>
                                 </div>
                             </div>
                        </div>
                        <div className="flex-1 space-y-4">
                            <div className="flex justify-between items-center text-sm font-bold">
                                <div className="flex items-center gap-3"><div className="w-4 h-4 bg-green-500 rounded-full"></div> <span className="text-gray-300">مكتمل</span></div>
                                <span className="text-white">{operations.completed}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm font-bold">
                                <div className="flex items-center gap-3"><div className="w-4 h-4 bg-red-500 rounded-full"></div> <span className="text-gray-300">ملغي</span></div>
                                <span className="text-white">{operations.cancelled}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm font-bold">
                                <div className="flex items-center gap-3"><div className="w-4 h-4 bg-blue-500 rounded-full"></div> <span className="text-gray-300">محجوز/قيد الانتظار</span></div>
                                <span className="text-white">{operations.booked + operations.checkedIn}</span>
                            </div>
                        </div>
                    </div>
                </TiltCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <TiltCard className="p-8 border-white/5 text-right" glowColor="red">
                    <h3 className="text-2xl font-black text-white mb-8 flex items-center gap-3">
                        <div className="p-2 bg-red-500/10 rounded-xl text-red-400"><AlertOctagon size={24}/></div> العمليات
                    </h3>
                    <div className="grid grid-cols-2 gap-8 mb-8">
                        <div className="text-center p-6 bg-white/5 rounded-3xl border border-white/10">
                            <div className="text-4xl font-black text-red-400 mb-2">{operations.cancellationRate}%</div>
                            <div className="text-xs text-gray-500 font-black uppercase tracking-widest">معدل الإلغاء</div>
                        </div>
                        <div className="text-center p-6 bg-white/5 rounded-3xl border border-white/10">
                            <div className="text-4xl font-black text-white mb-2">{operations.busiestDay}</div>
                            <div className="text-xs text-gray-500 font-black uppercase tracking-widest">أكثر الأيام زحاماً</div>
                        </div>
                    </div>
                    <div>
                        <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-4">التوزيع الأسبوعي للحركة</p>
                        <div className="flex items-end justify-between h-32 gap-3" dir="ltr">
                            {operations.dayCounts.map((count, idx) => {
                                const max = Math.max(...operations.dayCounts) || 1;
                                return (
                                    <div key={idx} className="flex-1 flex flex-col items-center group h-full">
                                        <div className="w-full bg-gray-800 rounded-t-lg relative flex items-end justify-center transition-all h-full overflow-hidden">
                                            <div className="w-full bg-white/30 rounded-t-lg group-hover:bg-white/60 transition-all" style={{ height: `${(count/max)*100}%` }}></div>
                                        </div>
                                        <span className="text-[9px] text-gray-500 mt-3 font-black uppercase">{operations.days[idx]}</span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </TiltCard>

                <TiltCard className="p-8 border-white/5 text-right" glowColor="cyan">
                    <h3 className="text-2xl font-black text-white mb-8 flex items-center gap-3">
                        <div className="p-2 bg-neon-blue/10 rounded-xl text-neon-blue"><PieChart size={24}/></div> أفضل مصادر الإحالة
                    </h3>
                    <div className="space-y-6">
                        {marketing.sourceRev.map(([source, revenue], idx) => (
                            <div key={source} className="group">
                                <div className="flex justify-between text-sm mb-3 font-bold">
                                    <span className="text-gray-300 group-hover:text-white transition-colors">{source === 'Phone Call' ? 'مكالمة هاتفية' : source === 'Social Media' ? 'تواصل اجتماعي' : source === 'Clinic Visit' ? 'زيارة عيادة' : source === 'Walk-in' ? 'حضور مباشر' : source}</span>
                                    <div className="flex gap-4 text-xs font-mono">
                                        <span className="text-gray-500">{marketing.sourceCount[source]} حجز</span>
                                        <span className="text-neon-blue">${revenue.toLocaleString()}</span>
                                    </div>
                                </div>
                                <div className="h-2.5 bg-gray-800 rounded-full overflow-hidden border border-white/5 shadow-inner">
                                    <div className="h-full bg-gradient-to-l from-neon-blue to-cyan-400 shadow-[0_0_10px_rgba(0,243,255,0.4)] transition-all duration-1000" style={{ width: `${(revenue / marketing.maxSourceRev) * 100}%`, transitionDelay: `${idx * 100}ms` }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </TiltCard>
            </div>
        </div>
    );
};

export default AnalyticsViewAR;

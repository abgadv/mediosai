
import React, { useState, useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import TiltCard from '../../components/TiltCard';
import { 
  Users, UserCheck, BarChart2, FileDown, 
  MapPin, PieChart, Layers, Clock, TrendingUp,
  DollarSign, Activity, Stethoscope, AlertOctagon,
  Calendar, Repeat, Heart
} from 'lucide-react';

const AnalyticsView: React.FC = () => {
    const { appointments, transactions } = useData();
    const [timeFilter, setTimeFilter] = useState<'7days' | '30days' | 'thisMonth' | 'custom'>('thisMonth');
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');

    const filteredData = useMemo(() => {
        const now = new Date();
        let startDate = new Date();
        let endDate = new Date();

        if (timeFilter === '7days') {
            startDate.setDate(now.getDate() - 7);
        } else if (timeFilter === '30days') {
            startDate.setDate(now.getDate() - 30);
        } else if (timeFilter === 'thisMonth') {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        } else if (timeFilter === 'custom' && customStart && customEnd) {
            startDate = new Date(customStart);
            endDate = new Date(customEnd);
            endDate.setHours(23, 59, 59, 999);
        }

        return appointments.filter(a => {
            const d = new Date(a.date);
            return d >= startDate && d <= endDate;
        });
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

    // --- Enhanced Metrics Logic ---

    // 1. Demographics & Retention
    const demographics = useMemo(() => {
        let age0_18 = 0, age19_35 = 0, age36_50 = 0, age50plus = 0;
        const locs: Record<string, number> = {};
        let newPatients = 0;
        let returning = 0;
        const uniquePatients = new Set();

        filteredData.forEach(a => {
            uniquePatients.add(a.phone);
            const age = parseInt(a.age || '0');
            if(age > 0) {
                if(age <= 18) age0_18++;
                else if(age <= 35) age19_35++;
                else if(age <= 50) age36_50++;
                else age50plus++;
            }
            if(a.residence) {
                const r = a.residence.trim();
                if(r) locs[r] = (locs[r] || 0) + 1;
            }
            if(a.visitType === 'Follow-up') returning++;
            else newPatients++;
        });

        const topLocations = Object.entries(locs).sort((a,b) => b[1] - a[1]).slice(0, 5);
        const totalPatients = newPatients + returning;
        const retentionRate = totalPatients > 0 ? Math.round((returning / totalPatients) * 100) : 0;
        const maxAgeGroup = Math.max(age0_18, age19_35, age36_50, age50plus) || 1;
        const maxLoc = topLocations.length > 0 ? topLocations[0][1] : 1;
        const avgVisits = uniquePatients.size > 0 ? (totalPatients / uniquePatients.size).toFixed(1) : '0';

        return {
            age: { '0-18': age0_18, '19-35': age19_35, '36-50': age36_50, '50+': age50plus, max: maxAgeGroup },
            locations: topLocations,
            retention: { new: newPatients, returning, rate: retentionRate },
            maxLoc,
            avgVisits
        };
    }, [filteredData]);

    // 2. Financial Deep Dive
    const financial = useMemo(() => {
        const apptRevenue = filteredData.reduce((acc, curr) => acc + (Number(curr.paid) || 0), 0);
        const otherIncome = filteredTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + Number(t.amount), 0);
        const totalIncome = apptRevenue + otherIncome;
        const totalExpense = filteredTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + Number(t.amount), 0);
        const netProfit = totalIncome - totalExpense;
        const profitMargin = totalIncome > 0 ? Math.round((netProfit / totalIncome) * 100) : 0;
        const payingPatients = filteredData.filter(a => a.paid > 0).length;
        const atv = payingPatients > 0 ? Math.round(apptRevenue / payingPatients) : 0;

        return { totalIncome, totalExpense, netProfit, profitMargin, atv, apptRevenue };
    }, [filteredData, filteredTransactions]);

    // 3. Operational Efficiency & Status Breakdown
    const operations = useMemo(() => {
        const total = filteredData.length;
        const completed = filteredData.filter(a => a.status === 'completed').length;
        const cancelled = filteredData.filter(a => a.status === 'cancelled').length;
        const checkedIn = filteredData.filter(a => a.status === 'checked-in').length;
        const booked = filteredData.filter(a => a.status === 'booked').length;
        
        const cancellationRate = total > 0 ? Math.round((cancelled / total) * 100) : 0;
        
        // Day of Week Analysis
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const dayCounts = Array(7).fill(0);
        filteredData.forEach(a => {
            const dayIdx = new Date(a.date).getDay();
            dayCounts[dayIdx]++;
        });
        const busiestDayIndex = dayCounts.indexOf(Math.max(...dayCounts));
        const busiestDay = days[busiestDayIndex];

        return { completed, cancelled, checkedIn, booked, cancellationRate, dayCounts, busiestDay, days, total };
    }, [filteredData]);

    // 4. Marketing - Revenue by Source
    const marketing = useMemo(() => {
        const sourceRev: Record<string, number> = {};
        const sourceCount: Record<string, number> = {};
        
        filteredData.forEach(a => {
            sourceRev[a.source] = (sourceRev[a.source] || 0) + (Number(a.paid) || 0);
            sourceCount[a.source] = (sourceCount[a.source] || 0) + 1;
        });

        const sortedByRev = Object.entries(sourceRev).sort((a,b) => b[1] - a[1]);
        const maxSourceRev = sortedByRev.length > 0 ? sortedByRev[0][1] : 1;

        return { sourceRev: sortedByRev, maxSourceRev, sourceCount };
    }, [filteredData]);

    // 5. Clinical - Top Diagnoses
    const clinical = useMemo(() => {
        const diagCounts: Record<string, number> = {};
        filteredData.forEach(a => {
            if(a.diagnosis && a.diagnosis.trim()) {
                const d = a.diagnosis.trim().toUpperCase();
                diagCounts[d] = (diagCounts[d] || 0) + 1;
            }
        });
        const topDiags = Object.entries(diagCounts).sort((a,b) => b[1] - a[1]).slice(0, 5);
        const maxDiag = topDiags.length > 0 ? topDiags[0][1] : 1;
        return { topDiags, maxDiag };
    }, [filteredData]);

    // 6. Peak Hours
    const busyHours = useMemo(() => {
        const hours = Array(24).fill(0);
        filteredData.forEach(a => {
            if(a.time) {
                const hour = parseInt(a.time.split(':')[0]);
                if(!isNaN(hour)) hours[hour]++;
            }
        });
        return hours.map((count, hour) => ({ hour, count })).slice(8, 22); 
    }, [filteredData]);

    const maxHourVal = Math.max(...busyHours.map(h => h.count)) || 1;

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header & Controls */}
            <TiltCard className="p-4 flex flex-wrap gap-4 items-center justify-between border-white/10" noTilt>
                <div className="flex gap-2 bg-black/40 p-1.5 rounded-xl border border-white/5">
                    {['7days', '30days', 'thisMonth', 'custom'].map(f => (
                        <button
                            key={f}
                            onClick={() => setTimeFilter(f as any)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition-all duration-300 ${timeFilter === f ? 'bg-neon-blue text-black shadow-[0_0_15px_-3px_rgba(0,243,255,0.4)]' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                        >
                            {f === 'thisMonth' ? 'This Month' : f.replace('days', ' Days')}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-4">
                    {timeFilter === 'custom' && (
                        <div className="flex gap-2 items-center animate-in fade-in slide-in-from-right-2">
                            <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-neon-blue outline-none transition-colors" />
                            <span className="text-gray-500 font-bold">-</span>
                            <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-neon-blue outline-none transition-colors" />
                        </div>
                    )}
                </div>
            </TiltCard>

            {/* --- SECTION 1: FINANCIAL OVERVIEW --- */}
            <h3 className="text-lg font-bold text-white flex items-center gap-2"><DollarSign className="text-green-400" size={20}/> Financial Performance</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <TiltCard className="p-6 border-white/5 group" glowColor="purple">
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest group-hover:text-neon-purple transition-colors">Total Income</p>
                    <h3 className="text-3xl font-black mt-2 text-white group-hover:drop-shadow-[0_0_10px_rgba(157,0,255,0.3)] transition-all">${financial.totalIncome.toLocaleString()}</h3>
                </TiltCard>
                <TiltCard className="p-6 border-white/5 group" glowColor="red">
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest group-hover:text-red-400 transition-colors">Total Expenses</p>
                    <h3 className="text-3xl font-black mt-2 text-red-400 group-hover:drop-shadow-[0_0_10px_rgba(239,68,68,0.3)] transition-all">${financial.totalExpense.toLocaleString()}</h3>
                </TiltCard>
                <TiltCard className="p-6 border-white/5 group" glowColor="green">
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest group-hover:text-green-400 transition-colors">Net Profit</p>
                    <h3 className="text-3xl font-black mt-2 text-green-400 group-hover:drop-shadow-[0_0_10px_rgba(34,197,94,0.3)] transition-all">${financial.netProfit.toLocaleString()}</h3>
                    <span className="text-[10px] text-gray-500 font-bold uppercase mt-1 block">Margin: {financial.profitMargin}%</span>
                </TiltCard>
                <TiltCard className="p-6 border-white/5 group" glowColor="cyan">
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest group-hover:text-neon-blue transition-colors">Avg. Transaction</p>
                    <h3 className="text-3xl font-black mt-2 text-neon-blue group-hover:drop-shadow-[0_0_10px_rgba(0,243,255,0.3)] transition-all">${financial.atv}</h3>
                    <span className="text-[10px] text-gray-500 font-bold uppercase mt-1 block">Per Patient</span>
                </TiltCard>
            </div>

            {/* --- SECTION 2: RETENTION & LOYALTY (NEW) --- */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <TiltCard className="p-8 border-white/5" glowColor="purple">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold flex items-center gap-3 text-white">
                            <div className="p-1.5 bg-neon-purple/10 rounded-lg text-neon-purple"><Heart size={20}/></div> Patient Retention
                        </h3>
                        <div className="px-3 py-1 bg-neon-purple/10 border border-neon-purple/30 rounded-lg text-xs font-bold text-neon-purple">
                            Avg Visits: {demographics.avgVisits}
                        </div>
                    </div>
                    <div className="flex gap-4 items-end h-40 mb-6 px-4">
                        <div className="flex-1 flex flex-col justify-end gap-2 group">
                            <div className="text-center font-bold text-blue-400 text-lg group-hover:scale-110 transition-transform">{demographics.retention.new}</div>
                            <div className="w-full bg-blue-500/20 rounded-t-xl border-t border-x border-blue-500/30 relative h-full group-hover:bg-blue-500/30 transition-colors">
                                <div className="absolute bottom-0 left-0 w-full bg-blue-500 rounded-t-xl opacity-60" style={{ height: `${(demographics.retention.new / (operations.total || 1)) * 100}%` }}></div>
                            </div>
                            <div className="text-center text-xs font-bold text-gray-500 uppercase tracking-wider">New</div>
                        </div>
                        <div className="flex-1 flex flex-col justify-end gap-2 group">
                            <div className="text-center font-bold text-neon-purple text-lg group-hover:scale-110 transition-transform">{demographics.retention.returning}</div>
                            <div className="w-full bg-neon-purple/20 rounded-t-xl border-t border-x border-neon-purple/30 relative h-full group-hover:bg-neon-purple/30 transition-colors">
                                <div className="absolute bottom-0 left-0 w-full bg-neon-purple rounded-t-xl opacity-60" style={{ height: `${(demographics.retention.returning / (operations.total || 1)) * 100}%` }}></div>
                            </div>
                            <div className="text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Returning</div>
                        </div>
                    </div>
                    <div className="bg-black/30 rounded-xl p-4 flex items-center justify-between border border-white/5">
                        <div className="flex items-center gap-3">
                            <Repeat size={20} className="text-gray-400" />
                            <div>
                                <p className="text-xs text-gray-500 font-bold uppercase">Loyalty Rate</p>
                                <p className="text-white font-medium text-sm">Returning Patients %</p>
                            </div>
                        </div>
                        <span className="text-2xl font-black text-white">{demographics.retention.rate}%</span>
                    </div>
                </TiltCard>

                {/* Status Breakdown (Replaces simple charts) */}
                <TiltCard className="p-8 border-white/5" glowColor="cyan">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-3 text-white">
                        <div className="p-1.5 bg-neon-blue/10 rounded-lg text-neon-blue"><PieChart size={20}/></div> Appointment Status
                    </h3>
                    <div className="flex items-center gap-8">
                        {/* CSS Conic Gradient Pie Chart Placeholder */}
                        <div className="relative w-40 h-40 rounded-full flex-shrink-0 animate-spin-slow" 
                             style={{
                                 background: `conic-gradient(
                                     #22c55e 0% ${ (operations.completed/operations.total)*100 }%, 
                                     #ef4444 ${ (operations.completed/operations.total)*100 }% ${ ((operations.completed + operations.cancelled)/operations.total)*100 }%,
                                     #3b82f6 ${ ((operations.completed + operations.cancelled)/operations.total)*100 }% 100%
                                 )`
                             }}>
                             <div className="absolute inset-2 bg-[#0a0a0a] rounded-full flex items-center justify-center">
                                 <div className="text-center">
                                     <span className="block text-2xl font-black text-white">{operations.total}</span>
                                     <span className="text-[10px] text-gray-500 uppercase font-bold">Total</span>
                                 </div>
                             </div>
                        </div>
                        <div className="flex-1 space-y-3">
                            <div className="flex justify-between items-center text-sm">
                                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-green-500 rounded-full"></div> <span className="text-gray-300">Completed</span></div>
                                <span className="font-bold text-white">{operations.completed}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-red-500 rounded-full"></div> <span className="text-gray-300">Cancelled</span></div>
                                <span className="font-bold text-white">{operations.cancelled}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <div className="flex items-center gap-2"><div className="w-3 h-3 bg-blue-500 rounded-full"></div> <span className="text-gray-300">Pending/Booked</span></div>
                                <span className="font-bold text-white">{operations.booked + operations.checkedIn}</span>
                            </div>
                        </div>
                    </div>
                </TiltCard>
            </div>

            {/* --- SECTION 3: MARKETING & OPERATIONS --- */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Cancellation & Operations */}
                <TiltCard className="p-8 border-white/5" glowColor="red">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-3 text-white">
                        <div className="p-1.5 bg-red-500/10 rounded-lg text-red-400"><AlertOctagon size={20}/></div> Operations
                    </h3>
                    <div className="grid grid-cols-2 gap-8 mb-6">
                        <div className="text-center p-4 bg-white/5 rounded-2xl border border-white/5">
                            <div className="text-3xl font-black text-red-400 mb-1">{operations.cancellationRate}%</div>
                            <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">Cancellation Rate</div>
                        </div>
                        <div className="text-center p-4 bg-white/5 rounded-2xl border border-white/5">
                            <div className="text-3xl font-black text-white mb-1">{operations.busiestDay}</div>
                            <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">Busiest Day</div>
                        </div>
                    </div>
                    <div>
                        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-3">Weekly Traffic Distribution</p>
                        <div className="flex items-end justify-between h-24 gap-2">
                            {operations.dayCounts.map((count, idx) => {
                                const max = Math.max(...operations.dayCounts) || 1;
                                return (
                                    <div key={idx} className="flex-1 flex flex-col items-center group">
                                        <div className="w-full bg-gray-800 rounded-t-sm relative flex items-end justify-center transition-all duration-300 hover:bg-white/20 h-full">
                                            <div className="w-full bg-white/30 rounded-t-sm group-hover:bg-white/60 transition-all" style={{ height: `${(count/max)*100}%` }}></div>
                                        </div>
                                        <span className="text-[9px] text-gray-500 mt-2 font-bold">{operations.days[idx]}</span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </TiltCard>

                {/* Revenue by Source (Marketing) */}
                <TiltCard className="p-8 border-white/5" glowColor="cyan">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-3 text-white">
                        <div className="p-1.5 bg-neon-blue/10 rounded-lg text-neon-blue"><PieChart size={20}/></div> Top Referral Sources
                    </h3>
                    <div className="space-y-4">
                        {marketing.sourceRev.map(([source, revenue], idx) => (
                            <div key={source} className="group">
                                <div className="flex justify-between text-sm mb-2 font-medium">
                                    <span className="text-gray-300 group-hover:text-white transition-colors">{source}</span>
                                    <div className="flex gap-3 text-xs">
                                        <span className="text-gray-500">{marketing.sourceCount[source]} bookings</span>
                                        <span className="text-neon-blue font-mono font-bold">${revenue.toLocaleString()}</span>
                                    </div>
                                </div>
                                <div className="h-2 bg-gray-800 rounded-full overflow-hidden border border-white/5">
                                    <div 
                                        className="h-full bg-gradient-to-r from-neon-blue to-cyan-400 shadow-[0_0_10px_rgba(0,243,255,0.4)] relative" 
                                        style={{ width: `${(revenue / marketing.maxSourceRev) * 100}%`, transitionDelay: `${idx * 100}ms` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                        {marketing.sourceRev.length === 0 && <p className="text-gray-500 text-center italic">No financial data by source available.</p>}
                    </div>
                </TiltCard>
            </div>

            {/* --- SECTION 4: CLINICAL & DEMOGRAPHICS --- */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Clinical Insights */}
                <TiltCard className="p-8 border-white/5" glowColor="purple">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-3 text-white">
                        <div className="p-1.5 bg-neon-purple/10 rounded-lg text-neon-purple"><Stethoscope size={20}/></div> Clinical Trends
                    </h3>
                    <div className="space-y-4">
                        <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider mb-2">Top Diagnoses</p>
                        {clinical.topDiags.map(([diag, count], idx) => (
                            <div key={diag} className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5 hover:bg-white/10 transition-colors">
                                <div className="text-neon-purple font-black text-sm w-4">{idx + 1}</div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-bold text-white text-sm">{diag}</span>
                                        <span className="text-gray-400 text-xs">{count} Cases</span>
                                    </div>
                                    <div className="w-full bg-gray-800 h-1 rounded-full overflow-hidden">
                                        <div className="h-full bg-neon-purple" style={{ width: `${(count / clinical.maxDiag) * 100}%` }}></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {clinical.topDiags.length === 0 && <p className="text-gray-500 text-center italic">No diagnosis data recorded yet.</p>}
                    </div>
                </TiltCard>

                {/* Peak Hours Traffic */}
                <TiltCard className="p-8 border-white/5" glowColor="red">
                    <h3 className="text-xl font-bold mb-8 flex items-center gap-3 text-white"><div className="p-1.5 bg-orange-500/10 rounded-lg text-orange-400"><Clock size={20}/></div> Peak Hours Traffic</h3>
                    <div className="h-56 flex items-end justify-between gap-2 px-2">
                        {busyHours.map(({ hour, count }) => (
                            <div key={hour} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                                <div 
                                    className="w-full bg-gradient-to-t from-orange-500/20 to-orange-400/40 group-hover:from-orange-500/40 group-hover:to-orange-400/60 transition-all duration-300 rounded-t-lg relative border-t border-x border-orange-500/30"
                                    style={{ height: `${(count / maxHourVal) * 100}%` }}
                                >
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-all font-bold shadow-lg -translate-y-2 group-hover:translate-y-0">{count}</div>
                                </div>
                                <span className="text-[10px] text-gray-600 group-hover:text-orange-400 mt-3 font-mono font-medium transition-colors">{hour}:00</span>
                            </div>
                        ))}
                    </div>
                </TiltCard>
            </div>
        </div>
    );
};

export default AnalyticsView;

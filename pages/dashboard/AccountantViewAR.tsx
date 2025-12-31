import React, { useState, useMemo, useContext, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import TiltCard from '../../components/TiltCard';
import { DashboardUIContext } from '../../contexts/DashboardUIContext';
import { exportToExcel } from '../../utils/exportHelper';
import { Transaction } from '../../types';
import { formatDate } from '../../utils/formatters';
import { 
  TrendingUp, TrendingDown, DollarSign, RefreshCw, FileDown, 
  Edit2, Trash2, XCircle, Plus
} from 'lucide-react';

const AccountantViewAR: React.FC = () => {
    const { appointments, transactions, addTransaction, updateTransaction, deleteTransaction } = useData();
    // Fix: Use systemUser instead of user which doesn't exist on AuthContextType
    const { systemUser } = useAuth();
    const { setHeaderHidden } = useContext(DashboardUIContext);
    const today = new Date().toISOString().split('T')[0];
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [typeFilter, setTypeFilter] = useState<'All' | 'Income' | 'Expense'>('All');
    const [showModal, setShowModal] = useState(false);
    const [editingTx, setEditingTx] = useState<Partial<Transaction> | null>(null);
    const [txForm, setTxForm] = useState({ date: today, description: '', type: 'income' as 'income' | 'expense', amount: '' });

    useEffect(() => { setHeaderHidden(showModal); }, [showModal, setHeaderHidden]);
    // Fix: Use systemUser instead of user
    const canAdd = systemUser?.role === 'admin' || systemUser?.permissions?.accountant?.actions?.add_transaction;

    const combinedData = useMemo(() => { 
        const paidAppts = appointments.filter(a => a.paid > 0).map(a => ({ id: a.id, date: a.date, description: `${a.name} - دفعة حجز`, type: 'income' as const, amount: a.paid, isSystem: true })); 
        const all = [...paidAppts, ...transactions.map(t => ({ ...t, isSystem: false }))]; 
        return all.filter(t => { 
            const dateMatch = (!dateFrom || t.date >= dateFrom) && (!dateTo || t.date <= dateTo); 
            const typeMatch = typeFilter === 'All' || (typeFilter === 'Income' && t.type === 'income') || (typeFilter === 'Expense' && t.type === 'expense'); 
            return dateMatch && typeMatch; 
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); 
    }, [appointments, transactions, dateFrom, dateTo, typeFilter]);

    const totals = useMemo(() => { 
        const income = combinedData.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0); 
        const expense = combinedData.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0); 
        return { income, expense, net: income - expense }; 
    }, [combinedData]);

    const handleTxSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if(txForm.description && txForm.amount) {
            const amount = Number(txForm.amount);
            if(editingTx?.id) await updateTransaction(editingTx.id, { ...txForm, amount });
            else await addTransaction({ ...txForm, amount });
            setShowModal(false); setEditingTx(null); setTxForm({ date: today, description: '', type: 'income', amount: '' });
        }
    };

    return (
        <div className="space-y-8 animate-fade-in font-arabic" dir="rtl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <TiltCard glowColor="green" className="p-8 flex items-center justify-between border-green-500/20 group text-right">
                    <div>
                        <p className="text-gray-400 text-xs font-black uppercase mb-2">إجمالي الإيرادات</p>
                        <h3 className="text-5xl font-black text-green-400">${totals.income.toLocaleString()}</h3>
                    </div>
                    <div className="w-16 h-16 rounded-3xl bg-green-500/10 flex items-center justify-center text-green-500 border border-green-500/20 shadow-lg"><TrendingUp size={32}/></div>
                </TiltCard>
                <TiltCard glowColor="red" className="p-8 flex items-center justify-between border-red-500/20 group text-right">
                    <div>
                        <p className="text-gray-400 text-xs font-black mb-2">إجمالي المصروفات</p>
                        <h3 className="text-5xl font-black text-red-400">${totals.expense.toLocaleString()}</h3>
                    </div>
                    <div className="w-16 h-16 rounded-3xl bg-red-500/10 flex items-center justify-center text-red-500 border border-red-500/20 shadow-lg"><TrendingDown size={32}/></div>
                </TiltCard>
                <TiltCard className="p-8 flex items-center justify-between border-white/10 group text-right" glowColor="cyan">
                    <div>
                        <p className="text-gray-400 text-xs font-black mb-2">صافي الربح</p>
                        <h3 className={`text-5xl font-black ${totals.net >= 0 ? 'text-neon-blue' : 'text-orange-500'}`}>${totals.net.toLocaleString()}</h3>
                    </div>
                    <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center text-white border border-white/10 shadow-lg"><DollarSign size={32}/></div>
                </TiltCard>
            </div>

            <TiltCard className="p-0 border-white/5 overflow-hidden" glowColor="cyan">
                <div className="flex flex-wrap items-end gap-4 p-6 bg-black/20 border-b border-white/5">
                    <div className="flex flex-col gap-1.5"> <label className="text-[10px] text-gray-500 font-black uppercase">من تاريخ</label> <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white" /> </div>
                    <div className="flex flex-col gap-1.5"> <label className="text-[10px] text-gray-500 font-black uppercase">إلى تاريخ</label> <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white" /> </div>
                    <div className="flex flex-col gap-1.5 min-w-[150px]"> <label className="text-[10px] text-gray-500 font-black uppercase">النوع</label> <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as any)} className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white appearance-none"> <option value="All">الكل</option> <option value="Income">إيرادات</option> <option value="Expense">مصروفات</option> </select> </div>
                    <button onClick={() => { setDateFrom(''); setDateTo(''); setTypeFilter('All'); }} className="px-4 py-2.5 bg-gray-800 text-gray-400 rounded-lg"><RefreshCw size={18}/></button>
                    <button onClick={() => exportToExcel(combinedData, 'Report')} className="flex items-center gap-2 px-6 py-2.5 bg-green-600/10 text-green-400 border border-green-500/30 rounded-xl font-black text-xs uppercase"><FileDown size={18}/> تصدير</button>
                    <div className="flex-1 text-left">
                        {canAdd && <button onClick={() => { setEditingTx(null); setTxForm({ date: today, description: '', type: 'income', amount: '' }); setShowModal(true); }} className="px-8 py-2.5 bg-neon-blue text-black font-black rounded-xl shadow-lg">+ إضافة قيد</button>}
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-right text-lg">
                        <thead className="bg-white/5 text-gray-500 font-black"><tr><th className="p-6">التاريخ</th><th className="p-6">البيان</th><th className="p-6">النوع</th><th className="p-6 text-left">المبلغ</th><th className="p-6 text-center">الإجراء</th></tr></thead>
                        <tbody className="divide-y divide-white/5 font-bold">
                            {combinedData.map(tx => (
                                <tr key={tx.id} className="hover:bg-white/5 transition-colors group">
                                    <td className="p-6 font-mono text-gray-500">{formatDate(tx.date)}</td>
                                    <td className="p-6 text-xl text-white">{tx.description}</td>
                                    <td className="p-6"> <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase ${tx.type === 'income' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}> {tx.type === 'income' ? 'وارد' : 'صادر'} </span> </td>
                                    <td className={`p-6 text-left font-mono text-2xl font-black ${tx.type === 'income' ? 'text-green-400' : 'text-red-400'}`}> {tx.type === 'income' ? '+' : '-'}${Number(tx.amount).toFixed(2)} </td>
                                    <td className="p-6 text-center">
                                        {!tx.isSystem ? (
                                            <div className="flex justify-center gap-3">
                                                <button onClick={() => { setEditingTx(tx); setTxForm({ date: tx.date, description: tx.description, type: tx.type, amount: tx.amount.toString() }); setShowModal(true); }} className="p-2 text-gray-400 hover:text-white transition-all"><Edit2 size={18}/></button>
                                                <button onClick={() => deleteTransaction(tx.id)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-xl transition-all"><Trash2 size={18}/></button>
                                            </div>
                                        ) : <span className="text-xs text-gray-700 italic">نظام</span>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </TiltCard>

            {showModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-6 animate-fade-in" dir="rtl">
                    <div className="w-full max-w-xl glass-panel rounded-3xl p-12 border border-neon-blue/30 shadow-2xl animate-slide-up">
                        <div className="flex justify-between items-center mb-10 pb-6 border-b border-white/10">
                            <h3 className="text-4xl font-black text-white">{editingTx ? 'تعديل المعاملة' : 'إضافة معاملة جديدة'}</h3>
                            <button onClick={() => setShowModal(false)} className="p-3 bg-white/5 rounded-full text-gray-400 hover:text-white"><XCircle size={32}/></button>
                        </div>
                        <form onSubmit={handleTxSubmit} className="space-y-8">
                            <div className="space-y-2"> <label className="text-sm font-black text-gray-500 block">التاريخ</label> <input type="date" required value={txForm.date} onChange={e => setTxForm({...txForm, date: e.target.value})} className="w-full bg-black/40 border-2 border-white/10 rounded-2xl p-5 text-xl text-white outline-none focus:border-neon-blue" /> </div>
                            <div className="space-y-2"> <label className="text-sm font-black text-gray-500 block">الوصف / البيان</label> <input type="text" required placeholder="مثلاً: شراء مستلزمات طبية" value={txForm.description} onChange={e => setTxForm({...txForm, description: e.target.value})} className="w-full bg-black/40 border-2 border-white/10 rounded-2xl p-5 text-xl text-white outline-none focus:border-neon-blue" /> </div>
                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-2"> <label className="text-sm font-black text-gray-500 block">النوع</label> <select value={txForm.type} onChange={e => setTxForm({...txForm, type: e.target.value as any})} className="w-full bg-black/40 border-2 border-white/10 rounded-2xl p-5 text-xl text-white outline-none focus:border-neon-blue appearance-none"> <option value="income">إيراد (+)</option> <option value="expense">مصروف (-)</option> </select> </div>
                                <div className="space-y-2"> <label className="text-sm font-black text-gray-500 block">المبلغ ($)</label> <input type="number" required placeholder="0.00" value={txForm.amount} onChange={e => setTxForm({...txForm, amount: e.target.value})} className="w-full bg-black/40 border-2 border-white/10 rounded-2xl p-5 text-2xl text-white outline-none focus:border-neon-blue text-left" dir="ltr" /> </div>
                            </div>
                            <button type="submit" className="w-full py-6 bg-gradient-to-l from-neon-blue to-cyan-600 rounded-3xl text-black font-black text-2xl shadow-xl hover:scale-[1.02] transition-all">حفظ المعاملة</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AccountantViewAR;
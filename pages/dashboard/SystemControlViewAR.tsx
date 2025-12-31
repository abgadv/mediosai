
import React, { useState, useContext, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import TiltCard from '../../components/TiltCard';
import { DashboardUIContext } from '../../contexts/DashboardUIContext';
import { AppUser } from '../../types';
import { Shield, UserPlus, Edit2, Trash2, XCircle, Key } from 'lucide-react';

const SystemControlViewAR: React.FC = () => {
    const { appUsers, addAppUser, updateAppUser, deleteAppUser } = useData();
    const [showUserModal, setShowUserModal] = useState(false);
    const { setHeaderHidden } = useContext(DashboardUIContext);
    const [editingUser, setEditingUser] = useState<AppUser | null>(null);
    const [userForm, setUserForm] = useState<Partial<AppUser>>({ username: '', password: '', displayName: '', role: 'staff', permissions: {} });

    useEffect(() => { setHeaderHidden(showUserModal); }, [showUserModal, setHeaderHidden]);

    const PERMISSION_KEYS = [
        { key: 'dashboard', label: 'الوصول للوحة القيادة' },
        { key: 'front_desk', label: 'الوصول لمكتب الاستقبال', actions: ['add_booking', 'delete_booking'] },
        { key: 'examination_room', label: 'الوصول لغرفة الفحص', actions: ['complete_exam'] },
        { key: 'social_media', label: 'الوصول للسوشيال ميديا' },
        { key: 'accountant', label: 'الوصول للمحاسبة', actions: ['add_transaction'] },
        { key: 'analytics', label: 'الوصول للتحليلات' },
        { key: 'customize_prints', label: 'تخصيص المطبوعات' },
        { key: 'system_control', label: 'الوصول للتحكم بالنظام' },
    ];

    const togglePermission = (key: string, type: 'access' | 'action', actionName?: string) => {
        setUserForm(prev => {
            const currentPerms = { ...prev.permissions };
            if (!currentPerms[key]) currentPerms[key] = { access: false, actions: {} };
            if (type === 'access') currentPerms[key].access = !currentPerms[key].access;
            else if (type === 'action' && actionName) {
                const currentActions = { ...currentPerms[key].actions };
                currentActions[actionName] = !currentActions[actionName];
                currentPerms[key].actions = currentActions;
            }
            return { ...prev, permissions: currentPerms };
        });
    };

    const handleSaveUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!userForm.username || !userForm.password || !userForm.displayName) return;
        if (editingUser) await updateAppUser(editingUser.id, userForm);
        else await addAppUser(userForm as any);
        setShowUserModal(false); setEditingUser(null);
    };

    return (
        <div className="space-y-8 animate-fade-in font-arabic" dir="rtl">
            <TiltCard className="p-10 border-white/5" glowColor="cyan">
                <div className="flex justify-between items-center mb-12">
                    <h3 className="text-3xl font-black text-white flex items-center gap-6">
                        <div className="p-3 bg-neon-blue/10 rounded-2xl text-neon-blue shadow-lg"><Shield size={40} /></div> إدارة مستخدمي النظام
                    </h3>
                    <button onClick={() => { setEditingUser(null); setUserForm({ username: '', password: '', displayName: '', role: 'staff', permissions: {} }); setShowUserModal(true); }} className="flex items-center gap-4 px-10 py-5 bg-gradient-to-l from-neon-blue to-cyan-600 rounded-3xl text-black font-black text-xl shadow-2xl hover:scale-105 active:scale-95 transition-all">
                        <UserPlus size={28} /> إضافة مستخدم جديد
                    </button>
                </div>

                <div className="overflow-hidden rounded-3xl border border-white/10 bg-black/20">
                    <table className="w-full text-right text-lg">
                        <thead className="bg-white/5 text-gray-400 font-black uppercase tracking-widest text-xs">
                            <tr><th className="p-6">الاسم المستعار</th><th className="p-6">اسم المستخدم</th><th className="p-6">الدور</th><th className="p-6">كلمة المرور</th><th className="p-6 text-center">الإجراءات</th></tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 font-bold">
                            {appUsers.map(user => (
                                <tr key={user.id} className="hover:bg-white/5 group">
                                    <td className="p-6 text-2xl text-white group-hover:text-neon-blue transition-colors">{user.displayName}</td>
                                    <td className="p-6 font-mono text-gray-500">{user.username}</td>
                                    <td className="p-6"><span className="bg-white/10 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest">{user.role}</span></td>
                                    <td className="p-6 font-mono text-xs opacity-50 tracking-widest">••••••</td>
                                    <td className="p-6 text-center">
                                        <div className="flex justify-center gap-4">
                                            <button onClick={() => { setEditingUser(user); setUserForm(user); setShowUserModal(true); }} className="p-3 bg-blue-500/10 text-blue-400 rounded-2xl hover:bg-blue-500 hover:text-white transition-all"><Edit2 size={24} /></button>
                                            <button onClick={() => deleteAppUser(user.id)} className="p-3 bg-red-500/10 text-red-400 rounded-2xl hover:bg-red-500 hover:text-white transition-all"><Trash2 size={24} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </TiltCard>

            {showUserModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-6 animate-fade-in" dir="rtl">
                    <div className="w-full max-w-2xl glass-panel rounded-[40px] p-12 border border-neon-blue/30 shadow-2xl animate-slide-up flex flex-col max-h-[90vh]">
                        <div className="flex justify-between items-center mb-8 pb-6 border-b border-white/10 shrink-0">
                            <h3 className="text-3xl font-black text-white">{editingUser ? 'تعديل الصلاحيات' : 'إنشاء حساب مستخدم'}</h3>
                            <button onClick={() => setShowUserModal(false)} className="p-3 bg-white/5 rounded-full text-gray-400 hover:text-white"><XCircle size={32}/></button>
                        </div>
                        <form onSubmit={handleSaveUser} className="space-y-8 flex-1 overflow-y-auto pl-4 custom-scrollbar">
                            <div className="grid grid-cols-2 gap-8">
                                <div><label className="text-sm font-black text-gray-500 block mb-2">اسم المستخدم</label><input type="text" required value={userForm.username} onChange={e => setUserForm({...userForm, username: e.target.value})} className="w-full bg-black/40 border-2 border-white/10 rounded-2xl p-5 text-xl text-white outline-none focus:border-neon-blue" /></div>
                                <div><label className="text-sm font-black text-gray-500 block mb-2">كلمة المرور</label><input type="text" required value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} className="w-full bg-black/40 border-2 border-white/10 rounded-2xl p-5 text-xl text-white outline-none focus:border-neon-blue" /></div>
                                <div><label className="text-sm font-black text-gray-500 block mb-2">الاسم المعروض</label><input type="text" required value={userForm.displayName} onChange={e => setUserForm({...userForm, displayName: e.target.value})} className="w-full bg-black/40 border-2 border-white/10 rounded-2xl p-5 text-xl text-white outline-none focus:border-neon-blue" /></div>
                                <div><label className="text-sm font-black text-gray-500 block mb-2">الدور الوظيفي</label><select value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value})} className="w-full bg-black/40 border-2 border-white/10 rounded-2xl p-5 text-xl text-white appearance-none outline-none"> <option value="staff">موظف</option> <option value="doctor">طبيب</option> <option value="admin">مدير نظام</option> <option value="moderator">مسوق</option> </select></div>
                            </div>
                            <div className="pt-8 border-t border-white/10">
                                <h4 className="text-sm font-black text-neon-blue mb-6 flex items-center gap-3 uppercase tracking-widest"><Key size={20}/> صلاحيات الوصول للنظام</h4>
                                <div className="space-y-4">
                                    {PERMISSION_KEYS.map((perm) => (
                                        <div key={perm.key} className="bg-white/5 p-6 rounded-3xl border border-white/10">
                                            <div className="flex items-center justify-between">
                                                <span className="font-black text-white text-md">{perm.label}</span>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input type="checkbox" className="sr-only peer" checked={userForm.permissions?.[perm.key]?.access || false} onChange={() => togglePermission(perm.key, 'access')} />
                                                    <div className="w-12 h-7 bg-gray-800 rounded-full peer peer-checked:bg-neon-blue peer-checked:after:-translate-x-full after:content-[''] after:absolute after:top-[4px] after:right-[4px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:shadow-[0_0_10px_#00f3ff]"></div>
                                                </label>
                                            </div>
                                            {perm.actions && userForm.permissions?.[perm.key]?.access && (
                                                <div className="mt-6 pr-6 border-r-2 border-white/10 space-y-4 animate-slide-up">
                                                    {perm.actions.map(action => (
                                                        <div key={action} className="flex items-center justify-between">
                                                            <span className="text-xs text-gray-400 font-bold capitalize">{action.replace('_', ' ')}</span>
                                                            <label className="relative inline-flex items-center cursor-pointer">
                                                                <input type="checkbox" className="sr-only peer" checked={userForm.permissions?.[perm.key]?.actions?.[action] || false} onChange={() => togglePermission(perm.key, 'action', action)} />
                                                                <div className="w-10 h-6 bg-gray-800 rounded-full peer peer-checked:bg-neon-purple peer-checked:after:-translate-x-full after:content-[''] after:absolute after:top-[4px] after:right-[4px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
                                                            </label>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </form>
                        <button onClick={handleSaveUser} className="w-full py-6 mt-8 bg-gradient-to-l from-neon-blue to-cyan-600 rounded-3xl text-black font-black text-2xl shadow-xl hover:scale-[1.02] transition-all uppercase tracking-widest">حفظ بيانات المستخدم</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SystemControlViewAR;

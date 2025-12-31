
import React, { useState, useContext, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import TiltCard from '../../components/TiltCard';
import { DashboardUIContext } from '../../contexts/DashboardUIContext';
import { AppUser } from '../../types';
import ConfirmationModal from '../../components/ConfirmationModal';
import { Shield, UserPlus, Edit2, Trash2, XCircle, Key } from 'lucide-react';

const SystemControlView: React.FC = () => {
    const { appUsers, addAppUser, updateAppUser, deleteAppUser } = useData();
    const [showUserModal, setShowUserModal] = useState(false);
    const { setHeaderHidden } = useContext(DashboardUIContext);
    const [editingUser, setEditingUser] = useState<AppUser | null>(null);
    const [userForm, setUserForm] = useState<Partial<AppUser>>({
        username: '',
        password: '',
        displayName: '',
        role: 'staff',
        permissions: {}
    });
    const [userToDelete, setUserToDelete] = useState<string | null>(null);

    useEffect(() => {
        setHeaderHidden(showUserModal);
    }, [showUserModal, setHeaderHidden]);

    const PERMISSION_KEYS = [
        { key: 'dashboard', label: 'Dashboard Access' },
        { key: 'front_desk', label: 'Front Desk Access', actions: ['add_booking', 'delete_booking'] },
        { key: 'examination_room', label: 'Examination Room Access', actions: ['complete_exam'] },
        { key: 'assistant_room', label: 'Assistant Room Access' }, // New
        { key: 'social_media', label: 'Social Media Access' },
        { key: 'accountant', label: 'Accountant Access', actions: ['add_transaction'] },
        { key: 'analytics', label: 'Analytics Access' },
        { key: 'customize_prints', label: 'Customize Prints Access' },
        { key: 'system_control', label: 'System Control Access' },
    ];

    const handleEditUser = (user: AppUser) => {
        setEditingUser(user);
        setUserForm({
            username: user.username,
            password: user.password,
            displayName: user.displayName,
            role: user.role,
            permissions: user.permissions || {}
        });
        setShowUserModal(true);
    };

    const handleDeleteUser = (id: string) => {
        setUserToDelete(id);
    };

    const confirmDeleteUser = async () => {
        if(userToDelete) {
            await deleteAppUser(userToDelete);
            setUserToDelete(null);
        }
    };

    const handleSaveUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!userForm.username || !userForm.password || !userForm.displayName) return;

        // Constraint: Only one Assistant Doctor
        if (userForm.role === 'assistant_doctor') {
            const existingAssistant = appUsers.find(u => u.role === 'assistant_doctor');
            if (existingAssistant && existingAssistant.id !== editingUser?.id) {
                alert("Only one Assistant Doctor can be added.");
                return;
            }
        }

        if (editingUser) {
            await updateAppUser(editingUser.id, userForm);
        } else {
            await addAppUser(userForm as any);
        }
        setShowUserModal(false);
        setEditingUser(null);
        setUserForm({ username: '', password: '', displayName: '', role: 'staff', permissions: {} });
    };

    const togglePermission = (key: string, type: 'access' | 'action', actionName?: string) => {
        setUserForm(prev => {
            const currentPerms = { ...prev.permissions };
            if (!currentPerms[key]) {
                currentPerms[key] = { access: false, actions: {} };
            }

            if (type === 'access') {
                currentPerms[key].access = !currentPerms[key].access;
            } else if (type === 'action' && actionName) {
                const currentActions = { ...currentPerms[key].actions };
                currentActions[actionName] = !currentActions[actionName];
                currentPerms[key].actions = currentActions;
            }

            return { ...prev, permissions: currentPerms };
        });
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <TiltCard className="p-8 border-white/5" glowColor="cyan">
                <div className="flex justify-between items-center mb-8">
                    <h3 className="text-xl font-bold flex items-center gap-3 text-white">
                        <div className="p-2 bg-neon-blue/10 rounded-lg text-neon-blue shadow-[0_0_10px_rgba(0,243,255,0.3)]"><Shield size={24} /></div> User Management
                    </h3>
                    <button 
                        onClick={() => { setEditingUser(null); setUserForm({ username: '', password: '', displayName: '', role: 'staff', permissions: {} }); setShowUserModal(true); }}
                        className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-neon-blue to-cyan-600 rounded-xl text-black font-bold hover:shadow-[0_0_20px_rgba(0,243,255,0.4)] transition-all hover:scale-105 active:scale-95"
                    >
                        <UserPlus size={18} /> Add User
                    </button>
                </div>

                <div className="overflow-hidden rounded-xl border border-white/10 bg-black/20">
                    <table className="w-full text-left text-sm text-gray-400">
                        <thead className="bg-white/5 text-gray-300 uppercase font-bold text-xs tracking-wider">
                            <tr>
                                <th className="p-4">Display Name</th>
                                <th className="p-4">Username</th>
                                <th className="p-4">Role</th>
                                <th className="p-4">Password</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {appUsers.map(user => (
                                <tr key={user.id} className="hover:bg-white/5 transition-colors group">
                                    <td className="p-4 font-medium text-white group-hover:text-neon-blue transition-colors">{user.displayName}</td>
                                    <td className="p-4">{user.username}</td>
                                    <td className="p-4"><span className="bg-white/10 px-3 py-1 rounded-full text-xs uppercase font-bold tracking-wide border border-white/5">{user.role}</span></td>
                                    <td className="p-4 font-mono text-xs opacity-50 tracking-widest">••••••</td>
                                    <td className="p-4 text-right flex justify-end gap-3">
                                        <button onClick={() => handleEditUser(user)} className="p-2 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20 hover:bg-blue-500/20 hover:border-blue-500/40 transition-all"><Edit2 size={16} /></button>
                                        <button onClick={() => handleDeleteUser(user.id)} className="p-2 bg-red-500/10 text-red-400 rounded-lg border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/40 transition-all"><Trash2 size={16} /></button>
                                    </td>
                                </tr>
                            ))}
                            {appUsers.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-gray-500 italic">No users found in the system.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </TiltCard>

            {showUserModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
                    <div className="w-full max-w-2xl glass-panel rounded-2xl p-8 border border-neon-blue/20 shadow-[0_0_50px_-10px_rgba(0,243,255,0.2)] flex flex-col max-h-[90vh] animate-slide-up">
                        <div className="flex justify-between items-center mb-8 shrink-0 pb-4 border-b border-white/10">
                            <h3 className="text-2xl font-bold text-white tracking-tight">{editingUser ? 'Edit User & Permissions' : 'Add New User'}</h3>
                            <button onClick={() => setShowUserModal(false)} className="text-gray-400 hover:text-white transition-colors bg-white/5 p-2 rounded-full hover:bg-white/10"><XCircle /></button>
                        </div>
                        
                        <form onSubmit={handleSaveUser} className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="block text-xs text-gray-400 font-bold uppercase tracking-wider ml-1">Username</label>
                                    <input type="text" required value={userForm.username} onChange={e => setUserForm({...userForm, username: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3.5 text-white outline-none focus:border-neon-blue focus:bg-black/60 focus:shadow-[0_0_15px_-5px_rgba(0,243,255,0.2)] transition-all placeholder-gray-600" />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-xs text-gray-400 font-bold uppercase tracking-wider ml-1">Password</label>
                                    <input type="text" required value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3.5 text-white outline-none focus:border-neon-blue focus:bg-black/60 focus:shadow-[0_0_15px_-5px_rgba(0,243,255,0.2)] transition-all placeholder-gray-600" />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-xs text-gray-400 font-bold uppercase tracking-wider ml-1">Display Name</label>
                                    <input type="text" required value={userForm.displayName} onChange={e => setUserForm({...userForm, displayName: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3.5 text-white outline-none focus:border-neon-blue focus:bg-black/60 focus:shadow-[0_0_15px_-5px_rgba(0,243,255,0.2)] transition-all placeholder-gray-600" />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-xs text-gray-400 font-bold uppercase tracking-wider ml-1">Role</label>
                                    <select value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3.5 text-white outline-none focus:border-neon-blue focus:bg-black/60 focus:shadow-[0_0_15px_-5px_rgba(0,243,255,0.2)] transition-all appearance-none cursor-pointer">
                                        <option value="admin" className="bg-gray-900">Admin</option>
                                        <option value="doctor" className="bg-gray-900">Doctor</option>
                                        <option value="assistant_doctor" className="bg-gray-900">Assistant Doctor</option>
                                        <option value="staff" className="bg-gray-900">Staff</option>
                                        <option value="moderator" className="bg-gray-900">Moderator</option>
                                    </select>
                                </div>
                            </div>

                            <div className="border-t border-white/10 pt-6">
                                <h4 className="text-sm font-bold text-neon-blue mb-5 flex items-center gap-2 uppercase tracking-widest"><Key size={16}/> Access Permissions</h4>
                                <div className="space-y-3">
                                    {PERMISSION_KEYS.map((perm) => (
                                        <div key={perm.key} className="bg-white/5 p-4 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                                            <div className="flex items-center justify-between">
                                                <span className="font-semibold text-white text-sm">{perm.label}</span>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input 
                                                        type="checkbox" 
                                                        className="sr-only peer" 
                                                        checked={userForm.permissions?.[perm.key]?.access || false} 
                                                        onChange={() => togglePermission(perm.key, 'access')}
                                                    />
                                                    <div className="w-11 h-6 bg-gray-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-neon-blue peer-checked:shadow-[0_0_10px_#00f3ff]"></div>
                                                </label>
                                            </div>
                                            
                                            {/* Sub Actions Permissions */}
                                            {perm.actions && userForm.permissions?.[perm.key]?.access && (
                                                <div className="mt-4 pl-4 border-l-2 border-white/10 space-y-3 animate-slide-up">
                                                    {perm.actions.map(action => (
                                                        <div key={action} className="flex items-center justify-between group">
                                                            <span className="text-xs text-gray-400 capitalize group-hover:text-white transition-colors">{action.replace('_', ' ')}</span>
                                                            <label className="relative inline-flex items-center cursor-pointer">
                                                                <input 
                                                                    type="checkbox" 
                                                                    className="sr-only peer" 
                                                                    checked={userForm.permissions?.[perm.key]?.actions?.[action] || false}
                                                                    onChange={() => togglePermission(perm.key, 'action', action)}
                                                                />
                                                                <div className="w-9 h-5 bg-gray-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-neon-purple peer-checked:shadow-[0_0_8px_#9d00ff]"></div>
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
                        <div className="mt-8 shrink-0">
                            <button onClick={handleSaveUser} className="w-full py-4 bg-gradient-to-r from-neon-blue to-cyan-600 rounded-xl text-black font-extrabold text-lg hover:opacity-90 transition-all shadow-[0_0_20px_rgba(0,243,255,0.3)] hover:shadow-[0_0_30px_rgba(0,243,255,0.5)] transform hover:-translate-y-1">
                                {editingUser ? 'Save User Changes' : 'Create New User'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmationModal
                isOpen={!!userToDelete}
                onClose={() => setUserToDelete(null)}
                onConfirm={confirmDeleteUser}
                title="Delete User"
                message="Are you sure you want to permanently delete this user? This action cannot be undone."
                confirmText="Delete User"
                isDanger={true}
            />
        </div>
    );
};

export default SystemControlView;

import React, { useState, useEffect } from 'react';
import { Users, Plus, Shield, MapPin, Trash2, Loader2 } from 'lucide-react';
import { getAllUsers, updateUserRole } from '../../utils/complaintStore';
import { Modal } from '../../components/ui';
import toast from 'react-hot-toast';

const ZONES = ['North Zone', 'South Zone', 'East Zone', 'West Zone', 'Central Zone', 'All Zones'];

export default function OfficerManagement() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [promoting, setPromoting] = useState(null);
    const [modal, setModal] = useState(null); // { user, zone }

    useEffect(() => {
        setUsers(getAllUsers());
        setLoading(false);
    }, []);

    const officers = users.filter(u => u.role === 'officer');
    const citizens = users.filter(u => u.role === 'citizen');

    const handlePromote = async () => {
        if (!modal) return;
        setPromoting(modal.user.id);
        try {
            updateUserRole(modal.user.id || modal.user.uid, 'officer', modal.zone);
            toast.success(`${modal.user.name} promoted to Officer!`);
            setUsers(getAllUsers());
            setModal(null);
        } catch {
            toast.error('Failed to update role');
        } finally {
            setPromoting(null);
        }
    };

    const handleDemote = async (uid, name) => {
        if (!window.confirm(`Remove ${name} from officer role?`)) return;
        try {
            updateUserRole(uid, 'citizen', '');
            toast.success(`${name} removed from officers`);
            setUsers(getAllUsers());
        } catch {
            toast.error('Failed to update role');
        }
    };

    const handleMakeAdmin = async (uid, name) => {
        if (!window.confirm(`Make ${name} an Admin? This grants full system access.`)) return;
        try {
            updateUserRole(uid, 'admin', '');
            toast.success(`${name} is now an Admin`);
            setUsers(getAllUsers());
        } catch {
            toast.error('Failed to update role');
        }
    };

    return (
        <div className="max-w-5xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800 mb-1" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Officer Management</h1>
                <p className="text-slate-500">{officers.length} active officers · {users.length} total users</p>
            </div>

            {/* Officers */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 mb-6 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                    <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                        <Shield className="w-4 h-4 text-[#1a3c6e]" /> Active Officers ({officers.length})
                    </h2>
                </div>
                <div className="divide-y divide-slate-50">
                    {loading ? (
                        <div className="py-8 text-center text-slate-400 text-sm">Loading...</div>
                    ) : officers.length === 0 ? (
                        <div className="py-12 text-center">
                            <Users className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                            <p className="text-slate-400 text-sm">No officers yet. Promote citizens below.</p>
                        </div>
                    ) : (
                        officers.map(officer => (
                            <div key={officer.id} className="px-6 py-4 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-[#1a3c6e] flex items-center justify-center text-white font-bold text-sm">
                                        {officer.name?.charAt(0)?.toUpperCase() || 'O'}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-800">{officer.name}</p>
                                        <p className="text-xs text-slate-400">{officer.email}</p>
                                        {officer.zone && (
                                            <p className="text-xs text-[#1a3c6e] flex items-center gap-1 mt-0.5">
                                                <MapPin className="w-3 h-3" /> {officer.zone}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleMakeAdmin(officer.id, officer.name)}
                                        className="px-3 py-1.5 bg-[#f97316]/10 text-[#f97316] rounded-lg text-xs font-medium hover:bg-[#f97316]/20 transition-colors"
                                    >
                                        Make Admin
                                    </button>
                                    <button
                                        onClick={() => handleDemote(officer.id, officer.name)}
                                        className="px-3 py-1.5 bg-red-100 text-red-600 rounded-lg text-xs font-medium hover:bg-red-200 transition-colors"
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Citizens - Promote to Officer */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100">
                    <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                        <Users className="w-4 h-4 text-slate-500" /> Citizens ({citizens.length})
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">Promote users to Officer role</p>
                </div>
                <div className="divide-y divide-slate-50">
                    {citizens.length === 0 ? (
                        <div className="py-8 text-center text-slate-400 text-sm">No citizens yet</div>
                    ) : (
                        citizens.slice(0, 20).map(citizen => (
                            <div key={citizen.id} className="px-6 py-4 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm">
                                        {citizen.name?.charAt(0)?.toUpperCase() || '?'}
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-700 text-sm">{citizen.name || 'Unknown'}</p>
                                        <p className="text-xs text-slate-400">{citizen.email}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setModal({ user: citizen, zone: 'All Zones' })}
                                    disabled={!!promoting}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1a3c6e]/10 text-[#1a3c6e] rounded-lg text-xs font-medium hover:bg-[#1a3c6e]/20 transition-colors disabled:opacity-50"
                                >
                                    <Plus className="w-3 h-3" /> Promote
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Promote Modal */}
            <Modal isOpen={!!modal} onClose={() => setModal(null)} title="Promote to Officer">
                <div className="space-y-4">
                    {modal && (
                        <>
                            <div className="bg-blue-50 rounded-xl p-4">
                                <p className="font-semibold text-blue-800">{modal.user.name}</p>
                                <p className="text-blue-600 text-sm">{modal.user.email}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Assign Zone</label>
                                <select
                                    value={modal.zone}
                                    onChange={e => setModal(prev => ({ ...prev, zone: e.target.value }))}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm input-field"
                                >
                                    {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
                                </select>
                            </div>
                            <button
                                onClick={handlePromote}
                                disabled={!!promoting}
                                className="btn-secondary w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
                            >
                                {promoting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                                {promoting ? 'Promoting...' : 'Confirm Promotion'}
                            </button>
                        </>
                    )}
                </div>
            </Modal>
        </div>
    );
}

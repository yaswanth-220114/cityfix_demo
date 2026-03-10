import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock, CheckCircle, BarChart2, TrendingUp, Users } from 'lucide-react';
import { getComplaints, getAllUsers, getLiveStats } from '../../utils/complaintStore';
import { StatCard, SkeletonCard } from '../../components/ui';
import { CityMap } from '../../components/maps/MapComponents';

export default function AdminOverview() {
    const [stats, setStats] = useState(null);
    const [complaints, setComplaints] = useState([]);
    const [officers, setOfficers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const s = getLiveStats();
        const c = getComplaints();
        const u = getAllUsers();
        setStats(s);
        setComplaints(c);
        setOfficers(u.filter(u => u.role === 'officer'));
        setLoading(false);
    }, []);

    // SLA violations (>48h not resolved)
    const slaViolations = complaints.filter(c => {
        if (c.status === 'resolved') return false;
        const created = c.createdAt?.toDate ? c.createdAt.toDate() : new Date(c.createdAt);
        const hours = (Date.now() - created.getTime()) / 3600000;
        return hours > 48;
    });

    const critical = complaints.filter(c => c.severity === 'critical' && c.status !== 'resolved');

    return (
        <div className="max-w-6xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800 mb-1" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Admin Overview</h1>
                <p className="text-slate-500">Real-time city complaint management dashboard</p>
            </div>

            {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">{[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}</div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <StatCard icon={BarChart2} label="Total Complaints" value={stats?.total || 0} color="blue" />
                    <StatCard icon={CheckCircle} label="Resolved" value={stats?.resolved || 0} color="green" trend={`${stats?.resolvedThisWeek || 0} this week`} />
                    <StatCard icon={Clock} label="Avg Resolution (hrs)" value={stats?.avgResolutionHours || 0} color="purple" />
                    <StatCard icon={Users} label="Active Officers" value={officers.length} color="orange" />
                </div>
            )}

            {/* SLA Alert */}
            {slaViolations.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6">
                    <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                        <h3 className="font-semibold text-red-800">SLA Violations ({slaViolations.length})</h3>
                    </div>
                    <div className="space-y-2">
                        {slaViolations.slice(0, 5).map(c => {
                            const created = c.createdAt?.toDate ? c.createdAt.toDate() : new Date(c.createdAt);
                            const hours = Math.floor((Date.now() - created.getTime()) / 3600000);
                            return (
                                <div key={c.id} className="flex items-center justify-between text-sm">
                                    <span className="font-medium text-red-700 truncate max-w-xs">{c.title}</span>
                                    <span className="text-red-500 font-medium flex-shrink-0">{hours}h overdue</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <div className="grid lg:grid-cols-3 gap-6">
                {/* City Map */}
                <div className="lg:col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                    <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                        <span>🗺️</span> Live Complaint Map
                    </h2>
                    <CityMap complaints={complaints} height="350px" />
                </div>

                {/* Quick stats */}
                <div className="space-y-4">
                    {/* Status breakdown */}
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
                        <h3 className="font-semibold text-slate-800 mb-4">Status Breakdown</h3>
                        {['submitted', 'assigned', 'in-progress', 'resolved'].map(status => {
                            const count = complaints.filter(c => c.status === status).length;
                            const pct = complaints.length ? Math.round((count / complaints.length) * 100) : 0;
                            const colors = {
                                submitted: '#94a3b8', assigned: '#3b82f6', 'in-progress': '#f59e0b', resolved: '#22c55e'
                            };
                            return (
                                <div key={status} className="mb-3">
                                    <div className="flex justify-between text-xs font-medium text-slate-600 mb-1">
                                        <span>{status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}</span>
                                        <span>{count} ({pct}%)</span>
                                    </div>
                                    <div className="h-2 bg-slate-100 rounded-full">
                                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: colors[status] }} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Critical complaints */}
                    {critical.length > 0 && (
                        <div className="bg-white rounded-2xl p-5 shadow-sm border border-red-100">
                            <h3 className="font-semibold text-red-700 mb-3 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4" /> Critical Unresolved ({critical.length})
                            </h3>
                            <div className="space-y-2">
                                {critical.slice(0, 4).map(c => (
                                    <div key={c.id} className="text-xs">
                                        <p className="font-medium text-slate-700 truncate">{c.title}</p>
                                        <p className="text-slate-400">{c.category}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

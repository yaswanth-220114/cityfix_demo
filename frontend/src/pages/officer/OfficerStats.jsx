import React, { useState, useEffect } from 'react';
import { BarChart2, Clock, CheckCircle, TrendingUp } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getOfficerComplaints, getComplaints } from '../../utils/complaintStore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { StatCard } from '../../components/ui';

export default function OfficerStats() {
    const { user } = useAuth();
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;
        const assigned = getOfficerComplaints(user.uid);
        const data = assigned.length > 0 ? assigned : getComplaints();
        setComplaints(data);
        setLoading(false);
    }, [user]);

    const total = complaints.length;
    const resolved = complaints.filter(c => c.status === 'resolved').length;
    const inProgress = complaints.filter(c => c.status === 'in-progress').length;

    const resolvedWithTime = complaints.filter(c => c.resolvedAt && c.createdAt);
    const avgHours = resolvedWithTime.length > 0
        ? Math.round(resolvedWithTime.reduce((acc, c) => {
            const created = c.createdAt?.toDate ? c.createdAt.toDate() : new Date(c.createdAt);
            const res = c.resolvedAt?.toDate ? c.resolvedAt.toDate() : new Date(c.resolvedAt);
            return acc + (res - created) / 3600000;
        }, 0) / resolvedWithTime.length)
        : 0;

    // Chart data: complaints by category
    const catData = complaints.reduce((acc, c) => {
        const cat = c.category?.split(' ')[0] || 'Other';
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
    }, {});
    const chartData = Object.entries(catData).map(([name, count]) => ({ name, count }));

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800 mb-1" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>My Performance</h1>
                <p className="text-slate-500">Your complaint resolution statistics</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <StatCard icon={BarChart2} label="Total Assigned" value={total} color="blue" />
                <StatCard icon={CheckCircle} label="Resolved" value={resolved} color="green" />
                <StatCard icon={TrendingUp} label="In Progress" value={inProgress} color="orange" />
                <StatCard icon={Clock} label="Avg Time (hrs)" value={avgHours} color="purple" />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {/* Resolution rate */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                    <h2 className="font-semibold text-slate-800 mb-4">Resolution Rate</h2>
                    <div className="flex items-center justify-center">
                        <div className="relative w-36 h-36">
                            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                                <path
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    fill="none" stroke="#22c55e" strokeWidth="3"
                                    strokeDasharray={`${total ? (resolved / total) * 100 : 0}, 100`}
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-2xl font-bold text-slate-800">{total ? Math.round((resolved / total) * 100) : 0}%</span>
                                <span className="text-xs text-slate-500">Resolved</span>
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3 text-center text-sm">
                        <div><div className="font-bold text-green-600">{resolved}</div><div className="text-slate-500 text-xs">Resolved</div></div>
                        <div><div className="font-bold text-slate-600">{total - resolved}</div><div className="text-slate-500 text-xs">Pending</div></div>
                    </div>
                </div>

                {/* Category breakdown */}
                {chartData.length > 0 && (
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                        <h2 className="font-semibold text-slate-800 mb-4">By Category</h2>
                        <ResponsiveContainer width="100%" height={180}>
                            <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                                <YAxis tick={{ fontSize: 10 }} />
                                <Tooltip />
                                <Bar dataKey="count" fill="#1a3c6e" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>

            {/* Recent resolved */}
            {resolved > 0 && (
                <div className="mt-6 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                    <h2 className="font-semibold text-slate-800 mb-4">Recently Resolved</h2>
                    <div className="space-y-3">
                        {complaints.filter(c => c.status === 'resolved').slice(0, 5).map(c => (
                            <div key={c.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                                <div>
                                    <p className="text-sm font-medium text-slate-700 truncate max-w-xs">{c.title}</p>
                                    <p className="text-xs text-slate-400">{c.category}</p>
                                </div>
                                <span className="text-xs text-green-600 font-medium">Resolved ✓</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

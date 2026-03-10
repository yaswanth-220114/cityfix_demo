import React, { useState, useEffect } from 'react';
import { getComplaints, getAllOfficers } from '../../utils/complaintStore';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, Legend, PieChart, Pie, Cell
} from 'recharts';
import { HeatMap } from '../../components/maps/MapComponents';

const COLORS = ['#1a3c6e', '#f97316', '#22c55e', '#8b5cf6', '#ef4444', '#06b6d4', '#f59e0b', '#64748b'];

export default function Analytics() {
    const [complaints, setComplaints] = useState([]);
    const [officers, setOfficers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setComplaints(getComplaints());
        setOfficers(getAllOfficers());
        setLoading(false);
    }, []);

    // Category breakdown
    const categoryData = Object.entries(
        complaints.reduce((acc, c) => {
            acc[c.category || 'Unknown'] = (acc[c.category || 'Unknown'] || 0) + 1;
            return acc;
        }, {})
    ).map(([name, value]) => ({ name: name.split(' ')[0], value }))
        .sort((a, b) => b.value - a.value);

    // Weekly trend (last 8 weeks)
    const weeklyData = Array.from({ length: 8 }, (_, i) => {
        const start = new Date();
        start.setDate(start.getDate() - (7 - i) * 7);
        const end = new Date(start);
        end.setDate(end.getDate() + 7);

        const submitted = complaints.filter(c => {
            const d = c.createdAt?.toDate ? c.createdAt.toDate() : new Date(c.createdAt);
            return d >= start && d < end;
        }).length;

        const resolved = complaints.filter(c => {
            const d = c.resolvedAt?.toDate ? c.resolvedAt.toDate() : new Date(c.resolvedAt || 0);
            return c.resolvedAt && d >= start && d < end;
        }).length;

        return {
            week: `Wk ${i + 1}`,
            submitted,
            resolved,
        };
    });

    // Severity distribution
    const severityData = ['low', 'medium', 'high', 'critical'].map(s => ({
        name: s.charAt(0).toUpperCase() + s.slice(1),
        value: complaints.filter(c => c.severity === s).length,
    }));

    // Officer performance table
    const officerPerformance = officers.map(o => {
        const assigned = complaints.filter(c => c.officerId === o.id);
        const resolved = assigned.filter(c => c.status === 'resolved');
        const withTime = resolved.filter(c => c.resolvedAt && c.createdAt);
        const avgHours = withTime.length > 0
            ? Math.round(withTime.reduce((acc, c) => {
                const cr = c.createdAt?.toDate ? c.createdAt.toDate() : new Date(c.createdAt);
                const rs = c.resolvedAt?.toDate ? c.resolvedAt.toDate() : new Date(c.resolvedAt);
                return acc + (rs - cr) / 3600000;
            }, 0) / withTime.length)
            : null;
        return { name: o.name, zone: o.zone, assigned: assigned.length, resolved: resolved.length, avgHours };
    }).sort((a, b) => b.resolved - a.resolved);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="w-10 h-10 border-3 border-[3px] border-[#1a3c6e] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800 mb-1" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Analytics</h1>
                <p className="text-slate-500">Comprehensive system performance metrics</p>
            </div>

            <div className="grid lg:grid-cols-2 gap-6 mb-6">
                {/* Complaints by Category */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                    <h2 className="font-semibold text-slate-800 mb-4">Complaints by Category</h2>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={categoryData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip />
                            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                                {categoryData.map((_, index) => (
                                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Weekly Trend */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                    <h2 className="font-semibold text-slate-800 mb-4">Weekly Trend</h2>
                    <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={weeklyData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip />
                            <Legend wrapperStyle={{ fontSize: 12 }} />
                            <Line type="monotone" dataKey="submitted" stroke="#1a3c6e" strokeWidth={2} dot={{ r: 3 }} />
                            <Line type="monotone" dataKey="resolved" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Severity Distribution */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                    <h2 className="font-semibold text-slate-800 mb-4">Severity Distribution</h2>
                    <div className="flex gap-6">
                        <ResponsiveContainer width="50%" height={160}>
                            <PieChart>
                                <Pie data={severityData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                                    {severityData.map((_, index) => (
                                        <Cell key={index} fill={['#22c55e', '#f59e0b', '#f97316', '#ef4444'][index]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="flex flex-col justify-center gap-2">
                            {severityData.map((s, i) => (
                                <div key={s.name} className="flex items-center gap-2 text-sm">
                                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: ['#22c55e', '#f59e0b', '#f97316', '#ef4444'][i] }}></div>
                                    <span className="text-slate-600">{s.name}</span>
                                    <span className="font-bold text-slate-800 ml-auto">{s.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Heatmap */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                    <h2 className="font-semibold text-slate-800 mb-4">Complaint Density Map</h2>
                    <HeatMap complaints={complaints} height="200px" />
                    <p className="text-xs text-slate-400 mt-2 text-center">
                        🔴 Critical · 🟠 High · 🔵 Open · 🟢 Resolved
                    </p>
                </div>
            </div>

            {/* Officer Performance Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100">
                    <h2 className="font-semibold text-slate-800">Officer Performance</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Officer</th>
                                <th className="text-center px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Assigned</th>
                                <th className="text-center px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Resolved</th>
                                <th className="text-center px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Rate</th>
                                <th className="text-center px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Avg Time</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {officerPerformance.length === 0 ? (
                                <tr><td colSpan={5} className="text-center py-8 text-slate-400 text-sm">No officer data available</td></tr>
                            ) : officerPerformance.map(o => (
                                <tr key={o.name} className="hover:bg-slate-50">
                                    <td className="px-6 py-4">
                                        <div>
                                            <p className="font-medium text-slate-800">{o.name}</p>
                                            <p className="text-xs text-slate-400">{o.zone || 'All Zones'}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center font-semibold text-slate-700">{o.assigned}</td>
                                    <td className="px-6 py-4 text-center font-semibold text-green-600">{o.resolved}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-1.5 bg-slate-100 rounded-full">
                                                <div className="h-full bg-green-500 rounded-full" style={{ width: o.assigned ? `${(o.resolved / o.assigned) * 100}%` : '0%' }} />
                                            </div>
                                            <span className="text-xs font-medium text-slate-600 w-8">
                                                {o.assigned ? Math.round((o.resolved / o.assigned) * 100) : 0}%
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center text-sm text-slate-600">
                                        {o.avgHours != null ? `${o.avgHours}h` : '—'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

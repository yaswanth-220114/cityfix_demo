import React from 'react';

export function StatusBadge({ status }) {
    const configs = {
        submitted: { label: 'Submitted', className: 'badge-submitted' },
        assigned: { label: 'Assigned', className: 'badge-assigned' },
        'in-progress': { label: 'In Progress', className: 'badge-in-progress' },
        resolved: { label: 'Resolved', className: 'badge-resolved' },
        escalated: { label: 'Escalated', className: 'badge-critical' },
    };
    const conf = configs[status] || configs.submitted;
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${conf.className}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70"></span>
            {conf.label}
        </span>
    );
}

export function SeverityBadge({ severity }) {
    const configs = {
        low: { label: 'Low', bg: 'bg-green-100 text-green-700 border border-green-200' },
        medium: { label: 'Medium', bg: 'bg-yellow-100 text-yellow-700 border border-yellow-200' },
        high: { label: 'High', bg: 'bg-orange-100 text-orange-700 border border-orange-200' },
        critical: { label: 'Critical', bg: 'bg-red-100 text-red-700 border border-red-200' },
    };
    const conf = configs[severity?.toLowerCase()] || configs.medium;
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${conf.bg}`}>
            {conf.label}
        </span>
    );
}

export function SkeletonCard() {
    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <div className="skeleton h-4 w-3/4 mb-3"></div>
            <div className="skeleton h-4 w-1/2 mb-4"></div>
            <div className="skeleton h-3 w-full mb-2"></div>
            <div className="skeleton h-3 w-full mb-2"></div>
            <div className="skeleton h-3 w-2/3"></div>
        </div>
    );
}

export function EmptyState({ icon: Icon, title, description, action }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                {Icon && <Icon className="w-10 h-10 text-slate-400" />}
            </div>
            <h3 className="text-lg font-semibold text-slate-700 mb-2">{title}</h3>
            <p className="text-slate-500 text-sm max-w-xs mb-6">{description}</p>
            {action && action}
        </div>
    );
}

export function StatCard({ icon: Icon, label, value, trend, color = 'blue' }) {
    const colors = {
        blue: 'from-blue-500 to-[#1a3c6e]',
        orange: 'from-[#f97316] to-orange-600',
        green: 'from-emerald-500 to-green-600',
        purple: 'from-purple-500 to-purple-700',
        red: 'from-red-500 to-rose-600',
    };
    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 card-hover">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm text-slate-500 font-medium mb-1">{label}</p>
                    <p className="text-3xl font-bold text-slate-800">{value}</p>
                    {trend && <p className="text-xs text-emerald-600 mt-1 font-medium">{trend}</p>}
                </div>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors[color]} flex items-center justify-center shadow-sm`}>
                    {Icon && <Icon className="w-6 h-6 text-white" />}
                </div>
            </div>
        </div>
    );
}

export function LoadingSpinner({ size = 'md', color = 'primary' }) {
    const sizes = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12' };
    const colors = {
        primary: 'border-[#1a3c6e] border-t-transparent',
        accent: 'border-[#f97316] border-t-transparent',
        white: 'border-white border-t-transparent',
    };
    return (
        <div className={`${sizes[size]} border-3 border-[3px] ${colors[color]} rounded-full animate-spin`}></div>
    );
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }) {
    if (!isOpen) return null;
    const sizes = {
        sm: 'max-w-md',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
    };
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
            <div className={`relative bg-white rounded-2xl shadow-2xl w-full ${sizes[size]} animate-fade-in max-h-[90vh] overflow-y-auto`}>
                <div className="flex items-center justify-between p-6 border-b border-slate-100">
                    <h2 className="text-xl font-bold text-slate-800">{title}</h2>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                    >
                        <span className="text-slate-500 text-lg leading-none">×</span>
                    </button>
                </div>
                <div className="p-6">{children}</div>
            </div>
        </div>
    );
}

import React, { useState } from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import { MapPin, Plus, List, LogOut, User, Menu, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import NotificationBell from '../../components/NotificationBell';
import ChatBot from '../../components/ChatBot';
import SubmitComplaint from './SubmitComplaint';
import MyComplaints from './MyComplaints';
import ComplaintDetail from './ComplaintDetail';
import toast from 'react-hot-toast';

export default function CitizenPortal() {
    const { user, userData, logout } = useAuth();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const handleLogout = async () => {
        await logout();
        toast.success('Logged out successfully');
        navigate('/');
    };

    const navItems = [
        { to: '/citizen/submit', icon: Plus, label: 'Submit Complaint' },
        { to: '/citizen/complaints', icon: List, label: 'My Complaints' },
    ];

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
            )}

            {/* Sidebar */}
            <aside className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-[#1a3c6e] flex flex-col transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
                }`}>
                {/* Logo */}
                <div className="px-6 py-6 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-[#f97316] rounded-xl flex items-center justify-center">
                            <MapPin className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-white font-bold text-xl" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                            City<span className="text-[#f97316]">Fix</span>
                        </span>
                    </div>
                    <div className="mt-4 flex items-center gap-3">
                        {user?.photoURL ? (
                            <img src={user.photoURL} alt="avatar" className="w-8 h-8 rounded-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                                <User className="w-4 h-4 text-white" />
                            </div>
                        )}
                        <div className="min-w-0">
                            <p className="text-white/90 text-sm font-medium truncate">{userData?.name || user?.displayName || 'Citizen'}</p>
                            <p className="text-white/40 text-xs">Citizen Portal</p>
                        </div>
                    </div>
                </div>

                {/* Nav */}
                <nav className="flex-1 px-3 py-6 space-y-1">
                    {navItems.map(item => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${isActive
                                    ? 'sidebar-active bg-white/10 text-[#f97316]'
                                    : 'text-white/70 hover:text-white hover:bg-white/10'
                                }`
                            }
                            onClick={() => setSidebarOpen(false)}
                        >
                            <item.icon className="w-5 h-5" />
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                {/* Logout */}
                <div className="px-3 pb-6">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-white/50 hover:text-white hover:bg-white/10 transition-all w-full"
                    >
                        <LogOut className="w-5 h-5" />
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Top bar */}
                <header className="bg-[#1a3c6e] px-4 sm:px-6 py-4 flex items-center justify-between lg:hidden sticky top-0 z-10">
                    <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-white">
                        <Menu className="w-6 h-6" />
                    </button>
                    <span className="text-white font-bold" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                        City<span className="text-[#f97316]">Fix</span>
                    </span>
                    <NotificationBell />
                </header>

                {/* Desktop top bar */}
                <header className="hidden lg:flex bg-white border-b border-slate-100 px-8 py-4 items-center justify-between sticky top-0 z-10">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">Citizen Portal</h2>
                        <p className="text-slate-500 text-sm">Welcome back, {userData?.name?.split(' ')[0] || 'Citizen'}!</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="px-3 py-1.5 bg-[#1a3c6e] text-white text-xs font-semibold rounded-full">
                            Citizen
                        </div>
                        <div className="w-8 h-8 rounded-full bg-[#1a3c6e] flex items-center justify-center">
                            <NotificationBell />
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                    <Routes>
                        <Route path="/" element={<SubmitComplaint />} />
                        <Route path="/submit" element={<SubmitComplaint />} />
                        <Route path="/complaints" element={<MyComplaints />} />
                        <Route path="/complaints/:id" element={<ComplaintDetail />} />
                    </Routes>
                </main>
            </div>

            <ChatBot />
        </div>
    );
}

import React, { useState } from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import {
  MapPin, Plus, List, LogOut, User, Menu, BarChart3,
  AlertCircle, Clock, CheckCircle2, FileText
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { StatusBadge, SeverityBadge } from '../../components/ui';
import NotificationBell from '../../components/NotificationBell';
import ChatBot from '../../components/ChatBot';
import SubmitComplaint from './SubmitComplaint';
import MyComplaints from './MyComplaints';
import ComplaintDetail from './ComplaintDetail';
import toast from 'react-hot-toast';

// Dummy data
const dummyComplaints = [
  { id: 'CF-2024-00001', title: 'Broken road near bus stand', category: 'Road & Infrastructure', severity: 'High', status: 'Resolved', date: '2024-01-15' },
  { id: 'CF-2024-00002', title: 'Street light not working', category: 'Electricity', severity: 'Medium', status: 'In Progress', date: '2024-01-18' },
  { id: 'CF-2024-00003', title: 'Water supply disruption', category: 'Water Supply', severity: 'Critical', status: 'Submitted', date: '2024-01-20' },
  { id: 'CF-2024-00004', title: 'Garbage not collected', category: 'Sanitation', severity: 'Low', status: 'Submitted', date: '2024-01-21' },
  { id: 'CF-2024-00005', title: 'Pothole on main street', category: 'Road & Infrastructure', severity: 'High', status: 'In Progress', date: '2024-01-22' },
  { id: 'CF-2024-00006', title: 'Park maintenance needed', category: 'Parks', severity: 'Low', status: 'Resolved', date: '2024-01-10' },
];

// Helper function to normalize status for comparison
const normalizeStatus = (status) => {
  return status.toLowerCase().replace(/\s+/g, '-');
};

// ─── Dashboard Content ────────────────────────────────────────────────────────
function DashboardContent() {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const [filterStatus, setFilterStatus] = useState('all');

  const statusFilters = ['all', 'submitted', 'assigned', 'in-progress', 'resolved'];

  const totalComplaints = dummyComplaints.length;
  const submittedCount = dummyComplaints.filter(c => normalizeStatus(c.status) === 'submitted').length;
  const inProgressCount = dummyComplaints.filter(c => normalizeStatus(c.status) === 'in-progress').length;
  const resolvedCount = dummyComplaints.filter(c => normalizeStatus(c.status) === 'resolved').length;

  const allComplaints = filterStatus === 'all'
    ? dummyComplaints
    : dummyComplaints.filter(c => normalizeStatus(c.status) === filterStatus);
  const submittedComplaints = dummyComplaints.filter(c => normalizeStatus(c.status) === 'submitted');
  const inProgressComplaints = dummyComplaints.filter(c => normalizeStatus(c.status) === 'in-progress');
  const resolvedComplaints = dummyComplaints.filter(c => normalizeStatus(c.status) === 'resolved');

  const StatCard = ({ icon: Icon, label, count, color }) => (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-2">{label}</p>
          <p className="text-3xl font-bold text-slate-900">{count}</p>
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
      <div className={`mt-4 h-1 rounded-full ${color === 'bg-blue-500' ? 'bg-blue-200' : color === 'bg-yellow-500' ? 'bg-yellow-200' : color === 'bg-orange-500' ? 'bg-orange-200' : 'bg-green-200'}`} />
    </div>
  );

  const ComplaintCard = ({ complaint }) => (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-slate-400 font-mono mb-2">{complaint.id}</p>
          <h3 className="font-semibold text-slate-800 text-base mb-3">{complaint.title}</h3>
          <div className="flex items-center gap-3 flex-wrap mb-4">
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-medium">
              {complaint.category}
            </span>
            <SeverityBadge severity={complaint.severity} />
            <StatusBadge status={normalizeStatus(complaint.status)} />
          </div>
          <p className="text-xs text-slate-400">
            Submitted on {new Date(complaint.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
      </div>
    </div>
  );

  const SectionHeader = ({ title, count, showFilter = false }) => (
    <div className="mb-4">
      <div className="flex items-center gap-3 mb-3">
        <h2 className="text-lg font-bold text-slate-800" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          {title}
        </h2>
        <span className="px-3 py-1 rounded-full bg-[#0284c7] text-white text-xs font-semibold">
          {count}
        </span>
      </div>
      {showFilter && (
        <div className="flex gap-2 flex-wrap">
          {statusFilters.map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                filterStatus === s
                  ? 'bg-[#0284c7] text-white shadow-sm'
                  : 'bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100'
              }`}
            >
              {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1).replace('-', ' ')}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header Section */}
      <div className="mb-10">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              Welcome back, {userData?.name || 'Citizen'}! 👋
            </h1>
            <p className="text-slate-600 text-sm">Here's an overview of your submitted complaints</p>
          </div>
          <button
            onClick={() => navigate('/citizen/submit')}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#f97316] text-white font-semibold hover:bg-orange-600 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Submit New Complaint
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard icon={FileText} label="Total Complaints" count={totalComplaints} color="bg-blue-500" />
        <StatCard icon={AlertCircle} label="Pending" count={submittedCount} color="bg-yellow-500" />
        <StatCard icon={Clock} label="In Progress" count={inProgressCount} color="bg-orange-500" />
        <StatCard icon={CheckCircle2} label="Resolved" count={resolvedCount} color="bg-green-500" />
      </div>

      {/* All Complaints Section */}
      <div className="mb-12">
        <SectionHeader title="All Complaints" count={allComplaints.length} showFilter={true} />
        <div className="space-y-4">
          {allComplaints.map(complaint => (
            <ComplaintCard key={complaint.id} complaint={complaint} />
          ))}
        </div>
      </div>

      {/* Submitted/Pending Section */}
      <div className="mb-12">
        <SectionHeader title="Submitted / Pending" count={submittedComplaints.length} />
        {submittedComplaints.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 text-center">
            <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">No submitted complaints</p>
          </div>
        ) : (
          <div className="space-y-4">
            {submittedComplaints.map(complaint => (
              <ComplaintCard key={complaint.id} complaint={complaint} />
            ))}
          </div>
        )}
      </div>

      {/* In Progress Section */}
      <div className="mb-12">
        <SectionHeader title="In Progress" count={inProgressComplaints.length} />
        {inProgressComplaints.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 text-center">
            <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">No in-progress complaints</p>
          </div>
        ) : (
          <div className="space-y-4">
            {inProgressComplaints.map(complaint => (
              <ComplaintCard key={complaint.id} complaint={complaint} />
            ))}
          </div>
        )}
      </div>

      {/* Resolved Section */}
      <div className="mb-12">
        <SectionHeader title="Resolved" count={resolvedComplaints.length} />
        {resolvedComplaints.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 text-center">
            <CheckCircle2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">No resolved complaints</p>
          </div>
        ) : (
          <div className="space-y-4">
            {resolvedComplaints.map(complaint => (
              <ComplaintCard key={complaint.id} complaint={complaint} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main CitizenDashboard (layout shell + routing) ──────────────────────────
export default function CitizenDashboard() {
  const { user, userData, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    navigate('/');
  };

  const navItems = [
    { to: '/citizen', icon: BarChart3, label: 'Dashboard' },
    { to: '/citizen/submit', icon: Plus, label: 'Submit Complaint' },
    { to: '/citizen/complaints', icon: List, label: 'My Complaints' },
  ];

  return (
    <div className="min-h-screen bg-sky-50 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-gradient-to-b from-[#0369a1] to-[#0284c7] flex flex-col transform transition-transform duration-300 shadow-xl ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
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
              <p className="text-white/40 text-xs">Citizen Dashboard</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-6 space-y-1">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/citizen'}
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
        {/* Mobile top bar */}
        <header className="bg-gradient-to-r from-[#0369a1] to-[#0284c7] px-4 sm:px-6 py-4 flex items-center justify-between lg:hidden sticky top-0 z-10 shadow-md">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-white">
            <Menu className="w-6 h-6" />
          </button>
          <span className="text-white font-bold" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            City<span className="text-[#f97316]">Fix</span>
          </span>
          <NotificationBell />
        </header>

        {/* Desktop top bar */}
        <header className="hidden lg:flex bg-white border-b border-sky-100 px-8 py-4 items-center justify-between sticky top-0 z-10 shadow-sm">
          <div>
            <h2 className="text-lg font-bold text-sky-900">Citizen Dashboard</h2>
            <p className="text-sky-500 text-sm">Welcome back, {userData?.name?.split(' ')[0] || 'Citizen'}!</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="px-3 py-1.5 bg-[#0284c7] text-white text-xs font-semibold rounded-full">
              Citizen
            </div>
            <div className="w-8 h-8 rounded-full bg-[#0284c7] flex items-center justify-center">
              <NotificationBell />
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <Routes>
            <Route path="/" element={<DashboardContent />} />
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

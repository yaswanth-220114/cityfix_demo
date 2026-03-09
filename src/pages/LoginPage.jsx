import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { MapPin, Shield, CheckCircle, Eye, EyeOff, Mail, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
    const { loginWithGoogleCredential, loginWithEmailPassword, user, userData } = useAuth();
    const navigate = useNavigate();

    const [tab, setTab] = useState('google'); // 'google' | 'email'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPwd, setShowPwd] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Already logged in → redirect
    if (user && userData) {
        if (userData.role === 'admin') return <Navigate to="/admin" replace />;
        if (userData.role === 'officer') return <Navigate to="/officer" replace />;
        return <Navigate to="/citizen" replace />;
    }

    const redirect = (role) => {
        if (role === 'admin') navigate('/admin', { replace: true });
        else if (role === 'officer') navigate('/officer', { replace: true });
        else navigate('/citizen', { replace: true });
    };

    // ── Google OAuth success ─────────────────────────────────────────────────
    const handleGoogleSuccess = async (credentialResponse) => {
        setLoading(true);
        setError('');
        try {
            const u = await loginWithGoogleCredential(credentialResponse);
            toast.success(`Welcome, ${u.name.split(' ')[0]}! 🎉`);
            redirect(u.role);
        } catch (err) {
            setError(err.message || 'Google login failed');
            toast.error('Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // ── Email / Password login ───────────────────────────────────────────────
    const handleEmailLogin = async (e) => {
        e.preventDefault();
        if (!email || !password) { setError('Please enter email and password'); return; }
        setLoading(true);
        setError('');
        try {
            const u = await loginWithEmailPassword(email, password);
            toast.success(`Welcome, ${u.name.split(' ')[0]}! 🎉`);
            redirect(u.role);
        } catch (err) {
            setError(err.message || 'Invalid credentials');
        } finally {
            setLoading(false);
        }
    };

    // Quick-fill demo account
    const fillDemo = (role) => {
        const map = { citizen: 'citizen@cityfix.com', officer: 'officer@cityfix.com', admin: 'admin@cityfix.com' };
        const pwd = { citizen: 'citizen123', officer: 'officer123', admin: 'admin123' };
        setEmail(map[role]); setPassword(pwd[role]); setTab('email'); setError('');
    };

    return (
        <div className="min-h-screen flex">
            {/* ── Left Panel ─────────────────────────────────────────────────────── */}
            <div className="hidden lg:flex w-1/2 hero-gradient flex-col justify-between p-12 relative overflow-hidden">
                <div className="absolute inset-0">
                    <div className="absolute top-20 left-10 w-72 h-72 bg-[#f97316]/10 rounded-full blur-3xl" />
                    <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl" />
                </div>

                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-16">
                        <div className="w-10 h-10 bg-[#f97316] rounded-xl flex items-center justify-center">
                            <MapPin className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-white font-bold text-2xl" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                            City<span className="text-[#f97316]">Fix</span>
                        </span>
                    </div>

                    <h2 className="text-5xl font-extrabold text-white mb-6 leading-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                        Your city needs<br /><span className="text-[#f97316]">your voice.</span>
                    </h2>
                    <p className="text-white/70 text-lg mb-12 max-w-md leading-relaxed">
                        Join thousands of citizens making their city better, one complaint at a time.
                    </p>

                    <div className="space-y-4">
                        {[
                            { icon: CheckCircle, text: 'AI-powered complaint categorization' },
                            { icon: Shield, text: 'Secure Google OAuth login' },
                            { icon: MapPin, text: 'Live map tracking of every issue' },
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                                    <item.icon className="w-4 h-4 text-[#f97316]" />
                                </div>
                                <span className="text-white/80 text-sm">{item.text}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="relative z-10 flex gap-6">
                    {[
                        { value: '1,247+', label: 'Complaints Filed' },
                        { value: '983', label: 'Issues Resolved' },
                        { value: '38h', label: 'Avg Resolution' },
                    ].map((s, i) => (
                        <div key={i} className="text-center">
                            <div className="text-2xl font-bold text-white">{s.value}</div>
                            <div className="text-white/50 text-xs mt-0.5">{s.label}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Right Panel ────────────────────────────────────────────────────── */}
            <div className="flex-1 flex items-center justify-center p-6 bg-slate-50">
                <div className="w-full max-w-md">
                    {/* Mobile logo */}
                    <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
                        <div className="w-10 h-10 bg-[#1a3c6e] rounded-xl flex items-center justify-center">
                            <MapPin className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-[#1a3c6e] font-bold text-2xl" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                            City<span className="text-[#f97316]">Fix</span>
                        </span>
                    </div>

                    <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
                        {/* Header */}
                        <div className="px-8 pt-8 pb-6 text-center">
                            <h1 className="text-3xl font-bold text-slate-800 mb-1" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                                Welcome Back
                            </h1>
                            <p className="text-slate-500 text-sm">Sign in to access your CityFix portal</p>
                        </div>

                        {/* Tab switcher */}
                        <div className="flex mx-8 mb-6 bg-slate-100 rounded-xl p-1">
                            {[
                                { id: 'google', label: '🔵 Google Login' },
                                { id: 'email', label: '📧 Demo Login' },
                            ].map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => { setTab(t.id); setError(''); }}
                                    className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${tab === t.id
                                            ? 'bg-white text-[#1a3c6e] shadow-sm'
                                            : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                >
                                    {t.label}
                                </button>
                            ))}
                        </div>

                        <div className="px-8 pb-8 space-y-4">
                            {/* Error banner */}
                            {error && (
                                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                    {error}
                                </div>
                            )}

                            {/* ── Google Tab ─────────────────────────────────────────── */}
                            {tab === 'google' && (
                                <div className="space-y-4">
                                    <div className="flex justify-center">
                                        <GoogleLogin
                                            onSuccess={handleGoogleSuccess}
                                            onError={() => { setError('Google login failed. Make sure pop-ups are allowed.'); }}
                                            useOneTap={false}
                                            theme="outline"
                                            size="large"
                                            width="360"
                                            text="continue_with"
                                            shape="rectangular"
                                            logo_alignment="left"
                                        />
                                    </div>

                                    <div className="relative">
                                        <div className="absolute inset-0 flex items-center">
                                            <div className="w-full border-t border-slate-100" />
                                        </div>
                                        <div className="relative flex justify-center">
                                            <span className="bg-white px-3 text-xs text-slate-400">or use demo accounts below</span>
                                        </div>
                                    </div>

                                    {/* Quick-fill demo buttons */}
                                    <div className="grid grid-cols-3 gap-2">
                                        {[
                                            { role: 'citizen', label: '👤 Citizen', color: 'bg-blue-50 text-blue-700 border-blue-200' },
                                            { role: 'officer', label: '👮 Officer', color: 'bg-purple-50 text-purple-700 border-purple-200' },
                                            { role: 'admin', label: '🛡️ Admin', color: 'bg-orange-50 text-orange-700 border-orange-200' },
                                        ].map(d => (
                                            <button
                                                key={d.role}
                                                onClick={() => fillDemo(d.role)}
                                                className={`py-2 px-2 rounded-xl border text-xs font-semibold ${d.color} hover:opacity-80 transition-opacity`}
                                            >
                                                {d.label}
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-center text-xs text-slate-400">
                                        Click a role above to auto-fill demo credentials → then switch to Demo Login tab
                                    </p>
                                </div>
                            )}

                            {/* ── Email / Password Tab ────────────────────────────────── */}
                            {tab === 'email' && (
                                <form onSubmit={handleEmailLogin} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <input
                                                id="email-input"
                                                type="email"
                                                value={email}
                                                onChange={e => { setEmail(e.target.value); setError(''); }}
                                                placeholder="citizen@cityfix.com"
                                                required
                                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm input-field bg-slate-50"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <input
                                                id="password-input"
                                                type={showPwd ? 'text' : 'password'}
                                                value={password}
                                                onChange={e => { setPassword(e.target.value); setError(''); }}
                                                placeholder="••••••••"
                                                required
                                                className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 text-sm input-field bg-slate-50"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPwd(!showPwd)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                            >
                                                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    <button
                                        id="email-login-btn"
                                        type="submit"
                                        disabled={loading}
                                        className="w-full btn-primary py-3.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
                                    >
                                        {loading
                                            ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Signing in...</>
                                            : 'Sign In'
                                        }
                                    </button>

                                    {/* Demo accounts reference */}
                                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                                        <p className="text-xs font-semibold text-blue-700 mb-2">🧪 Demo Accounts</p>
                                        <div className="space-y-1">
                                            {[
                                                { label: 'Citizen', email: 'citizen@cityfix.com', pwd: 'citizen123' },
                                                { label: 'Officer', email: 'officer@cityfix.com', pwd: 'officer123' },
                                                { label: 'Admin Suresh', email: 'admin@cityfix.com', pwd: 'admin123' },
                                            ].map(a => (
                                                <button
                                                    key={a.label}
                                                    type="button"
                                                    onClick={() => { setEmail(a.email); setPassword(a.pwd); setError(''); }}
                                                    className="w-full flex items-center justify-between text-xs hover:bg-blue-100 px-2 py-1.5 rounded-lg transition-colors"
                                                >
                                                    <span className="font-medium text-blue-700">{a.label}</span>
                                                    <span className="text-blue-500 font-mono">{a.email}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </form>
                            )}

                            {/* Role info */}
                            <div className="pt-2 pb-1 border-t border-slate-100">
                                <p className="text-center text-xs text-slate-400 mb-2 flex items-center justify-center gap-1">
                                    <Shield className="w-3 h-3" /> Role-Based Access
                                </p>
                                <div className="flex justify-around text-xs">
                                    {[
                                        { role: 'Citizen', desc: 'Submit & track', color: 'text-blue-600' },
                                        { role: 'Officer', desc: 'Manage queue', color: 'text-purple-600' },
                                        { role: 'Admin', desc: 'Full control', color: 'text-orange-600' },
                                    ].map(r => (
                                        <div key={r.role} className="text-center">
                                            <div className={`font-semibold ${r.color}`}>{r.role}</div>
                                            <div className="text-slate-400">{r.desc}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <p className="text-center text-xs text-slate-400 mt-4">
                        By signing in you agree to our{' '}
                        <a href="#" className="text-[#1a3c6e] hover:underline">Terms</a> &amp;{' '}
                        <a href="#" className="text-[#1a3c6e] hover:underline">Privacy Policy</a>
                    </p>
                </div>
            </div>
        </div>
    );
}

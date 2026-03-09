import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, CheckCircle, Clock, Users, ArrowRight, ChevronDown, BarChart2, Shield, AlertTriangle, Menu, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getLiveStats } from '../utils/complaintStore';
import { CityMap } from '../components/maps/MapComponents';
import ChatBot from '../components/ChatBot';

// Mock complaints for demo map (replace with real Firestore data)
const DEMO_COMPLAINTS = [
    { title: 'Pothole on Main St', category: 'Roads', severity: 'high', status: 'submitted', location: { lat: 17.391, lng: 78.491 } },
    { title: 'Street light out', category: 'Electricity', severity: 'medium', status: 'in-progress', location: { lat: 17.382, lng: 78.478 } },
    { title: 'Garbage overflow', category: 'Sanitation', severity: 'high', status: 'submitted', location: { lat: 17.395, lng: 78.468 } },
    { title: 'Water leak', category: 'Water Supply', severity: 'critical', status: 'assigned', location: { lat: 17.376, lng: 78.488 } },
    { title: 'Broken footpath repaired', category: 'Roads', severity: 'low', status: 'resolved', location: { lat: 17.401, lng: 78.472 } },
    { title: 'Park maintenance done', category: 'Parks', severity: 'low', status: 'resolved', location: { lat: 17.386, lng: 78.461 } },
];

function AnimatedNumber({ target }) {
    const [value, setValue] = useState(0);
    useEffect(() => {
        let start = 0;
        const step = Math.ceil(target / 40);
        const timer = setInterval(() => {
            start += step;
            if (start >= target) { setValue(target); clearInterval(timer); }
            else setValue(start);
        }, 40);
        return () => clearInterval(timer);
    }, [target]);
    return <span>{value.toLocaleString()}</span>;
}

export default function LandingPage() {
    const navigate = useNavigate();
    const { user, userData } = useAuth();
    const [stats, setStats] = useState({ total: 0, resolved: 0, resolvedThisWeek: 0, avgResolutionHours: 0 });
    const [menuOpen, setMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => {
        try {
            const data = getLiveStats();
            // If the store has real data use it, otherwise show demo numbers
            setStats({
                total: data.total || 1247,
                resolved: data.resolved || 983,
                resolvedThisWeek: data.resolvedThisWeek || 47,
                avgResolutionHours: data.avgResolutionHours || 38,
            });
        } catch {
            setStats({ total: 1247, resolved: 983, resolvedThisWeek: 47, avgResolutionHours: 38 });
        }
    }, []);

    const handleGetStarted = () => {
        if (user && userData) navigate('/dashboard');
        else navigate('/login');
    };

    return (
        <div className="min-h-screen bg-white">
            {/* Navigation */}
            <nav className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${scrolled ? 'bg-[#1a3c6e]/95 backdrop-blur-md shadow-lg' : 'bg-transparent'
                }`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-[#f97316] rounded-xl flex items-center justify-center">
                            <MapPin className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-white font-bold text-xl" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                            City<span className="text-[#f97316]">Fix</span>
                        </span>
                    </div>

                    {/* Desktop nav */}
                    <div className="hidden md:flex items-center gap-8">
                        <a href="#how-it-works" className="text-white/80 hover:text-white text-sm font-medium transition-colors">How it Works</a>
                        <a href="#stats" className="text-white/80 hover:text-white text-sm font-medium transition-colors">Live Stats</a>
                        <a href="#map" className="text-white/80 hover:text-white text-sm font-medium transition-colors">Map</a>
                        <button
                            onClick={handleGetStarted}
                            className="btn-primary px-5 py-2.5 rounded-xl text-sm font-semibold"
                        >
                            {user ? 'Go to Dashboard' : 'Get Started'}
                        </button>
                    </div>

                    {/* Mobile nav */}
                    <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden text-white">
                        {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>

                {menuOpen && (
                    <div className="md:hidden bg-[#1a3c6e]/98 px-4 pb-4 space-y-3">
                        <a href="#how-it-works" className="block text-white/80 py-2 text-sm">How it Works</a>
                        <a href="#stats" className="block text-white/80 py-2 text-sm">Live Stats</a>
                        <a href="#map" className="block text-white/80 py-2 text-sm">Map</a>
                        <button onClick={handleGetStarted} className="btn-primary w-full py-3 rounded-xl text-sm">
                            {user ? 'Go to Dashboard' : 'Get Started'}
                        </button>
                    </div>
                )}
            </nav>

            {/* Hero Section */}
            <section className="hero-gradient min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden pt-20">
                {/* Background orbs */}
                <div className="absolute top-20 left-10 w-72 h-72 bg-[#f97316]/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-3xl"></div>

                <div className="max-w-5xl mx-auto text-center relative z-10">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 bg-white/10 text-white/90 px-4 py-2 rounded-full text-sm font-medium mb-8 animate-fade-in">
                        <span className="w-2 h-2 bg-[#f97316] rounded-full animate-pulse"></span>
                        AI-Powered Civic Complaint Platform
                    </div>

                    <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 leading-tight animate-fade-in-up" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                        Report it.{' '}
                        <span className="text-[#f97316]">Track it.</span>{' '}
                        <br className="hidden md:block" />
                        Fix it.
                    </h1>

                    <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto mb-10 animate-fade-in-up delay-100">
                        CityFix connects citizens with city officials to resolve civic issues faster.
                        Submit complaints, track progress in real-time, and hold your city accountable.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up delay-200">
                        <button
                            onClick={handleGetStarted}
                            className="btn-primary px-8 py-4 rounded-2xl text-lg font-bold flex items-center justify-center gap-2 group"
                        >
                            {user ? 'Go to Dashboard' : 'Get Started Free'}
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                        <button
                            onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                            className="px-8 py-4 rounded-2xl text-lg font-semibold text-white border-2 border-white/20 hover:border-white/40 hover:bg-white/10 transition-all"
                        >
                            Learn More
                        </button>
                    </div>

                    {/* Floating stats mini */}
                    <div className="flex flex-wrap justify-center gap-6 mt-16 animate-fade-in-up delay-300">
                        {[
                            { value: stats.total || '1,247', label: 'Complaints Filed' },
                            { value: stats.resolved || '983', label: 'Issues Resolved' },
                            { value: `${stats.avgResolutionHours || 38}h`, label: 'Avg Resolution' },
                        ].map((s, i) => (
                            <div key={i} className="text-center">
                                <div className="text-3xl font-bold text-white">{s.value}</div>
                                <div className="text-white/50 text-sm mt-0.5">{s.label}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Scroll indicator */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/40 animate-bounce">
                    <ChevronDown className="w-6 h-6" />
                </div>
            </section>

            {/* How It Works */}
            <section id="how-it-works" className="py-24 px-4 bg-slate-50">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <span className="inline-block px-4 py-1.5 bg-[#1a3c6e]/10 text-[#1a3c6e] rounded-full text-sm font-semibold mb-4">
                            How It Works
                        </span>
                        <h2 className="text-4xl font-bold text-slate-800 mb-4" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                            Three Steps to Resolve Your Issue
                        </h2>
                        <p className="text-slate-500 max-w-xl mx-auto">
                            Our streamlined process ensures your complaints are heard, assigned, and resolved quickly.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 relative">
                        {/* Connector line */}
                        <div className="hidden md:block absolute top-16 left-1/3 right-1/3 h-0.5 bg-gradient-to-r from-[#1a3c6e] to-[#f97316] z-0"></div>

                        {[
                            {
                                step: '01',
                                icon: '📝',
                                title: 'Submit',
                                description: 'Fill in your complaint with details, location, and evidence. Our AI auto-categorizes and scores the priority instantly.',
                                color: 'from-[#1a3c6e] to-blue-700',
                            },
                            {
                                step: '02',
                                icon: '🎯',
                                title: 'Assign',
                                description: 'Admin automatically routes your complaint to the right officer. You get notified via email and in-app notification.',
                                color: 'from-purple-600 to-purple-800',
                            },
                            {
                                step: '03',
                                icon: '✅',
                                title: 'Resolve',
                                description: 'Track real-time progress. Officer updates you on every step. Receive resolution proof when work is done.',
                                color: 'from-[#f97316] to-orange-600',
                            },
                        ].map((step, i) => (
                            <div key={i} className="relative z-10 bg-white rounded-3xl p-8 shadow-sm border border-slate-100 card-hover text-center">
                                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center text-2xl mx-auto mb-6 shadow-lg`}>
                                    {step.icon}
                                </div>
                                <div className="text-xs font-bold text-slate-300 mb-2 tracking-widest">STEP {step.step}</div>
                                <h3 className="text-xl font-bold text-slate-800 mb-3">{step.title}</h3>
                                <p className="text-slate-500 leading-relaxed text-sm">{step.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Live Stats */}
            <section id="stats" className="py-24 px-4 bg-white">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <span className="inline-block px-4 py-1.5 bg-[#f97316]/10 text-[#f97316] rounded-full text-sm font-semibold mb-4">
                            Live Statistics
                        </span>
                        <h2 className="text-4xl font-bold text-slate-800 mb-4" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                            Real-Time City Performance
                        </h2>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {[
                            { icon: AlertTriangle, label: 'Total Complaints', value: stats.total || 1247, color: '#1a3c6e' },
                            { icon: CheckCircle, label: 'Resolved Issues', value: stats.resolved || 983, color: '#22c55e' },
                            { icon: BarChart2, label: 'Resolved This Week', value: stats.resolvedThisWeek || 47, color: '#f97316' },
                            { icon: Clock, label: 'Avg Resolution (hrs)', value: stats.avgResolutionHours || 38, color: '#8b5cf6' },
                        ].map((stat, i) => (
                            <div key={i} className="bg-slate-50 rounded-2xl p-6 text-center card-hover border border-slate-100">
                                <stat.icon className="w-8 h-8 mx-auto mb-3" style={{ color: stat.color }} />
                                <div className="text-3xl font-bold text-slate-800 mb-1">
                                    <AnimatedNumber target={stat.value} />
                                </div>
                                <p className="text-slate-500 text-sm">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="py-24 px-4 bg-gradient-to-br from-[#0f2346] to-[#1a3c6e]">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-white mb-4" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                            Powered by <span className="text-[#f97316]">AI + Technology</span>
                        </h2>
                        <p className="text-white/60 max-w-xl mx-auto">Everything you need for modern civic engagement</p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            { icon: '🤖', title: 'Gemini AI Categorization', desc: 'Automatic categorization and priority scoring powered by Google Gemini AI.' },
                            { icon: '🗺️', title: 'Live OpenStreetMap', desc: 'Interactive maps show real-time complaint locations across the city.' },
                            { icon: '📱', title: 'Real-time Notifications', desc: 'Instant notifications on every status change via app and email.' },
                            { icon: '📊', title: 'Analytics Dashboard', desc: 'Comprehensive charts and reports for administrators and officers.' },
                            { icon: '📸', title: 'Evidence Upload', desc: 'Attach photos and videos as evidence. AI analyzes images automatically.' },
                            { icon: '🔐', title: 'Role-Based Access', desc: 'Secure portals for Citizens, Officers, and Administrators.' },
                        ].map((f, i) => (
                            <div key={i} className="glass rounded-2xl p-6 hover:bg-white/90 transition-all card-hover">
                                <div className="text-3xl mb-4">{f.icon}</div>
                                <h3 className="font-bold text-[#1a3c6e] mb-2">{f.title}</h3>
                                <p className="text-slate-600 text-sm leading-relaxed">{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Map Section */}
            <section id="map" className="py-24 px-4 bg-slate-50">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-12">
                        <span className="inline-block px-4 py-1.5 bg-[#1a3c6e]/10 text-[#1a3c6e] rounded-full text-sm font-semibold mb-4">
                            City Map
                        </span>
                        <h2 className="text-4xl font-bold text-slate-800 mb-4" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                            Complaints Across the City
                        </h2>
                        <p className="text-slate-500 max-w-xl mx-auto mb-6">
                            <span className="inline-flex items-center gap-1 text-orange-600 font-medium">● Open complaints</span>
                            {' '}&nbsp;
                            <span className="inline-flex items-center gap-1 text-green-600 font-medium">● Resolved</span>
                        </p>
                    </div>
                    <div className="rounded-3xl overflow-hidden shadow-xl border border-slate-200">
                        <CityMap complaints={DEMO_COMPLAINTS} height="500px" />
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-24 px-4 bg-white">
                <div className="max-w-3xl mx-auto text-center">
                    <h2 className="text-4xl md:text-5xl font-bold text-slate-800 mb-6" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                        Ready to make your city{' '}
                        <span className="text-[#f97316]">better?</span>
                    </h2>
                    <p className="text-slate-500 text-lg mb-10">
                        Join thousands of citizens who use CityFix to report and track civic issues.
                    </p>
                    <button
                        onClick={handleGetStarted}
                        className="btn-primary px-10 py-5 rounded-2xl text-xl font-bold inline-flex items-center gap-3"
                    >
                        Get Started Now
                        <ArrowRight className="w-6 h-6" />
                    </button>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-[#0f2346] py-10 px-4">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#f97316] rounded-lg flex items-center justify-center">
                            <MapPin className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-white font-bold">City<span className="text-[#f97316]">Fix</span></span>
                    </div>
                    <p className="text-white/40 text-sm">© 2025 CityFix. AI-powered civic complaint management.</p>
                    <div className="flex gap-6">
                        <a href="#" className="text-white/40 hover:text-white/70 text-sm transition-colors">Privacy</a>
                        <a href="#" className="text-white/40 hover:text-white/70 text-sm transition-colors">Terms</a>
                        <a href="#" className="text-white/40 hover:text-white/70 text-sm transition-colors">Contact</a>
                    </div>
                </div>
            </footer>

            <ChatBot />
        </div>
    );
}

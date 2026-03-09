import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User } from 'lucide-react';
import { chatbotResponse } from '../services/gemini';
import { LoadingSpinner } from './ui';

export default function ChatBot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'bot', text: "Hi! I'm CityBot 🏙️ How can I help you today? I can guide you through submitting a complaint, checking its status, or answering questions about CityFix." }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const bottomRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = async () => {
        if (!input.trim() || loading) return;
        const userMsg = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setLoading(true);

        try {
            const response = await chatbotResponse(userMsg, 'User is on the CityFix portal');
            setMessages(prev => [...prev, { role: 'bot', text: response }]);
        } catch {
            setMessages(prev => [...prev, { role: 'bot', text: "I'm having trouble connecting. Please try again later." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Floating button */}
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 z-50 chatbot-bubble text-white shadow-2xl"
                aria-label="Open CityBot"
            >
                <MessageCircle className="w-6 h-6" />
            </button>

            {/* Chat window */}
            {isOpen && (
                <div className="fixed bottom-20 right-6 z-50 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 animate-fade-in-up overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-[#1a3c6e] to-[#1e5a9e] p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-[#f97316] flex items-center justify-center">
                                <Bot className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <p className="text-white font-semibold text-sm">CityBot</p>
                                <p className="text-white/60 text-xs">AI Assistant</p>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-white/70 hover:text-white transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="h-72 overflow-y-auto p-4 space-y-3 bg-slate-50">
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'bot' ? 'bg-[#1a3c6e]' : 'bg-[#f97316]'
                                    }`}>
                                    {msg.role === 'bot' ? <Bot className="w-3.5 h-3.5 text-white" /> : <User className="w-3.5 h-3.5 text-white" />}
                                </div>
                                <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${msg.role === 'bot'
                                    ? 'bg-white text-slate-700 shadow-sm border border-slate-100'
                                    : 'bg-[#f97316] text-white'
                                    }`}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex gap-2">
                                <div className="w-7 h-7 rounded-full bg-[#1a3c6e] flex items-center justify-center">
                                    <Bot className="w-3.5 h-3.5 text-white" />
                                </div>
                                <div className="bg-white px-4 py-3 rounded-2xl shadow-sm border border-slate-100">
                                    <div className="flex gap-1">
                                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                        <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={bottomRef}></div>
                    </div>

                    {/* Input */}
                    <div className="p-3 bg-white border-t border-slate-100 flex gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && sendMessage()}
                            placeholder="Ask anything..."
                            className="flex-1 px-3 py-2 text-sm bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-[#1a3c6e] focus:ring-2 focus:ring-[#1a3c6e]/10"
                        />
                        <button
                            onClick={sendMessage}
                            disabled={loading || !input.trim()}
                            className="w-9 h-9 bg-[#f97316] rounded-xl flex items-center justify-center text-white disabled:opacity-40 hover:bg-orange-600 transition-colors"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}

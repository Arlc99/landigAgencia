import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User } from 'lucide-react';

interface Message {
    sender: 'user' | 'bot';
    text: string;
}

const MAX_INPUT = 500; // límite de caracteres por mensaje

const GREETING: Message = {
    sender: 'bot',
    text: '¡Hola! 👋 Soy el asistente de JUALU. Te ayudo con nuestros planes, servicios y cómo agendar una cita.',
};

const QUICK_REPLIES = [
    '¿Qué planes tienen?',
    '¿Cómo agendo una cita?',
    '¿Qué incluye la automatización?',
];

export function ChatBot() {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [messages, setMessages] = useState<Message[]>([GREETING]);

    const chatRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Scroll al último mensaje
    useEffect(() => {
        chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' });
    }, [messages, loading]);

    // Enfoca el input al abrir y permite cerrar con Escape
    useEffect(() => {
        if (!isOpen) return;
        inputRef.current?.focus();
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsOpen(false);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isOpen]);

    const sendMessage = async (raw: string) => {
        const userMsg = raw.trim().slice(0, MAX_INPUT);
        if (!userMsg || loading) return;

        setInput('');
        setLoading(true);

        // Historial: últimos 10 mensajes + el nuevo, para que el bot tenga contexto
        const history = [...messages, { sender: 'user', text: userMsg } as Message]
            .slice(-10)
            .map((m) => ({
                role: m.sender === 'user' ? ('user' as const) : ('assistant' as const),
                content: m.text,
            }));

        setMessages((prev) => [...prev, { sender: 'user', text: userMsg }]);

        let botText = '';

        try {
            const r = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ history }),
            });

            if (r.ok) {
                const data = await r.json();
                botText = data.text ?? '';
            }
        } catch (error) {
            console.warn('Error al conectar con el chat:', error);
        } finally {
            setMessages((prev) => [
                ...prev,
                {
                    sender: 'bot',
                    text:
                        botText ||
                        'No pude conectar con el asistente. Intenta de nuevo en unos segundos o agenda una cita desde el botón de la página.',
                },
            ]);
            setLoading(false);
        }
    };

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        sendMessage(input);
    };

    const showQuickReplies = messages.length === 1 && !loading;

    return (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50">
            {/* Animaciones propias del chat (respetan prefers-reduced-motion) */}
            <style>{`
                @keyframes jualu-pop {
                    from { opacity: 0; transform: translateY(12px) scale(0.97); }
                    to   { opacity: 1; transform: translateY(0) scale(1); }
                }
                @keyframes jualu-dot {
                    0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
                    40% { transform: translateY(-4px); opacity: 1; }
                }
                .jualu-pop { animation: jualu-pop 0.22s ease-out; }
                .jualu-dot { animation: jualu-dot 1.2s infinite ease-in-out; }
                @media (prefers-reduced-motion: reduce) {
                    .jualu-pop, .jualu-dot { animation: none; }
                }
            `}</style>

            {/* Botón flotante */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    aria-label="Abrir chat de atención"
                    className="group relative flex items-center justify-center w-14 h-14 rounded-full text-white
                               bg-gradient-to-br from-blue-500 to-cyan-400
                               shadow-[0_8px_30px_rgba(47,107,255,0.45)]
                               transition-transform duration-200 hover:scale-105
                               focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                >
                    <MessageSquare className="w-6 h-6" />
                    <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-black" />
                </button>
            )}

            {/* Ventana del chat */}
            {isOpen && (
                <div
                    role="dialog"
                    aria-label="Chat de atención al cliente"
                    className="jualu-pop flex flex-col overflow-hidden rounded-3xl text-white
                               w-[calc(100vw-2rem)] sm:w-[390px] h-[min(560px,calc(100vh-6rem))]
                               bg-[#080b13]/95 backdrop-blur-xl
                               border border-white/10
                               shadow-[0_24px_80px_rgba(0,0,0,0.65),0_0_0_1px_rgba(56,189,248,0.08)]"
                >
                    {/* Encabezado */}
                    <div className="relative px-5 py-4 flex items-center justify-between border-b border-white/10 bg-gradient-to-r from-blue-600/25 via-blue-500/10 to-cyan-400/15">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/30">
                                    <Bot className="w-5 h-5 text-white" />
                                </div>
                                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#080b13]" />
                            </div>
                            <div>
                                <h3 className="text-[15px] font-semibold leading-tight">Asistente JUALU</h3>
                                <p className="text-xs text-zinc-400">Responde al instante</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            aria-label="Cerrar chat"
                            className="text-zinc-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition
                                       focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Mensajes */}
                    <div ref={chatRef} className="flex-1 px-4 py-5 overflow-y-auto space-y-4 scroll-smooth">
                        {messages.map((msg, index) => (
                            <div
                                key={index}
                                className={`flex items-end gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                {msg.sender === 'bot' && (
                                    <div className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                                        <Bot className="w-4 h-4 text-cyan-300" />
                                    </div>
                                )}
                                <div
                                    className={`max-w-[78%] px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words ${
                                        msg.sender === 'user'
                                            ? 'rounded-2xl rounded-br-md bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-md shadow-blue-600/20'
                                            : 'rounded-2xl rounded-bl-md bg-white/[0.06] text-zinc-100 border border-white/10'
                                    }`}
                                >
                                    {msg.text}
                                </div>
                                {msg.sender === 'user' && (
                                    <div className="w-7 h-7 rounded-full bg-blue-600/30 border border-blue-400/30 flex items-center justify-center shrink-0">
                                        <User className="w-4 h-4 text-blue-200" />
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Sugerencias iniciales */}
                        {showQuickReplies && (
                            <div className="flex flex-wrap gap-2 pl-9">
                                {QUICK_REPLIES.map((q) => (
                                    <button
                                        key={q}
                                        onClick={() => sendMessage(q)}
                                        className="text-xs px-3 py-1.5 rounded-full border border-cyan-400/30 text-cyan-200
                                                   bg-cyan-400/5 hover:bg-cyan-400/15 transition
                                                   focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Indicador "escribiendo" */}
                        {loading && (
                            <div className="flex items-end gap-2" aria-live="polite" aria-label="El asistente está escribiendo">
                                <div className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                                    <Bot className="w-4 h-4 text-cyan-300" />
                                </div>
                                <div className="flex items-center gap-1.5 px-4 py-3 rounded-2xl rounded-bl-md bg-white/[0.06] border border-white/10">
                                    {[0, 1, 2].map((i) => (
                                        <span
                                            key={i}
                                            className="jualu-dot w-1.5 h-1.5 rounded-full bg-cyan-300"
                                            style={{ animationDelay: `${i * 0.15}s` }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Entrada de texto */}
                    <form onSubmit={handleSend} className="p-3 border-t border-white/10 bg-black/30">
                        <div className="flex items-center gap-2 rounded-2xl bg-white/[0.06] border border-white/10 pl-4 pr-1.5 py-1.5 focus-within:border-cyan-400/60 transition">
                            <input
                                ref={inputRef}
                                type="text"
                                value={input}
                                maxLength={MAX_INPUT}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Escribe tu consulta..."
                                className="flex-1 bg-transparent text-white placeholder-zinc-500 text-sm py-1.5 focus:outline-none"
                            />
                            <button
                                type="submit"
                                disabled={loading || !input.trim()}
                                aria-label="Enviar mensaje"
                                className="w-9 h-9 rounded-xl flex items-center justify-center text-white
                                           bg-gradient-to-br from-blue-500 to-cyan-400
                                           disabled:opacity-40 disabled:cursor-not-allowed
                                           hover:brightness-110 transition
                                           focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}

export default ChatBot;
import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Mic, MicOff } from 'lucide-react';

const InterviewInterface = ({
    messages,
    onSendMessage,
    isListening,
    toggleListening,
    currentQuestion
}) => {
    const [inputText, setInputText] = React.useState('');
    const chatEndRef = useRef(null);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (inputText.trim()) {
            onSendMessage(inputText);
            setInputText('');
        }
    };

    return (
        <div className="flex flex-col h-full w-full max-w-2xl mx-auto p-4 md:p-6 bg-slate-900/40 backdrop-blur-sm rounded-xl border border-slate-800 shadow-2xl overflow-hidden relative">
            {/* Header / Context */}
            <div className="flex-shrink-0 mb-4 border-b border-slate-800 pb-2">
                <h2 className="text-xl font-bold text-shibu-accent">Current Question:</h2>
                <p className="text-lg text-slate-200 mt-1">{currentQuestion || "Initializing..."}</p>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                <AnimatePresence>
                    {messages.map((msg, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, x: msg.sender === 'user' ? 20 : -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0 }}
                            className={`flex w-full ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[80%] p-4 rounded-2xl ${msg.sender === 'user'
                                        ? 'bg-shibu-accent text-slate-900 rounded-br-none'
                                        : 'bg-slate-800 text-slate-100 rounded-bl-none border border-slate-700'
                                    }`}
                            >
                                <p className="text-sm font-medium opacity-70 mb-1">{msg.sender === 'user' ? 'You' : 'SHIBU'}</p>
                                <p>{msg.text}</p>
                            </div>
                        </motion.div>
                    ))}
                    {isListening && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex justify-end"
                        >
                            <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                                <div className="flex space-x-1">
                                    <motion.div className="w-2 h-2 bg-red-500 rounded-full" animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 0.6 }} />
                                    <motion.div className="w-2 h-2 bg-red-500 rounded-full" animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} />
                                    <motion.div className="w-2 h-2 bg-red-500 rounded-full" animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} />
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
                <div ref={chatEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSubmit} className="flex-shrink-0 relative flex items-center gap-2">

                <button
                    type="button"
                    onClick={toggleListening}
                    className={`p-3 rounded-full transition-all ${isListening
                            ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 ring-2 ring-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.3)]'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                        }`}
                    title="Toggle Voice Input"
                >
                    {isListening ? <MicOff size={24} /> : <Mic size={24} />}
                </button>

                <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={isListening ? "Listening..." : "Type your answer..."}
                    className="flex-1 bg-slate-900/80 border border-slate-700 rounded-lg py-3 px-4 text-white focus:outline-none focus:border-shibu-accent focus:ring-1 focus:ring-shibu-accent transition-all placeholder:text-slate-600"
                    disabled={isListening}
                />

                <button
                    type="submit"
                    disabled={!inputText.trim()}
                    className="p-3 bg-shibu-accent text-slate-900 rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-cyan-400 transition-colors"
                >
                    <Send size={20} />
                </button>
            </form>
        </div>
    );
};

export default InterviewInterface;

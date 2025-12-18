
import React, { useState, useEffect } from 'react';
import { Activity } from 'lucide-react';

const HealthCheck = () => {
    const [status, setStatus] = useState('checking'); // 'ok', 'error', 'checking'
    const [ragStatus, setRagStatus] = useState(null);

    useEffect(() => {
        const checkHealth = async () => {
            try {
                const response = await fetch('http://localhost:8000/health');
                if (response.ok) {
                    const data = await response.json();
                    setStatus('ok');
                    setRagStatus(data.rag_status);
                } else {
                    setStatus('error');
                }
            } catch (e) {
                setStatus('error');
            }
        };

        // Initial check
        checkHealth();

        // Poll every 10 seconds
        const interval = setInterval(checkHealth, 10000);

        return () => clearInterval(interval);
    }, []);

    if (status === 'checking') return null;

    return (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-md border ${status === 'ok'
                ? 'bg-green-500/10 border-green-500/20 text-green-400'
                : 'bg-red-500/10 border-red-500/20 text-red-400'
            }`}>
            <div className={`w-2 h-2 rounded-full ${status === 'ok' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'
                }`} />
            <span className="text-xs font-mono font-bold uppercase tracking-wider">
                {status === 'ok' ? 'System Online' : 'System Offline'}
            </span>
            {ragStatus === 'loading_or_disabled' && status === 'ok' && (
                <span className="text-[10px] text-yellow-400 ml-1 opacity-80">(RAG Loading)</span>
            )}
        </div>
    );
};

export default HealthCheck;

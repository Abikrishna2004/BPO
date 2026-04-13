import React, { useState, useEffect } from 'react';
import { Layers, Clock, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const QueueItem = ({ name, active, waiting, sl }) => (
    <div className="glass-card p-6 flex flex-col gap-4 relative overflow-hidden">
        <div className="flex justify-between items-start z-10 relative">
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                    <Layers size={20} />
                </div>
                <div>
                    <h3 className="font-bold text-white text-lg">{name}</h3>
                    <p className="text-xs text-gray-500">Inbound Voice</p>
                </div>
            </div>
            <div className="text-2xl font-bold text-white">{sl || 95}% <span className="text-[10px] text-gray-500 font-normal block text-right">SLA</span></div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-2 z-10 relative">
            <div className="bg-black/20 rounded-lg p-3">
                <div className="text-xs text-gray-400 mb-1">Active Calls</div>
                <div className="text-xl font-bold text-neon-blue">{active}</div>
            </div>
            <div className="bg-black/20 rounded-lg p-3">
                <div className="text-xs text-gray-400 mb-1">Waiting</div>
                <div className={`text-xl font-bold ${waiting > 5 ? 'text-red-500 animate-pulse' : 'text-white'}`}>{waiting}</div>
            </div>
        </div>

        {/* Background decorative element */}
        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
    </div>
);

const Queues = () => {
    const [queues, setQueues] = useState([]);
    const { api } = useAuth();

    useEffect(() => {
        const fetchQueues = async () => {
            try {
                const response = await api.get('/queues');
                setQueues(response.data.map(q => ({
                    id: q._id,
                    name: q.name,
                    active: q.active_calls,
                    waiting: q.waiting_calls,
                    sl: 95 // Mock SLA for now as it's not in DB model yet
                })));
            } catch (error) {
                console.error("Failed to fetch queues:", error);
            }
        };

        fetchQueues();
        const interval = setInterval(fetchQueues, 5000); // Poll every 5s
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-white">Queue Management</h2>
                    <p className="text-sm text-gray-400">SLA Monitoring & Real-time Routing for {queues.length} Queues</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {queues.map(q => (
                    <QueueItem key={q.id || q.name} {...q} />
                ))}
            </div>
        </div>
    );
};

export default Queues;

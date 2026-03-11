import React, { useState } from 'react';
import { Phone, Mic, MoreVertical, PlayCircle, PauseCircle } from 'lucide-react';

const CallCard = ({ caller, queue, duration, status, agent }) => (
    <div className="glass-card p-4 flex items-center justify-between group hover:border-neon-blue/50 transition-colors">
        <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${status === 'Active' ? 'bg-green-500/10 text-green-500 animate-pulse' : 'bg-white/5 text-gray-400'}`}>
                <Phone size={20} />
            </div>
            <div>
                <div className="flex items-center gap-2">
                    <h4 className="font-bold text-white">{caller}</h4>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-white/5 text-gray-400">{queue}</span>
                </div>
                <div className="text-xs text-gray-500 flex items-center gap-2 mt-1">
                    <span className={status === 'Active' ? 'text-green-400' : 'text-gray-400'}>{duration}</span> • Agent: {agent || 'Unassigned'}
                </div>
            </div>
        </div>

        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white"><Mic size={18} /></button>
            <button className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white"><MoreVertical size={18} /></button>
        </div>
    </div>
);

const LiveCalls = () => {
    const [calls] = useState([
        { id: 1, caller: "+1 (555) 0123-4567", queue: "Tech Support", duration: "04:12", status: "Active", agent: "Sarah Connor" },
        { id: 2, caller: "+1 (555) 9876-5432", queue: "Sales", duration: "02:45", status: "Active", agent: "John Doe" },
        { id: 3, caller: "+1 (555) 1111-2222", queue: "Billing", duration: "00:30", status: "Queued", agent: null },
    ]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-white">Live Operations</h2>
                    <p className="text-sm text-gray-400">Real-time call monitoring</p>
                </div>
                <button className="btn-primary flex items-center gap-2">
                    <PlayCircle size={18} /> Monitor All
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 px-2">
                        <span>Active Calls ({calls.length})</span>
                        <span>Sort by: Duration</span>
                    </div>

                    {calls.map(call => (
                        <CallCard key={call.id} {...call} />
                    ))}
                </div>

                <div className="glass-card p-6 h-fit">
                    <h3 className="font-bold text-white mb-4">Queue Health</h3>
                    <div className="space-y-4">
                        {['Tech Support', 'Sales', 'Billing', 'General'].map(q => (
                            <div key={q} className="flex justify-between items-center">
                                <span className="text-sm text-gray-400">{q}</span>
                                <div className="flex items-center gap-3">
                                    <div className="h-1.5 w-24 bg-gray-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-neon-blue w-[40%]"></div>
                                    </div>
                                    <span className="text-xs font-mono text-white">4</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LiveCalls;

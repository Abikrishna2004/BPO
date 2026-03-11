import React, { useState, useEffect } from 'react';
import { User, Shield, Radio } from 'lucide-react';
import axios from 'axios';

const AgentCard = ({ name, role, status, efficiency }) => (
    <div className="glass-card p-4 flex items-center gap-4 group hover:border-neon-purple/50 transition-colors">
        <div className="relative">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center border border-white/5">
                <User className="text-gray-300" size={20} />
            </div>
            <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-[#0a0a12] ${status === 'Available' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
        </div>

        <div className="flex-1">
            <h4 className="font-bold text-white text-sm">{name}</h4>
            <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-gray-400">{role}</span>
            </div>
        </div>

        <div className="text-right">
            <div className="text-xs text-gray-400 mb-1">Efficiency</div>
            <div className="text-sm font-bold text-neon-blue">{efficiency || 95}%</div>
        </div>
    </div>
);

const Agents = () => {
    const [agents, setAgents] = useState([]);

    useEffect(() => {
        const fetchAgents = async () => {
            try {
                const response = await axios.get('http://localhost:8000/api/agents');
                // Map API response to UI model if needed, currently straightforward
                setAgents(response.data.map(a => ({
                    id: a._id,
                    name: a.full_name,
                    role: a.role,
                    status: a.is_active ? 'Available' : 'Logged Out', // Simplified status for now
                    efficiency: 95 + Math.floor(Math.random() * 5) // Mock efficiency for now
                })));
            } catch (error) {
                console.error("Failed to fetch agents:", error);
            }
        };

        fetchAgents();
        const interval = setInterval(fetchAgents, 5000); // Polling for updates
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-white">Workforce Management</h2>
                    <p className="text-sm text-gray-400">Total Agents: {agents.length}</p>
                </div>
                <div className="flex gap-2">
                    <button className="btn-secondary text-xs">Manage Shifts</button>
                    <button className="btn-primary text-xs">Add Agent</button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {agents.map(agent => (
                    <AgentCard key={agent.id} {...agent} />
                ))}
            </div>
        </div>
    );
};

export default Agents;

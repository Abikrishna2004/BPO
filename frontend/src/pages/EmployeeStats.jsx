import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { CheckCircle, Clock, Calendar, ChevronDown, Activity, Trophy, Award, Lock, BarChart3, ArrowLeft, Zap, Shield, UserCog, UserCheck, ChevronRight, Briefcase, Share2, Monitor, GraduationCap, DollarSign, SignalHigh } from 'lucide-react';
import { CustomSelect, CustomRoleSelect } from '../components/CustomDropdowns';

export default function EmployeeStats() {
    const { api, user: currentUser } = useAuth();
    const navigate = useNavigate();

    // State
    const [agents, setAgents] = useState([]);
    const [expandedAgent, setExpandedAgent] = useState(null);
    const [achievements, setAchievements] = useState([]);
    const [historyData, setHistoryData] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    // Admin Role Management State
    const [selectedAgentId, setSelectedAgentId] = useState('');
    const [selectedRole, setSelectedRole] = useState('');
    const [salaryInput, setSalaryInput] = useState('');
    const [updatingRole, setUpdatingRole] = useState(false);
    const [updatingSalary, setUpdatingSalary] = useState(false);

    // Records Modal State
    const [showRecordsModal, setShowRecordsModal] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [employeeTasks, setEmployeeTasks] = useState([]);
    const [employeeAttendance, setEmployeeAttendance] = useState([]);
    const [loadingRecordId, setLoadingRecordId] = useState(null);

    const openRecords = async (agent, e) => {
        e.stopPropagation(); // Prevent card expansion

        if (loadingRecordId === agent.id) return; // Prevent double click
        setLoadingRecordId(agent.id);

        try {
            const [tasksRes, attRes] = await Promise.all([
                api.get(`/tasks/user/${agent.id}`),
                api.get(`/attendance/history/${agent.id}`)
            ]);
            setSelectedEmployee(agent);
            setEmployeeTasks(tasksRes.data);
            setEmployeeAttendance(attRes.data);
            setShowRecordsModal(true);
        } catch (error) {
            console.error(error);
            alert("Failed to load records. You may not have permission or there is a connection issue.");
        } finally {
            setLoadingRecordId(null);
        }
    };

    const parseAttachments = (attachmentsJson) => {
        if (!attachmentsJson) return [];
        try {
            return JSON.parse(attachmentsJson);
        } catch (e) {
            return [];
        }
    };

    useEffect(() => {
        fetchAgents();
    }, []);

    const fetchAgents = async () => {
        try {
            const response = await api.get('/dashboard/agents');
            setAgents(response.data);
        } catch (error) {
            console.error('Failed to fetch agents', error);
        }
    };

    const handleExpandInfo = async (agentId) => {
        if (expandedAgent === agentId) {
            setExpandedAgent(null);
            return;
        }
        setExpandedAgent(agentId);
        setLoadingHistory(true);
        try {
            const [achRes, histRes, tasksRes] = await Promise.all([
                api.get(`/users/${agentId}/achievements`).catch(e => { console.error(e); return { data: [] }; }),
                api.get(`/performance/${agentId}/history`).catch(e => { console.error(e); return { data: [] }; }),
                api.get(`/tasks/user/${agentId}`).catch(e => { console.error(e); return { data: [] }; })
            ]);
            setAchievements(achRes.data);
            setHistoryData(histRes.data);
            setEmployeeTasks(tasksRes.data);
        } catch (error) {
            console.error("Error fetching details", error);
        } finally {
            setLoadingHistory(false);
        }
    };

    const handleGlobalRoleUpdate = async () => {
        if (!selectedAgentId) return alert("Please select an agent.");
        if (!selectedRole) return alert("Please select a role.");

        setUpdatingRole(true);
        try {
            await api.put(`/users/${selectedAgentId}/role`, { role: selectedRole });

            // Optimistic Update
            setAgents(prev => prev.map(a => a.id === parseInt(selectedAgentId) ? { ...a, role: selectedRole } : a));

            alert(`Role successfully updated to: ${selectedRole}`);
            setSelectedAgentId(''); // Reset selection
            setSelectedRole('');
        } catch (error) {
            console.error("Failed to update role", error);
            alert("Failed to update role. Ensure you have admin privileges.");
        } finally {
            setUpdatingRole(false);
        }
    };

    const handleSalaryUpdate = async () => {
        if (!selectedAgentId) return alert("Please select an agent.");
        if (!salaryInput) return alert("Enter salary.");

        setUpdatingSalary(true);
        try {
            await api.put(`/users/${selectedAgentId}/salary`, { salary: parseFloat(salaryInput) });

            // Optimistic Update
            setAgents(prev => prev.map(a => a.id === parseInt(selectedAgentId) ? { ...a, salary: parseFloat(salaryInput) } : a));

            alert(`Salary updated to: ₹ ${salaryInput} LPA`);
            // Keep selection but clear input or keep it? Keep it showing current.
        } catch (error) {
            console.error("Failed to update salary", error);
            alert("Failed to update salary.");
        } finally {
            setUpdatingSalary(false);
        }
    };

    // Auto-fill salary when agent selected
    useEffect(() => {
        if (selectedAgentId) {
            const agent = agents.find(a => a.id === parseInt(selectedAgentId));
            if (agent) {
                setSalaryInput(agent.salary || '');
            }
        } else {
            setSalaryInput('');
        }
    }, [selectedAgentId, agents]);

    const isAdmin = currentUser?.role === 'admin' || currentUser?.username === 'Admin@CJ';

    // Role Categories Data
    const roleCategories = [
        {
            title: "Agent (Core Operations)",
            icon: UserCheck,
            roles: ["Agent", "Senior Agent", "Manager"]
        },
        {
            title: "Sales (Inside Sales / BPO)",
            icon: Briefcase,
            roles: ["Sales Executive", "Senior Sales Executive", "Sales Team Leader", "Sales Manager", "Head of Sales / Sales Director"]
        },
        {
            title: "Technical (IT / Support / Dev)",
            icon: Monitor,
            roles: ["Technical Support Executive", "Senior Technical Support Engineer", "System / Software Engineer", "Senior Software Engineer", "Technical Lead / IT Manager"]
        },
        {
            title: "LinkedIn & Social Pages",
            icon: Share2,
            roles: ["Social Media Executive", "Content & Community Manager", "Social Media Strategist", "Brand & Social Media Manager", "Head of Social Media / Brand Director"]
        },
        {
            title: "Digital Marketing",
            icon: SignalHigh,
            roles: ["Digital Marketing Executive", "SEO / Social Media Specialist", "Digital Marketing Strategist", "Digital Marketing Manager", "Head of Digital Marketing"]
        },
        {
            title: "University / Training",
            icon: GraduationCap,
            roles: ["Training Coordinator", "Trainer / Instructor", "Senior Trainer", "Training Manager", "Head of Training / Academic Director"]
        }
    ];

    return (
        <div className="min-h-screen bg-black text-gray-100 p-4 md:p-8 font-sans selection:bg-primary/30 relative">
            <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/')}
                className="fixed top-6 left-6 z-[100] flex items-center gap-3 bg-black/60 backdrop-blur-md px-4 py-2.5 rounded-full border border-white/10 hover:border-white/30 text-gray-300 hover:text-white transition-all shadow-xl group cursor-pointer"
            >
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
                <span className="font-medium text-sm">Back to Home</span>
            </motion.button>

            <div className="max-w-7xl mx-auto mb-10 pt-16 relative text-center">
                <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight uppercase">
                    Workforce Analytics
                </h2>
            </div>

            {/* --- ADMIN ROLE MANAGEMENT PANEL (Separated) --- */}
            {isAdmin && (
                <div className="max-w-7xl mx-auto mb-12 relative z-50">
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-[#0f0f0f] border border-purple-500/20 rounded-3xl p-8 shadow-[0_0_50px_rgba(168,85,247,0.08)] overflow-visible relative"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                            <Shield className="w-32 h-32 text-purple-500" />
                        </div>

                        <div className="flex items-center gap-3 mb-6 text-purple-400">
                            <div className="p-2 bg-purple-500/10 rounded-lg">
                                <UserCog className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold uppercase tracking-widest text-white">Workforce Administration</h3>
                                <p className="text-xs text-gray-500">Promote, Demote, or Reassign Department Roles</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end relative z-20">
                            {/* 1. Select Agent */}
                            <div className="md:col-span-1 relative z-30">
                                <label className="block text-[10px] uppercase text-gray-500 font-bold mb-2 ml-1">Select Employee</label>
                                <CustomSelect
                                    options={agents.map(a => ({ value: a.id, label: a.username, sub: a.role }))}
                                    value={selectedAgentId}
                                    onChange={setSelectedAgentId}
                                    placeholder="Choose Agent..."
                                    icon={UserCheck}
                                />
                            </div>

                            {/* 2. Select Role (Premium Dropdown) */}
                            <div className="md:col-span-2 relative z-30">
                                <label className="block text-[10px] uppercase text-gray-500 font-bold mb-2 ml-1">Assign New Designation</label>
                                <CustomRoleSelect
                                    categories={roleCategories}
                                    value={selectedRole}
                                    onChange={setSelectedRole}
                                    placeholder="Select a new Role..."
                                    centered={false}
                                />
                            </div>

                            {/* 3. Action Button */}
                            <div className="md:col-span-1 relative z-10">
                                <button
                                    onClick={handleGlobalRoleUpdate}
                                    disabled={updatingRole || !selectedAgentId || !selectedRole}
                                    className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 border ${selectedAgentId && selectedRole
                                        ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_20px_rgba(147,51,234,0.3)] border-purple-500/50 cursor-pointer hover:-translate-y-0.5'
                                        : 'bg-white/5 text-gray-500 border-white/5 cursor-not-allowed'
                                        }`}
                                >
                                    {updatingRole ? (
                                        <Activity className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <UserCog className="w-4 h-4" />
                                    )}
                                    {updatingRole ? 'Processing...' : 'Update Role'}
                                </button>
                            </div>
                        </div>
                    </motion.div>


                    {/* --- FINANCIAL SETTINGS PANEL --- */}
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-[#0f0f0f] border border-green-500/20 rounded-3xl p-8 shadow-[0_0_50px_rgba(34,197,94,0.08)] overflow-visible relative mt-8"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                            <DollarSign className="w-32 h-32 text-green-500" />
                        </div>

                        <div className="flex items-center gap-3 mb-6 text-green-400">
                            <div className="p-2 bg-green-500/10 rounded-lg">
                                <Activity className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold uppercase tracking-widest text-white">Financial Compensation</h3>
                                <p className="text-xs text-gray-500">Manage Annual Packages (LPA) for Employees</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end relative z-20">
                            {/* 1. Select Agent (Reuse selection if already selected, or separate ui?) */}
                            {/* It's cleaner to use the same selection state but maybe re-render dropdown? 
                                 Or just rely on the user having selected above? 
                                 Let's duplicate the dropdown for clarity if they scroll here directly, 
                                 OR just say "Selected Agent: X" if active.
                                 Actually, let's just put the Input and Update button here, linked to `selectedAgentId`.
                             */}
                            <div className="md:col-span-1 relative z-30">
                                <label className="block text-[10px] uppercase text-gray-500 font-bold mb-2 ml-1">Current Selection</label>
                                <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-300">
                                    {selectedAgentId ? agents.find(a => a.id === parseInt(selectedAgentId))?.username || 'Unknown' : 'No Agent Selected'}
                                </div>
                            </div>

                            {/* 2. Salary Input */}
                            <div className="md:col-span-2 relative z-30">
                                <label className="block text-[10px] uppercase text-gray-500 font-bold mb-2 ml-1">Annual Salary (LPA)</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-mono">₹</span>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={salaryInput}
                                        onChange={(e) => setSalaryInput(e.target.value)}
                                        className="w-full bg-[#1a1a1a] text-white border border-white/10 rounded-xl px-4 py-3 pl-8 focus:outline-none focus:border-green-500/50 transition-colors placeholder-gray-600 font-mono"
                                        placeholder="0.0"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-xs font-bold">LPA</span>
                                </div>
                            </div>

                            {/* 3. Update Button */}
                            <div className="md:col-span-1 relative z-10">
                                <button
                                    onClick={handleSalaryUpdate}
                                    disabled={updatingSalary || !selectedAgentId}
                                    className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 border ${selectedAgentId
                                        ? 'bg-green-600 hover:bg-green-500 text-white shadow-[0_0_20px_rgba(34,197,94,0.3)] border-green-500/50 cursor-pointer hover:-translate-y-0.5'
                                        : 'bg-white/5 text-gray-500 border-white/5 cursor-not-allowed'
                                        }`}
                                >
                                    {updatingSalary ? (
                                        <Activity className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <DollarSign className="w-4 h-4" />
                                    )}
                                    {updatingSalary ? 'Updating...' : 'Set Salary'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div >
            )
            }

            <div className="max-w-7xl mx-auto grid gap-6 pb-20 relative z-0">
                {agents.map((agent, index) => {
                    const metrics = calculateMetrics(agent);
                    return (
                        <motion.div
                            key={agent.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={`group relative overflow-hidden rounded-3xl border transition-all duration-500 ${agent.performance_score >= 100
                                ? 'border-yellow-500/30 bg-gradient-to-br from-yellow-500/5 via-black/80 to-black shadow-[0_0_30px_rgba(234,179,8,0.05)]'
                                : 'border-white/5 bg-[#0a0a0a] hover:border-white/10 hover:bg-[#0f0f0f]'
                                }`}
                        >
                            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-50 transition-opacity duration-700" />

                            <div
                                onClick={() => handleExpandInfo(agent.id)}
                                className="relative p-6 md:p-8 flex items-center justify-between cursor-pointer z-10"
                            >
                                <div className="flex items-center gap-6">
                                    <div className="relative">
                                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl font-black transition-transform group-hover:scale-105 duration-300 ${agent.status === 'online'
                                            ? 'bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-[0_0_20px_rgba(59,130,246,0.3)]'
                                            : 'bg-gradient-to-br from-gray-800 to-black text-gray-500 border border-white/5'
                                            }`}>
                                            {agent.username.charAt(0).toUpperCase()}
                                        </div>
                                        {agent.status === 'online' && (
                                            <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex flex-col gap-1">
                                        <h3 className="font-bold text-xl text-white group-hover:text-blue-400 transition-colors flex items-center gap-3">
                                            {agent.username}
                                            <span className={`text-[10px] px-2 py-0.5 max-w-[200px] truncate rounded-full border ${agent.role === 'admin' ? 'border-purple-500/30 text-purple-400 bg-purple-500/10' :
                                                'border-gray-700 text-gray-400 bg-gray-800'
                                                } uppercase tracking-wider font-mono`}>
                                                {agent.role}
                                            </span>
                                        </h3>

                                        <div className="flex items-center gap-3 mt-1">
                                            <div className="w-32 h-1.5 bg-gray-800 rounded-full overflow-hidden relative">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${metrics.progress}%` }}
                                                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-400"
                                                />
                                            </div>
                                            <span className="text-[10px] font-mono text-gray-500">
                                                NEXT LEVEL: {Math.round(metrics.progress)}%
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-8 md:gap-12">

                                    <div className="text-right hidden md:block group/stat">
                                        <div className="text-[10px] text-gray-500 mb-1 uppercase tracking-widest font-semibold group-hover/stat:text-green-400 transition-colors">Attendance</div>
                                        <div className={`text-2xl font-mono font-bold tracking-tight ${getAttendanceColor(agent.attendance_rate)}`}>
                                            {agent.attendance_rate}%
                                        </div>
                                    </div>
                                    <div className="text-right hidden md:block group/stat">
                                        <div className="text-[10px] text-gray-500 mb-1 uppercase tracking-widest font-semibold group-hover/stat:text-blue-400 transition-colors">Performance</div>
                                        <div className="text-3xl font-black text-white drop-shadow-md group-hover/stat:text-blue-400 transition-colors flex items-center gap-1 justify-end">
                                            {metrics.performanceScore}
                                        </div>
                                    </div>
                                    <div className={`p-3 rounded-full border border-white/5 transition-all duration-300 self-end ${expandedAgent === agent.id ? 'bg-blue-500/20 text-blue-400 border-blue-500/30 rotate-180' : 'bg-transparent text-gray-400 group-hover:border-white/20 group-hover:bg-white/5'}`}>
                                        <ChevronDown className="w-5 h-5" />
                                    </div>
                                </div>
                            </div>

                            <AnimatePresence>
                                {expandedAgent === agent.id && (
                                    <StatsDetailPanel
                                        agent={agent}
                                        achievements={achievements}
                                        historyData={historyData}
                                        loadingHistory={loadingHistory}
                                        metrics={metrics}
                                        employeeTasks={employeeTasks}
                                        parseAttachments={parseAttachments}
                                    />
                                )}
                            </AnimatePresence>
                        </motion.div>
                    );
                })}
            </div>
            {/* Records Modal */}
        </div >
    );
}



const calculateMetrics = (agent) => {
    let performanceScore = Math.round(agent.completed_tasks * 3.5);
    let baseEfficiency = 25;
    let xp = (agent.completed_tasks * 15) + ((agent.attendance_rate || 0) * 0.5);

    if (agent.attendance_rate > 50 && agent.completed_tasks < 1) {
        xp -= 50;
    }

    xp = Math.max(0, xp);
    const xpPerPoint = 100;
    const pointsGained = Math.floor(xp / xpPerPoint);
    let efficiency = Math.min(100, baseEfficiency + pointsGained);
    const progress = ((xp % xpPerPoint) / xpPerPoint) * 100;

    return { performanceScore, efficiency, progress, pointsGained };
}

function getAttendanceColor(rate) {
    if (rate >= 95) return 'text-emerald-400';
    if (rate >= 80) return 'text-yellow-400';
    return 'text-red-400';
}

function StatsDetailPanel({ agent, achievements, historyData, loadingHistory, metrics, employeeTasks, parseAttachments }) {

    return (
        <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-white/10 bg-[#080808] relative z-0 shadow-inner"
        >

            <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-6">

                <div className="lg:col-span-1 space-y-4">
                    <div className="bg-[#0f0f0f] rounded-2xl border border-white/5 p-6 relative overflow-hidden group hover:border-blue-500/20 transition-colors h-[220px] flex flex-col justify-between">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                        <div>
                            <div className="flex justify-between items-start mb-2 relative z-10">
                                <div>
                                    <h4 className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Efficiency Engine</h4>
                                    <p className="text-[10px] text-gray-500">Based on Task Velocity</p>
                                </div>
                                <Activity className={`w-4 h-4 text-blue-500`} />
                            </div>

                            <div className="flex items-end gap-2 mb-1 relative z-10">
                                <span className="text-6xl font-black text-white tracking-tighter">{metrics.efficiency}</span>
                                <span className="text-2xl font-medium text-gray-500 mb-1.5">%</span>
                            </div>
                        </div>

                        <div className="relative z-10">
                            <div className="flex justify-between text-[10px] text-gray-400 mb-1.5 font-mono uppercase tracking-wider">
                                <span className="flex items-center gap-1">
                                    <Zap className="w-3 h-3 text-yellow-500" />
                                    Next Level
                                </span>
                                <span>{Math.round(metrics.progress)}%</span>
                            </div>
                            <div className="h-2.5 w-full bg-gray-800 rounded-full overflow-hidden border border-white/5 relative">
                                <div className="absolute inset-0 z-0 opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNCIgaGVpZ2h0PSI0IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGQ9Ik0gMCA0IEwgNCAwIiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMSIvPjwvc3ZnPg==')]"></div>
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${metrics.progress}%` }}
                                    transition={{ duration: 1.5, type: "spring", stiffness: 50 }}
                                    className="h-full bg-gradient-to-r from-blue-600 via-cyan-500 to-white relative z-10"
                                >
                                    <div className="absolute top-0 right-0 h-full w-2 bg-white/50 blur-[2px]" />
                                </motion.div>
                            </div>
                            <div className="mt-2 text-[9px] text-gray-500">
                                +3.5 pts avg per task completion.
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <StatCard icon={CheckCircle} label="Tasks" value={agent.completed_tasks} glow="blue" delay={0.1} />
                        <StatCard icon={Clock} label="Pending" value={agent.pending_tasks} color="text-amber-400" glow="yellow" delay={0.2} />
                    </div>
                </div>

                <div className="lg:col-span-1 bg-[#0f0f0f] rounded-2xl border border-white/5 flex flex-col hover:border-white/10 transition-all duration-500 group relative overflow-hidden shadow-2xl h-[340px]">
                    <div className="p-4 border-b border-white/5 relative z-10 flex justify-between items-center bg-white/[0.02]">
                        <h4 className="text-xs font-bold flex items-center gap-2 text-white tracking-wide uppercase">
                            <Trophy className="w-3.5 h-3.5 text-yellow-500" />
                            Achievements
                        </h4>
                        <span className="text-[10px] bg-yellow-500/10 text-yellow-500 px-2 py-0.5 rounded border border-yellow-500/20 font-mono">
                            {achievements.length} UNLOCKED
                        </span>
                    </div>

                    <div className="p-3 space-y-2 flex-grow overflow-y-auto custom-scrollbar relative z-10">
                        {achievements.length > 0 ? achievements.map((ach) => (
                            <div key={ach.id} className="relative group/card flex items-center gap-3 bg-black/40 rounded-lg border border-white/5 p-2.5 hover:border-yellow-500/30 transition-all group/item">
                                <div className="p-2 bg-yellow-500/10 rounded-md text-yellow-400 group-hover/item:scale-110 transition-transform">
                                    <Award className="w-4 h-4" />
                                </div>
                                <div className="min-w-0 flex-grow">
                                    <div className="text-xs font-bold text-gray-200 truncate group-hover/item:text-yellow-400 transition-colors">{ach.title}</div>
                                    <div className="text-[9px] text-gray-500 truncate">{ach.description}</div>
                                </div>
                                {ach.amount && (
                                    <div className="text-[10px] font-mono text-emerald-400 whitespace-nowrap px-2 py-1 bg-emerald-500/5 rounded border border-emerald-500/10">
                                        ₹{ach.amount}
                                    </div>
                                )}
                            </div>
                        )) : (
                            <div className="flex flex-col items-center justify-center h-full text-center opacity-40">
                                <Lock className="w-8 h-8 text-gray-500 mb-2" />
                                <span className="text-[10px] text-gray-400">VAULT LOCKED</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-4 lg:col-span-1">
                    <div className="bg-[#0f0f0f] rounded-2xl border border-white/5 p-4 relative overflow-hidden group h-[160px] flex flex-col">
                        <h4 className="text-[10px] font-bold mb-2 text-gray-400 flex items-center gap-2 uppercase tracking-wider z-10">
                            <BarChart3 className="w-3.5 h-3.5 text-purple-500" />
                            Task Output Trends
                        </h4>
                        <div className="flex-grow w-full relative z-10">
                            {!loadingHistory ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={historyData}>
                                        <defs>
                                            <linearGradient id="colorDrift" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <Tooltip contentStyle={{ background: '#000', border: '1px solid #333', fontSize: '10px' }} itemStyle={{ color: '#fff' }} cursor={{ stroke: '#666', strokeWidth: 1 }} />
                                        <Area type="monotone" dataKey="tasks" stroke="#8b5cf6" fill="url(#colorDrift)" strokeWidth={2} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : <div className="h-full flex items-center justify-center text-[10px] text-gray-600 animate-pulse">LOADING FEED...</div>}
                        </div>
                    </div>

                    <div className="bg-[#0f0f0f] rounded-2xl border border-white/5 p-4 relative overflow-hidden group h-[160px] flex flex-col">
                        <h4 className="text-[10px] font-bold mb-2 text-gray-400 flex items-center gap-2 uppercase tracking-wider z-10">
                            <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                            Attendance Graph
                        </h4>
                        <div className="flex items-end justify-between gap-0.5 h-full pt-2 relative z-10 w-full">
                            {!loadingHistory && historyData.map((day, i) => (
                                <div key={i} className="flex-1 flex flex-col justify-end items-center group/tooltip relative h-full">
                                    <div className={`w-full max-w-[4px] rounded-t-sm transition-all duration-300 ${day.attendance === 'present' ? 'h-[70%] bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]' :
                                        day.attendance === 'absent' ? 'h-[20%] bg-red-900/50' : 'h-px bg-white/5'
                                        }`} />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* --- DETAILED RECORDS & DOCUMENTATION (Full Width) --- */}
                <div className="lg:col-span-3 bg-[#0f0f0f] rounded-2xl border border-white/5 overflow-hidden flex flex-col shadow-2xl relative">
                    <div className="p-4 border-b border-white/5 bg-black/40 backdrop-blur-md flex justify-between items-center z-10 sticky top-0">
                        <h4 className="text-xs font-bold flex items-center gap-3 text-white uppercase tracking-wider">
                            <div className="p-1.5 bg-primary/10 rounded-lg text-primary">
                                <Activity className="w-4 h-4" />
                            </div>
                            Daily Productivity & Attendance Log
                        </h4>
                    </div>

                    <div className="p-4 md:p-6 overflow-y-auto max-h-[400px] custom-scrollbar relative z-0 space-y-4">
                        {[...historyData].reverse().map((day, i) => (
                            <div key={i} className="flex items-start gap-4 p-4 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                                <div className={`mt-1 w-2 h-2 rounded-full ${day.attendance === 'present' ? 'bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]' :
                                    'bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.5)]'
                                    }`} />
                                <div className="flex-grow">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-mono text-sm text-gray-300">{day.date}</span>
                                        <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-wider ${day.attendance === 'present' ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'
                                            }`}>
                                            {day.attendance}
                                        </span>
                                    </div>

                                    {day.tasks > 0 ? (
                                        <div className="space-y-2">
                                            {day.task_details && day.task_details.map((t, idx) => (
                                                <div key={idx} className="flex items-center gap-2 text-xs text-gray-400">
                                                    <CheckCircle className="w-3 h-3 text-blue-500" />
                                                    <span className="text-gray-300">{t.title}</span>
                                                    {t.project_title && <span className="text-[9px] px-1.5 py-0.5 bg-white/5 rounded text-gray-500 uppercase">{t.project_title}</span>}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-xs text-gray-600 italic">No tasks recorded for this day.</div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {historyData.length === 0 && (
                            <div className="text-center py-8 text-gray-500 text-xs">No historical data available.</div>
                        )}
                    </div>
                </div>
            </div>
        </motion.div >
    );
}

function StatCard({ icon: Icon, label, value, subtext, color = "text-primary", glow = "primary", delay = 0 }) {
    const glowColors = {
        primary: "shadow-[0_0_15px_rgba(139,92,246,0.1)] border-primary/20",
        blue: "shadow-[0_0_15px_rgba(59,130,246,0.1)] border-blue-500/20",
        yellow: "shadow-[0_0_15px_rgba(234,179,8,0.1)] border-yellow-500/20",
        emerald: "shadow-[0_0_15px_rgba(16,185,129,0.1)] border-emerald-500/20",
    };

    const iconColors = {
        primary: "bg-primary/10 text-primary",
        blue: "bg-blue-500/10 text-blue-500",
        yellow: "bg-yellow-500/10 text-yellow-500",
        emerald: "bg-emerald-500/10 text-emerald-500",
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: delay }}
            className={`bg-[#0f0f0f] p-4 rounded-xl border flex flex-col justify-between hover:border-white/20 transition-all duration-300 group relative overflow-hidden ${glowColors[glow] || glowColors.primary}`}
        >
            <div className="absolute inset-0 bg-white/[0.02] opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-start justify-between mb-2 relative z-10">
                <div className={`p-2 rounded-lg ${iconColors[glow] || iconColors.primary}`}>
                    <Icon className="w-4 h-4" />
                </div>
            </div>

            <div className="relative z-10">
                <div className="text-2xl font-bold text-white tracking-tight mb-0.5">{value}</div>
                <div className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{label}</div>
            </div>
        </motion.div>
    );
}

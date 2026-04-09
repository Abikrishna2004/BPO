import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { CheckCircle, Clock, Calendar, ChevronDown, Activity, Trophy, Award, Lock, BarChart3, ArrowLeft, Zap, Shield, UserCog, UserCheck, ChevronRight, Briefcase, Share2, Monitor, GraduationCap, DollarSign, SignalHigh } from 'lucide-react';
import { CustomSelect, CustomRoleSelect } from '../components/CustomDropdowns';
import WorkforceAnalyticsHUD from '../components/WorkforceAnalyticsHUD';

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
            // Filter out admins from the list as requested
            const agentsOnly = response.data.filter(u => u.role !== 'admin' && u.username !== 'Admin@CJ');
            setAgents(agentsOnly);
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
                api.get(`/users/${agentId}/achievements`),
                api.get(`/performance/${agentId}/history`),
                api.get(`/tasks/user/${agentId}`)
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
            await api.put(`/users/${selectedAgentId}/promote`, { role: selectedRole });

            // Optimistic Update
            setAgents(prev => prev.map(a => a.id === selectedAgentId ? { ...a, role: selectedRole } : a));

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
            await api.put(`/users/${selectedAgentId}/promote`, { salary: parseFloat(salaryInput) });

            // Optimistic Update
            setAgents(prev => prev.map(a => a.id === selectedAgentId ? { ...a, salary: parseFloat(salaryInput) } : a));

            alert(`Salary updated to: ₹ ${salaryInput} LPA`);
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
            const agent = agents.find(a => a.id === selectedAgentId);
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
            roles: ["Agent", "Senior Agent", "Lead Agent", "Supervisor", "Manager"]
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
            {/* --- PERSONNEL MANAGEMENT CONSOLE (UNIFIED) --- */}
            {isAdmin && (
                <div className="max-w-7xl mx-auto mb-16 relative z-50">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-[#0a0a0b] border border-white/10 rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative overflow-visible"
                    >
                        {/* Decorative HUD Elements */}
                        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                            <Shield className="w-48 h-48 text-blue-500" />
                        </div>
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />

                        <div className="flex items-center gap-4 mb-10 border-b border-white/5 pb-8">
                            <div className="p-3 bg-blue-500/10 rounded-2xl border border-blue-500/20">
                                <UserCog className="w-6 h-6 text-blue-400" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black uppercase tracking-tight text-white flex items-center gap-3">
                                    Personnel Management Console
                                    <span className="text-[10px] px-2 py-0.5 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-full font-mono font-bold tracking-[0.2em] animate-pulse">System Active</span>
                                </h3>
                                <p className="text-[10px] text-white/30 font-mono uppercase tracking-widest mt-1">Configure asset designation and compensation hierarchy</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 relative z-20">
                            {/* Directive 01: Agent */}
                            <div className="space-y-4 relative z-40">
                                <div className="flex items-center gap-2">
                                    <span className="text-[8px] font-black text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20 uppercase tracking-widest">Directive 01</span>
                                    <label className="text-[10px] uppercase text-white/40 font-black tracking-widest">Select Agent</label>
                                </div>
                                <CustomSelect
                                    options={agents.map(a => ({ value: a.id, label: a.username, sub: a.role }))}
                                    value={selectedAgentId}
                                    onChange={setSelectedAgentId}
                                    placeholder="Choose Agent..."
                                    icon={UserCheck}
                                />
                            </div>

                            {/* Directive 02: Designation */}
                            <div className="space-y-4 relative z-40">
                                <div className="flex items-center gap-2">
                                    <span className="text-[8px] font-black text-purple-500 bg-purple-500/10 px-2 py-0.5 rounded-md border border-purple-500/20 uppercase tracking-widest">Directive 02</span>
                                    <label className="text-[10px] uppercase text-white/40 font-black tracking-widest">New Designation</label>
                                </div>
                                <CustomRoleSelect
                                    categories={roleCategories}
                                    value={selectedRole}
                                    onChange={setSelectedRole}
                                    placeholder="Select Role..."
                                    centered={false}
                                    placement="bottom"
                                />
                                <button
                                    onClick={handleGlobalRoleUpdate}
                                    disabled={updatingRole || !selectedAgentId || !selectedRole}
                                    className={`w-full py-4 rounded-xl font-bold text-[11px] uppercase tracking-widest transition-all flex items-center justify-center gap-3 border ${selectedAgentId && selectedRole
                                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-900/40 border-purple-400/30'
                                        : 'bg-white/5 text-white/10 border-white/5 cursor-not-allowed'
                                        }`}
                                >
                                    {updatingRole ? <Activity className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                                    {updatingRole ? 'Updating' : 'Apply Role'}
                                </button>
                            </div>

                            {/* Directive 03: Compensation */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-[8px] font-black text-green-500 bg-green-500/10 px-2 py-0.5 rounded-md border border-green-500/20 uppercase tracking-widest">Directive 03</span>
                                    <label className="text-[10px] uppercase text-white/40 font-black tracking-widest">LPA Value</label>
                                </div>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/10 font-bold">₹</span>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={salaryInput}
                                        onChange={(e) => setSalaryInput(e.target.value)}
                                        className="w-full bg-white/5 text-white border border-white/10 rounded-xl px-5 py-3.5 pl-8 focus:outline-none focus:border-green-500/40 transition-all font-mono"
                                        placeholder="0.0"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 text-[10px] uppercase font-bold tracking-tighter">LPA</span>
                                </div>
                                <button
                                    onClick={handleSalaryUpdate}
                                    disabled={updatingSalary || !selectedAgentId}
                                    className={`w-full py-4 rounded-xl font-bold text-[11px] uppercase tracking-widest transition-all flex items-center justify-center gap-3 border ${selectedAgentId
                                        ? 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white shadow-lg shadow-emerald-900/40 border-emerald-400/30'
                                        : 'bg-white/5 text-white/10 border-white/5 cursor-not-allowed'
                                        }`}
                                >
                                    {updatingSalary ? <Activity className="w-4 h-4 animate-spin text-white" /> : <DollarSign className="w-4 h-4" />}
                                    {updatingSalary ? 'Calibrating' : 'Set Salary'}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}

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
                                    apiBaseUrl={api.defaults.baseURL}
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
    // Performance score is directly from backend's performance_score (XP)
    const performanceScore = agent.performance_score || 0;
    
    // Efficiency is level (e.g., 26.0)
    // Progress is XP % 100
    const efficiency = agent.efficiency || 25;
    const level = Math.floor(efficiency);
    const progress = performanceScore % 100;

    return { performanceScore, efficiency, progress, level };
}

function getAttendanceColor(rate) {
    if (rate >= 95) return 'text-emerald-400';
    if (rate >= 80) return 'text-yellow-400';
    return 'text-red-400';
}

function StatsDetailPanel({ agent, achievements, historyData, loadingHistory, metrics, employeeTasks, parseAttachments, apiBaseUrl }) {

    return (
        <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-white/10 bg-[#080808] relative z-0 shadow-inner overflow-hidden"
        >
            <div className="p-10">
                <WorkforceAnalyticsHUD 
                    targetUser={agent}
                    perfData={{
                        efficiency: metrics.efficiency,
                        attendance_rate: agent.attendance_rate,
                        completed_tasks: agent.completed_tasks
                    }}
                    tasksData={employeeTasks}
                    getAvatarUrl={(path) => path ? `${apiBaseUrl.replace('/api', '')}/uploads/${path}` : null}
                    completeTask={() => {}}
                    isAdminView={true}
                />
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

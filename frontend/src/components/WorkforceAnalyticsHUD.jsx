import React, { useEffect } from 'react';
import { motion, useMotionValue, useTransform, animate, AnimatePresence } from 'framer-motion';
import { Activity, Trophy, Zap, Lock, Clock, CheckCircle, Target, Cpu, BarChart3, ChevronRight, Fingerprint } from 'lucide-react';

const AnimatedCounter = ({ value, duration = 2 }) => {
    const count = useMotionValue(0);
    const rounded = useTransform(count, (latest) => Math.round(latest));

    useEffect(() => {
        const controls = animate(count, value, { duration });
        return controls.stop;
    }, [value, count, duration]);

    return <motion.span>{rounded}</motion.span>;
};

const WorkforceAnalyticsHUD = ({ 
    targetUser, 
    perfData, 
    tasksData = [], 
    getAvatarUrl, 
    completeTask, 
    isAdminView = false 
}) => {
    const efficiency = perfData?.efficiency || 0;
    const completed = perfData?.completed_tasks || 0;
    const pending = tasksData.filter(t => t.status === 'pending').length;
    
    const progress = Math.round((efficiency % 1) * 100);
    const level = Math.floor(efficiency);

    return (
        <div className="flex flex-col gap-6 w-full font-sans text-white max-w-[1400px] mx-auto animate-in fade-in zoom-in-95 duration-1000">
            {/* --- COMPACT IDENTITY STRIP --- */}
            <div className="bg-[#0a0a0b]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 flex flex-col md:flex-row justify-between items-center gap-6 shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-transparent pointer-events-none" />
                
                <div className="flex items-center gap-6 relative z-10 w-full md:w-auto">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-900 p-0.5 shadow-xl">
                        <div className="w-full h-full rounded-[0.9rem] bg-black flex items-center justify-center text-2xl font-black overflow-hidden relative">
                            {targetUser?.profile_photo ? (
                                <img src={getAvatarUrl(targetUser.profile_photo)} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <span>{targetUser?.username?.slice(0,1)}</span>
                            )}
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl font-black uppercase tracking-tight">{targetUser?.username}</h2>
                            <div className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded-md text-[8px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-1.5">
                                <Fingerprint className="w-2.5 h-2.5" /> {targetUser?.role}
                            </div>
                        </div>
                        <p className="text-[10px] text-white/30 font-mono uppercase tracking-[0.2em] mt-1 italic">
                            System Operational <span className="text-blue-500/40">//</span> sector sync verified
                        </p>
                    </div>
                </div>

                <div className="flex bg-black/40 border border-white/5 rounded-2xl p-4 gap-8 min-w-full md:min-w-0 justify-around md:justify-end">
                    <div className="flex flex-col items-center">
                        <span className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">Operational Level</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-xl font-black text-white">{level}</span>
                            <span className="text-[9px] font-mono text-blue-500">+{progress}%</span>
                        </div>
                    </div>
                    <div className="w-px h-8 bg-white/10" />
                    <div className="flex flex-col items-center">
                        <span className="text-[8px] font-black text-white/20 uppercase tracking-widest mb-1">Sync Status</span>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-tighter">Active</span>
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_#10b981]" />
                        </div>
                    </div>
                </div>
            </div>

            {/* --- TELEMETRY MODULES (Smaller Boxes) --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* 1. Efficiency Hub */}
                <div className="bg-[#0a0a0b] border border-white/10 rounded-3xl p-8 relative overflow-hidden group shadow-xl h-[300px] flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <Cpu className="w-4 h-4 text-blue-500" />
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30">Efficiency Hub</span>
                        </div>
                        <span className="text-[9px] font-mono text-blue-400 font-bold tracking-tighter">LVL {level} SYNC</span>
                    </div>

                    <div className="flex items-center justify-center flex-1">
                        <div className="text-6xl font-black tracking-tighter leading-none text-white drop-shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                            <AnimatedCounter value={level} />
                            <span className="text-2xl text-blue-500/30 ml-2">%</span>
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between text-[8px] font-black uppercase truncate tracking-widest mb-2 text-white/20">
                            <span>Sector Calibration</span>
                            <span className="text-blue-500">Next Level: {progress}%</span>
                        </div>
                        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                className="h-full bg-gradient-to-r from-blue-600 to-cyan-400"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-6">
                            <div className="text-center bg-white/[0.02] border border-white/5 py-2 rounded-xl">
                                <span className="block text-lg font-black text-white">{completed}</span>
                                <span className="text-[7px] font-black text-white/20 uppercase">Delivered</span>
                            </div>
                            <div className="text-center bg-white/[0.02] border border-white/5 py-2 rounded-xl">
                                <span className="block text-lg font-black text-blue-500">{pending}</span>
                                <span className="text-[7px] font-black text-white/20 uppercase">Pending</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Persistence Grid */}
                <div className="bg-[#0a0a0b] border border-white/10 rounded-3xl p-8 shadow-xl flex flex-col relative overflow-hidden h-[300px]">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-emerald-500" />
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30">Persistence</span>
                        </div>
                        <span className="text-xl font-black text-emerald-400 tabular-nums">{perfData?.attendance_rate || 0}%</span>
                    </div>
                    
                    <div className="flex-1 flex flex-col justify-end">
                        <div className="flex items-end gap-1.5 h-32 mb-4 group/graph">
                            {[40, 75, 52, 90, 68, 85, 95].map((h, i) => {
                                const today = new Date().getDay(); // 0 is Sunday, 1 is Mon...
                                const currentDayIndex = today === 0 ? 6 : today - 1; // Map to M-S (0-6)
                                return (
                                    <motion.div 
                                        key={i}
                                        initial={{ height: 0 }}
                                        animate={{ height: `${h}%` }}
                                        className={`flex-1 rounded-t-md transition-all duration-300 ${i === currentDayIndex ? 'bg-emerald-500/50 shadow-[0_0_10px_#10b981]' : 'bg-white/5 border-t border-white/10 group-hover/graph:bg-white/10'}`}
                                    />
                                );
                            })}
                        </div>
                        <div className="flex justify-between font-mono text-[8px] text-white/20 font-black px-1">
                            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map(d => <span key={d}>{d}</span>)}
                        </div>
                    </div>
                </div>

                {/* 3. Vault & Security */}
                <div className="bg-[#0a0a0b] border border-white/10 rounded-3xl p-8 flex flex-col h-[300px] shadow-xl">
                    <div className="flex justify-between items-center mb-8">
                        <div className="flex items-center gap-2">
                            <Trophy className="w-4 h-4 text-amber-500" />
                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30">Vault Access</span>
                        </div>
                        <span className="text-[8px] px-2 py-0.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full font-black tracking-widest">0 UNLOCKED</span>
                    </div>
                    <div className="flex-1 border border-dashed border-white/10 rounded-[2rem] flex flex-col items-center justify-center bg-white/[0.01] hover:bg-white/[0.03] transition-colors relative group">
                        <Lock className="w-8 h-8 text-white/5 mb-4 group-hover:text-amber-500/10 transition-colors" />
                        <span className="text-[9px] font-black text-white/10 uppercase tracking-[0.5em] group-hover:text-amber-500/30 transition-colors">Vault Encrypted</span>
                    </div>
                    <p className="text-[8px] text-white/20 font-mono text-center mt-6 uppercase tracking-widest italic leading-relaxed px-4">
                        Perform mission critical directives to unlock achievement nodes.
                    </p>
                </div>
            </div>

            {/* --- PIPELINE SECTION (Tightened) --- */}
            <div className="bg-gradient-to-br from-[#0a0a0b] to-[#111112] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10 pb-6 border-b border-white/5">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center text-blue-500 shadow-inner">
                            <Target className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="text-lg font-black uppercase tracking-tight">Directives</h4>
                            <p className="text-[9px] text-white/20 font-mono uppercase tracking-widest mt-0.5">Session Pipeline // {pending} active syncs</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4 bg-black/40 px-6 py-2 rounded-2xl border border-white/5 self-end">
                        <div className="text-right">
                            <span className="block text-[7px] font-black text-white/10 uppercase tracking-widest">Delivered</span>
                            <span className="text-lg font-black text-white leading-none">{completed}</span>
                        </div>
                        <div className="w-px h-6 bg-white/10" />
                        <div className="text-right">
                            <span className="block text-[7px] font-black text-white/10 uppercase tracking-widest">Active</span>
                            <span className="text-lg font-black text-blue-500 leading-none">{pending}</span>
                        </div>
                    </div>
                </div>

                {/* Directive Cards (Smaller) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    <AnimatePresence mode="popLayout">
                        {tasksData.filter(t => t.status === 'pending').length > 0 ? (
                            tasksData.filter(t => t.status === 'pending').map((activeTask, idx) => (
                                <motion.div
                                    layout
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.98 }}
                                    key={activeTask.id}
                                    className="bg-[#0c0c0d] border border-white/10 p-6 rounded-2xl hover:border-blue-500/30 transition-all group/task flex flex-col justify-between shadow-lg relative"
                                >
                                    <div className="absolute top-4 right-4 text-white/5 group-hover/task:text-blue-500/20 transition-colors">
                                        <ChevronRight className="w-4 h-4" />
                                    </div>
                                    
                                    <div>
                                        <div className="flex items-center gap-2 mb-4">
                                            <span className="text-[7px] font-black text-blue-400 bg-blue-500/10 px-2 py-1 rounded-md border border-blue-500/20 uppercase tracking-widest italic">Phase 0{idx + 1}</span>
                                            <span className="text-white/10 font-mono text-[8px]">#{activeTask.id?.toString().slice(-4).toUpperCase()}</span>
                                        </div>
                                        <h5 className="text-md font-black text-white mb-2 group-hover/task:text-blue-400 transition-colors uppercase leading-snug">{activeTask.title}</h5>
                                        <p className="text-[10px] text-white/30 leading-relaxed mb-6 line-clamp-2 italic font-medium">"{activeTask.description}"</p>
                                    </div>

                                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
                                        <div className="flex flex-col">
                                            <span className="text-[7px] font-black text-white/20 uppercase tracking-widest mb-1">Due Matrix</span>
                                            <span className="text-[9px] font-mono font-bold text-gray-400">
                                                {activeTask.deadline ? new Date(activeTask.deadline).toLocaleDateString() : 'REALTIME'}
                                            </span>
                                        </div>
                                        <Clock className="w-3.5 h-3.5 text-white/5" />
                                    </div>

                                    <button
                                        onClick={() => completeTask(activeTask.id)}
                                        disabled={isAdminView}
                                        className={`w-full py-4 rounded-xl ${isAdminView ? 'bg-white/5 text-white/10 cursor-not-allowed border border-white/5' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-xl'} text-[9px] font-black uppercase tracking-[0.25em] transition-all flex items-center justify-center gap-2 active:scale-[0.98]`}
                                    >
                                        <CheckCircle className="w-3.5 h-3.5" /> 
                                        <span>{isAdminView ? 'Verification Required' : 'Transmit Record'}</span>
                                    </button>
                                </motion.div>
                            ))
                        ) : (
                            <div className="col-span-full flex flex-col items-center justify-center py-12 border-2 border-dashed border-white/5 rounded-3xl bg-white/[0.01]">
                                <Activity className="w-10 h-10 text-white/5 mb-4 animate-pulse" />
                                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/10">Standby Mode</span>
                                <p className="text-[8px] text-white/5 font-mono mt-2 uppercase tracking-widest text-center px-12">Waiting for primary command directives</p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default WorkforceAnalyticsHUD;


file_path = r"c:\Users\ACER\OneDrive\Desktop\BPO\frontend\src\pages\Dashboard.jsx"

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Indentation for readability
indent = " " * 24 # Standard indent deep in component
nl = "\n"

# The new content to insert
new_content_str = r'''                        <div className="col-span-1 md:col-span-3 h-full min-h-[60vh] flex flex-col gap-6">
                            {performance ? (() => {
                                // Metric Calculations
                                const efficiency = performance.efficiency || 0;
                                const pendingCount = tasks.filter(t => t.status === 'pending').length;
                                const completedCount = performance.completed_tasks;
                                
                                // Prepare History Data for Graph
                                const graphData = myHistory.map(h => ({
                                    date: new Date(h.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                                    tasks: h.tasks,
                                    status: h.attendance === 'present' ? 1 : 0
                                })).reverse(); // Show oldest to newest

                                return (
                                    <>
                                        {/* 1. Summary Cards Row */}
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                            {/* Performance Score */}
                                            <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} transition={{delay:0.1}} className="bg-black/40 border border-white/10 p-5 rounded-2xl relative overflow-hidden group hover:border-blue-500/30 transition-colors">
                                                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity"><Activity size={40} className="text-blue-500"/></div>
                                                <h3 className="text-gray-400 text-xs uppercase tracking-wider font-semibold mb-1">Performance Score</h3>
                                                <div className="text-3xl font-bold text-white flex items-end gap-2">
                                                    <AnimatedCounter value={performance.performance_score} />
                                                    <span className="text-sm text-gray-500 mb-1">/100</span>
                                                </div>
                                                <div className="w-full bg-gray-800 h-1 mt-3 rounded-full overflow-hidden">
                                                    <motion.div initial={{width:0}} animate={{width:`${performance.performance_score}%`}} className="h-full bg-blue-500 shadow-[0_0_10px_#3b82f6]"/>
                                                </div>
                                            </motion.div>

                                            {/* Tasks Completed (Total) */}
                                            <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} transition={{delay:0.2}} className="bg-black/40 border border-white/10 p-5 rounded-2xl relative overflow-hidden group hover:border-green-500/30 transition-colors">
                                                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity"><CheckCircle size={40} className="text-green-500"/></div>
                                                <h3 className="text-gray-400 text-xs uppercase tracking-wider font-semibold mb-1">Total Completed</h3>
                                                <div className="text-3xl font-bold text-white"><AnimatedCounter value={completedCount} /></div>
                                                <div className="text-xs text-green-400 mt-2 flex items-center gap-1">
                                                    <span>Tasks Assigned & Done</span>
                                                </div>
                                            </motion.div>

                                            {/* Pending Tasks */}
                                            <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} transition={{delay:0.3}} className="bg-black/40 border border-white/10 p-5 rounded-2xl relative overflow-hidden group hover:border-yellow-500/30 transition-colors">
                                                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity"><Clock size={40} className="text-yellow-500"/></div>
                                                <h3 className="text-gray-400 text-xs uppercase tracking-wider font-semibold mb-1">Pending Tasks</h3>
                                                <div className="text-3xl font-bold text-white"><AnimatedCounter value={pendingCount} /></div>
                                                <div className="text-xs text-yellow-400 mt-2">Needs Attention</div>
                                            </motion.div>

                                            {/* Efficiency/Attendance */}
                                            <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} transition={{delay:0.4}} className="bg-black/40 border border-white/10 p-5 rounded-2xl relative overflow-hidden group hover:border-purple-500/30 transition-colors">
                                                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity"><Zap size={40} className="text-purple-500"/></div>
                                                <h3 className="text-gray-400 text-xs uppercase tracking-wider font-semibold mb-1">Efficiency</h3>
                                                <div className="text-3xl font-bold text-white">{efficiency}%</div>
                                                <div className="text-xs text-purple-400 mt-2">Attendance: {performance.attendance_rate}%</div>
                                            </motion.div>
                                        </div>

                                        {/* 2. Main Content Grid */}
                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full flex-1 min-h-[400px]">
                                            
                                            {/* Left: Productivity Trend Graph */}
                                            <motion.div initial={{opacity:0, x:-20}} animate={{opacity:1, x:0}} transition={{delay:0.5}} className="lg:col-span-2 bg-black/40 border border-white/10 rounded-2xl p-6 flex flex-col">
                                                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                                                    <span className="text-blue-500">📈</span> Work Improvement & Productivity
                                                </h3>
                                                <div className="flex-1 w-full min-h-[300px]">
                                                    {graphData.length > 0 ? (
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <AreaChart data={graphData}>
                                                                <defs>
                                                                    <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                                                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                                                    </linearGradient>
                                                                </defs>
                                                                <XAxis dataKey="date" stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} />
                                                                <YAxis stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
                                                                <Tooltip 
                                                                    contentStyle={{ backgroundColor: '#000', borderColor: '#333', color: '#fff' }}
                                                                    itemStyle={{ color: '#3b82f6' }}
                                                                />
                                                                <Area type="monotone" dataKey="tasks" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorTasks)" />
                                                            </AreaChart>
                                                        </ResponsiveContainer>
                                                    ) : (
                                                        <div className="h-full flex items-center justify-center text-gray-500 italic">No history data available yet.</div>
                                                    )}
                                                </div>
                                            </motion.div>

                                            {/* Right: Current Focus / Task List */}
                                            <motion.div initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} transition={{delay:0.6}} className="lg:col-span-1 bg-black/40 border border-white/10 rounded-2xl p-6 flex flex-col">
                                                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                                    <span className="text-yellow-500">⚡</span> Current Focus
                                                </h3>
                                                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2 max-h-[400px]">
                                                    {tasks.filter(t => t.status === 'pending').length === 0 ? (
                                                        <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 italic py-10">
                                                            <CheckCircle size={40} className="mb-4 text-green-500/20" />
                                                            <span>No pending tasks.<br/>Great job!</span>
                                                        </div>
                                                    ) : (
                                                        tasks.filter(t => t.status === 'pending').map((task, idx) => (
                                                            <div key={task.id} className="bg-white/5 p-4 rounded-xl border border-white/5 hover:border-yellow-500/30 transition-all group">
                                                                <div className="flex justify-between items-start mb-2">
                                                                    <span className="text-[10px] font-mono text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20">PRIORITY</span>
                                                                    {task.deadline && <span className="text-[10px] text-gray-400">{new Date(task.deadline).toLocaleDateString()}</span>}
                                                                </div>
                                                                <h4 className="text-sm font-semibold text-white mb-1 group-hover:text-yellow-400 transition-colors">{task.title}</h4>
                                                                <p className="text-xs text-gray-500 line-clamp-2 mb-3">{task.description || "No description provided."}</p>
                                                                <button 
                                                                    onClick={() => { setActiveTask(task); setShowCompleteModal(true); }}
                                                                    className="w-full py-2 bg-white/5 hover:bg-green-500/20 text-gray-300 hover:text-green-400 text-xs font-bold uppercase tracking-wider rounded transition-colors border border-white/10 hover:border-green-500/30"
                                                                >
                                                                    Mark Complete
                                                                </button>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </motion.div>
                                        </div>
                                    </>
                                );
                            })() : (
                                <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                                    <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                    <div className="text-blue-400 text-xs font-mono animate-pulse tracking-widest">LOADING DASHBOARD...</div>
                                </div>
                            )}
                        </div>
'''

# Identify indices (1014-1226 1-indexed -> 1013-1225 0-indexed)
start_idx = 1013
end_idx = 1225

print(f"Replacing lines {start_idx+1}-{end_idx+1}")
print(f"Old Start: {lines[start_idx].strip()}")
print(f"Old End: {lines[end_idx].strip()}")

# Replace
new_lines = lines[:start_idx] + [new_content_str + "\n"] + lines[end_idx+1:]

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)
    
print("Successfully updated Employee Dashboard.")

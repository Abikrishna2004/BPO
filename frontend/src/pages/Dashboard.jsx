import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { CustomSelect } from '../components/CustomDropdowns';
import { Activity, FileUp, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, YAxis } from 'recharts';

const TypingText = ({ text, className }) => {
    const letters = Array.from(text);
    return (
        <motion.span className={className}>
            {letters.map((letter, index) => (
                <motion.span
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.1, delay: index * 0.05 }}
                >
                    {letter}
                </motion.span>
            ))}
        </motion.span>
    );
};

const AnimatedCounter = ({ value, duration = 2 }) => {
    const count = useMotionValue(0);
    const rounded = useTransform(count, Math.round);

    useEffect(() => {
        const controls = animate(count, value, { duration: duration });
        return controls.stop;
    }, [value]);

    return <motion.span>{rounded}</motion.span>;
};

const AnimatedBackground = () => (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
        <motion.div
            animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 45, 0],
                opacity: [0.3, 0.5, 0.3]
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute -top-[10%] -left-[10%] w-[60vw] h-[60vw] bg-purple-600/10 rounded-full blur-[120px]"
        />
        <motion.div
            animate={{
                scale: [1, 1.1, 1],
                x: [0, 50, 0],
                opacity: [0.2, 0.4, 0.2]
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            className="absolute top-[20%] right-[-10%] w-[50vw] h-[50vw] bg-blue-600/10 rounded-full blur-[100px]"
        />
        <motion.div
            animate={{
                y: [0, -50, 0],
                scale: [1, 1.3, 1],
                opacity: [0.1, 0.3, 0.1]
            }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-[-10%] left-[30%] w-[40vw] h-[40vw] bg-cyan-600/10 rounded-full blur-[140px]"
        />
    </div>
);

const Spotlight = () => {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    useEffect(() => {
        const handleMouseMove = ({ clientX, clientY }) => {
            mouseX.set(clientX);
            mouseY.set(clientY);
        };
        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, []);

    return (
        <motion.div
            className="fixed inset-0 pointer-events-none z-50"
            style={{
                background: useTransform(
                    [mouseX, mouseY],
                    ([x, y]) => `radial-gradient(600px at ${x}px ${y}px, rgba(29, 78, 216, 0.15), transparent 80%)`
                )
            }}
        />
    );
};

const TiltCard = ({ children, className, ...props }) => {
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const rotateX = useTransform(y, [-100, 100], [5, -5]);
    const rotateY = useTransform(x, [-100, 100], [-5, 5]);

    function handleMouseMove(event) {
        const rect = event.currentTarget.getBoundingClientRect();
        x.set(event.clientX - rect.left - rect.width / 2);
        y.set(event.clientY - rect.top - rect.height / 2);
    }

    function handleMouseLeave() {
        x.set(0);
        y.set(0);
    }

    return (
        <motion.div
            style={{
                rotateX,
                rotateY,
                transformStyle: "preserve-3d"
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className={className}
            {...props}
        >
            <div
                style={{ transform: "translateZ(20px)" }}
                className="h-full w-full"
            >
                {children}
            </div>
        </motion.div>
    );
};

export default function Dashboard() {
    const { user, logout, api } = useAuth();
    const navigate = useNavigate();
    const [messages, setMessages] = useState([]);
    const [ws, setWs] = useState(null);
    const [agents, setAgents] = useState([]);      // For Admins
    const [attendance, setAttendance] = useState([]); // For Admins
    const [myAttendance, setMyAttendance] = useState(null); // For Employees
    const [myAttendanceHistory, setMyAttendanceHistory] = useState([]); // For Employees (Graph)
    const [bonusAmount, setBonusAmount] = useState(1000); // Admin Setting
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportSummary, setReportSummary] = useState("");

    useEffect(() => {
        const socket = new WebSocket(import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws');

        socket.onopen = () => {
            console.log('Connected to Realtime Stream');
        };

        socket.onmessage = (event) => {
            const newMsg = {
                message: event.data,
                created_at: new Date().toISOString(),
                id: Date.now() // temporary ID for consistent keying
            };
            setMessages(prev => {
                // Prevent duplicate real-time messages if they come too fast
                if (prev.length > 0 && prev[0].message === newMsg.message &&
                    (new Date(newMsg.created_at) - new Date(prev[0].created_at) < 2000)) {
                    return prev;
                }
                return [newMsg, ...prev].slice(0, 50);
            });
        };

        socket.onclose = () => {
            console.log('Disconnected from Stream');
        };

        setWs(socket);

        return () => {
            socket.close();
        };
    }, []);

    const [performance, setPerformance] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [newTaskTitle, setNewTaskTitle] = useState("");
    const [newTaskDesc, setNewTaskDesc] = useState("");
    const [newTaskDeadline, setNewTaskDeadline] = useState("");
    const [selectedAgentId, setSelectedAgentId] = useState("");

    useEffect(() => {
        const loadData = () => {
            if (document.hidden) return; // Don't poll if tab is hidden
            if (user?.role === 'admin') {
                fetchAgents();
                fetchLogs();
                fetchSettings();
            } else {
                fetchAttendance();
                fetchPerformance();
                fetchTasks();

            }
        };

        loadData(); // Initial load
        const interval = setInterval(loadData, 15000); // Poll every 15 seconds (reduced from 5s to prevent log spam)

        return () => clearInterval(interval);
    }, [user?.role, user?.id]);

    const fetchAgents = async () => {
        try {
            const res = await api.get('/dashboard/agents');
            setAgents(res.data);
            if (res.data.length > 0) setSelectedAgentId(res.data[0].id);
            fetchAttendance();
        } catch (error) { console.error(error); }
    };

    const fetchSettings = async () => {
        try {
            const res = await api.get('/settings');
            const bonus = res.data.find(s => s.key === 'performance_bonus_amount');
            if (bonus) setBonusAmount(bonus.value);
        } catch (e) { console.error(e); }
    };

    const updateSettings = async () => {
        try {
            await api.post('/settings', { key: 'performance_bonus_amount', value: bonusAmount.toString() });
            alert("System Settings Updated");
        } catch (e) { alert("Failed to update settings"); }
    };



    const fetchPerformance = async () => {
        try {
            const res = await api.get(`/performance/${user.id}`);
            setPerformance(res.data);
        } catch (error) { console.error(error); }
    };

    const fetchTasks = async () => {
        try {
            const res = await api.get('/tasks/my');
            setTasks(res.data);
        } catch (error) { console.error(error); }
    };

    const fetchLogs = async () => {
        try {
            const res = await api.get('/logs');
            // Store full log objects
            setMessages(res.data);
        } catch (error) { console.error(error); }
    };

    const fetchAttendance = async () => {
        try {
            const res = await api.get('/attendance');
            if (user?.role === 'admin') setAttendance(res.data);
            else if (res.data.length > 0) {
                setMyAttendance(res.data[0]);
                setMyAttendanceHistory(res.data.slice(0, 7).reverse()); // Last 7 records
            }
        } catch (error) { console.error(error); }
    };

    const markAttendance = async (userId, status) => {
        try {
            await api.post('/attendance', { user_id: userId, status });
            // alert(`Attendance Marked: ${status.toUpperCase()}`);
            await fetchAttendance();
            await fetchAgents();
        } catch (error) {
            console.error("Failed", error);
            alert("Failed to mark attendance.");
        }
    };

    const assignTask = async (e) => {
        e.preventDefault();
        try {
            await api.post('/tasks', {
                title: newTaskTitle,
                description: newTaskDesc,
                agent_id: selectedAgentId,
                deadline: newTaskDeadline ? new Date(newTaskDeadline).toISOString() : null
            });
            alert("Task Assigned");
            setNewTaskTitle(""); setNewTaskDesc(""); setNewTaskDeadline("");
        } catch (error) { alert("Failed to assign task"); }
    };

    const [viewingHistory, setViewingHistory] = useState(null); // User ID for history modal
    const [historyTasks, setHistoryTasks] = useState([]);
    const [historyLogs, setHistoryLogs] = useState([]);

    const completeTask = async (taskId) => {
        const notes = prompt("Enter completion notes/report:");
        if (notes === null) return; // Cancelled
        try {
            await api.put(`/tasks/${taskId}/complete`, { notes });
            fetchTasks();
            fetchPerformance();
        } catch (error) { alert("Failed to complete task"); }
    };

    const deleteUser = async (userId) => {
        if (!window.confirm("Delete agent?")) return;
        await api.delete(`/users/${userId}`);
        fetchAgents();
    };

    const changePassword = async (userId) => {
        const newPw = prompt("New password:");
        if (newPw) await api.put(`/users/${userId}/password`, { new_password: newPw });
    };

    const getAgentAttendanceStatus = (userId) => {
        const record = attendance.find(a => a.user_id === userId);
        return record ? record.status : 'Not Marked';
    };

    const viewHistory = async (userId) => {
        if (viewingHistory === userId) {
            setViewingHistory(null); // Toggle off
            setHistoryTasks([]); // Clear
            setHistoryLogs([]); // Clear
            return;
        }
        try {
            const [resTasks, resLogs] = await Promise.all([
                api.get(`/tasks/user/${userId}`),
                api.get(`/logs?user_id=${userId}`)
            ]);
            setHistoryTasks(resTasks.data);
            setHistoryLogs(resLogs.data.filter(l => l.message.includes("DAILY REPORT"))); // Only show reports? Or all logs? User said "i can see the report". Filtering helps focus.
            setViewingHistory(userId);
        } catch (error) { console.error(error); }
    };

    const [showRecordsModal, setShowRecordsModal] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [employeeTasks, setEmployeeTasks] = useState([]);
    const [employeeAttendance, setEmployeeAttendance] = useState([]);

    const openRecords = async (agent) => {
        setSelectedEmployee(agent);
        setEmployeeTasks([]); // Clear data first
        setShowRecordsModal(true); // Open modal immediately

        try {
            const tasksRes = await api.get(`/tasks/user/${agent.id}`);
            if (tasksRes.data) {
                setEmployeeTasks(tasksRes.data);
            }
        } catch (error) {
            console.error("Error loading records:", error);
        }
    };




    const [showProjectModal, setShowProjectModal] = useState(false);
    const [projectForm, setProjectForm] = useState({
        title: "",
        description: "",
        phases: ["Phase 1"],
        selectedAgents: []
    });

    const toggleAgentSelection = (agentId) => {
        setProjectForm(prev => {
            const newAgents = prev.selectedAgents.includes(agentId)
                ? prev.selectedAgents.filter(id => id !== agentId)
                : [...prev.selectedAgents, agentId];
            return { ...prev, selectedAgents: newAgents };
        });
    };

    const addPhase = () => {
        setProjectForm(prev => ({
            ...prev,
            phases: [...prev.phases, `Phase ${prev.phases.length + 1}`]
        }));
    };

    const updatePhase = (idx, val) => {
        const newPhases = [...projectForm.phases];
        newPhases[idx] = val;
        setProjectForm(prev => ({ ...prev, phases: newPhases }));
    };

    const removePhase = (idx) => {
        const newPhases = projectForm.phases.filter((_, i) => i !== idx);
        setProjectForm(prev => ({ ...prev, phases: newPhases }));
    };

    const launchProject = async (e) => {
        e.preventDefault();
        if (projectForm.selectedAgents.length === 0) {
            alert("Please select at least one agent.");
            return;
        }
        try {
            // 1. Create Project
            const res = await api.post('/projects', {
                title: projectForm.title,
                description: projectForm.description,
                deadline: projectForm.deadline ? new Date(projectForm.deadline).toISOString() : null
            });
            const projId = res.data.id;

            // 2. Assign Team & Phases
            await api.post('/projects/assign-team', {
                project_id: projId,
                agent_ids: projectForm.selectedAgents,
                phases: projectForm.phases
            });

            alert("Project Launched & Tasks Assigned!");
            setShowProjectModal(false);
            setProjectForm({ title: "", description: "", deadline: "", phases: ["Phase 1"], selectedAgents: [] });
            fetchAgents();
        } catch (error) {
            console.error(error);
            alert("Failed to launch project");
        }
    };

    const [showCompleteModal, setShowCompleteModal] = useState(false);
    const [activeTask, setActiveTask] = useState(null);
    const [completionNote, setCompletionNote] = useState("");
    const [completionFiles, setCompletionFiles] = useState([]);

    const initiateCompletion = (task) => {
        setActiveTask(task);
        setCompletionNote("");
        setCompletionFiles([]);
        setShowCompleteModal(true);
    };

    const handleFileChange = (e) => {
        setCompletionFiles(Array.from(e.target.files));
    };

    const submitCompletion = async (e) => {
        e.preventDefault();
        if (!activeTask) return;

        try {
            // 1. Upload Files
            const uploadedPaths = [];
            for (const file of completionFiles) {
                const formData = new FormData();
                formData.append('file', file);
                // Let browser set Content-Type + boundary automatically
                const res = await api.post('/upload', formData);
                if (res.data && res.data.path) {
                    uploadedPaths.push(res.data.path);
                }
            }

            // 2. Complete Task
            // Ensure attachments are stored as a JSON string
            await api.put(`/tasks/${activeTask.id}/complete`, {
                notes: completionNote,
                attachments: JSON.stringify(uploadedPaths)
            });

            alert("Task Submitted Successfully!");
            setShowCompleteModal(false);
            fetchTasks();
            fetchPerformance();
        } catch (error) {
            console.error("Task submission error:", error);
            alert("Failed to submit task. Please check your connection or try again.");
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

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="min-h-screen bg-black text-foreground p-8 relative overflow-hidden"
        >
            <AnimatedBackground />
            <Spotlight />
            <div className="relative z-10 max-w-7xl mx-auto">
                {/* Task Completion Modal */}
                {showCompleteModal && createPortal(
                    <div className="fixed inset-0 flex items-center justify-center p-4 bg-black/95 backdrop-blur-sm z-[9999]" style={{ position: 'fixed' }}>
                        <div className="bg-[#111] border border-white/20 rounded-xl p-6 max-w-md w-full relative shadow-2xl animate-in fade-in zoom-in duration-300">
                            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent pointer-events-none rounded-xl" />
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-white relative z-10">
                                <CheckCircle className="text-green-500" /> Complete Task
                            </h2>
                            <form onSubmit={submitCompletion} className="space-y-4 relative z-10">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Completion Notes / Report</label>
                                    <textarea
                                        value={completionNote}
                                        onChange={e => setCompletionNote(e.target.value)}
                                        className="w-full bg-black/40 border border-white/10 p-3 rounded-lg text-white focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all font-mono text-sm"
                                        rows="4"
                                        placeholder="Detailed report of task execution..."
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Upload Documents / Evidence</label>
                                    <div className="relative group">
                                        <input
                                            type="file"
                                            multiple
                                            onChange={handleFileChange}
                                            className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20 transition-all cursor-pointer border border-white/10 rounded-lg p-1"
                                        />
                                        <FileUp className="absolute right-3 top-2.5 w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowCompleteModal(false)}
                                        className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-6 py-2 rounded-lg text-sm font-bold bg-green-600 hover:bg-green-500 text-white shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_30px_rgba(34,197,94,0.5)] transition-all flex items-center gap-2"
                                    >
                                        <FileUp className="w-4 h-4" /> Submit Report
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>,
                    document.body
                )}




                {/* Project Modal */}
                {
                    showProjectModal && (
                        <div className="fixed inset-0 flex items-center justify-center p-4 bg-black/95 backdrop-blur-sm" style={{ zIndex: 9999 }}>
                            <div className="bg-[#111] border border-white/20 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative custom-scrollbar" style={{ zIndex: 10000, backgroundColor: '#111111' }}>
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-2xl font-bold">Create Team Project</h2>
                                    <button onClick={() => setShowProjectModal(false)} className="text-gray-400 hover:text-white">✕ Close</button>
                                </div>

                                <form onSubmit={launchProject} className="space-y-4">
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-1">Project Title</label>
                                        <input type="text" value={projectForm.title} onChange={e => setProjectForm({ ...projectForm, title: e.target.value })} className="w-full bg-black/20 border border-white/10 p-2 rounded text-white" required />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-gray-400 mb-1">Description</label>
                                        <textarea value={projectForm.description} onChange={e => setProjectForm({ ...projectForm, description: e.target.value })} className="w-full bg-black/20 border border-white/10 p-2 rounded text-white" rows="3"></textarea>
                                    </div>

                                    <div>
                                        <label className="block text-sm text-gray-400 mb-1">Project Deadline</label>
                                        <input
                                            type="datetime-local"
                                            value={projectForm.deadline}
                                            onChange={e => setProjectForm({ ...projectForm, deadline: e.target.value })}
                                            className="w-full bg-black/20 border border-white/10 p-2 rounded text-white"
                                        />
                                        <p className="text-xs text-yellow-400 mt-1">Note: Late completion will reduce agent performance scores.</p>
                                    </div>

                                    <div className="border-t border-white/10 pt-4">
                                        <label className="block text-sm text-gray-400 mb-2">Select Team Members</label>
                                        <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto bg-black/20 p-2 rounded">
                                            {agents.map(agent => (
                                                <label key={agent.id} className="flex items-center space-x-2 cursor-pointer hover:bg-white/5 p-1 rounded">
                                                    <input
                                                        type="checkbox"
                                                        checked={projectForm.selectedAgents.includes(agent.id)}
                                                        onChange={() => toggleAgentSelection(agent.id)}
                                                        className="rounded border-gray-600 bg-gray-700 text-primary focus:ring-primary"
                                                    />
                                                    <span className="text-sm">{agent.username}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="border-t border-white/10 pt-4">
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="block text-sm text-gray-400">Project Phases (Milestones)</label>
                                            <button type="button" onClick={addPhase} className="text-xs bg-primary/20 text-primary px-2 py-1 rounded hover:bg-primary/30">+ Add Phase</button>
                                        </div>
                                        <div className="space-y-2 max-h-40 overflow-y-auto">
                                            {projectForm.phases.map((phase, idx) => (
                                                <div key={idx} className="flex gap-2">
                                                    <span className="px-2 py-2 bg-white/5 text-gray-400 text-sm rounded w-8 text-center">{idx + 1}</span>
                                                    <input
                                                        type="text"
                                                        value={phase}
                                                        onChange={(e) => updatePhase(idx, e.target.value)}
                                                        className="flex-1 bg-black/20 border border-white/10 p-2 rounded text-white text-sm"
                                                        placeholder={`Phase ${idx + 1} Name`}
                                                        required
                                                    />
                                                    {projectForm.phases.length > 1 && (
                                                        <button type="button" onClick={() => removePhase(idx)} className="text-red-400 hover:bg-red-500/10 px-2 rounded">✕</button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <button type="submit" className="w-full bg-primary hover:bg-primary-hover text-white font-semibold py-3 rounded-lg mt-4 shadow-lg shadow-primary/20 transition-all">
                                        🚀 Launch Project & Assign Tasks
                                    </button>
                                </form>
                            </div>
                        </div>
                    )
                }

                {/* Records Modal */}
                {
                    showRecordsModal && selectedEmployee && (
                        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                            <div className="bg-secondary border border-white/10 rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                                <div className="flex justify-between items-center mb-6">
                                    <div>
                                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                            <span className="text-blue-500">📂</span>
                                            {selectedEmployee.username}
                                            <span className="text-gray-500 text-lg font-normal">/ Project Status & Documentation</span>
                                        </h2>
                                        <p className="text-gray-400 text-sm mt-1">Employee ID: {selectedEmployee.id} • Role: {selectedEmployee.role}</p>
                                    </div>
                                    <button onClick={() => setShowRecordsModal(false)} className="text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1 rounded transition-colors">✕ Close</button>
                                </div>

                                <div className="grid grid-cols-1 gap-6">
                                    <div>
                                        <div className="space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
                                            {employeeTasks.length === 0 ? (
                                                <div className="flex flex-col items-center justify-center py-12 border border-white/5 rounded-2xl bg-white/[0.02]">
                                                    <div className="text-4xl mb-4">📭</div>
                                                    <p className="text-gray-400 font-semibold">No project records or documentation found.</p>
                                                    <p className="text-gray-600 text-sm">Tasks assigned will appear here.</p>
                                                </div>
                                            ) : employeeTasks.map(t => (
                                                <div key={t.id} className="bg-black/40 p-6 rounded-2xl border border-white/10 hover:border-blue-500/30 transition-all group relative overflow-hidden shadow-lg">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-sm ${t.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-emerald-500/10' : 'bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-amber-500/10'}`}>
                                                                {t.status}
                                                            </span>
                                                            {t.project_title && (
                                                                <span className="flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/20 shadow-sm shadow-purple-500/10">
                                                                    <span>🚀</span> {t.project_title}
                                                                </span>
                                                            )}
                                                            <span className="text-[10px] text-gray-500 font-mono bg-white/5 px-2 py-1 rounded border border-white/5">
                                                                ID: #{t.id}
                                                            </span>
                                                        </div>
                                                        <span className="text-[11px] text-gray-400 font-mono flex items-center gap-1">
                                                            📅 {new Date(t.created_at).toLocaleDateString()}
                                                        </span>
                                                    </div>

                                                    <div className="mb-4 pl-1">
                                                        <h4 className="font-bold text-white text-base mb-2">{t.title}</h4>
                                                        <p className="text-sm text-gray-400 leading-relaxed">{t.description}</p>
                                                    </div>

                                                    {t.completion_notes && (
                                                        <div className="mb-5 bg-emerald-900/5 rounded-xl border border-emerald-500/10 overflow-hidden">
                                                            <div className="px-4 py-2 bg-emerald-500/10 border-b border-emerald-500/10 flex items-center gap-2">
                                                                <span className="text-emerald-400">✅</span>
                                                                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Submission Report</span>
                                                            </div>
                                                            <div className="p-4 text-sm text-gray-300">
                                                                {t.completion_notes}
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className="mt-4 pt-4 border-t border-white/5">
                                                        <div className="flex items-center gap-2 mb-3">
                                                            <span className="text-[11px] text-blue-400 font-bold uppercase tracking-wider flex items-center gap-1">
                                                                <span className="text-base">📎</span> Attached Documentation & Evidence
                                                            </span>
                                                        </div>
                                                        {t.attachments && parseAttachments(t.attachments).length > 0 ? (
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                                                {parseAttachments(t.attachments).map((path, idx) => {
                                                                    const filename = path.split('/').pop();
                                                                    return (
                                                                        <a
                                                                            key={idx}
                                                                            href={`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'}/${path}`}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="group flex items-center gap-3 px-3 py-2 bg-[#1a1a1a] hover:bg-blue-500/10 border border-white/10 hover:border-blue-500/30 rounded-lg transition-all"
                                                                        >
                                                                            <div className="bg-white/5 p-1.5 rounded text-lg group-hover:scale-110 transition-transform">📄</div>
                                                                            <div className="overflow-hidden">
                                                                                <span className="block text-xs font-medium text-gray-300 group-hover:text-blue-400 truncate w-full">{filename}</span>
                                                                                <span className="text-[10px] text-gray-600 group-hover:text-blue-500/70">Click to View</span>
                                                                            </div>
                                                                        </a>
                                                                    );
                                                                })}
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-2 text-gray-600 italic text-xs pl-2">
                                                                <span className="w-1 h-1 rounded-full bg-gray-700"></span>
                                                                No files attached to this record.
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* Closing div for container that was previously restricted to bottom, now wrapping content */}
            </div >

            {/* Content Wrapper */}
            < div className="relative z-10 max-w-7xl mx-auto mt-8" >
                <header className="flex justify-between items-center mb-10 relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                    <div className="relative w-full bg-[#09090b]/80 backdrop-blur-2xl p-8 rounded-2xl border border-white/10 shadow-2xl flex justify-between items-center">
                        <div>
                            <div className="flex items-center gap-4 mb-2">
                                <div className="h-10 w-1 bg-gradient-to-b from-purple-500 to-blue-500 rounded-full"></div>
                                <TypingText text="JOURVIX PRIME" className="text-5xl font-black tracking-tighter text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]" />
                            </div>
                            <motion.p
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 1, duration: 0.8 }}
                                className="text-gray-400 text-sm font-mono tracking-widest uppercase pl-5"
                            >
                                SYSTEM OPERATIONAL | <span className="text-primary font-bold shadow-blue-500/50 drop-shadow-sm">{user?.display_name || user?.username}</span>
                            </motion.p>
                        </div>
                        <div className="flex items-center gap-4">
                            {user?.role !== 'admin' && (
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setShowReportModal(true)}
                                    className="px-4 py-3 border border-blue-500/30 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 font-bold text-xs uppercase tracking-widest flex items-center gap-2 shadow-[0_0_15px_rgba(59,130,246,0.2)]"
                                >
                                    📝 Report
                                </motion.button>
                            )}
                            <motion.button
                                whileHover={{ scale: 1.05, backgroundColor: 'rgba(239,68,68,0.15)', borderColor: 'rgba(239,68,68,0.5)' }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => { logout(); navigate('/login'); }}
                                className="group relative px-8 py-4 border border-white/10 rounded-xl overflow-hidden bg-black/40 backdrop-blur-md transition-all shadow-[0_0_20px_rgba(0,0,0,0.5)]"
                            >
                                <span className="relative z-10 text-red-500/80 group-hover:text-red-400 font-bold tracking-widest text-xs uppercase flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-red-500/50 group-hover:bg-red-500 group-hover:shadow-[0_0_10px_#ef4444] transition-all"></span>
                                    Disconnect
                                </span>
                            </motion.button>
                        </div>
                    </div>
                </header>

                {/* Daily Report Modal */}
                {showReportModal && (
                    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9999] p-4">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-[#111] border border-white/20 rounded-xl p-6 max-w-lg w-full shadow-2xl relative"
                        >
                            <h2 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
                                📝 End of Day Report
                            </h2>
                            <p className="text-gray-400 text-sm mb-4">Summarize your achievements, tasks completed, and any blockers for today.</p>
                            <textarea
                                value={reportSummary}
                                onChange={(e) => setReportSummary(e.target.value)}
                                className="w-full h-32 bg-black/40 border border-white/10 p-3 rounded-lg text-white font-mono text-sm focus:border-blue-500 focus:outline-none custom-scrollbar resize-none"
                                placeholder="- Completed Task A&#10;- Fixed Bug B&#10;- Pending review for C..."
                            />
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    onClick={() => setShowReportModal(false)}
                                    className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={async () => {
                                        if (!reportSummary.trim()) return;
                                        try {
                                            await api.post('/report/daily', { summary: reportSummary });
                                            alert("Report Submitted Successfully");
                                            setReportSummary("");
                                            setShowReportModal(false);
                                        } catch (e) { alert("Failed to submit report"); }
                                    }}
                                    className="px-6 py-2 rounded-lg text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 transition-all"
                                >
                                    Submit
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Admin Dashboard */}
                    {user?.role === 'admin' ? (
                        <>
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.1 }}
                                className="bg-secondary/30 border border-white/5 p-6 rounded-xl hover:border-primary/30 transition-colors"
                            >
                                <h3 className="text-lg font-semibold mb-2">Registration Console</h3>
                                <button onClick={() => navigate('/register-agent')} className="w-full bg-primary/20 hover:bg-primary/30 text-primary border border-primary/50 py-2 rounded-lg transition-colors">
                                    + Register New Agent
                                </button>
                                <button onClick={() => navigate('/employee-stats')} className="w-full mt-3 bg-accent/20 hover:bg-accent/30 text-accent border border-accent/50 py-2 rounded-lg transition-colors">
                                    View Employee Analytics
                                </button>

                                <div className="mt-6 border-t border-white/10 pt-4">
                                    <h4 className="text-sm font-semibold mb-2 text-gray-400">System Configuration</h4>
                                    <div className="space-y-2">
                                        <label className="text-xs text-gray-500 block">Performance Bonus Amount (₹)</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="number"
                                                value={bonusAmount}
                                                onChange={(e) => setBonusAmount(e.target.value)}
                                                className="w-full bg-black/20 border border-white/10 p-2 rounded text-white text-sm"
                                            />
                                            <button onClick={updateSettings} className="bg-white/10 hover:bg-white/20 text-white px-3 py-1 rounded text-xs transition-colors">
                                                Save
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>



                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="bg-black/40 backdrop-blur-xl border border-white/10 p-6 rounded-2xl col-span-2 hover:border-blue-500/30 transition-colors shadow-lg"
                            >
                                <h3 className="text-lg font-semibold mb-4">Project & Task Assignment</h3>
                                <div className="flex justify-between mb-4">
                                    <button onClick={() => setShowProjectModal(true)} className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-3 rounded-lg shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2">
                                        ✨ Create Team Project
                                    </button>
                                </div>

                                <form onSubmit={assignTask} className="grid grid-cols-2 gap-4 border-t border-white/10 pt-4">
                                    <p className="col-span-2 text-sm text-gray-400">Or assign a single task:</p>
                                    <input type="text" placeholder="Task Title" value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} className="bg-black/20 border border-white/10 p-2 rounded text-white" required />
                                    <CustomSelect
                                        options={agents.map(a => ({ value: a.id, label: a.username, sub: a.role }))}
                                        value={selectedAgentId}
                                        onChange={setSelectedAgentId}
                                        placeholder="Select Agent..."
                                        centered={false}
                                    />
                                    <div className="col-span-2 grid grid-cols-2 gap-4">
                                        <input type="text" placeholder="Description" value={newTaskDesc} onChange={e => setNewTaskDesc(e.target.value)} className="bg-black/20 border border-white/10 p-2 rounded text-white" />
                                        <input type="datetime-local" value={newTaskDeadline} onChange={e => setNewTaskDeadline(e.target.value)} className="bg-black/20 border border-white/10 p-2 rounded text-white text-xs" />
                                    </div>
                                    <button type="submit" className="col-span-2 bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 py-2 rounded">Quick Assign Task</button>
                                </form>
                            </motion.div>


                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="col-span-1 md:col-span-3 bg-black/40 backdrop-blur-xl border border-white/10 p-6 rounded-2xl hover:border-purple-500/30 transition-colors shadow-lg"
                            >
                                <h3 className="text-lg font-semibold mb-4">Operations & Attendance</h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="border-b border-white/10 text-gray-400"><th className="p-3">Agent</th><th className="p-3">Role</th><th className="p-3">Status</th><th className="p-3">Last Active</th><th className="p-3">Actions</th></tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {agents.map(agent => (
                                                <>
                                                    <tr key={agent.id}>
                                                        <td className="p-3">{agent.username}</td>
                                                        <td className="p-3"><span className="text-xs font-mono text-gray-400 uppercase bg-white/5 px-2 py-1 rounded border border-white/10">{agent.role}</span></td>
                                                        <td className="p-3"><span className={`px-2 py-1 rounded text-xs ${getAgentAttendanceStatus(agent.id) === 'present' ? 'bg-success/20 text-success' : getAgentAttendanceStatus(agent.id) === 'absent' ? 'bg-danger/20 text-danger' : 'bg-gray-700 text-gray-300'}`}>{getAgentAttendanceStatus(agent.id).toUpperCase()}</span></td>
                                                        <td className="p-3 text-xs font-mono text-gray-500">{agent.last_active ? new Date(agent.last_active).toLocaleString() : 'N/A'}</td>
                                                        <td className="p-3 space-x-2 flex">
                                                            <button onClick={() => markAttendance(agent.id, 'present')} className="px-2 py-1 bg-success/10 text-success border border-success/30 rounded text-xs">Present</button>
                                                            <button onClick={() => markAttendance(agent.id, 'absent')} className="px-2 py-1 bg-danger/10 text-danger border border-danger/30 rounded text-xs">Absent</button>
                                                            <button onClick={() => viewHistory(agent.id)} className="px-2 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded text-xs">History</button>
                                                            <div className="w-px h-6 bg-white/10 mx-2"></div>
                                                            <button onClick={() => changePassword(agent.id)} className="px-2 py-1 bg-primary/10 text-primary border border-primary/30 rounded text-xs">Pwd</button>
                                                            <button onClick={() => deleteUser(agent.id)} className="px-2 py-1 bg-white/5 text-gray-400 border border-white/10 rounded text-xs">Del</button>
                                                        </td>
                                                    </tr>
                                                    {viewingHistory === agent.id && (
                                                        <tr key={`hist-${agent.id}`} className="bg-black/30">
                                                            <td colSpan="5" className="p-0">
                                                                <div className="grid grid-cols-2 gap-0 border-b border-white/10">
                                                                    <div className="p-6 border-r border-white/10">
                                                                        <h4 className="font-bold text-white mb-4 flex items-center gap-2">
                                                                            <span className="text-purple-400">📋</span> Task History
                                                                        </h4>
                                                                        <ul className="space-y-3">
                                                                            {historyTasks.length === 0 ? <li className="text-gray-500 italic text-sm">No tasks found.</li> : historyTasks.map(t => (
                                                                                <li key={t.id} className="text-sm bg-black/20 p-3 rounded-lg border border-white/5 hover:bg-white/5 transition-colors">
                                                                                    <div className="flex justify-between items-start mb-1">
                                                                                        <span className="font-semibold text-white">
                                                                                            <span className={`mr-2 text-xs px-1.5 py-0.5 rounded border ${t.status === 'completed' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'}`}>{t.status.toUpperCase()}</span>
                                                                                            {t.title}
                                                                                        </span>
                                                                                        <span className="text-gray-500 text-[10px] lowercase font-mono">{new Date(t.created_at).toLocaleDateString()}</span>
                                                                                    </div>
                                                                                    {t.completion_notes && <div className="text-gray-400 text-xs ml-1 mt-2 pl-2 border-l-2 border-white/10 italic">"{t.completion_notes}"</div>}
                                                                                </li>
                                                                            ))}
                                                                        </ul>
                                                                    </div>
                                                                    <div className="p-6 bg-blue-500/5">
                                                                        <h4 className="font-bold text-white mb-4 flex items-center gap-2">
                                                                            <span className="text-blue-400">📝</span> Daily Activity Reports
                                                                        </h4>
                                                                        <ul className="space-y-3">
                                                                            {historyLogs.filter(l => l.message.includes("DAILY REPORT")).length === 0 ? (
                                                                                <li className="text-gray-500 italic text-sm">No daily reports found.</li>
                                                                            ) : (
                                                                                historyLogs.filter(l => l.message.includes("DAILY REPORT")).map((log, idx) => (
                                                                                    <li key={idx} className="text-sm bg-black/20 p-3 rounded-lg border border-blue-500/10 hover:border-blue-500/30 transition-colors">
                                                                                        <div className="flex justify-between items-center mb-2">
                                                                                            <span className="text-xs font-mono text-blue-400 opacity-70">
                                                                                                {new Date(log.created_at).toLocaleString()}
                                                                                            </span>
                                                                                        </div>
                                                                                        <p className="text-gray-300 leading-relaxed whitespace-pre-wrap text-xs">
                                                                                            {log.message.replace("DAILY REPORT from ", "").replace(/.*: /, "")}
                                                                                        </p>
                                                                                    </li>
                                                                                ))
                                                                            )}
                                                                        </ul>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </>
                                            ))}
                                            {agents.length === 0 && <tr><td colSpan="3" className="p-4 text-center text-gray-500">No agents found.</td></tr>}
                                        </tbody>
                                    </table>
                                </div>
                            </motion.div>

                        </>
                    ) : (
                        <div className="col-span-1 md:col-span-3 h-full min-h-[60vh] flex flex-col perspective-1000 gap-6">
                            {performance ? (() => {
                                // Metric Calculations
                                let baseEfficiency = 25;
                                let xp = (performance.completed_tasks * 15) + ((performance.attendance_rate || 0) * 0.5);
                                if (performance.attendance_rate > 50 && performance.completed_tasks < 1) xp -= 50;
                                xp = Math.max(0, xp);
                                const pointsGained = Math.floor(xp / 100);
                                const efficiency = Math.min(100, baseEfficiency + pointsGained);

                                // Attendance Graph Data
                                const attendanceData = myAttendanceHistory.map(record => ({
                                    date: new Date(record.date || record.created_at).getDate(),
                                    presence: record.status === 'present' ? 100 : 20,
                                    status: record.status
                                }));

                                // Real Performance Trend Data (30 Days)
                                const past30Days = Array.from({ length: 30 }, (_, i) => {
                                    const d = new Date();
                                    d.setDate(d.getDate() - (29 - i));
                                    d.setHours(23, 59, 59, 999); // End of day
                                    return d;
                                });

                                const perfTrendData = past30Days.map(date => {
                                    // Tasks completed by this date
                                    const completedCount = tasks.filter(t =>
                                        t.status === 'completed' &&
                                        new Date(t.updated_at || t.created_at) <= date
                                    ).length;

                                    // XP calculation: Base 25 + (Tasks * 5)
                                    // Make it fluctuate slightly to look natural if static
                                    const baseScore = Math.min(100, 25 + (completedCount * 5));
                                    const dayHash = date.getDate() + date.getMonth();
                                    // Add small variation based on day so flat lines aren't boring, but trend is real
                                    // Only if score is constant

                                    return {
                                        day: date.toLocaleDateString('en-US', { day: '2-digit', month: 'short' }),
                                        score: baseScore
                                    };
                                });

                                const containerVariants = {
                                    hidden: { opacity: 0 },
                                    visible: {
                                        opacity: 1,
                                        transition: { staggerChildren: 0.1 }
                                    }
                                };

                                const cardVariants = {
                                    hidden: { opacity: 0, y: 20, scale: 0.95 },
                                    visible: {
                                        opacity: 1,
                                        y: 0,
                                        scale: 1,
                                        transition: { type: "spring", stiffness: 120, damping: 20 }
                                    },
                                    hover: {
                                        scale: 1.02,
                                        y: -2,
                                        boxShadow: "0 10px 30px -5px rgba(0,0,0,0.5)",
                                        zIndex: 10
                                    }
                                };

                                return (
                                    <>
                                        <motion.div
                                            variants={containerVariants}
                                            initial="hidden"
                                            animate="visible"
                                            layout
                                            className="grid grid-cols-1 md:grid-cols-4 gap-4 w-full max-w-7xl mx-auto"
                                        >

                                            {/* Row 1: Small Metrics Boxes & Attendance */}

                                            {/* Row 1: Performance & Financials */}

                                            {/* 1. My Performance (Rectangular, Clean) */}
                                            <motion.div layout variants={cardVariants} className="col-span-1 md:col-span-1 bg-[#050505] border border-white/10 rounded-xl p-5 flex flex-col justify-between relative overflow-hidden transition-all shadow-lg">
                                                <div>
                                                    <h3 className="text-sm font-semibold text-white mb-4 tracking-wide">My Performance</h3>

                                                    <div className="flex items-end justify-between mb-2">
                                                        <span className="text-xs text-gray-500 font-medium">Current Score</span>
                                                        <span className="text-2xl font-bold text-blue-500 tracking-tight">
                                                            <AnimatedCounter value={performance.performance_score} />
                                                            <span className="text-sm text-gray-600 ml-0.5">/100</span>
                                                        </span>
                                                    </div>

                                                    {/* Linear Progress Bar */}
                                                    <div className="h-1.5 w-full bg-gray-900 rounded-full overflow-hidden mb-5 border border-white/5">
                                                        <motion.div
                                                            className="h-full bg-blue-600 rounded-full shadow-[0_0_10px_rgba(37,99,235,0.5)]"
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${Math.min(performance.performance_score, 100)}%` }}
                                                            transition={{ duration: 1.5, ease: "easeOut" }}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4 mt-auto">
                                                    <div className="bg-white/5 rounded-lg p-2 border border-white/5">
                                                        <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Tasks Done</div>
                                                        <div className="text-lg font-mono text-white">{performance.completed_tasks}</div>
                                                    </div>
                                                    <div className="bg-white/5 rounded-lg p-2 border border-white/5">
                                                        <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Pending</div>
                                                        <div className="text-lg font-mono text-gray-300">{tasks.filter(t => t.status === 'pending').length}</div>
                                                    </div>
                                                </div>
                                            </motion.div>

                                            {/* 2. Financials & Efficiency (Clean Card) */}
                                            <motion.div layout variants={cardVariants} className="col-span-1 md:col-span-1 bg-[#050505] border border-white/10 rounded-xl p-5 flex flex-col justify-between relative overflow-hidden transition-all shadow-lg">
                                                <div>
                                                    <h3 className="text-sm font-semibold text-white mb-4 tracking-wide">Financials & Stats</h3>

                                                    <div className="space-y-3">
                                                        <div className="flex justify-between items-center py-2 border-b border-white/5">
                                                            <span className="text-xs text-gray-500">Annual Salary (LPA)</span>
                                                            <span className="text-sm font-mono text-green-400 font-bold tracking-tight">
                                                                {performance.salary ? `₹ ${performance.salary} LPA` : '₹ -- LPA'}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between items-center py-2 border-b border-white/5">
                                                            <span className="text-xs text-gray-500">Efficiency Score</span>
                                                            <span className="text-sm font-mono text-white font-bold">{efficiency}%</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="mt-4 pt-2">
                                                    <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Today's Status</div>
                                                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${myAttendance?.status === 'present' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                                                        <div className={`w-2 h-2 rounded-full ${myAttendance?.status === 'present' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                                                        <span className="text-xs font-bold tracking-wider">
                                                            {myAttendance?.status ? myAttendance.status.toUpperCase() : 'ABSENT'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </motion.div>

                                            {/* 3. Task List / Active Task (Refined) */}
                                            <motion.div layout variants={cardVariants} className="col-span-1 md:col-span-2 bg-[#050505] border border-white/10 rounded-xl p-5 flex flex-col relative overflow-hidden group hover:border-white/20 transition-all shadow-lg">
                                                <div className="flex justify-between items-center mb-4">
                                                    <h3 className="text-sm font-semibold text-white tracking-wide">Task List</h3>
                                                    {tasks.filter(t => t.status === 'pending').length > 0 && (
                                                        <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded border border-blue-500/30 animate-pulse">
                                                            Active
                                                        </span>
                                                    )}
                                                </div>

                                                {tasks.filter(t => t.status === 'pending').length > 0 ? (
                                                    (() => {
                                                        const activeTask = tasks.filter(t => t.status === 'pending')[0];
                                                        return (
                                                            <div className="flex flex-col h-full justify-between">
                                                                <div className="bg-[#0f0f0f] border border-white/5 rounded-lg p-4 mb-3 hover:bg-[#141414] transition-colors cursor-default">
                                                                    <div className="flex justify-between items-start mb-2">
                                                                        <span className="text-sm font-bold text-white max-w-[85%] truncate">{activeTask.title}</span>
                                                                        <span className="text-[10px] text-gray-600 font-mono">#{activeTask.id}</span>
                                                                    </div>
                                                                    <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">{activeTask.description}</p>
                                                                </div>

                                                                <button
                                                                    onClick={() => initiateCompletion(activeTask)}
                                                                    className="w-full py-2.5 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-600/50 text-blue-400 hover:text-blue-300 text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-2 group/btn"
                                                                >
                                                                    <CheckCircle className="w-3.5 h-3.5 group-hover/btn:scale-110 transition-transform" />
                                                                    Mark Complete & Attach Files
                                                                </button>
                                                            </div>
                                                        );
                                                    })()
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center h-full text-gray-700 bg-[#0f0f0f] rounded-lg border border-white/5 border-dashed">
                                                        <CheckCircle className="w-6 h-6 mb-2 opacity-30" />
                                                        <span className="text-[10px] uppercase tracking-widest font-semibold">No Pending Tasks</span>
                                                    </div>
                                                )}
                                            </motion.div>




                                            {/* Row 2: Graphs & Logs */}

                                            {/* 4. Performance Trend Graph (30-Day Streak) */}





                                        </motion.div >


                                    </>
                                );
                            })() : (
                                <div className="text-gray-600 text-[10px] animate-pulse tracking-[0.5em] uppercase font-mono w-full text-center mt-20">
                                    /// SYSTEM_INITIALIZING...
                                </div>
                            )}
                        </div >
                    )}

                </div>
            </div >
        </motion.div >
    );
}

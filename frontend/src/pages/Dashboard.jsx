import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { CustomSelect } from '../components/CustomDropdowns';
import WorkforceAnalyticsHUD from '../components/WorkforceAnalyticsHUD';
import { Activity, FileUp, CheckCircle, Clock, AlertTriangle, LogOut, User, Settings, CreditCard, Trophy, Zap, Lock } from 'lucide-react';
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
    const [showProjectModal, setShowProjectModal] = useState(false);
    const [reportSummary, setReportSummary] = useState("");

    useEffect(() => {
        const socket = new WebSocket(import.meta.env.VITE_WS_URL || 'wss://bpo-rouge.vercel.app/ws');

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

    const [showProfileDropdown, setShowProfileDropdown] = useState(false);
    const [performance, setPerformance] = useState({
        completed_tasks: 0,
        pending_tasks: 0,
        attendance_rate: 0,
        efficiency: 25.0,
        salary: 0,
        performance_score: 0
    });
    const [loadingPerformance, setLoadingPerformance] = useState(true);
    const [performanceError, setPerformanceError] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [newTaskTitle, setNewTaskTitle] = useState("");
    const [newTaskDesc, setNewTaskDesc] = useState("");
    const [newTaskDeadline, setNewTaskDeadline] = useState("");
    const [selectedAgentId, setSelectedAgentId] = useState("");
    const [error, setError] = useState(false);
    const [loadingAttempts, setLoadingAttempts] = useState(0);

    const [showProfileModal, setShowProfileModal] = useState(false);
    const [editProfile, setEditProfile] = useState({
        display_name: "",
        email: "",
        profile_photo: ""
    });

    useEffect(() => {
        if (user) {
            setEditProfile({
                display_name: user.display_name || "",
                email: user.email || "",
                profile_photo: user.profile_photo || ""
            });
        }
    }, [user]);

    const saveProfile = async () => {
        try {
            await api.put('/users/profile', editProfile);
            // Re-fetch current user to sync throughout the app
            const res = await api.get('/users/me');
            // useAuth likely doesn't have a direct "setUser" exported here easily unless we update AuthContext
            // But we can just rely on the next refresh or provide a local reload
            alert("Digital Signature Updated Successfully");
            setShowProfileModal(false);
            window.location.reload(); // Quick sync across context
        } catch (e) { alert("Failed to update node configuration"); }
    };

    const getAvatarUrl = (photo) => {
        if (!photo) return null;
        if (photo.startsWith('http')) return photo;
        const baseUrl = import.meta.env.VITE_BACKEND_URL || 'https://bpo-rouge.vercel.app';
        return photo.startsWith('uploads') ? `${baseUrl}/${photo}` : `${baseUrl}/uploads/${photo}`;
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            if (!performance && !error) setError(true);
        }, 10000); // 10 seconds timeout
        return () => clearTimeout(timer);
    }, [performance, error]);

    useEffect(() => {
        const loadData = () => {
            if (document.hidden || !user) return; // Don't poll if tab is hidden or user not yet loaded
            
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
        if (!user?.id) return;
        try {
            setLoadingPerformance(true);
            const res = await api.get(`/performance/${user.id}`);
            setPerformance(res.data);
            setPerformanceError(null);
        } catch (err) { 
            console.error(err);
            setPerformanceError("Synchronization Failed: Central Core unreachable.");
        } finally {
            setLoadingPerformance(false);
        }
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
        if (!selectedAgentId) {
            alert("SYSTEM ERROR: No target node selected for directive transmission.");
            return;
        }
        try {
            await api.post('/tasks', {
                title: newTaskTitle,
                description: newTaskDesc,
                agent_id: selectedAgentId,
                deadline: newTaskDeadline ? new Date(newTaskDeadline).toISOString() : null
            });
            alert("Task Assigned to Unit");
            // Clear inputs
            setNewTaskTitle(""); 
            setNewTaskDesc(""); 
            setNewTaskDeadline("");
            // Refresh counts for admin to see current sync status
            if (user?.role === 'admin') {
                fetchAgents();
            }
        } catch (error) { 
            console.error("Task Assignment Failed:", error);
            alert("Failed to assign task to remote node."); 
        }
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
        if (!window.confirm("Delete agent node from central core?")) return;
        try {
            await api.delete(`/users/${userId}`);
            fetchAgents();
        } catch (e) { console.error(e); }
    };

    const promoteUser = async (agent) => {
        const newSalary = prompt(`Elevate ${agent.username} - New Salary Package (LPA):`, agent.salary);
        const newRole = prompt(`Update Designation for ${agent.username}:`, agent.role);
        if (newSalary === null || newRole === null) return;
        
        try {
            await api.put(`/users/${agent.id}/promote`, { 
                salary: parseFloat(newSalary), 
                role: newRole,
                performance_score: (agent.performance_score || 0) + 10 // Award bonus points on promotion
            });
            fetchAgents();
            alert("SYSTEM: Node Synchronized. Promotion applied successfully.");
        } catch (e) {
            alert("SYSTEM FAILURE: Could not apply promotion.");
        }
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
        setEmployeeTasks([]);
        setShowRecordsModal(true);

        try {
            // Fresh Sync: Fetch latest performance along with records
            const [tasksRes, perfRes] = await Promise.all([
                api.get(`/tasks/user/${agent.id}`),
                api.get(`/performance/${agent.id}`)
            ]);
            
            if (tasksRes.data) setEmployeeTasks(tasksRes.data);
            if (perfRes.data) {
                // Update selected employee with latest synced metrics
                setSelectedEmployee(prev => ({ ...prev, ...perfRes.data }));
            }
        } catch (error) {
            console.error("Error loading records sync:", error);
        }
    };




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
                {showProjectModal && createPortal(
                    <div className="fixed inset-0 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md z-[9999]" style={{ position: 'fixed' }}>
                        <div className="bg-[#111] border border-white/20 rounded-xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative animate-in fade-in zoom-in duration-300 custom-scrollbar">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold flex items-center gap-2 text-white">
                                    <span className="text-purple-500">✨</span> Create Team Project
                                </h2>
                                <button
                                    onClick={() => setShowProjectModal(false)}
                                    className="text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-lg transition-all"
                                >
                                    ✕ Close
                                </button>
                            </div>

                            <form onSubmit={launchProject} className="space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="col-span-2 md:col-span-1">
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Project Title</label>
                                        <input
                                            type="text"
                                            value={projectForm.title}
                                            onChange={e => setProjectForm({ ...projectForm, title: e.target.value })}
                                            className="w-full bg-black/40 border border-white/10 p-3 rounded-xl text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                                            placeholder="e.g. Q4 Data Migration"
                                            required
                                        />
                                    </div>
                                    <div className="col-span-2 md:col-span-1">
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Project Deadline</label>
                                        <input
                                            type="datetime-local"
                                            value={projectForm.deadline}
                                            onChange={e => setProjectForm({ ...projectForm, deadline: e.target.value })}
                                            className="w-full bg-black/40 border border-white/10 p-3 rounded-xl text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all text-sm"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Description</label>
                                    <textarea
                                        value={projectForm.description}
                                        onChange={e => setProjectForm({ ...projectForm, description: e.target.value })}
                                        className="w-full bg-black/40 border border-white/10 p-3 rounded-xl text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all resize-none"
                                        rows="3"
                                        placeholder="Detailed project objectives..."
                                    />
                                </div>

                                <div className="border-t border-white/10 pt-6">
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Select Team Members</label>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-48 overflow-y-auto bg-black/40 p-4 rounded-xl border border-white/5 custom-scrollbar">
                                        {agents.map(agent => (
                                            <label
                                                key={agent.id}
                                                className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer border transition-all ${projectForm.selectedAgents.includes(agent.id) ? 'bg-purple-500/10 border-purple-500/30 text-white' : 'hover:bg-white/5 border-transparent text-gray-400'}`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={projectForm.selectedAgents.includes(agent.id)}
                                                    onChange={() => toggleAgentSelection(agent.id)}
                                                    className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-purple-600 focus:ring-purple-500 focus:ring-offset-black"
                                                />
                                                <span className="text-sm font-medium">{agent.username}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div className="border-t border-white/10 pt-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">Project Phases & Milestones</label>
                                        <button
                                            type="button"
                                            onClick={addPhase}
                                            className="text-[10px] font-bold uppercase tracking-widest bg-purple-500/10 text-purple-400 px-3 py-1.5 rounded-full border border-purple-500/30 hover:bg-purple-500/20 transition-all"
                                        >
                                            + Add Phase
                                        </button>
                                    </div>
                                    <div className="space-y-3 max-h-40 overflow-y-auto custom-scrollbar pr-2">
                                        {projectForm.phases.map((phase, idx) => (
                                            <div key={idx} className="flex gap-3 animate-in slide-in-from-left-2 duration-300" style={{ animationDelay: `${idx * 50}ms` }}>
                                                <div className="flex-none w-8 h-10 bg-white/5 border border-white/10 flex items-center justify-center rounded-lg text-xs font-mono text-gray-500">
                                                    {idx + 1}
                                                </div>
                                                <input
                                                    type="text"
                                                    value={phase}
                                                    onChange={(e) => updatePhase(idx, e.target.value)}
                                                    className="flex-1 bg-black/40 border border-white/10 p-2 rounded-lg text-white text-sm focus:border-purple-500"
                                                    placeholder={`Enter phase ${idx + 1} name...`}
                                                    required
                                                />
                                                {projectForm.phases.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => removePhase(idx)}
                                                        className="flex-none p-2 text-red-500/50 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                                                    >
                                                        ✕
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-black uppercase tracking-[0.2em] py-4 rounded-xl mt-6 shadow-xl shadow-purple-500/20 hover:shadow-purple-500/40 transition-all duration-300"
                                >
                                    🚀 Launch Project System
                                </button>
                            </form>
                        </div>
                    </div>,
                    document.body
                )}

                {/* Records Modal */}
                {showRecordsModal && selectedEmployee && createPortal(
                    <div className="fixed inset-0 bg-black/98 backdrop-blur-3xl flex items-center justify-center z-[99999] p-4" style={{ position: 'fixed' }}>
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0, y: 40 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            className="bg-[#0a0a0c] border border-white/10 rounded-[3rem] p-10 max-w-6xl w-full max-h-[92vh] overflow-hidden flex flex-col shadow-[0_50px_100px_rgba(0,0,0,0.8)] relative"
                        >
                            {/* Decorative Background Node */}
                            <div className="absolute top-0 right-0 w-[40%] h-full bg-gradient-to-l from-blue-600/5 to-transparent pointer-events-none" />
                            
                            <div className="flex-1 overflow-hidden flex flex-col">
                                <WorkforceAnalyticsHUD 
                                    targetUser={selectedEmployee}
                                    perfData={employeePerformance || selectedEmployee}
                                    tasksData={employeeTasks}
                                    getAvatarUrl={getAvatarUrl}
                                    completeTask={() => {}} // Admin doesn't complete tasks for them
                                    isAdminView={true}
                                />
                            </div>
                        </motion.div>
                    </div>,
                    document.body
                )}

                {/* Closing div for container that was previously restricted to bottom, now wrapping content */}
            </div>

            {/* Content Wrapper */}
            <div className="relative z-10 max-w-7xl mx-auto mt-8">
                <header className="flex justify-between items-center mb-10 relative z-50 group">
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
                        <div className="flex items-center gap-6">
                            {user?.role !== 'admin' && (
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setShowReportModal(true)}
                                    className="px-4 py-3 border border-blue-500/30 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-[0_0_15px_rgba(59,130,246,0.1)] transition-all"
                                >
                                    📝 New Report
                                </motion.button>
                            )}
                            
                            {/* Profile Dropdown Container */}
                            <div className="relative">
                                <motion.button
                                    onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                                    whileHover={{ scale: 1.02, backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
                                    className="flex items-center gap-4 p-1.5 pr-6 bg-black/60 backdrop-blur-md border border-white/10 rounded-full transition-all group"
                                >
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 p-0.5 shadow-lg group-hover:shadow-blue-500/20 transition-all">
                                        <div className="w-full h-full rounded-full bg-black flex items-center justify-center text-sm font-black text-white overflow-hidden">
                                            {user?.profile_photo ? (
                                                <img src={getAvatarUrl(user.profile_photo)} alt="Avatar" className="w-full h-full object-cover" />
                                            ) : (
                                                <span>{user?.username?.slice(0, 1).toUpperCase()}</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-left hidden md:block">
                                        <div className="text-[10px] font-black text-white tracking-widest uppercase leading-none mb-0.5">{user?.display_name || user?.username}</div>
                                        <div className="text-[8px] font-bold text-blue-500/60 uppercase tracking-tighter">{user?.role}</div>
                                    </div>
                                    <div className={`ml-2 transition-transform duration-300 ${showProfileDropdown ? 'rotate-180' : ''}`}>
                                        <Settings className="w-3.5 h-3.5 text-gray-600 group-hover:text-blue-400" />
                                    </div>
                                </motion.button>

                                {showProfileDropdown && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        className="absolute right-0 mt-4 w-72 bg-[#0c0c0e] border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden z-[9999] backdrop-blur-2xl"
                                    >
                                        <div className="p-6 bg-gradient-to-br from-blue-500/10 to-transparent border-b border-white/5">
                                            <div className="flex items-center gap-4 mb-4">
                                                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-2xl font-black text-white shadow-xl ring-2 ring-white/10 overflow-hidden">
                                                    {user?.profile_photo ? (
                                                        <img src={getAvatarUrl(user.profile_photo)} alt="Profile" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span>{user?.username?.slice(0, 1).toUpperCase()}</span>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-white font-black uppercase tracking-tighter truncate text-lg leading-tight">{user?.display_name || user?.username}</div>
                                                    <div className="text-[10px] text-blue-400/80 font-mono tracking-widest uppercase font-black mb-1">{user?.role}</div>
                                                    <div className="text-[9px] text-gray-500 font-mono truncate">{user?.email || 'OFFLINE_NODE@JOURVIX.NET'}</div>
                                                </div>
                                            </div>
                                            {user?.role !== 'admin' && (
                                                <div className="bg-white/5 rounded-lg py-1.5 px-3 flex items-center justify-between border border-white/5">
                                                    <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Efficiency Index</span>
                                                    <span className="text-xs font-mono text-blue-400 font-bold">{Math.floor(performance?.efficiency || 0)}</span>
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="p-2">
                                            <button 
                                                onClick={() => { setShowProfileModal(true); setShowProfileDropdown(false); }}
                                                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest group/item"
                                            >
                                                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover/item:bg-blue-500/20 transition-colors">
                                                    <User className="w-4 h-4 group-hover/item:text-blue-400" />
                                                </div>
                                                Change Profile
                                            </button>
                                            <div className="my-2 border-t border-white/5" />
                                            <button 
                                                onClick={() => { logout(); navigate('/login'); }}
                                                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-500/10 text-red-500/60 hover:text-red-500 transition-all text-[10px] font-black uppercase tracking-widest group/item"
                                            >
                                                <div className="w-8 h-8 rounded-lg bg-red-500/5 flex items-center justify-center group-hover/item:bg-red-500/20 transition-colors">
                                                    <LogOut className="w-4 h-4" />
                                                </div>
                                                Disconnect Node
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Daily Report Modal */}
                {showReportModal && createPortal(
                    <div className="fixed inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center z-[9999] p-4" style={{ position: 'fixed' }}>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-[#111] border border-white/20 rounded-2xl p-8 max-w-xl w-full shadow-[0_0_50px_rgba(0,0,0,0.5)] relative animate-in fade-in zoom-in duration-300"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent pointer-events-none rounded-2xl" />
                            <h2 className="text-2xl font-black text-white flex items-center gap-3 mb-2 uppercase tracking-tighter">
                                <span className="text-blue-500">📝</span> Activity Log
                            </h2>
                            <p className="text-gray-500 text-sm mb-6 font-medium">Summarize your operational achievements and identify any infrastructure blockers.</p>
                            <textarea
                                value={reportSummary}
                                onChange={(e) => setReportSummary(e.target.value)}
                                className="w-full h-48 bg-black/40 border border-white/10 p-4 rounded-xl text-white font-mono text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all placeholder:text-gray-700 resize-none custom-scrollbar"
                                placeholder="- Completed Task Alpha&#10;- Resolved Node latency issue&#10;- Investigating DB throughput bottleneck..."
                            />
                            <div className="flex justify-end gap-3 mt-8">
                                <button
                                    onClick={() => setShowReportModal(false)}
                                    className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:text-white hover:bg-white/5 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={async () => {
                                        if (!reportSummary.trim()) return;
                                        try {
                                            await api.post('/report/daily', { summary: reportSummary });
                                            alert("Operation Log Transmitted Successfully");
                                            setReportSummary("");
                                            setShowReportModal(false);
                                        } catch (e) { alert("Data transmission failed"); }
                                    }}
                                    className="px-8 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest bg-blue-600 hover:bg-blue-500 text-white shadow-xl shadow-blue-500/20 hover:shadow-blue-500/40 transition-all duration-300"
                                >
                                    Execute Send
                                </button>
                            </div>
                        </motion.div>
                    </div>,
                    document.body
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
                                className="bg-black/40 backdrop-blur-xl border border-white/10 p-8 rounded-2xl col-span-2 hover:border-blue-500/30 transition-all shadow-2xl flex flex-col"
                            >
                                <h3 className="text-xl font-bold mb-6 text-white flex items-center gap-2">
                                    <span className="text-blue-500">🎯</span> Project & Task Assignment
                                </h3>
                                <div className="mb-8">
                                    <motion.button
                                        whileHover={{ scale: 1.02, x: 5 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => setShowProjectModal(true)}
                                        className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-black uppercase tracking-[0.2em] py-4 rounded-xl shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.5)] transition-all flex items-center justify-center gap-3 group"
                                    >
                                        <span className="text-lg group-hover:rotate-12 transition-transform">✨</span> Create Team Project
                                    </motion.button>
                                </div>

                                <div className="relative mb-6">
                                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                        <div className="w-full border-t border-white/10"></div>
                                    </div>
                                    <div className="relative flex justify-center text-sm">
                                        <span className="px-4 bg-[#09090b] text-gray-500 font-bold uppercase tracking-widest text-[10px]">Or assign a single task</span>
                                    </div>
                                </div>

                                <form onSubmit={assignTask} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-4">
                                        <input
                                            type="text"
                                            placeholder="Task Title"
                                            value={newTaskTitle}
                                            onChange={e => setNewTaskTitle(e.target.value)}
                                            className="w-full bg-white/[0.03] border border-white/10 p-4 rounded-xl text-white placeholder:text-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all"
                                            required
                                        />
                                        <input
                                            type="text"
                                            placeholder="Description"
                                            value={newTaskDesc}
                                            onChange={e => setNewTaskDesc(e.target.value)}
                                            className="w-full bg-white/[0.03] border border-white/10 p-4 rounded-xl text-white placeholder:text-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all"
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <CustomSelect
                                            options={agents.map(a => ({ value: a.id, label: a.username, sub: a.role }))}
                                            value={selectedAgentId}
                                            onChange={setSelectedAgentId}
                                            placeholder="Select Agent..."
                                            centered={false}
                                        />
                                        <input
                                            type="datetime-local"
                                            value={newTaskDeadline}
                                            onChange={e => setNewTaskDeadline(e.target.value)}
                                            className="w-full bg-white/[0.03] border border-white/10 p-4 rounded-xl text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all text-xs font-mono uppercase"
                                        />
                                    </div>
                                    <motion.button
                                        whileHover={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
                                        whileTap={{ scale: 0.98 }}
                                        type="submit"
                                        className="md:col-span-2 bg-white/[0.05] hover:bg-white/[0.08] text-white font-bold uppercase tracking-widest text-[10px] border border-white/10 py-4 rounded-xl transition-all shadow-inner"
                                    >
                                        Quick Assign Pipeline Task
                                    </motion.button>
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
                                            <tr className="border-b border-white/10 text-gray-400">
                                                <th className="p-3">Agent</th>
                                                <th className="p-3">Performance Index</th>
                                                <th className="p-3">Status</th>
                                                <th className="p-3">Last Active</th>
                                                <th className="p-3">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {agents.map(agent => (
                                                <>
                                                    <tr key={agent.id} className="group/row hover:bg-white/[0.02] transition-colors">
                                                        <td className="p-3">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                                                                    {agent.profile_photo ? (
                                                                        <img src={getAvatarUrl(agent.profile_photo)} alt="" className="w-full h-full object-cover" />
                                                                    ) : (
                                                                        <span className="text-[10px] font-black">{agent.username.slice(0, 1).toUpperCase()}</span>
                                                                    )}
                                                                </div>
                                                                <div className="flex flex-col">
                                                                    <span className="text-white font-bold">{agent.username}</span>
                                                                    <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">{agent.role}</span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="p-3">
                                                            <div className="flex flex-col gap-2 w-44 bg-white/[0.03] border border-white/5 p-3 rounded-2xl group/perf hover:border-blue-500/30 transition-all">
                                                                <div className="flex justify-between items-end">
                                                                    <div className="flex flex-col">
                                                                        <span className="text-[7px] font-black text-gray-500 uppercase tracking-widest leading-none mb-1">Service Level</span>
                                                                        <span className="text-2xl font-black text-white tracking-tighter leading-none">{Math.floor(agent.efficiency)}</span>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <div className="flex flex-col items-end">
                                                                            <span className="text-[8px] font-black text-blue-400/80 uppercase tracking-widest">XP: {agent.performance_score}</span>
                                                                            <div className="flex items-center gap-1 mt-0.5">
                                                                                <span className="text-[7px] font-black text-blue-500/60 uppercase tracking-widest">Next</span>
                                                                                <span className="text-xs font-mono text-blue-400 font-bold">{Math.round(agent.performance_score % 100)}%</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                                                    <motion.div 
                                                                        initial={{ width: 0 }}
                                                                        animate={{ width: `${agent.performance_score % 100}%` }}
                                                                        className="h-full bg-gradient-to-r from-blue-600 to-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="p-3">
                                                            <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-tight ${getAgentAttendanceStatus(agent.id) === 'present' ? 'bg-success/20 text-success border border-success/30' : getAgentAttendanceStatus(agent.id) === 'absent' ? 'bg-danger/20 text-danger border border-danger/30' : 'bg-gray-700/20 text-gray-400 border border-white/10'}`}>
                                                                {getAgentAttendanceStatus(agent.id) || 'OFFLINE'}
                                                            </span>
                                                        </td>
                                                        <td className="p-3 text-[10px] font-mono text-gray-500 tabular-nums">
                                                            {agent.last_active ? new Date(agent.last_active).toLocaleString() : '---'}
                                                        </td>
                                                        <td className="p-3 space-x-2 flex">
                                                            <button onClick={() => markAttendance(agent.id, 'present')} className="px-2 py-1 bg-success/10 text-success border border-success/30 rounded text-[9px] uppercase font-bold">Present</button>
                                                            <button onClick={() => markAttendance(agent.id, 'absent')} className="px-2 py-1 bg-danger/10 text-danger border border-danger/30 rounded text-[9px] uppercase font-bold">Absent</button>
                                                            <button onClick={() => viewHistory(agent.id)} className="px-2 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded text-[9px] uppercase font-bold">History</button>
                                                            <div className="w-px h-6 bg-white/10 mx-1"></div>
                                                            <button 
                                                                onClick={() => promoteUser(agent)} 
                                                                className={`px-2 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/30 rounded text-[9px] uppercase font-bold ${agent.efficiency >= 50 ? 'animate-pulse bg-amber-500/20' : ''}`}
                                                            >
                                                                Promote
                                                            </button>
                                                            <button onClick={() => deleteUser(agent.id)} className="px-2 py-1 bg-white/5 text-gray-400 border border-white/10 rounded text-[9px] uppercase font-bold">Del</button>
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
                        <div className="col-span-1 md:col-span-3 h-full">
                            <WorkforceAnalyticsHUD 
                                targetUser={user}
                                perfData={performance}
                                tasksData={tasks}
                                getAvatarUrl={getAvatarUrl}
                                completeTask={completeTask}
                            />
                        </div>
                    )}
                </div>

                {/* Profile Modal */}
                {showProfileModal && createPortal(
                    <div className="fixed inset-0 bg-black/98 backdrop-blur-2xl flex items-center justify-center z-[99999] p-4" style={{ position: 'fixed' }}>
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 30 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            className="bg-[#0c0c0e] border border-white/10 rounded-[2.5rem] p-12 max-w-2xl w-full shadow-[0_0_100px_rgba(59,130,246,0.15)] relative overflow-hidden"
                        >
                            {/* Decorative Background Elements */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
                            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-600/5 rounded-full blur-[100px] pointer-events-none" />

                            <div className="relative z-10">
                                <header className="mb-10 text-center">
                                    <div className="inline-block px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.2em] mb-4">
                                        Identity Management
                                    </div>
                                    <h3 className="text-4xl font-black text-white tracking-tighter uppercase mb-2">Profile Configuration</h3>
                                    <p className="text-gray-500 font-medium text-sm">Update your system identifier and node credentials</p>
                                </header>

                                <div className="space-y-8">
                                    <div className="flex flex-col items-center gap-6 mb-8">
                                        <div className="relative group/avatar">
                                            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-primary to-blue-600 p-1 shadow-2xl overflow-hidden ring-4 ring-white/5 transition-transform duration-500 group-hover/avatar:scale-105">
                                                <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden">
                                                    {editProfile.profile_photo ? (
                                                        <img src={getAvatarUrl(editProfile.profile_photo)} alt="Preview" className="w-full h-full object-cover shadow-inner" />
                                                    ) : (
                                                        <span className="text-4xl font-black text-white">{user?.username?.slice(0, 1).toUpperCase()}</span>
                                                    )}
                                                </div>
                                            </div>
                                            <label className="absolute bottom-0 right-0 p-3 bg-blue-600 hover:bg-blue-500 rounded-full shadow-xl cursor-pointer transition-all hover:scale-110 active:scale-90 border border-white/20">
                                                <FileUp className="w-4 h-4 text-white" />
                                                <input 
                                                    type="file" 
                                                    className="hidden" 
                                                    onChange={async (e) => {
                                                        const file = e.target.files[0];
                                                        if (file) {
                                                            const formData = new FormData();
                                                            formData.append('file', file);
                                                            try {
                                                                const res = await api.post('/upload', formData);
                                                                setEditProfile(prev => ({ ...prev, profile_photo: res.data.path }));
                                                            } catch (err) { alert("Visual upload failure"); }
                                                        }
                                                    }}
                                                />
                                            </label>
                                        </div>
                                        <p className="text-[10px] text-gray-600 font-black uppercase tracking-widest">Authorized system avatar</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">System Display Name</label>
                                            <input
                                                type="text"
                                                value={editProfile.display_name}
                                                onChange={e => setEditProfile(prev => ({ ...prev, display_name: e.target.value }))}
                                                className="w-full bg-white/[0.03] border border-white/10 p-5 rounded-2xl text-white font-bold placeholder:text-gray-700 outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all shadow-inner"
                                                placeholder="Mission Identity..."
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Node Communication Email</label>
                                            <input
                                                type="email"
                                                value={editProfile.email}
                                                onChange={e => setEditProfile(prev => ({ ...prev, email: e.target.value }))}
                                                className="w-full bg-white/[0.03] border border-white/10 p-5 rounded-2xl text-white font-bold placeholder:text-gray-700 outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all shadow-inner"
                                                placeholder="node@jourvix.net"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4 mt-12">
                                    <button
                                        onClick={() => setShowProfileModal(false)}
                                        className="flex-1 px-8 py-5 border border-white/10 rounded-2xl text-[11px] font-black uppercase tracking-widest text-gray-500 hover:text-white hover:bg-white/5 transition-all active:scale-95"
                                    >
                                        Cancel Calibration
                                    </button>
                                    <button
                                        onClick={saveProfile}
                                        className="flex-3 px-12 py-5 bg-blue-600 border border-blue-500/50 hover:bg-blue-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] shadow-[0_0_30px_rgba(59,130,246,0.2)] hover:shadow-[0_0_50px_rgba(59,130,246,0.4)] transition-all active:scale-95"
                                    >
                                        Execute Update
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>,
                    document.body
                )}
            </div>
        </motion.div>
    );
}

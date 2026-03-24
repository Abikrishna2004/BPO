import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Lock, Shield, ChevronDown, CheckCircle, Monitor, Briefcase, Share2, Activity, UserCheck } from 'lucide-react';
import { CustomRoleSelect } from '../components/CustomDropdowns';

export default function RegisterAgent() {
    const { api } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        role: 'agent'
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            // Ensure endpoint matches backend (usually /register or /users)
            await api.post('/register', formData);
            setSuccess('New asset successfully added to the network.');
            setTimeout(() => navigate('/'), 1500);
        } catch (err) {
            setError(err.response?.data?.detail || 'Failed to register asset. Please verify credentials.');
        } finally {
            setLoading(false);
        }
    };

    // Role Categories Data
    const roleCategories = [
        {
            title: "Sales",
            icon: Briefcase,
            roles: ["Sales Executive"]
        },
        {
            title: "Technical",
            icon: Monitor,
            roles: ["Technical Support"]
        },
        {
            title: "LinkedIn & Social Pages",
            icon: Share2,
            roles: ["Social Media Manager"]
        },
        {
            title: "Digital Marketing",
            icon: Activity,
            roles: ["Digital Marketing Executive"]
        }
    ];

    return (
        <div className="min-h-screen bg-black text-gray-100 p-6 flex items-center justify-center relative">
            {/* Background Effects (Fixed to avoid scrollbars) */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="w-full max-w-lg bg-[#0f0f0f]/80 backdrop-blur-xl border border-white/10 p-8 md:p-10 rounded-3xl shadow-2xl relative z-10"
            >
                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/20 mb-4 text-white">
                        <UserCheck className="w-8 h-8" />
                    </div>
                    <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 uppercase tracking-tight">Register New Asset</h2>
                    <p className="text-gray-500 text-sm mt-2">Create profile for new network entity</p>
                </div>

                {error && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6 text-sm flex items-center gap-3">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        {error}
                    </motion.div>
                )}
                {success && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-green-500/10 border border-green-500/20 text-green-400 p-4 rounded-xl mb-6 text-sm flex items-center gap-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        {success}
                    </motion.div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Username */}
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Username</label>
                        <div className="relative group">
                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-purple-400 transition-colors" />
                            <input
                                type="text"
                                required
                                placeholder="Enter asset ID / Name"
                                className="w-full bg-black/40 border border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-sm text-white placeholder:text-gray-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:bg-white/5 outline-none transition-all"
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Email */}
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Email Coordinates</label>
                        <div className="relative group">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-purple-400 transition-colors" />
                            <input
                                type="email"
                                required
                                placeholder="name@organization.com"
                                className="w-full bg-black/40 border border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-sm text-white placeholder:text-gray-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:bg-white/5 outline-none transition-all"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Secure Access Key</label>
                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-purple-400 transition-colors" />
                            <input
                                type="password"
                                required
                                placeholder="••••••••••••"
                                className="w-full bg-black/40 border border-white/10 rounded-xl py-3.5 pl-11 pr-4 text-sm text-white placeholder:text-gray-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:bg-white/5 outline-none transition-all"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Role Dropdown */}
                    <div className="space-y-1 relative z-50">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Designation & Access Level</label>
                        <CustomRoleSelect
                            categories={roleCategories}
                            value={formData.role}
                            onChange={(role) => setFormData({ ...formData, role: role })}
                            dropup={true}
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4 pt-4 mt-2 relative z-10">
                        <button
                            type="button"
                            onClick={() => navigate('/')}
                            className="w-1/3 py-3.5 rounded-xl border border-white/10 hover:bg-white/5 text-gray-400 hover:text-white font-bold text-sm transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-2/3 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-purple-900/20 transition-all transform active:scale-95 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <Activity className="w-4 h-4 animate-spin" />
                            ) : (
                                <Shield className="w-4 h-4" />
                            )}
                            {loading ? 'Registering...' : 'Register Asset'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, User, Mail, Shield, Award, Trophy, Star, Camera, Edit2, Activity, CheckCircle, XCircle } from 'lucide-react';

export default function Profile() {
    const { user, api } = useAuth();
    const navigate = useNavigate();
    const [achievements, setAchievements] = useState([]);
    const [loading, setLoading] = useState(true);

    // Image Upload
    const fileInputRef = useRef(null);
    const [uploadingImage, setUploadingImage] = useState(false);

    // Profile Request Edit
    const [showEditModal, setShowEditModal] = useState(false);
    const [newUsername, setNewUsername] = useState("");
    const [newEmail, setNewEmail] = useState("");
    const [requesting, setRequesting] = useState(false);

    // Admin Requests View
    const [pendingRequests, setPendingRequests] = useState([]);
    const [loadingRequests, setLoadingRequests] = useState(false);

    useEffect(() => {
        const loadProfile = async () => {
            if (!user) return;
            try {
                // Fetch achievements for the current user
                const res = await api.get(`/users/${user.id}/achievements`);
                setAchievements(res.data);

                if (user.role === 'admin') {
                    setLoadingRequests(true);
                    const reqs = await api.get('/profile-requests');
                    setPendingRequests(reqs.data);
                    setLoadingRequests(false);
                }
            } catch (error) {
                console.error("Failed to fetch data", error);
                setLoadingRequests(false);
            } finally {
                setLoading(false);
            }
        };
        loadProfile();
    }, [user, api]);

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Basic validation and conversion to base64
        if (file.size > 2 * 1024 * 1024) {
            alert("Image must be less than 2MB");
            return;
        }

        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64String = reader.result;
            setUploadingImage(true);
            try {
                await api.put('/users/me/profile_image', { profile_image: base64String });
                alert("Profile image updated! Please refresh the page to see changes across the app.");
                window.location.reload();
            } catch (err) {
                console.error("Failed to upload image", err);
                alert("Failed to upload image.");
            } finally {
                setUploadingImage(false);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleProfileRequest = async (e) => {
        e.preventDefault();
        if (!newUsername && !newEmail) return alert("Please enter at least one new value.");

        setRequesting(true);
        try {
            await api.post('/profile-requests', {
                new_username: newUsername || null,
                new_email: newEmail || null
            });
            alert("Profile update request sent to Admin successfully!");
            setShowEditModal(false);
            setNewUsername("");
            setNewEmail("");
        } catch (error) {
            console.error(error);
            alert("Failed to send request.");
        } finally {
            setRequesting(false);
        }
    };

    const handleAdminAction = async (requestId, action) => {
        try {
            await api.put(`/profile-requests/${requestId}/${action}`);
            setPendingRequests(prev => prev.filter(r => r.id !== requestId));
        } catch (error) {
            console.error("Failed to perform action", error);
            alert("Failed to process request.");
        }
    };

    if (!user) return null;

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
                <span className="font-medium text-sm">Back to Dashboard</span>
            </motion.button>

            <div className="max-w-6xl mx-auto mb-10 pt-16 relative">
                <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight uppercase text-center mb-12">
                    Personnel Profile
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* User Details Box */}
                    <div className="md:col-span-1">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-[#0f0f0f] rounded-3xl border border-white/5 p-8 text-center shadow-[0_0_50px_rgba(255,255,255,0.03)] relative overflow-hidden group h-full flex flex-col"
                        >
                            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500"></div>

                            {/* Avatar Section */}
                            <div className="relative w-32 h-32 mx-auto mb-4 group/avatar">
                                {user.profile_image ? (
                                    <img src={user.profile_image} alt={user.username} className="w-full h-full object-cover rounded-2xl shadow-[0_0_30px_rgba(139,92,246,0.3)] transition-transform duration-500 group-hover/avatar:scale-105" />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-5xl font-black text-white shadow-[0_0_30px_rgba(139,92,246,0.3)] transition-transform duration-500 group-hover/avatar:scale-105">
                                        {user.username.charAt(0).toUpperCase()}
                                    </div>
                                )}

                                {/* Image Upload Overlay */}
                                <div onClick={() => !uploadingImage && fileInputRef.current?.click()} className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-2xl opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center cursor-pointer transition-all duration-300">
                                    {uploadingImage ? <Activity className="w-8 h-8 text-white animate-spin" /> : <Camera className="w-8 h-8 text-white" />}
                                </div>
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                            </div>

                            <h3 className="text-2xl font-bold text-white mb-1 group-hover:text-blue-400 transition-colors">{user.username}</h3>
                            <p className="text-sm text-gray-400 capitalize flex items-center justify-center gap-2 mb-6">
                                <Shield className="w-4 h-4 text-purple-500" />
                                {user.role}
                            </p>

                            <div className="space-y-4 text-left flex-grow">
                                <div className="bg-black/40 rounded-xl p-3 border border-white/5 group-hover:border-white/10 transition-colors">
                                    <div className="text-[10px] uppercase text-gray-500 font-bold mb-1 flex items-center gap-2">
                                        <Mail className="w-3 h-3" /> Email
                                    </div>
                                    <div className="text-sm font-mono text-gray-300 truncate">
                                        {user.email || "No email added"}
                                    </div>
                                </div>
                                <div className="bg-black/40 rounded-xl p-3 border border-white/5 group-hover:border-white/10 transition-colors">
                                    <div className="text-[10px] uppercase text-gray-500 font-bold mb-1 flex items-center gap-2">
                                        <User className="w-3 h-3" /> Profile ID
                                    </div>
                                    <div className="text-sm font-mono text-gray-300">
                                        #{user.id.toString().padStart(4, '0')}
                                    </div>
                                </div>
                            </div>

                            <button onClick={() => setShowEditModal(true)} className="mt-6 w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold uppercase tracking-widest text-gray-300 hover:text-white transition-all flex items-center justify-center gap-2">
                                <Edit2 className="w-3 h-3" /> Request Updates
                            </button>

                        </motion.div>
                    </div>

                    {/* Achievements Box */}
                    <div className="md:col-span-2">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-[#0f0f0f] rounded-3xl border border-yellow-500/20 p-8 shadow-[0_0_50px_rgba(234,179,8,0.08)] h-full flex flex-col"
                        >
                            <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
                                <div className="p-2 bg-yellow-500/10 rounded-lg">
                                    <Trophy className="w-6 h-6 text-yellow-500" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold uppercase tracking-wider text-white">Achievements & Awards</h3>
                                    <p className="text-xs text-gray-500">Your recognized accomplishments</p>
                                </div>
                            </div>

                            <div className="space-y-4 flex-grow overflow-y-auto custom-scrollbar pr-2 max-h-[400px]">
                                {loading ? (
                                    <div className="text-center text-gray-500 text-sm py-10 animate-pulse">Loading vault...</div>
                                ) : achievements.length > 0 ? (
                                    achievements.map((ach) => (
                                        <div key={ach.id} className="bg-gradient-to-r from-yellow-500/5 to-black/60 border border-yellow-500/10 rounded-2xl p-4 flex gap-4 hover:border-yellow-500/30 transition-colors group/award">
                                            <div className="bg-yellow-500/10 p-3 rounded-xl h-fit border border-yellow-500/20 group-hover/award:scale-110 transition-transform">
                                                <Award className="w-6 h-6 text-yellow-500" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start mb-1">
                                                    <h4 className="font-bold text-white text-lg">{ach.title}</h4>
                                                    {ach.amount && (
                                                        <span className="text-xs font-mono font-bold text-green-400 bg-green-500/10 px-2 py-1 rounded-md border border-green-500/20 shadow-[0_0_10px_rgba(34,197,94,0.2)]">
                                                            ₹ {ach.amount}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-gray-400 text-sm line-clamp-2 leading-relaxed mb-2">
                                                    {ach.description}
                                                </p>
                                                <div className="text-[10px] text-gray-500 font-mono">
                                                    Award {ach.type.toUpperCase()} • {new Date(ach.date_awarded).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-16 text-center opacity-50 h-full">
                                        <Star className="w-12 h-12 text-gray-600 mb-4" />
                                        <p className="text-gray-400 font-bold text-sm tracking-widest uppercase mb-1">Vault Empty</p>
                                        <p className="text-xs text-gray-500">No achievements awarded yet. Keep pushing!</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>

                    {/* Admin Requests Panel (Only visible to Admin) */}
                    {user.role === 'admin' && (
                        <div className="md:col-span-3 mt-4">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="bg-[#0f0f0f] rounded-3xl border border-blue-500/20 p-8 shadow-[0_0_50px_rgba(59,130,246,0.08)]"
                            >
                                <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
                                    <div className="p-2 bg-blue-500/10 rounded-lg">
                                        <Shield className="w-6 h-6 text-blue-500" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold uppercase tracking-wider text-white">Pending Profile Requests</h3>
                                        <p className="text-xs text-gray-500">Approve or reject employee profile updates</p>
                                    </div>
                                </div>

                                <div className="grid gap-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                                    {loadingRequests ? (
                                        <div className="text-center py-8 text-gray-500 animate-pulse">Loading requests...</div>
                                    ) : pendingRequests.length > 0 ? (
                                        pendingRequests.map(req => (
                                            <div key={req.id} className="bg-black/40 border border-white/10 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:border-blue-500/30 transition-colors">
                                                <div className="flex-1">
                                                    <div className="text-xs font-mono text-gray-500 mb-1">Request #{req.id} • User ID: {req.user_id}</div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        {req.new_username && (
                                                            <div>
                                                                <span className="text-[10px] text-gray-500 uppercase font-bold">New Username:</span>
                                                                <p className="font-bold text-blue-400">{req.new_username}</p>
                                                            </div>
                                                        )}
                                                        {req.new_email && (
                                                            <div>
                                                                <span className="text-[10px] text-gray-500 uppercase font-bold">New Email:</span>
                                                                <p className="font-bold text-purple-400">{req.new_email}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button onClick={() => handleAdminAction(req.id, 'approve')} className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-lg font-bold text-xs uppercase hover:scale-105 transition-all flex items-center gap-2">
                                                        <CheckCircle className="w-4 h-4" /> Approve
                                                    </button>
                                                    <button onClick={() => handleAdminAction(req.id, 'reject')} className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg font-bold text-xs uppercase hover:scale-105 transition-all flex items-center gap-2">
                                                        <XCircle className="w-4 h-4" /> Reject
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-8 text-gray-500 text-sm">No pending requests.</div>
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    )}
                </div>
            </div>

            {/* Edit Profile Request Modal */}
            <AnimatePresence>
                {showEditModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[999] p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-[#111] border border-white/10 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl relative"
                        >
                            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500"></div>

                            <div className="p-6">
                                <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                                    <Edit2 className="w-5 h-5 text-blue-500" />
                                    Request Information Update
                                </h3>
                                <p className="text-xs text-gray-500 mb-6">
                                    Any changes to your username or email must be approved by an administrator before taking effect.
                                </p>

                                <form onSubmit={handleProfileRequest} className="space-y-4">
                                    <div>
                                        <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1 ml-1">New Username</label>
                                        <input
                                            type="text"
                                            value={newUsername}
                                            onChange={(e) => setNewUsername(e.target.value)}
                                            placeholder="Leave blank to keep current"
                                            className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors placeholder-gray-600"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1 ml-1">New Email</label>
                                        <input
                                            type="email"
                                            value={newEmail}
                                            onChange={(e) => setNewEmail(e.target.value)}
                                            placeholder="Leave blank to keep current"
                                            className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors placeholder-gray-600"
                                        />
                                    </div>

                                    <div className="pt-4 flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setShowEditModal(false)}
                                            className="flex-1 py-3 px-4 rounded-xl font-bold bg-white/5 hover:bg-white/10 text-gray-300 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={requesting || (!newUsername && !newEmail)}
                                            className="flex-1 py-3 px-4 rounded-xl font-bold bg-blue-600 hover:bg-blue-500 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            {requesting ? <Activity className="w-4 h-4 animate-spin" /> : "Submit Request"}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

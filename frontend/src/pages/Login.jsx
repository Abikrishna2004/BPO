import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [showLogin, setShowLogin] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await login(username, password);
            navigate('/');
        } catch (err) {
            setError('Invalid credentials');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background overflow-hidden relative p-4">
            {/* Background Ambience */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <motion.div
                    animate={{ x: [0, 100, 0], y: [0, -50, 0], scale: [1, 1.2, 1] }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                    className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[120px]"
                />
                <motion.div
                    animate={{ x: [0, -100, 0], y: [0, 50, 0], scale: [1, 1.1, 1] }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                    className="absolute bottom-[0%] right-[0%] w-[40%] h-[40%] rounded-full bg-accent/20 blur-[100px]"
                />
            </div>

            {/* Main Container */}
            <div className={`relative z-10 flex flex-col md:flex-row items-center transition-all duration-700 ${showLogin ? 'gap-0' : ''}`}>

                {/* 1. The Box (Logo) */}
                <motion.div
                    layout
                    onClick={() => !showLogin && setShowLogin(true)}
                    className={`bg-secondary/80 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl flex flex-col items-center justify-center relative z-20 transition-all duration-500 cursor-pointer hover:border-primary/50 hover:shadow-primary/20
                    ${showLogin ? 'w-full md:w-[320px] h-[400px] md:rounded-r-none border-r-0' : 'w-[300px] h-[300px] hover:scale-105'}`}
                >
                    <motion.img
                        layout="position"
                        src="/logo.png"
                        alt="Jourvix Logo"
                        className={`object-contain rounded-xl border border-white/5 shadow-lg shadow-primary/10 transition-all duration-500 ${showLogin ? 'h-24 w-24 mb-6' : 'h-32 w-32 mb-6'}`}
                    />

                    <motion.div layout="position" className="text-center">
                        <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                            JOURVIX
                        </h2>
                        <p className="text-gray-400 text-sm mt-2">From Vision to Victory</p>
                    </motion.div>

                    {!showLogin && (
                        <motion.button
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="mt-8 px-6 py-2 bg-white/5 rounded-full text-xs font-mono text-primary border border-primary/20 hover:bg-primary/20 transition-colors animate-pulse"
                        >
                            TOUCH TO ACCESS
                        </motion.button>
                    )}
                </motion.div>

                {/* 2. The Form (Slides Out) */}
                <motion.div
                    initial={{ width: 0, opacity: 0, x: -50 }}
                    animate={{
                        width: showLogin ? (window.innerWidth < 768 ? '100%' : '320px') : 0,
                        height: showLogin ? '400px' : '300px',
                        opacity: showLogin ? 1 : 0,
                        x: showLogin ? 0 : -50
                    }}
                    transition={{ type: "spring", stiffness: 120, damping: 20 }}
                    className={`bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl md:rounded-l-none border-l-0 shadow-xl overflow-hidden flex flex-col justify-center relative z-10 ${!showLogin ? 'hidden' : 'block'}`}
                >
                    <div className="p-8 w-full md:w-[320px]">
                        <h3 className="text-xl font-semibold mb-6 text-white">Identify Yourself</h3>

                        {error && (
                            <div className="bg-danger/10 border border-danger/20 text-danger p-2 rounded text-xs text-center mb-4">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-sm text-white focus:ring-1 focus:ring-primary focus:border-primary/50 transition-all outline-none"
                                    placeholder="Username"
                                    autoFocus
                                />
                            </div>
                            <div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-sm text-white focus:ring-1 focus:ring-primary focus:border-primary/50 transition-all outline-none"
                                    placeholder="Access Code"
                                />
                            </div>

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    className="w-full bg-primary hover:bg-primary/90 text-white text-sm font-bold py-2 rounded shadow-lg shadow-primary/20 transition-all"
                                >
                                    Access Jourvix 
                                </button>
                            </div>
                        </form>

                        <button
                            onClick={(e) => { e.stopPropagation(); setShowLogin(false); }}
                            className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
                        >
                            ✕
                        </button>
                    </div>
                </motion.div>

            </div>
        </div>
    );
}

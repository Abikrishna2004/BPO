import React from 'react';
import { Home, Phone, Users, BarChart2, Settings, Layers, Headphones } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const NavItem = ({ icon: Icon, label, to, active }) => (
    <Link to={to} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${active ? 'bg-neon-blue/10 text-neon-blue shadow-glow-blue border border-neon-blue/20' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
        <Icon size={20} className={`transition-transform duration-300 group-hover:scale-110 ${active ? 'text-neon-blue' : ''}`} />
        <span className="font-medium tracking-wide">{label}</span>
        {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-neon-blue shadow-glow-blue" />}
    </Link>
);

import { useAuth } from '../context/AuthContext';
import { LogOut } from 'lucide-react';

// ... (keep structure)

const Sidebar = () => {
    const location = useLocation();
    const { user, logout } = useAuth();

    return (
        <aside className="w-72 h-full bg-[#0a0a12]/80 backdrop-blur-xl border-r border-white/5 flex flex-col z-20 relative">
            <div className="absolute inset-0 bg-gradient-to-b from-blue-900/5 to-purple-900/5 pointer-events-none" />

            {/* Header kept same */}
            <div className="p-8 border-b border-white/5 relative z-10">
                <div className="flex items-center gap-3 mb-1">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-neon-blue to-blue-600 flex items-center justify-center shadow-glow-blue">
                        <Headphones className="text-white" size={20} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-neon-blue to-white bg-clip-text text-transparent tracking-tight">
                            JOURVIX
                        </h1>
                    </div>
                </div>
                <p className="text-[10px] text-gray-500 tracking-[0.2em] font-bold uppercase ml-1">Powered by CJ</p>
            </div>

            <nav className="flex-1 p-6 space-y-2 relative z-10 overflow-y-auto">
                <div className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-4 px-2">Main Menu</div>
                <NavItem icon={Home} label="Dashboard" to="/" active={location.pathname === '/'} />
                <NavItem icon={Phone} label="Live Operations" to="/calls" active={location.pathname === '/calls'} />
                <NavItem icon={Users} label="Workforce" to="/agents" active={location.pathname === '/agents'} />
                <NavItem icon={Layers} label="Queues & SLA" to="/queues" active={location.pathname === '/queues'} />

                <div className="text-xs font-bold text-gray-600 uppercase tracking-wider mt-8 mb-4 px-2">Management</div>
                <NavItem icon={BarChart2} label="Analytics" to="/analytics" active={location.pathname === '/analytics'} />
                <NavItem icon={Settings} label="System Config" to="/settings" active={location.pathname === '/settings'} />
            </nav>

            <div className="p-6 border-t border-white/5 relative z-10 space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 overflow-hidden border-2 border-white/10">
                        <img src={`https://ui-avatars.com/api/?name=${user?.display_name || user?.username || 'User'}&background=random`} alt="User" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold truncate text-white">{user?.display_name || user?.username || 'Guest'}</div>
                        <div className="text-xs text-neon-blue truncate">{user?.role || 'Viewer'}</div>
                    </div>
                </div>
                <button
                    onClick={logout}
                    className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold text-red-500 bg-red-500/10 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition-all"
                >
                    <LogOut size={14} />
                    Sign Out
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;

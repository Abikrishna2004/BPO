import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, CheckCircle, Shield, Search, X } from 'lucide-react';

// --- Animation Variants ---
const dropdownVariants = {
    hidden: {
        opacity: 0,
        y: -10,
        scale: 0.95,
        filter: "blur(10px)",
        transition: { duration: 0.2 }
    },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        filter: "blur(0px)",
        transition: {
            type: "spring",
            stiffness: 300,
            damping: 25,
            staggerChildren: 0.05,
            delayChildren: 0.1
        }
    },
    exit: {
        opacity: 0,
        y: -10,
        scale: 0.95,
        filter: "blur(10px)",
        transition: { duration: 0.2 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 }
};

// --- Custom Select (Advanced with Search) ---
export function CustomSelect({ options, value, onChange, placeholder, icon: Icon, centered = false }) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const containerRef = useRef(null);
    const searchInputRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Focus search input when opened
    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            setTimeout(() => searchInputRef.current.focus(), 100);
        } else {
            setSearchTerm(""); // Reset search on close
        }
    }, [isOpen]);

    const filteredOptions = useMemo(() => {
        return options.filter(opt =>
            opt.label.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [options, searchTerm]);

    const selectedOption = options.find(o => o.value == value);
    const label = selectedOption ? selectedOption.label : value;

    return (
        <div ref={containerRef} className="relative w-full z-50">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full bg-white/5 border ${isOpen ? 'border-primary ring-2 ring-primary/50 shadow-[0_0_30px_rgba(59,130,246,0.3)] bg-black/80' : 'border-white/10 hover:border-white/30 hover:bg-white/10'} rounded-xl py-4 px-5 text-sm text-left flex items-center justify-between transition-all duration-300 group backdrop-blur-xl relative overflow-hidden`}
            >
                {/* Advanced Glow Effect */}
                <div className={`absolute inset-0 bg-gradient-to-r from-primary/20 via-transparent to-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                <div className={`flex items-center gap-3 w-full relative z-10 ${centered ? 'justify-center' : ''}`}>
                    {Icon && <Icon className={`w-5 h-5 transition-colors ${isOpen ? 'text-primary' : 'text-gray-500 group-hover:text-gray-300'}`} />}
                    <span className={`truncate text-base ${value ? 'text-white font-semibold tracking-wide' : 'text-gray-500'} ${centered ? 'text-center' : ''}`}>
                        {label || placeholder || "Select Option..."}
                    </span>
                </div>
                <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform duration-500 ${isOpen ? 'rotate-180 text-primary' : ''} absolute right-4 z-10`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        variants={dropdownVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="absolute top-[calc(100%+8px)] left-0 w-full bg-[#09090b]/95 border border-white/10 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] overflow-hidden z-[9999] ring-1 ring-white/5 backdrop-blur-3xl origin-top"
                    >
                        {/* Search Bar (Only if > 5 options or specifically requested, doing always for now for "advanced" feel) */}
                        <div className="p-3 border-b border-white/10 bg-white/5">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    placeholder="Search..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg py-2 pl-9 pr-8 text-sm text-white focus:ring-1 focus:ring-primary focus:border-primary/50 outline-none transition-all placeholder:text-gray-600"
                                />
                                {searchTerm && (
                                    <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                                        <X className="w-3 h-3" />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="p-2 space-y-1 max-h-[350px] overflow-y-auto custom-scrollbar">
                            {filteredOptions.length === 0 ? (
                                <div className="px-4 py-8 text-sm text-gray-500 text-center flex flex-col items-center gap-2">
                                    <Search className="w-8 h-8 opacity-20" />
                                    No results found
                                </div>
                            ) : (
                                filteredOptions.map((opt) => (
                                    <motion.div
                                        key={opt.value}
                                        variants={itemVariants}
                                        layout
                                        onClick={() => { onChange(opt.value); setIsOpen(false); }}
                                        className={`px-4 py-3 rounded-xl cursor-pointer flex items-center group transition-all duration-200 relative overflow-hidden ${opt.value == value ? 'bg-primary/20 text-primary ring-1 ring-primary/30 shadow-[0_0_15px_rgba(59,130,246,0.1)]' : 'hover:bg-white/10 text-gray-400 hover:text-white'} ${centered ? 'justify-center' : 'justify-between'}`}
                                    >
                                        {opt.value == value && <motion.div layoutId="activeSelect" className="absolute inset-0 bg-primary/10" />}
                                        <div className={`flex flex-col relative z-10 ${centered ? 'items-center' : 'items-start'}`}>
                                            <span className="text-sm font-medium">{opt.label}</span>
                                            {opt.sub && <span className="text-[10px] text-gray-500 uppercase tracking-wider">{opt.sub}</span>}
                                        </div>
                                        {opt.value == value && !centered && <CheckCircle className="w-4 h-4 text-primary relative z-10" />}
                                        {opt.value == value && centered && <CheckCircle className="w-4 h-4 text-primary ml-2 relative z-10" />}
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// --- Custom Role Select (Categorized with Advanced UI) ---
export function CustomRoleSelect({ categories, value, onChange, placeholder, centered = true }) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const findRoleCategory = (role) => {
        if (!categories) return null;
        for (const cat of categories) {
            if (cat.roles.includes(role)) return cat;
        }
        return null;
    };

    const currentCat = findRoleCategory(value);

    return (
        <div ref={containerRef} className="relative w-full z-40">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full bg-white/5 border ${isOpen ? 'border-primary ring-2 ring-primary/50 shadow-[0_0_30px_rgba(59,130,246,0.3)] bg-black/80' : 'border-white/10 hover:border-white/30 hover:bg-white/10'} rounded-xl py-4 px-5 text-sm text-left flex items-center justify-between transition-all duration-300 group backdrop-blur-xl relative overflow-hidden`}
            >
                <div className={`absolute inset-0 bg-gradient-to-r from-primary/20 via-transparent to-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                <div className={`flex items-center gap-3 w-full relative z-10 ${centered ? 'justify-center' : ''}`}>
                    {currentCat && currentCat.icon ? (
                        <currentCat.icon className={`w-5 h-5 transition-colors ${isOpen ? 'text-primary' : 'text-primary/70 group-hover:text-primary'}`} />
                    ) : (
                        <Shield className={`w-5 h-5 transition-colors ${isOpen ? 'text-primary' : 'text-gray-500 group-hover:text-gray-300'}`} />
                    )}

                    <span className={`truncate font-semibold tracking-wide ${value ? 'text-white' : 'text-gray-500'} ${centered ? 'text-center' : ''}`}>
                        {value || placeholder || "Select Role..."}
                    </span>
                </div>
                <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform duration-500 ${isOpen ? 'rotate-180 text-primary' : ''} absolute right-4 z-10`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        variants={dropdownVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className="absolute top-[calc(100%+8px)] left-0 w-full bg-[#09090b]/95 border border-white/10 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] overflow-hidden z-[9999] max-h-[300px] overflow-y-auto custom-scrollbar ring-1 ring-white/5 backdrop-blur-3xl origin-top"
                    >
                        {categories.map((cat, idx) => (
                            <motion.div key={idx} variants={itemVariants} className="border-b border-white/5 last:border-0 relative">
                                <div className={`sticky top-0 bg-[#09090b]/90 backdrop-blur-md px-4 py-2 text-[10px] font-bold uppercase text-gray-500 tracking-wider flex items-center gap-2 z-20 border-b border-white/5 ${centered ? 'justify-center' : ''}`}>
                                    {cat.icon && <cat.icon className="w-3 h-3 text-primary/50" />}
                                    {cat.title}
                                </div>

                                <div className="p-2 space-y-1 relative z-0">
                                    {cat.roles.map((role) => (
                                        <motion.div
                                            key={role}
                                            layout
                                            onClick={() => { onChange(role); setIsOpen(false); }}
                                            className={`px-4 py-3 rounded-xl cursor-pointer flex items-center group transition-all duration-200 relative overflow-hidden ${role === value ? 'bg-primary/20 text-primary ring-1 ring-primary/30 shadow-[0_0_15px_rgba(59,130,246,0.1)]' : 'hover:bg-white/10 text-gray-400 hover:text-white'} ${centered ? 'justify-center' : 'justify-between'}`}
                                        >
                                            {role === value && <motion.div layoutId="activeRoleSelect" className="absolute inset-0 bg-primary/10" />}
                                            <span className="text-sm font-medium relative z-10">{role}</span>
                                            {role === value && centered && <CheckCircle className="w-4 h-4 text-primary ml-2 relative z-10" />}
                                            {role === value && !centered && <CheckCircle className="w-4 h-4 text-primary relative z-10" />}
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Briefcase, User, Clock } from 'lucide-react';

const OnboardingForm = ({ onSubmit }) => {
    const [formData, setFormData] = useState({
        name: '',
        domain: '',
        age: '',
        experience: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (formData.name && formData.domain && formData.age && formData.experience) {
            onSubmit(formData);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center w-full max-w-lg p-8 mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-8"
            >
                <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-shibu-accent to-shibu-neon mb-2">
                    Identity Verification
                </h1>
                <p className="text-slate-400">Initialize profile for interview session.</p>
            </motion.div>

            <motion.form
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                onSubmit={handleSubmit}
                className="w-full bg-slate-800/50 backdrop-blur-md border border-slate-700 p-8 rounded-2xl shadow-2xl relative overflow-hidden"
            >
                {/* Glow effect */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-gradient-to-r from-transparent via-shibu-accent to-transparent opacity-50" />

                <div className="space-y-6">
                    <div className="group">
                        <label className="block text-sm font-medium text-slate-400 mb-1">Full Name</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-shibu-accent transition-colors" size={18} />
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Arun Kumar"
                                className="w-full bg-slate-900/80 border border-slate-700 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-shibu-accent focus:ring-1 focus:ring-shibu-accent transition-all"
                            />
                        </div>
                    </div>

                    <div className="group">
                        <label className="block text-sm font-medium text-slate-400 mb-1">Target Domain</label>
                        <div className="relative">
                            <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-shibu-accent transition-colors" size={18} />
                            <select
                                name="domain"
                                value={formData.domain}
                                onChange={handleChange}
                                className="w-full bg-slate-900/80 border border-slate-700 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-shibu-accent focus:ring-1 focus:ring-shibu-accent transition-all appearance-none"
                            >
                                <option value="">Select Domain</option>
                                <option value="IT">Information Technology</option>
                                <option value="Biology">Biology</option>
                                <option value="Cloud">Cloud Computing</option>
                                <option value="Finance">Finance</option>
                                <option value="Marketing">Marketing</option>
                            </select>
                        </div>
                    </div>

                    <div className="group">
                        <label className="block text-sm font-medium text-slate-400 mb-1">Candidate Age</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-shibu-neon transition-colors" size={18} />
                            <input
                                type="number"
                                name="age"
                                value={formData.age}
                                onChange={handleChange}
                                placeholder="25"
                                className="w-full bg-slate-900/80 border border-slate-700 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-shibu-neon focus:ring-1 focus:ring-shibu-neon transition-all"
                            />
                        </div>
                    </div>

                    <div className="group">
                        <label className="block text-sm font-medium text-slate-400 mb-1">Years of Experience</label>
                        <div className="relative">
                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition-colors" size={18} />
                            <input
                                type="number"
                                name="experience"
                                value={formData.experience}
                                onChange={handleChange}
                                placeholder="3"
                                className="w-full bg-slate-900/80 border border-slate-700 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
                            />
                        </div>
                    </div>
                </div>

                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="mt-8 w-full bg-gradient-to-r from-shibu-accent to-shibu-neon text-white font-bold py-3 px-6 rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 transition-shadow"
                >
                    Initialize Interview <ArrowRight size={20} />
                </motion.button>
            </motion.form>
        </div>
    );
};

export default OnboardingForm;

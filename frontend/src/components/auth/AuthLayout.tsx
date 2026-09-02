import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';

export default function AuthLayout({ children, title, subtitle }: { children: React.ReactNode, title: string, subtitle: string }) {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex bg-bg-dark relative overflow-hidden selection:bg-brand-500/30 text-slate-200">
      
      {/* Global Background Ambient Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-900/40 via-bg-dark to-bg-dark opacity-80" />
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-brand-500/20 rounded-full blur-[140px] pointer-events-none mix-blend-screen animate-[pulse_6s_ease-in-out_infinite]" />
      <div className="absolute bottom-[-20%] right-[30%] w-[40%] h-[40%] bg-accent-500/20 rounded-full blur-[120px] pointer-events-none mix-blend-screen animate-[pulse_8s_ease-in-out_infinite_alternate]" />


      {/* Left Column: Form */}
      <div className="flex-1 flex flex-col justify-center relative z-10 w-full lg:w-1/2 px-6 sm:px-12 lg:px-24 py-12">
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-sm mx-auto"
        >
            <Link to="/" className="flex items-center justify-center mx-auto mb-10 group w-max">
              <div className="flex items-center gap-2.5 px-5 py-2.5 bg-surface-dark/40 backdrop-blur-md rounded-full border border-white/10 shadow-[0_0_30px_rgba(6,182,212,0.15)] group-hover:bg-surface-dark/60 group-hover:border-white/20 transition-all duration-300">
                <div className="relative flex items-center justify-center">
                  <div className="absolute inset-1 bg-brand-400/20 blur-md rounded-full group-hover:bg-brand-400/40 transition-colors duration-500"></div>
                  <img src="/logo-monevra.png" alt="Logo" className="h-10 w-auto object-contain relative z-10 drop-shadow-[0_0_10px_rgba(255,255,255,0.2)] group-hover:scale-110 transition-transform duration-300" />
                </div>
                <span className="font-display font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-brand-400 to-accent-400">
                  Monevra
                </span>
              </div>
            </Link>

          <div className="bg-surface-dark/40 backdrop-blur-xl border border-white/10 p-8 sm:p-12 rounded-[2.5rem] shadow-2xl relative overflow-hidden group hover:border-brand-500/30 transition-all duration-700">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-brand-500/20 transition-colors duration-700"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent-500/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-accent-500/20 transition-colors duration-700"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
            
            <div className="relative z-10">
              <h2 className="text-3xl font-display font-bold tracking-tight text-white mb-2">
                {title}
              </h2>
              <p className="text-sm text-slate-400 mb-8">
                {subtitle}
              </p>
              {children}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Right Column: Visual Showcase (Hidden on Mobile) */}
      <div className="hidden lg:flex flex-1 relative items-center justify-center p-12 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-brand-950/40 via-surface-dark to-bg-dark" />
        <div className="absolute top-[-20%] right-[-10%] w-[80%] h-[80%] bg-brand-600/25 rounded-full blur-[160px] pointer-events-none mix-blend-screen" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[80%] h-[80%] bg-accent-600/25 rounded-full blur-[160px] pointer-events-none mix-blend-screen" />
        
        {/* Abstract Glassmorphism Element */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
          className="relative w-full max-w-lg aspect-square"
        >
          {/* Decorative Card 1 */}
          <motion.div 
            animate={{ y: [-15, 15, -15], rotateZ: [-2, 2, -2] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[5%] right-[10%] w-64 h-80 rounded-[2.5rem] bg-gradient-to-br from-white/10 via-white/5 to-transparent border border-white/20 backdrop-blur-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] z-20 overflow-hidden"
          >
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
            <div className="p-6 h-full flex flex-col justify-between relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-brand-500/20 flex items-center justify-center border border-brand-500/30 shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                <span className="text-xl">✨</span>
              </div>
              <div>
                <h3 className="text-white font-display font-bold text-xl mb-2">{t('heroCards.smartInsight')}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{t('heroCards.insightDesc')}</p>
              </div>
            </div>
          </motion.div>

          {/* Decorative Card 2 */}
          <motion.div 
            animate={{ y: [15, -15, 15], rotateZ: [2, -2, 2] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute bottom-[10%] left-[0%] w-80 rounded-[2.5rem] bg-gradient-to-tr from-brand-600/30 to-accent-600/20 border border-white/20 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] z-10 p-6 flex flex-col justify-center"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse shadow-[0_0_10px_rgba(74,222,128,0.8)]" />
              <span className="text-sm font-medium text-slate-200 tracking-wider uppercase">Live Synchronization</span>
            </div>
            <div className="h-2 w-full bg-surface-dark rounded-full overflow-hidden mb-3">
              <motion.div 
                animate={{ width: ['0%', '100%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="h-full bg-gradient-to-r from-brand-400 to-accent-400 rounded-full"
              />
            </div>
            <p className="text-xs text-slate-400">Securely encrypting and syncing your financial data in real-time.</p>
          </motion.div>

          {/* Decorative Glow Orb */}
          <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-brand-400 rounded-full blur-[80px] -z-10"
          />
        </motion.div>
      </div>
    </div>
  );
}

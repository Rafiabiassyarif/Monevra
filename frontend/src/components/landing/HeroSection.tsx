import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, ChevronRight, Play, Coffee, ArrowDownLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

export default function HeroSection() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  
  return (
    <section className="relative flex flex-col items-center text-center pt-24 pb-20 md:pt-32 md:pb-40 z-10">
      {/* Decorative Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand-500/20 blur-[150px] rounded-full pointer-events-none" />
      
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-surface-dark/80 border border-white/10 text-sm font-medium text-slate-300 mb-10 backdrop-blur-xl shadow-2xl hover:border-brand-500/30 transition-colors cursor-pointer group"
      >
        <span className="flex h-2.5 w-2.5 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-500"></span>
        </span>
        <span className="text-white font-semibold">Monevra 2.0</span> {t('hero.live').replace('Monevra 2.0', '')}
        <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-brand-400 transition-colors" />
      </motion.div>

      <motion.h1 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
        className={`font-display font-extrabold tracking-tight leading-[1.05] mb-8 max-w-5xl text-white ${
          language === 'id' 
            ? 'text-4xl md:text-6xl lg:text-[5rem]' 
            : 'text-5xl md:text-7xl lg:text-[6.5rem]'
        }`}
      >
        {t('hero.title1')}<br />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-accent-400 to-brand-300 animate-gradient-x">
          {t('hero.title2')}
        </span>
      </motion.h1>

      <motion.p 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
        className="text-xl md:text-2xl text-slate-400 max-w-3xl mb-12 leading-relaxed font-light"
      >
        {t('hero.subtitle')}
      </motion.p>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
        className="flex flex-col sm:flex-row items-center justify-center gap-6 w-full sm:w-auto"
      >
        <Link 
          to={user ? "/dashboard" : "/login"}
          className="relative group overflow-hidden rounded-2xl p-[1px] hover:shadow-[0_0_40px_rgba(59,130,246,0.4)] transition-shadow duration-300"
        >
          <span className="absolute inset-0 bg-gradient-to-r from-brand-400 to-accent-600 rounded-2xl opacity-70 group-hover:opacity-100 transition-opacity duration-300"></span>
          <div className="relative px-8 py-4 bg-bg-dark rounded-2xl flex items-center justify-center gap-3 transition-all duration-300 group-hover:bg-opacity-0 group-hover:text-white">
             <span className="font-semibold text-lg">{user ? t('hero.ctaOpen') : t('hero.ctaStart')}</span>
             <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
        <a 
          href="#features"
          className="px-8 py-4 rounded-2xl bg-surface-dark border border-white/10 hover:border-white/20 text-white font-semibold transition-all backdrop-blur-md flex items-center justify-center gap-3 hover:-translate-y-1 shadow-xl hover:shadow-2xl hover:bg-white/5"
        >
          <Play className="w-5 h-5 fill-current" />
          {t('hero.demo')}
        </a>
      </motion.div>

      {/* Floating UI - overlapping seperti asli, teks tetap horizontal */}
      <motion.div 
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
        className="mt-32 w-full max-w-6xl mx-auto relative perspective-1000 hidden lg:block h-[560px]"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-brand-500/10 to-transparent blur-3xl -z-10 rounded-full pointer-events-none" />

        {/* Total Wealth - tengah, paling depan */}
        <motion.div 
          animate={{ y: [-12, 12, -12] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[560px] h-[340px] rounded-[2rem] border border-border-dark bg-surface-dark shadow-2xl shadow-slate-900/20 z-30 p-8 overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-80 h-80 bg-brand-500/10 blur-[100px] rounded-full pointer-events-none" />
          <div className="relative z-10 flex justify-between items-start mb-8">
            <div>
              <div className="text-slate-400 font-medium mb-2 whitespace-nowrap">{t('heroCards.totalWealth')}</div>
              <div className="text-5xl font-display font-bold text-white tracking-tight whitespace-nowrap">{t('heroCards.wealthValue')}</div>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-brand-500/20 flex items-center justify-center border border-brand-500/30 text-brand-400 text-2xl shadow-[0_0_20px_rgba(59,130,246,0.3)]">
              💎
            </div>
          </div>
          
          <div className="absolute bottom-0 left-0 right-0 h-48 w-full z-0">
            <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 100">
              <defs>
                <linearGradient id="heroSparkline" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="rgba(56, 189, 248, 0.5)" />
                  <stop offset="100%" stopColor="rgba(56, 189, 248, 0)" />
                </linearGradient>
                <filter id="glowChart" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>
              <path d="M0,100 L0,50 C30,40 40,80 70,30 C85,5 95,20 100,20 L100,100 Z" fill="url(#heroSparkline)" />
              <path d="M0,50 C30,40 40,80 70,30 C85,5 95,20 100,20" fill="none" stroke="#38bdf8" strokeWidth="3" filter="url(#glowChart)" />
              <g transform="translate(100, 20)">
                <ellipse cx="0" cy="0" rx="8" ry="3" fill="#38bdf8" filter="url(#glowChart)" />
                <ellipse cx="0" cy="0" rx="4" ry="1.5" fill="#38bdf8" />
              </g>
            </svg>
          </div>
        </motion.div>

        {/* FLOW - kiri atas, di belakang Total Wealth */}
        <motion.div 
          animate={{ y: [0, -15, 0], rotateZ: [-12, -10, -12] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute left-[8%] top-[2%] w-[340px] rounded-[1.5rem] bg-surface-dark border border-border-dark shadow-2xl shadow-slate-900/20 p-6 z-10 overflow-hidden group"
        >
          <div className="absolute inset-0 bg-white/5 opacity-50 mix-blend-overlay pointer-events-none rounded-[1.5rem]"></div>
          <div className="flex justify-between items-center mb-12 relative z-10">
            <span className="font-display font-bold text-white text-xl tracking-widest whitespace-nowrap">{t('heroCards.virtualCard')}</span>
            <svg className="w-10 h-10 text-slate-300" viewBox="0 0 36 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="12" fill="currentColor" fillOpacity="0.4"/>
              <circle cx="24" cy="12" r="12" fill="currentColor" fillOpacity="0.4"/>
            </svg>
          </div>
          <div className="font-mono text-white/90 tracking-[0.25em] mb-6 relative z-10 whitespace-nowrap text-lg">{t('heroCards.cardNumber')}</div>
          <div className="flex justify-between text-white/70 text-xs font-medium relative z-10 uppercase tracking-wider whitespace-nowrap">
            <span>{t('heroCards.cardHolder')}</span>
            <span>{t('heroCards.cardExpiry')}</span>
          </div>
        </motion.div>

        {/* Recent Transaction - kanan bawah, overlap Total Wealth */}
        <motion.div 
          animate={{ y: [0, 20, 0], rotateZ: [5, 7, 5] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute right-[5%] bottom-[10%] w-[320px] rounded-3xl border border-border-dark bg-surface-dark shadow-2xl shadow-slate-900/20 p-6 z-40"
        >
          <div className="text-sm font-semibold text-white mb-6 flex items-center justify-between">
            <span className="whitespace-nowrap">{t('heroCards.recentTransaction')}</span>
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shrink-0 ml-2"></span>
          </div>
          
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-[#00704A] flex items-center justify-center shrink-0">
                <Coffee className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-medium text-slate-200 text-sm truncate">{t('heroCards.starbucks')}</div>
                <div className="text-xs text-slate-500 truncate">{t('heroCards.starbucksTime')}</div>
              </div>
              <div className="ml-auto font-bold text-white whitespace-nowrap shrink-0">{t('heroCards.starbucksAmount')}</div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-brand-500/20 flex items-center justify-center shrink-0 border border-brand-500/20">
                <ArrowDownLeft className="w-5 h-5 text-brand-400" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-medium text-slate-200 text-sm truncate">{t('heroCards.incomingTransfer')}</div>
                <div className="text-xs text-slate-500 truncate">{t('heroCards.transferTime')}</div>
              </div>
              <div className="ml-auto font-bold text-green-400 whitespace-nowrap shrink-0">{t('heroCards.transferAmount')}</div>
            </div>
          </div>
        </motion.div>

        {/* Smart Insight - kiri bawah */}
        <motion.div 
          animate={{ y: [-10, 8, -10] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 3 }}
          className="absolute left-[8%] bottom-[12%] w-[320px] rounded-3xl border border-border-dark bg-surface-dark shadow-2xl shadow-slate-900/20 p-5 z-40"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-surface-hover flex items-center justify-center shrink-0 border border-border-dark">
              <span className="text-amber-300 font-bold text-xl">✨</span>
            </div>
            <div className="min-w-0 flex flex-col justify-center mt-1">
              <h4 className="text-white font-semibold text-sm mb-1 whitespace-nowrap">{t('heroCards.smartInsight')}</h4>
              <p className="text-slate-400 text-xs leading-relaxed">{t('heroCards.insightDesc')}</p>
            </div>
          </div>
        </motion.div>

      </motion.div>
    </section>
  );
}

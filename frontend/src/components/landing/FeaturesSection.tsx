import React from 'react';
import { motion } from 'motion/react';
import { useLanguage } from '../../context/LanguageContext';
import {
  CreditCard, Wallet, TrendingUp, PieChart,
  BarChart3, Receipt, Download,
  Smartphone, Moon, ListFilter, Globe, Sparkles
} from 'lucide-react';

export default function FeaturesSection() {
  const { t } = useLanguage();
  return (
    <section id="features" className="py-32 relative z-10">
      <div className="text-center mb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/10 text-brand-400 text-sm font-semibold mb-6 border border-brand-500/20"
        >
          <Sparkles className="w-4 h-4" /> {t('features.tag')}
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight text-white"
        >
          {t('features.title1')}<br />
          <span className="text-slate-500">{t('features.title2')}</span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="text-slate-400 max-w-2xl mx-auto text-xl"
        >{t('features.subtitle')}</motion.p>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">

        {/* Large Feature 1 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 lg:row-span-2 rounded-[2.5rem] bg-gradient-to-br from-surface-dark to-bg-dark border border-border-dark p-8 flex flex-col group overflow-hidden relative shadow-xl hover:shadow-brand-500/10 hover:border-brand-500/30 transition-all duration-500"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-brand-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="flex-1 relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-brand-500/20 text-brand-400 flex items-center justify-center mb-6 border border-brand-500/20 group-hover:scale-110 transition-transform duration-500">
              <Globe className="w-8 h-8" />
            </div>
            <h3 className="font-display text-3xl font-bold text-white mb-4">{t('features.card1Title')}</h3>
            <p className="text-slate-400 text-lg leading-relaxed">{t('features.card1Desc')}</p>
          </div>
          {/* Visual Mockup inside card */}
          <div className="mt-8 relative h-48 w-full rounded-2xl bg-surface-hover border border-border-dark overflow-hidden group-hover:border-brand-500/30 transition-colors">
            <div className="absolute inset-0 bg-gradient-to-t from-brand-500/20 to-transparent opacity-50"></div>
            <svg className="absolute bottom-0 w-full h-full drop-shadow-xl" preserveAspectRatio="none" viewBox="0 0 100 100">
              <path d="M0,80 Q20,60 40,90 T80,50 T100,70 L100,100 L0,100 Z" fill="rgba(96, 165, 250, 0.1)" />
              <path d="M0,80 Q20,60 40,90 T80,50 T100,70" fill="none" stroke="#60a5fa" strokeWidth="3" />
            </svg>
          </div>
        </motion.div>

        {/* Medium Feature 1 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 rounded-[2.5rem] bg-surface-dark border border-border-dark p-8 flex flex-col justify-center group relative overflow-hidden shadow-xl hover:shadow-accent-500/10 hover:border-accent-500/30 transition-all duration-500"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/4 group-hover:bg-accent-500/20 transition-colors duration-500"></div>
          <div className="relative z-10 flex items-start gap-6">
            <div className="w-16 h-16 rounded-2xl bg-accent-500/20 text-accent-400 flex items-center justify-center shrink-0 border border-accent-500/20 group-hover:rotate-12 transition-transform duration-500">
              <Wallet className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-display text-2xl font-bold text-white mb-3">{t('features.card2Title')}</h3>
              <p className="text-slate-400 text-lg leading-relaxed">{t('features.card2Desc')}</p>
            </div>
          </div>
        </motion.div>

        {/* Small Feature 1 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="rounded-[2.5rem] bg-surface-dark border border-border-dark p-8 flex flex-col items-start group hover:border-cyan-500/30 hover:-translate-y-2 transition-all duration-300 shadow-lg"
        >
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mb-6 border border-cyan-500/20">
            <PieChart className="w-7 h-7" />
          </div>
          <h3 className="font-display text-xl font-bold text-white mb-3">{t('features.card3Title')}</h3>
          <p className="text-slate-400">{t('features.card3Desc')}</p>
        </motion.div>

        {/* Small Feature 2 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="rounded-[2.5rem] bg-surface-dark border border-border-dark p-8 flex flex-col items-start group hover:border-blue-500/30 hover:-translate-y-2 transition-all duration-300 shadow-lg"
        >
          <div className="w-14 h-14 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center mb-6 border border-blue-500/20">
            <Download className="w-7 h-7" />
          </div>
          <h3 className="font-display text-xl font-bold text-white mb-3">{t('features.card4Title')}</h3>
          <p className="text-slate-400">{t('features.card4Desc')}</p>
        </motion.div>


      </div>
    </section>
  );
}

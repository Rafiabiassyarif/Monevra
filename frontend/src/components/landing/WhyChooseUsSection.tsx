import React from 'react';
import { motion } from 'motion/react';
import { Zap, Shield, Sparkles } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function WhyChooseUsSection() {
  const { t } = useLanguage();
  return (
    <section id="why-us" className="py-16 md:py-32 relative z-10">
      

      <div className="text-center mb-12 md:mb-20">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight text-white"
        >
          {t('whyUs.title1')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-400 to-brand-400">{t('whyUs.title2')}</span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-slate-400 max-w-2xl mx-auto text-xl"
        >
          {t('whyUs.subtitle')}
        </motion.p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {[
          {
            icon: Zap,
            title: t('whyUs.card1Title'),
            desc: t('whyUs.card1Desc'),
            color: 'text-yellow-400',
            bg: 'bg-yellow-500/20',
            border: 'border-yellow-500/20'
          },
          {
            icon: Shield,
            title: t('whyUs.card2Title'),
            desc: t('whyUs.card2Desc'),
            color: 'text-green-400',
            bg: 'bg-green-500/20',
            border: 'border-green-500/20'
          },
          {
            icon: Sparkles,
            title: t('whyUs.card3Title'),
            desc: t('whyUs.card3Desc'),
            color: 'text-cyan-400',
            bg: 'bg-cyan-500/20',
            border: 'border-cyan-500/20'
          }
        ].map((item, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            key={i} 
            className="p-10 rounded-[2.5rem] bg-surface-dark border border-border-dark hover:border-brand-500/30 transition-all duration-300 shadow-xl relative overflow-hidden group hover:-translate-y-2"
          >
            <div className={`absolute -right-10 -top-10 w-40 h-40 ${item.bg} rounded-full blur-[50px] opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
            <div className={`w-14 h-14 rounded-2xl ${item.bg} ${item.color} flex items-center justify-center mb-8 border ${item.border}`}>
              <item.icon className="w-7 h-7" />
            </div>
            <h3 className="font-display font-bold text-2xl text-white mb-4">{item.title}</h3>
            <p className="text-slate-400 text-lg leading-relaxed">{item.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

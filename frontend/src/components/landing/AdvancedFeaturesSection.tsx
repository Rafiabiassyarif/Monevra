import React from 'react';
import { motion } from 'motion/react';
import { Tag, SplitSquareHorizontal, History, Target, Users, ShieldAlert } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function AdvancedFeaturesSection() {
  const { t } = useLanguage();
  
  const features = [
    {
      icon: SplitSquareHorizontal,
      title: t('advanced.card1Title'),
      desc: t('advanced.card1Desc')
    },
    {
      icon: Tag,
      title: t('advanced.card2Title'),
      desc: t('advanced.card2Desc')
    },
    {
      icon: History,
      title: t('advanced.card3Title'),
      desc: t('advanced.card3Desc')
    },
    {
      icon: Target,
      title: t('advanced.card4Title'),
      desc: t('advanced.card4Desc')
    },
    {
      icon: Users,
      title: t('advanced.card5Title'),
      desc: t('advanced.card5Desc')
    },
    {
      icon: ShieldAlert,
      title: t('advanced.card6Title'),
      desc: t('advanced.card6Desc')
    }
  ];

  return (
    <section className="py-32 relative z-10">
      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24">
        
        <div className="mb-16 md:flex justify-between items-end gap-10">
          <div className="max-w-2xl">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="font-display text-4xl md:text-5xl font-bold mb-6 tracking-tight text-white"
            >
              {t('advanced.tag')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-400 to-brand-400">{t('advanced.title1')}</span>
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-slate-400 text-xl"
            >
              {t('advanced.subtitle')}
            </motion.p>
          </div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="hidden md:block"
          >
            <div className="w-24 h-24 rounded-full bg-brand-500/10 blur-xl absolute -mt-12 -ml-12 pointer-events-none"></div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              key={i} 
              className="p-8 rounded-3xl bg-surface-dark border border-border-dark hover:border-brand-500/30 hover:bg-surface-dark transition-all duration-300 group hover:-translate-y-1 shadow-lg"
            >
              <div className="w-12 h-12 rounded-2xl bg-surface-hover text-slate-300 flex items-center justify-center mb-6 group-hover:bg-brand-500/20 group-hover:text-brand-400 transition-colors">
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="font-display font-bold text-xl text-white mb-3 group-hover:text-brand-300 transition-colors">{feature.title}</h3>
              <p className="text-slate-400 leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}

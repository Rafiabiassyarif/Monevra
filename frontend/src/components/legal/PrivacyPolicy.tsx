import React from 'react';
import { useLanguage } from "../../context/LanguageContext";
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';

export default function PrivacyPolicy() {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen bg-bg-dark text-slate-200 py-12 px-6">
      <div className="max-w-3xl mx-auto">
        <Link to="/register" className="inline-flex items-center gap-2 text-brand-400 hover:text-brand-300 transition-colors mb-8">
          <ArrowLeft size={16} />
          <span>{t('common.backToRegister')}</span>
        </Link>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface-dark/50 border border-white/5 rounded-3xl p-8 md:p-12 backdrop-blur-sm"
        >
          <h1 className="text-3xl font-bold text-white mb-6">{t('legal.privacyTitle')}</h1>
          <p className="text-slate-400 mb-8">{t('legal.lastUpdated')}</p>
          
          <div className="space-y-6 text-slate-300 leading-relaxed">
            {(t('legal.privacySections', { returnObjects: true }) as { title: string, content: string }[]).map((section, index) => (
              <section key={index}>
                <h2 className="text-xl font-semibold text-white mb-3">{section.title}</h2>
                <p>{section.content}</p>
              </section>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

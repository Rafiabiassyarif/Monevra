import React from 'react';
import { Github, Twitter, Linkedin, Instagram, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';

export default function Footer() {
  const { t } = useLanguage();
  return (
    <footer className="relative pt-32 pb-10 overflow-hidden">
      {/* Seamless transition background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-surface-dark/80 -z-10"></div>

      {/* Decorative gradients */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[500px] bg-brand-600/10 blur-[120px] rounded-full pointer-events-none -z-10"></div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24 relative z-10">

        {/* Massive CTA */}
        <div className="mb-32 text-center bg-gradient-to-b from-surface-dark to-bg-dark border border-border-dark p-12 md:p-24 rounded-[3rem] relative overflow-hidden shadow-2xl group">
          <div className="absolute inset-0 bg-gradient-to-r from-brand-500/10 via-accent-500/10 to-brand-500/10 opacity-50 group-hover:opacity-100 transition-opacity duration-700"></div>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1/2 bg-brand-500/20 blur-[80px] rounded-full pointer-events-none"></div>

          <div className="relative z-10">
            <h2 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold mb-6 text-white tracking-tight">
              {t('footer.ready')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-500 to-accent-500">{t('footer.control')}</span>
            </h2>
            <p className="text-slate-400 text-xl mb-12 max-w-2xl mx-auto">
              {t('footer.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link
                to="/register"
                className="relative group/btn overflow-hidden rounded-2xl p-[1px] hover:shadow-[0_0_40px_rgba(59,130,246,0.4)] transition-shadow duration-300 w-full sm:w-auto"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-brand-400 to-accent-600 rounded-2xl opacity-70 group-hover/btn:opacity-100 transition-opacity duration-300"></span>
                <div className="relative px-10 py-5 bg-bg-dark rounded-2xl flex items-center justify-center gap-3 transition-all duration-300 group-hover/btn:bg-opacity-0 group-hover/btn:text-white text-white">
                  <span className="font-semibold text-lg">{t('footer.cta')}</span>
                  <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                </div>
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div className="lg:col-span-2">
            <div className="flex items-center mb-6">
              <div className="relative -mr-3">
                <img src="/logo-monevra.png" alt="Logo" className="h-12 md:h-14 w-auto object-contain relative z-10 drop-shadow-[0_0_15px_rgba(255,255,255,0.15)]" />
              </div>
              <span className="font-display font-bold text-2xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-brand-500 to-accent-500 ml-3">Monevra</span>
            </div>
            <p className="text-slate-400 mb-8 max-w-sm leading-relaxed text-base">
              {t('footer.desc')}
            </p>
            <div className="flex gap-4">
              {[Twitter, Github, Linkedin, Instagram].map((Icon, i) => (
                <a key={i} href="#" className="w-12 h-12 rounded-2xl bg-surface-dark hover:bg-surface-hover flex items-center justify-center text-slate-400 hover:text-white hover:-translate-y-1 transition-all border border-border-dark shadow-lg">
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-6 tracking-wide text-sm">{t('footer.product')}</h4>
            <ul className="space-y-4 text-base text-slate-400">
              <li><a href="/#features" className="hover:text-brand-400 transition-colors">{t('footer.features')}</a></li>
              <li><a href="/#preview" className="hover:text-brand-400 transition-colors">{t('footer.analytics')}</a></li>
              <li><a href="/#why-us" className="hover:text-brand-400 transition-colors">{t('footer.security')}</a></li>
              <li><a href="/#preview" className="hover:text-brand-400 transition-colors">{t('footer.dashboard')}</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-6 tracking-wide text-sm">{t('footer.company')}</h4>
            <ul className="space-y-4 text-base text-slate-400">
              <li><a href="/#why-us" className="hover:text-brand-400 transition-colors">{t('footer.about')}</a></li>
              <li><a href="/#contact" className="hover:text-brand-400 transition-colors">{t('footer.help')}</a></li>
              <li><a href="/#contact" className="hover:text-brand-400 transition-colors">{t('footer.contact')}</a></li>
              <li><Link to="/privacy" className="hover:text-brand-400 transition-colors">{t('footer.privacy')}</Link></li>
              <li><Link to="/terms" className="hover:text-brand-400 transition-colors">{t('footer.terms')}</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-border-dark flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <p>© {new Date().getFullYear()} Monevra. {t('footer.rights')}</p>
        </div>
      </div>
    </footer>
  );
}

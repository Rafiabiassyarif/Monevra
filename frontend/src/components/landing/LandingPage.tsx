import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import HeroSection from './HeroSection';
import FeaturesSection from './FeaturesSection';
import DashboardPreviewSection from './DashboardPreviewSection';
import AdvancedFeaturesSection from './AdvancedFeaturesSection';
import WhyChooseUsSection from './WhyChooseUsSection';
import ContactSection from './ContactSection';
import Footer from './Footer';
import CustomCursor from './CustomCursor';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../hooks/useTheme';
import { useLanguage } from '../../context/LanguageContext';
import { Sun, Moon, Menu, X } from 'lucide-react';
import { motion, useScroll, useTransform, AnimatePresence } from 'motion/react';

export default function LandingPage() {

  const { user } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const { scrollY } = useScroll();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Dynamic header styles based on scroll
  const headerBgLight = useTransform(scrollY, [0, 50], ['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0.8)']);
  const headerBgDark = useTransform(scrollY, [0, 50], ['rgba(2, 6, 23, 0)', 'rgba(2, 6, 23, 0.8)']);
  const headerBg = isDark ? headerBgDark : headerBgLight;

  const headerBorderLight = useTransform(scrollY, [0, 50], ['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0.1)']);
  const headerBorderDark = useTransform(scrollY, [0, 50], ['rgba(255, 255, 255, 0)', 'rgba(255, 255, 255, 0.1)']);
  const headerBorder = isDark ? headerBorderDark : headerBorderLight;

  const headerBlur = useTransform(scrollY, [0, 50], ['blur(0px)', 'blur(16px)']);



  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="flex flex-col min-h-screen relative overflow-hidden bg-bg-dark text-slate-200 selection:bg-brand-500/30">

      <CustomCursor />

      {/* Decorative Blobs */}
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-brand-600/20 rounded-full blur-[150px] pointer-events-none z-0"></div>
      <div className="fixed bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-accent-600/20 rounded-full blur-[150px] pointer-events-none z-0"></div>

      {/* Premium Header */}
      <motion.header
        style={{ backgroundColor: headerBg, borderColor: headerBorder, backdropFilter: headerBlur }}
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 md:px-12 lg:px-24 transition-colors duration-300 border-b"
      >
        <div className="flex items-center group cursor-default">
          <div className="relative -mr-3">
            <div className="absolute inset-1 bg-brand-400/20 blur-lg rounded-full group-hover:bg-brand-400/40 transition-colors duration-500"></div>
            <img src="/logo-monevra.png" alt="Logo" className="h-10 md:h-12 w-auto object-contain relative z-10 drop-shadow-[0_0_15px_rgba(255,255,255,0.15)] group-hover:scale-105 transition-transform duration-500" />
          </div>
          <span className="font-display font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-brand-400 to-accent-400 ml-3">Monevra</span>
        </div>

        <nav className="hidden md:flex items-center gap-10 text-sm font-medium">
          <a href="#features" className="text-slate-300 hover:text-white transition-colors relative after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-brand-400 after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:origin-left">{t('nav.features')}</a>
          <a href="#preview" className="text-slate-300 hover:text-white transition-colors relative after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-brand-400 after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:origin-left">{t('nav.preview')}</a>
          <a href="#why-us" className="text-slate-300 hover:text-white transition-colors relative after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-brand-400 after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:origin-left">{t('nav.whyUs')}</a>
          <a href="#contact" className="text-slate-300 hover:text-white transition-colors relative after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-brand-400 after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:origin-left">{t('footer.contact')}</a>
        </nav>

        <div className="flex items-center gap-4">
          <div className="flex items-center bg-[#ffffff] dark:bg-surface-dark rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.05)] dark:shadow-none border border-slate-200/60 dark:border-white/10 p-1">
            <button
              onClick={() => setLanguage(language === 'en' ? 'id' : 'en')}
              className="px-3 py-1 rounded-full text-xs font-bold transition-colors text-brand-500 dark:text-brand-400 hover:bg-slate-100 dark:hover:bg-white/5 uppercase tracking-wider"
            >
              {language}
            </button>
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
              title={language === 'en' ? `Switch to ${isDark ? 'light' : 'dark'} mode` : `Beralih ke mode ${isDark ? 'terang' : 'gelap'}`}
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
          {user ? (
            <Link
              to="/dashboard"
              className="px-5 py-2.5 rounded-full bg-gradient-to-r from-brand-500 to-accent-500 hover:from-brand-400 hover:to-accent-400 text-sm font-medium transition-all text-[#ffffff] shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] hover:-translate-y-0.5"
            >
              {t('dashboard.title')}
            </Link>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Link
                to="/login"
                className="px-5 py-2.5 rounded-full text-sm font-medium text-slate-500 dark:text-slate-300 hover:text-black dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
              >
                {t('nav.signIn')}
              </Link>
              <Link
                to="/register"
                className="px-5 py-2.5 rounded-full text-sm font-medium bg-brand-500 text-white hover:bg-brand-600 transition-colors shadow-lg"
              >
                {t('nav.getStarted')}
              </Link>
            </div>
          )}
          
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden ml-2 p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </motion.header>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 bg-white dark:bg-bg-dark pt-24 px-6 md:hidden flex flex-col"
          >
            <nav className="flex flex-col gap-6 text-lg font-medium mt-4">
              <a href="#features" onClick={() => setIsMobileMenuOpen(false)} className="text-slate-600 dark:text-slate-300 hover:text-brand-500 dark:hover:text-brand-400">{t('nav.features')}</a>
              <a href="#preview" onClick={() => setIsMobileMenuOpen(false)} className="text-slate-600 dark:text-slate-300 hover:text-brand-500 dark:hover:text-brand-400">{t('nav.preview')}</a>
              <a href="#why-us" onClick={() => setIsMobileMenuOpen(false)} className="text-slate-600 dark:text-slate-300 hover:text-brand-500 dark:hover:text-brand-400">{t('nav.whyUs')}</a>
              <a href="#contact" onClick={() => setIsMobileMenuOpen(false)} className="text-slate-600 dark:text-slate-300 hover:text-brand-500 dark:hover:text-brand-400">{t('footer.contact')}</a>
            </nav>
            
            {!user && (
              <div className="flex flex-col gap-3 mt-10">
                <Link
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full py-3 rounded-full text-center font-medium border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300"
                >
                  {t('nav.signIn')}
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full py-3 rounded-full text-center font-medium bg-brand-500 text-white hover:bg-brand-600"
                >
                  {t('nav.getStarted')}
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 w-full max-w-7xl mx-auto px-6 md:px-12 lg:px-24 relative z-10 pt-10">
        <HeroSection />
        <FeaturesSection />
        <DashboardPreviewSection />
        <AdvancedFeaturesSection />
        <WhyChooseUsSection />
        <ContactSection />
      </main>

      <Footer />
    </div>
  );
}

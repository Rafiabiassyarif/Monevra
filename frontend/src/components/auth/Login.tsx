import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import AuthLayout from './AuthLayout';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Mail, Lock, ArrowRight, Loader2, Github } from 'lucide-react';
import PuzzleCaptcha from './PuzzleCaptcha';
import { motion } from 'motion/react';

export default function Login() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { loginWithEmail, user, isAdmin } = useAuth();
  const [searchParams] = useSearchParams();
  const justRegistered = searchParams.get('registered') === 'true';
  const prefillEmail = searchParams.get('email') || '';
  const [email, setEmail] = useState(prefillEmail);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showBanner, setShowBanner] = useState(justRegistered);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      if (isAdmin) {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    }
  }, [user, isAdmin, navigate]);

  useEffect(() => {
    if (showBanner) {
      const timer = setTimeout(() => setShowBanner(false), 8000);
      return () => clearTimeout(timer);
    }
  }, [showBanner]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!captchaToken) {
      setError(t('messages.puzzleRequired'));
      return;
    }
    setError('');
    setLoading(true);
    try {
      await loginWithEmail(email, password, captchaToken);
    } catch (err: any) {
      setError(err.message || t('messages.invalidEmailPass'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      setError(t('messages.googleMissing'));
      return;
    }
    const redirectUri = `${window.location.origin}/auth/callback/google`;
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=email%20profile`;
  };

  const handleGithubLogin = () => {
    const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
    if (!clientId) {
      setError(t('messages.githubMissing'));
      return;
    }
    const redirectUri = `${window.location.origin}/auth/callback/github`;
    window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=user:email`;
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } as any }
  };

  return (
    <AuthLayout title={t('auth.loginTitle')} subtitle={t('auth.loginSubtitle')}>
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
        {error && (
          <motion.div variants={itemVariants} className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl text-sm flex items-start gap-3">
            <div className="mt-0.5">⚠️</div>
            <div>{error}</div>
          </motion.div>
        )}

        {showBanner && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-green-500/10 border border-green-500/30 text-green-400 p-4 rounded-xl text-sm flex items-start gap-3 backdrop-blur-sm"
          >
            <div className="mt-0.5 text-green-400 text-base">✅</div>
            <div>
              <p className="font-semibold">{t('messages.accountCreated')}</p>
              <p className="text-green-400/80 text-xs mt-0.5">{t('messages.loginPrompt')}</p>
            </div>
          </motion.div>
        )}
       
        <form onSubmit={handleEmailLogin} className="space-y-5">
          <motion.div variants={itemVariants} className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
              <Mail className="h-5 w-5 text-slate-500 group-focus-within:text-brand-400 transition-colors" />
            </div>
            <input
              type="email"
              id="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="peer block w-full appearance-none rounded-2xl border border-white/5 bg-black/20 pl-11 px-4 pt-5 pb-2 text-white focus:border-brand-500 focus:bg-black/40 focus:outline-none focus:ring-1 focus:ring-brand-500 transition-all duration-300 hover:border-white/10 sm:text-sm placeholder-transparent backdrop-blur-xl shadow-inner"
              placeholder={t('auth.emailPlaceholder')}
            />
            <label htmlFor="email" className="absolute text-sm text-slate-500 duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-11 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-brand-400 cursor-text">
              {t('auth.emailLabel')}
            </label>
          </motion.div>

          <motion.div variants={itemVariants}>
            <div className="flex items-center justify-end mb-2">
              <Link to="/forgot-password" className="text-sm font-medium text-brand-400 hover:text-brand-300 transition-colors">
                {t('auth.forgotPassword')}
              </Link>
            </div>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                <Lock className="h-5 w-5 text-slate-500 group-focus-within:text-brand-400 transition-colors" />
              </div>
              <input
                type="password"
                id="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="peer block w-full appearance-none rounded-2xl border border-white/5 bg-black/20 pl-11 px-4 pt-5 pb-2 text-white focus:border-brand-500 focus:bg-black/40 focus:outline-none focus:ring-1 focus:ring-brand-500 transition-all duration-300 hover:border-white/10 sm:text-sm placeholder-transparent backdrop-blur-xl shadow-inner"
                placeholder={t('auth.passwordPlaceholder')}
              />
              <label htmlFor="password" className="absolute text-sm text-slate-500 duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-11 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-brand-400 cursor-text">
                {t('auth.passwordLabel')}
              </label>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="flex justify-center mt-4 w-full">
            <PuzzleCaptcha onVerify={(token) => setCaptchaToken(token)} />
          </motion.div>

          <motion.button
            variants={itemVariants}
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-4 bg-gradient-to-r from-brand-600 to-accent-600 hover:from-brand-500 hover:to-accent-500 text-white rounded-2xl font-semibold text-lg transition-all shadow-lg hover:shadow-brand-500/25 disabled:opacity-70 disabled:cursor-not-allowed group mt-2"
          >
            {loading ? (
              <><Loader2 className="w-6 h-6 animate-spin" /> {t('auth.signingIn')}</>
            ) : (
              <><span className="text-white text-base">{t('auth.signIn')}</span> <ArrowRight className="w-5 h-5 text-white group-hover:translate-x-1 transition-transform" /></>
            )}
          </motion.button>
        </form>

        <motion.div variants={itemVariants} className="mt-8">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-surface-dark/90 text-slate-400">{t('auth.orContinueWith')}</span>
            </div>
          </div>
          
          <div className="mt-6 grid grid-cols-2 gap-4">
            <button type="button" onClick={handleGoogleLogin} className="flex items-center justify-center gap-2 w-full px-4 py-3.5 rounded-2xl border border-white/5 bg-black/20 hover:bg-black/40 hover:border-white/10 transition-all duration-300 text-sm font-medium text-white cursor-pointer backdrop-blur-xl shadow-inner group">
              <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              {t('auth.google')}
            </button>
            <button type="button" onClick={handleGithubLogin} className="flex items-center justify-center gap-2 w-full px-4 py-3.5 rounded-2xl border border-white/5 bg-black/20 hover:bg-black/40 hover:border-white/10 transition-all duration-300 text-sm font-medium text-white cursor-pointer backdrop-blur-xl shadow-inner group">
              <Github className="w-5 h-5 group-hover:scale-110 transition-transform" />
              GitHub
            </button>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="mt-8 text-center text-sm text-slate-400">
          {t('auth.noAccount')}{' '}
          <Link to="/register" className="font-semibold text-white hover:text-brand-400 transition-colors">
            {t('auth.signUpNow')}
          </Link>
        </motion.div>
      </motion.div>
    </AuthLayout>
  );
}

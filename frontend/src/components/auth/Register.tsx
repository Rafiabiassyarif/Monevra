import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import AuthLayout from './AuthLayout';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Mail, Lock, User, ArrowRight, Loader2, Github } from 'lucide-react';
import PuzzleCaptcha from './PuzzleCaptcha';
import { motion } from 'motion/react';

export default function Register() {
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const navigate = useNavigate();
  const { registerWithEmail, user, isAdmin } = useAuth();

  useEffect(() => {
    if (user) {
      if (isAdmin) {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    }
  }, [user, isAdmin, navigate]);

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError(t('auth.passMismatch'));
      return;
    }
    if (!agreeToTerms) {
      setError(t('auth.errorTerms'));
      return;
    }
    if (!captchaToken) {
      setError(t('messages.puzzleRequired'));
      return;
    }
    setLoading(true);
    
    try {
      await registerWithEmail(email, password, name, captchaToken);
      navigate(`/login?registered=true&email=${encodeURIComponent(email)}`);
    } catch (err: any) {
      setError(err.message || 'Gagal membuat akun');
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

  const getPasswordStrength = (pass: string) => {
    let score = 0;
    if (pass.length > 5) score += 1;
    if (pass.length > 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    return score; // 0-5
  };

  const strengthScore = getPasswordStrength(password);
  const strengthColor = 
    strengthScore === 0 ? 'bg-slate-700' :
    strengthScore <= 2 ? 'bg-red-500' :
    strengthScore <= 3 ? 'bg-yellow-500' :
    'bg-green-500';

  const strengthLabel = 
    strengthScore === 0 ? '' :
    strengthScore <= 2 ? t('auth.weak') :
    strengthScore <= 3 ? t('auth.fair') :
    strengthScore <= 4 ? t('auth.good') :
    t('auth.strong');

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
    <AuthLayout title={t('auth.registerTitle')} subtitle={t('auth.registerSubtitle')}>
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
        {error && (
          <motion.div variants={itemVariants} className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl text-sm flex items-start gap-3">
            <div className="mt-0.5">⚠️</div>
            <div>{error}</div>
          </motion.div>
        )}
        
        <form onSubmit={handleEmailRegister} className="space-y-5">
          <motion.div variants={itemVariants} className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
              <User className="h-5 w-5 text-slate-500 group-focus-within:text-brand-400 transition-colors" />
            </div>
            <input
              type="text"
              id="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="peer block w-full appearance-none rounded-2xl border border-form-border bg-form-bg pl-11 px-4 pt-5 pb-2 text-white focus:border-brand-500 focus:bg-form-hover focus:outline-none focus:ring-1 focus:ring-brand-500 transition-all duration-300 hover:border-form-border sm:text-sm placeholder-transparent backdrop-blur-xl shadow-inner"
              placeholder={t('auth.namePlaceholder')}
            />
            <label htmlFor="name" className="absolute text-sm text-slate-500 duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-11 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-brand-400 cursor-text">
              {t('auth.nameLabel')}
            </label>
          </motion.div>

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
              className="peer block w-full appearance-none rounded-2xl border border-form-border bg-form-bg pl-11 px-4 pt-5 pb-2 text-white focus:border-brand-500 focus:bg-form-hover focus:outline-none focus:ring-1 focus:ring-brand-500 transition-all duration-300 hover:border-form-border sm:text-sm placeholder-transparent backdrop-blur-xl shadow-inner"
              placeholder={t('auth.emailPlaceholder')}
            />
            <label htmlFor="email" className="absolute text-sm text-slate-500 duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-11 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-brand-400 cursor-text">
              {t('auth.emailLabel')}
            </label>
          </motion.div>

          <motion.div variants={itemVariants}>
            <div className="relative group mb-2">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                <Lock className="h-5 w-5 text-slate-500 group-focus-within:text-brand-400 transition-colors" />
              </div>
              <input
                type="password"
                id="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="peer block w-full appearance-none rounded-2xl border border-form-border bg-form-bg pl-11 px-4 pt-5 pb-2 text-white focus:border-brand-500 focus:bg-form-hover focus:outline-none focus:ring-1 focus:ring-brand-500 transition-all duration-300 hover:border-form-border sm:text-sm placeholder-transparent backdrop-blur-xl shadow-inner"
                placeholder={t('auth.passwordPlaceholder')}
                minLength={6}
              />
              <label htmlFor="password" className="absolute text-sm text-slate-500 duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-11 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-brand-400 cursor-text">
                {t('auth.passwordLabel')}
              </label>
            </div>
            
            {/* Password Strength Indicator */}
            {password.length > 0 && (
              <div className="px-1 flex items-center justify-between">
                <div className="flex-1 flex gap-1 h-1.5 rounded-full overflow-hidden bg-slate-700/50">
                  <div className={`h-full transition-all duration-300 ${strengthScore >= 1 ? strengthColor : 'bg-transparent'} w-1/5`} />
                  <div className={`h-full transition-all duration-300 ${strengthScore >= 2 ? strengthColor : 'bg-transparent'} w-1/5`} />
                  <div className={`h-full transition-all duration-300 ${strengthScore >= 3 ? strengthColor : 'bg-transparent'} w-1/5`} />
                  <div className={`h-full transition-all duration-300 ${strengthScore >= 4 ? strengthColor : 'bg-transparent'} w-1/5`} />
                  <div className={`h-full transition-all duration-300 ${strengthScore >= 5 ? strengthColor : 'bg-transparent'} w-1/5`} />
                </div>
                <span className={`text-[10px] uppercase font-bold tracking-wider ml-3 transition-colors duration-300 ${strengthColor.replace('bg-', 'text-')}`}>
                  {strengthLabel}
                </span>
              </div>
            )}
          </motion.div>

          {/* Confirm Password */}
          <motion.div variants={itemVariants}>
            <div className="relative group mb-2">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                <Lock className="h-5 w-5 text-slate-500 group-focus-within:text-brand-400 transition-colors" />
              </div>
              <input
                type="password"
                id="confirmPassword"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="peer block w-full appearance-none rounded-2xl border border-form-border bg-form-bg pl-11 px-4 pt-5 pb-2 text-white focus:border-brand-500 focus:bg-form-hover focus:outline-none focus:ring-1 focus:ring-brand-500 transition-all duration-300 hover:border-form-border sm:text-sm placeholder-transparent backdrop-blur-xl shadow-inner"
                placeholder={t('auth.confirmPass')}
                minLength={6}
              />
              <label htmlFor="confirmPassword" className="absolute text-sm text-slate-500 duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-11 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-brand-400 cursor-text">
                {t('auth.confirmPass')}
              </label>
            </div>
            {confirmPassword.length > 0 && password !== confirmPassword && (
              <p className="text-xs text-red-400 px-1 mt-1">{t('auth.passMismatch')}</p>
            )}
            {confirmPassword.length > 0 && password === confirmPassword && confirmPassword.length >= 6 && (
              <p className="text-xs text-green-400 px-1 mt-1">{t('auth.passMatch')}</p>
            )}
          </motion.div>

          {/* Terms of Service */}
          <motion.div variants={itemVariants} className="flex items-start gap-3 px-1">
            <input
              type="checkbox"
              id="terms"
              checked={agreeToTerms}
              onChange={(e) => setAgreeToTerms(e.target.checked)}
              className="mt-1 w-4 h-4 rounded border-white/20 bg-surface-dark/40 text-brand-500 focus:ring-brand-500/30 cursor-pointer accent-brand-500"
            />
            <label htmlFor="terms" className="text-sm text-slate-400 cursor-pointer leading-relaxed">
              {t('auth.agreeTo')} <Link to="/terms" target="_blank" className="text-brand-400 hover:text-brand-300 font-medium">{t('auth.terms')}</Link> {t('auth.and')} <Link to="/privacy" target="_blank" className="text-brand-400 hover:text-brand-300 font-medium">{t('auth.privacy')}</Link>
            </label>
          </motion.div>

          <motion.div variants={itemVariants} className="flex justify-center mt-4 w-full">
            <PuzzleCaptcha onVerify={(token) => setCaptchaToken(token)} />
          </motion.div>

          <motion.button
            variants={itemVariants}
            type="submit"
            disabled={loading || !agreeToTerms}
            className="w-full flex items-center justify-center gap-3 py-4 bg-gradient-to-r from-brand-600 to-accent-600 hover:from-brand-500 hover:to-accent-500 text-white rounded-2xl font-semibold text-lg transition-all shadow-lg hover:shadow-brand-500/25 disabled:opacity-70 disabled:cursor-not-allowed group mt-2"
          >
            {loading ? (
              <><Loader2 className="w-6 h-6 animate-spin" /> {t('auth.creatingAccount')}</>
            ) : (
              <><span className="text-white text-base">{t('auth.createAccount')}</span> <ArrowRight className="w-5 h-5 text-white group-hover:translate-x-1 transition-transform" /></>
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
            <button type="button" onClick={handleGoogleLogin} className="flex items-center justify-center gap-2 w-full px-4 py-3.5 rounded-2xl border border-form-border bg-form-bg hover:bg-form-hover transition-all duration-300 text-sm font-medium text-white cursor-pointer backdrop-blur-xl shadow-inner group">
              <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              {t('auth.google')}
            </button>
            <button type="button" onClick={handleGithubLogin} className="flex items-center justify-center gap-2 w-full px-4 py-3.5 rounded-2xl border border-form-border bg-form-bg hover:bg-form-hover transition-all duration-300 text-sm font-medium text-white cursor-pointer backdrop-blur-xl shadow-inner group">
              <Github className="w-5 h-5 group-hover:scale-110 transition-transform" />
              GitHub
            </button>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="mt-8 text-center text-sm text-slate-400">
          {t('auth.alreadyHaveAccount')}{' '}
          <Link to="/login" className="font-semibold text-white hover:text-brand-400 transition-colors">
            {t('auth.signIn')}
          </Link>
        </motion.div>
      </motion.div>
    </AuthLayout>
  );
}

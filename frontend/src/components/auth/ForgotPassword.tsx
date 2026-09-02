import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from './AuthLayout';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Mail, ArrowRight, Loader2, CheckCircle2, Lock, KeyRound } from 'lucide-react';
import PuzzleCaptcha from './PuzzleCaptcha';
import { motion } from 'motion/react';

export default function ForgotPassword() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [step, setStep] = useState<'email' | 'code' | 'password'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const { resetPassword, verifyResetCode, confirmPasswordReset } = useAuth();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    
    try {
      if (step === 'email') {
        if (!captchaToken) {
          setError(t('auth.captchaRequired'));
          setLoading(false);
          return;
        }
        const response = await resetPassword(email, captchaToken);
        setMessage(t('auth.otpSent'));
        setStep('code');
      } else if (step === 'code') {
        await verifyResetCode(email, code);
        setMessage(t('auth.otpValid'));
        setStep('password');
      } else {
        await confirmPasswordReset(email, newPassword, code);
        setMessage(t('auth.resetSuccess'));
        setTimeout(() => navigate('/login'), 2000);
      }
    } catch (err: any) {
      let errorMessage = err.message;
      if (errorMessage === 'Email tidak terdaftar.') errorMessage = t('auth.emailNotFound');
      else if (errorMessage === 'Kode OTP telah kedaluwarsa.') errorMessage = t('auth.otpExpired');
      else if (errorMessage === 'Kode OTP salah.') errorMessage = t('auth.otpInvalid');
      else if (errorMessage === 'Terjadi kesalahan internal server.') errorMessage = t('auth.internalError');
      
      setError(errorMessage || t('auth.defaultError'));
    } finally {
      setLoading(false);
    }
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
    <AuthLayout title={t('auth.resetTitle')} subtitle={t('auth.resetSubtitle')}>
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
        <form className="space-y-6" onSubmit={handleReset}>
          {error && (
            <motion.div variants={itemVariants} className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl text-sm flex items-start gap-3">
              <div className="mt-0.5">⚠️</div>
              <div>{error}</div>
            </motion.div>
          )}
          {message && (
            <motion.div variants={itemVariants} className="bg-green-500/10 border border-green-500/30 text-green-400 p-4 rounded-xl text-sm flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <div>{message}</div>
            </motion.div>
          )}
          
          <div className="space-y-5">
            {step === 'email' && (
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
            )}
          
                    {step === 'code' && (
              <motion.div variants={itemVariants} className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                  <KeyRound className="h-5 w-5 text-slate-500 group-focus-within:text-brand-400 transition-colors" />
                </div>
                <input
                  type="text"
                  id="code"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="peer block w-full appearance-none rounded-2xl border border-white/5 bg-black/20 pl-11 px-4 pt-5 pb-2 text-white focus:border-brand-500 focus:bg-black/40 focus:outline-none focus:ring-1 focus:ring-brand-500 transition-all duration-300 hover:border-white/10 sm:text-lg tracking-widest font-mono placeholder-transparent backdrop-blur-xl shadow-inner"
                  placeholder="000000"
                  maxLength={6}
                />
                <label htmlFor="code" className="absolute text-sm text-slate-500 duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-11 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-brand-400 cursor-text">
                  {t('auth.verifyCodeLabel')}
                </label>
              </motion.div>
            )}

            {step === 'password' && (
              <motion.div variants={itemVariants} className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                  <Lock className="h-5 w-5 text-slate-500 group-focus-within:text-brand-400 transition-colors" />
                </div>
                <input
                  type="password"
                  id="newPassword"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="peer block w-full appearance-none rounded-2xl border border-white/5 bg-black/20 pl-11 px-4 pt-5 pb-2 text-white focus:border-brand-500 focus:bg-black/40 focus:outline-none focus:ring-1 focus:ring-brand-500 transition-all duration-300 hover:border-white/10 sm:text-sm placeholder-transparent backdrop-blur-xl shadow-inner"
                  placeholder="••••••••"
                  minLength={6}
                />
                <label htmlFor="newPassword" className="absolute text-sm text-slate-500 duration-300 transform -translate-y-3 scale-75 top-4 z-10 origin-[0] left-11 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3 peer-focus:text-brand-400 cursor-text">
                  {t('auth.newPasswordLabel')}
                </label>
              </motion.div>
            )}

            {step === 'email' && (
              <motion.div variants={itemVariants} className="flex justify-center mt-4">
                <PuzzleCaptcha onVerify={(token) => setCaptchaToken(token)} />
              </motion.div>
            )}

            <motion.button
              variants={itemVariants}
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-4 bg-gradient-to-r from-brand-600 to-accent-600 hover:from-brand-500 hover:to-accent-500 text-white rounded-2xl font-semibold text-lg transition-all shadow-lg hover:shadow-brand-500/25 disabled:opacity-70 disabled:cursor-not-allowed group mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                  <span className="font-semibold text-white">{t('auth.processing')}</span>
                </>
              ) : (
                <>
                  <span className="font-semibold text-white text-base">
                    {step === 'email' ? t('auth.resetPassword') : (step === 'code' ? t('auth.verifyCodeBtn') : t('auth.changePasswordBtn'))}
                  </span>
                  <ArrowRight className="w-5 h-5 text-white group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </motion.button>
          </div>
        </form>

        <motion.div variants={itemVariants} className="mt-8 text-center text-sm text-slate-400">
          {t('auth.rememberPassword')}{' '}
          <Link to="/login" className="font-semibold text-white hover:text-brand-400 transition-colors">
            {t('auth.signInBack')}
          </Link>
        </motion.div>
      </motion.div>
    </AuthLayout>
  );
}

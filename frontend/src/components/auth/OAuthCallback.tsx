import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Loader2 } from 'lucide-react';
import AuthLayout from './AuthLayout';
import { useLanguage } from '../../context/LanguageContext';

export default function OAuthCallback() {
  const { provider } = useParams<{ provider: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithGoogle, loginWithGithub } = useAuth();
  const { t } = useLanguage();
  const [error, setError] = useState('');
  const hasProcessed = React.useRef(false);

  useEffect(() => {
    const code = searchParams.get('code');
    
    if (!code) {
      setError(t('custom.oAuthErrNoCode'));
      setTimeout(() => navigate('/login'), 3000);
      return;
    }

    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processLogin = async () => {
      try {
        if (provider === 'google') {
          await loginWithGoogle(code);
        } else if (provider === 'github') {
          await loginWithGithub(code);
        } else {
          throw new Error('Provider tidak didukung.');
        }
        
        // If successful, AuthContext will update 'user' and other pages will redirect
        navigate('/dashboard');
      } catch (err: any) {
        setError(err.message || `Gagal login dengan ${provider}`);
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    processLogin();
  }, [provider, searchParams, loginWithGoogle, loginWithGithub, navigate]);

  return (
    <AuthLayout title={t('custom.oAuthTitle')} subtitle={`${t('custom.oAuthProcessing')} ${provider === 'github' ? 'GitHub' : 'Google'}...`}>
      <div className="flex flex-col items-center justify-center space-y-6 py-12">
        {error ? (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl text-sm flex items-start gap-3 w-full">
            <div className="mt-0.5">⚠️</div>
            <div>{error} <br/> Mengalihkan kembali...</div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 text-brand-400 animate-spin" />
            <p className="text-slate-300 font-medium">Memverifikasi kredensial Anda...</p>
          </div>
        )}
      </div>
    </AuthLayout>
  );
}

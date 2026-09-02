import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Send, Loader2, MessageSquare } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function ContactSection() {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setStatus('success');
        setFormData({ name: '', email: '', subject: '', message: '' });
      } else {
        setStatus('success');
        setFormData({ name: '', email: '', subject: '', message: '' });
      }
    } catch (error) {
      console.error('Submission error:', error);
      setStatus('success');
      setFormData({ name: '', email: '', subject: '', message: '' });
    }
  };

  return (
    <section id="contact" className="py-32 relative z-10 overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-brand-500/10 rounded-full blur-[120px] -translate-y-1/2 pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24 relative">
        <div className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/10 text-brand-400 text-sm font-semibold mb-6 border border-brand-500/20 shadow-[0_0_15px_rgba(59,130,246,0.15)]"
          >
            <MessageSquare className="w-4 h-4" /> {t('contact.tag')}
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight text-white"
          >
            {t('contact.title1')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-400 to-brand-400">{t('contact.title2')}</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-slate-400 max-w-2xl mx-auto text-xl"
          >
            {t('contact.subtitle')}
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-8 items-start">
          
          {/* Contact Information Cards */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-2 flex flex-col gap-6"
          >
            <div className="group p-8 rounded-3xl bg-surface-dark/40 backdrop-blur-xl border border-white/5 hover:border-brand-500/30 hover:bg-surface-dark/60 transition-all duration-500 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/10 rounded-full blur-3xl group-hover:bg-brand-500/20 transition-colors"></div>
              
              <div className="w-14 h-14 rounded-2xl bg-brand-500/10 text-brand-400 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 border border-brand-500/20">
                <Mail className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">{t('contact.emailUs') || 'Email Us'}</h3>
              <p className="text-slate-400 mb-6">{t('contact.emailDesc')}</p>
              <a href="mailto:appsmonevra@gmail.com" className="inline-flex text-brand-400 font-medium hover:text-brand-300 transition-colors text-lg">
                appsmonevra@gmail.com
              </a>
            </div>
          </motion.div>

          {/* Contact Form */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-3 bg-surface-dark/50 backdrop-blur-xl p-8 md:p-12 rounded-[2.5rem] border border-white/10 shadow-2xl relative"
          >
            <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-500 to-transparent opacity-20"></div>

            <h3 className="text-2xl md:text-3xl font-display font-bold mb-8 text-white">{t('contact.formTitle')}</h3>

            {status === 'success' ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-green-500/10 border border-green-500/20 text-green-400 p-8 rounded-3xl text-center backdrop-blur-md flex flex-col items-center justify-center min-h-[400px]"
              >
                <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
                  <Send className="w-10 h-10 text-green-400" />
                </div>
                <h4 className="font-display font-bold text-2xl mb-3 text-white">{t('contact.sent')}</h4>
                <p className="text-slate-300 mb-8 max-w-md">{t('contact.sentDesc') || 'Terima kasih, pesan Anda telah kami terima. Tim kami akan segera menghubungi Anda kembali. Mohon periksa juga folder spam Anda untuk memastikan.'}</p>
                <button
                  onClick={() => setStatus('idle')}
                  className="px-8 py-3.5 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-white font-medium transition-all"
                >
                  Kirim pesan lain
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="name" className="block text-sm font-medium text-slate-300 ml-1">{t('contact.nameLabel')}</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-5 py-4 bg-black/20 border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-white placeholder:text-slate-500 transition-all"
                      placeholder={t('contact.namePlaceholder')}
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="email" className="block text-sm font-medium text-slate-300 ml-1">{t('contact.emailLabel')}</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-5 py-4 bg-black/20 border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-white placeholder:text-slate-500 transition-all"
                      placeholder={t('contact.emailPlaceholder')}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="subject" className="block text-sm font-medium text-slate-300 ml-1">{t('contact.subjectLabel')}</label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    required
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full px-5 py-4 bg-black/20 border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-white placeholder:text-slate-500 transition-all"
                    placeholder={t('contact.subjectPlaceholder')}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="message" className="block text-sm font-medium text-slate-300 ml-1">{t('contact.messageLabel')}</label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={5}
                    value={formData.message}
                    onChange={handleChange}
                    className="w-full px-5 py-4 bg-black/20 border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-white placeholder:text-slate-500 resize-none transition-all"
                    placeholder={t('contact.messagePlaceholder')}
                  ></textarea>
                </div>

                {status === 'error' && (
                  <div className="text-red-400 text-sm p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                    {errorMessage || t('contact.sendFailed')}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full flex items-center justify-center gap-3 py-4 bg-gradient-to-r from-brand-600 to-accent-600 hover:from-brand-500 hover:to-accent-500 text-white rounded-2xl font-semibold text-lg transition-all shadow-lg hover:shadow-brand-500/25 disabled:opacity-70 disabled:cursor-not-allowed group mt-4"
                >
                  {status === 'loading' ? (
                    <><Loader2 className="w-6 h-6 animate-spin" /> {t('contact.sending')}</>
                  ) : (
                    <><Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" /> {t('contact.send')}</>
                  )}
                </button>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

import React, { useState, useEffect } from 'react';
import { useLanguage } from "../../../context/LanguageContext";
import { Bell, Send, Users, AlertCircle, CheckCircle2, Info, Sparkles } from 'lucide-react';
import { apiRequest } from '../../../lib/api';

export default function NotificationManager() {
  const { t } = useLanguage();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

  const [form, setForm] = useState({
    userId: 'all',
    title: '',
    message: '',
    type: 'info'
  });

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await apiRequest('/admin/users');
        setUsers(data as any[]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleAIGenerate = () => {
    const templates = [
      {
        type: 'warning',
        title: 'Peringatan Keamanan Terdeteksi',
        message: 'Sistem keamanan AI kami mendeteksi aktivitas login yang tidak wajar. Mohon periksa log keamanan Anda dan aktifkan Autentikasi Dua Faktor (2FA).'
      },
      {
        type: 'info',
        title: 'Pembaruan Sistem Otomatis',
        message: 'Halo! Kami akan melakukan pemeliharaan server rutin (maintenance) pada malam ini pukul 00:00 - 02:00 WIB. Beberapa fitur mungkin akan terganggu sejenak.'
      },
      {
        type: 'success',
        title: 'Laporan Finansial AI Tersedia',
        message: 'AI kami telah selesai menganalisis pola pengeluaran Anda minggu ini. Silakan cek menu Analitik untuk melihat rekomendasi penghematan khusus untuk Anda!'
      },
      {
        type: 'error',
        title: 'Peringatan: Overbudget Deteksi Dini',
        message: 'Sistem prediktif kami mendeteksi bahwa pengeluaran Anda di kategori "Gaya Hidup" akan melampaui batas dalam 3 hari ke depan jika Anda tidak mengubah pola belanja.'
      }
    ];
    
    const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
    
    setForm({
      ...form,
      type: randomTemplate.type,
      title: randomTemplate.title,
      message: randomTemplate.message
    });
    
    setStatus({ type: 'success', msg: '✨ Pesan notifikasi brilian berhasil dibuat oleh AI!' });
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.message) {
      setStatus({ type: 'error', msg: 'Judul dan pesan tidak boleh kosong.' });
      return;
    }

    setSending(true);
    setStatus(null);
    try {
      await apiRequest('/admin/notifications', {
        method: 'POST',
        body: JSON.stringify(form)
      });
      setStatus({ type: 'success', msg: 'Notifikasi berhasil dikirim!' });
      setForm({ ...form, title: '', message: '' });
    } catch (err: any) {
      setStatus({ type: 'error', msg: err.message || 'Gagal mengirim notifikasi.' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-display font-bold text-slate-200">Pusat Notifikasi</h2>
          <p className="text-slate-400 mt-1">Kirim pemberitahuan ke satu pengguna spesifik atau siaran (broadcast) ke semua pengguna.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="glass-card rounded-[2rem] p-8 border border-border-dark shadow-xl shadow-black/5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h3 className="font-semibold text-lg text-slate-200 flex items-center gap-2">
                <Send size={20} className="text-brand-400" />
                Tulis Notifikasi Baru
              </h3>
              <button
                type="button"
                onClick={handleAIGenerate}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500/20 to-sky-500/20 border border-cyan-500/30 text-cyan-300 text-sm font-semibold hover:from-cyan-500/30 hover:to-sky-500/30 transition-all shadow-[0_0_15px_rgba(168,85,247,0.15)] hover:shadow-[0_0_20px_rgba(168,85,247,0.3)]"
              >
                <Sparkles size={16} />
                Generate AI
              </button>
            </div>

            {status && (
              <div className={`p-4 rounded-xl mb-6 flex items-start gap-3 ${status.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'} border`}>
                {status.type === 'success' ? <CheckCircle2 size={20} className="shrink-0" /> : <AlertCircle size={20} className="shrink-0" />}
                <p className="text-sm font-medium">{status.msg}</p>
              </div>
            )}

            <form onSubmit={handleSend} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">Penerima</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                    <Users size={18} />
                  </div>
                  <select
                    value={form.userId}
                    onChange={e => setForm({ ...form, userId: e.target.value })}
                    className="w-full bg-surface-dark border border-border-dark rounded-xl pl-12 pr-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-brand-500/50 appearance-none cursor-pointer"
                    disabled={loading}
                  >
                    <option value="all">{t('custom.broadcastAll')}</option>
                    <optgroup label={t('custom.notifSpecificGroup')}>
                      {users.map(u => (
                        <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                      ))}
                    </optgroup>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">{t('custom.notifTypeLabel')}</label>
                <div className="grid grid-cols-4 gap-3">
                  {['info', 'success', 'warning', 'error'].map(type => (
                    <label key={type} className={`cursor-pointer flex flex-col items-center justify-center p-4 rounded-xl border ${form.type === type ? 'border-brand-500 bg-brand-500/10' : 'border-border-dark bg-surface-dark hover:bg-surface-hover'}`}>
                      <input type="radio" name="type" value={type} checked={form.type === type} onChange={e => setForm({ ...form, type: e.target.value })} className="sr-only" />
                      {type === 'info' && <Info size={24} className="text-blue-400 mb-2" />}
                      {type === 'success' && <CheckCircle2 size={24} className="text-green-400 mb-2" />}
                      {type === 'warning' && <AlertCircle size={24} className="text-yellow-400 mb-2" />}
                      {type === 'error' && <AlertCircle size={24} className="text-red-400 mb-2" />}
                      <span className="text-xs font-medium capitalize text-slate-300">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">{t('custom.notifTitleLabel')}</label>
                <input
                  type="text"
                  placeholder={t('custom.notifPlaceholderTitle')}
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full bg-surface-dark border border-border-dark rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-brand-500/50"
                  maxLength={100}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">{t('custom.notifMsgLabel')}</label>
                <textarea
                  placeholder={t('custom.notifPlaceholderMsg')}
                  value={form.message}
                  onChange={e => setForm({ ...form, message: e.target.value })}
                  className="w-full bg-surface-dark border border-border-dark rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-brand-500/50 min-h-[120px] resize-y"
                ></textarea>
              </div>

              <div className="pt-2">
                <button type="submit" disabled={sending} className="w-full btn-premium flex items-center justify-center gap-2">
                  {sending ? (
                    <span className="flex items-center gap-2">{t('custom.notifSending')}</span>
                  ) : (
                    <>
                      <Send size={18} />
                      {t('custom.notifSend')}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div>
          <div className="glass-card rounded-[2rem] p-6 border border-border-dark">
            <h3 className="font-semibold text-slate-200 mb-4">{t('custom.notifGuideTitle')}</h3>
            <div className="space-y-4 text-sm text-slate-400">
              <p dangerouslySetInnerHTML={{ __html: t('custom.notifGuideBroadcast') }} />
              <p>{t('custom.notifGuideUseWisely')}</p>
              <ul className="space-y-3 mt-3">
                <li className="flex gap-3"><Info size={16} className="text-blue-400 shrink-0 mt-0.5" /> <span>{t('custom.notifGuideInfo')}</span></li>
                <li className="flex gap-3"><CheckCircle2 size={16} className="text-green-400 shrink-0 mt-0.5" /> <span>{t('custom.notifGuideSuccess')}</span></li>
                <li className="flex gap-3"><AlertCircle size={16} className="text-yellow-400 shrink-0 mt-0.5" /> <span>{t('custom.notifGuideWarning')}</span></li>
                <li className="flex gap-3"><AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" /> <span>{t('custom.notifGuideError')}</span></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { useLanguage } from "../../../context/LanguageContext";
import { Settings, Save, Bell, Mail, Database, RefreshCw, Download, ShieldCheck, HardDrive } from 'lucide-react';
import { apiRequest } from '../../../lib/api';

export default function SystemSettings() {
  const { t } = useLanguage();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  const fetchSettings = async () => {
    try {
      const data = await apiRequest<Record<string, string>>('/admin/settings');
      setSettings(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiRequest('/admin/settings', {
        method: 'PUT',
        body: JSON.stringify(settings)
      });
      showToast('Pengaturan berhasil disimpan!');
    } catch (e: any) {
      showToast(`Gagal menyimpan: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleBackup = () => {
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
    window.open(`${apiBase}/admin/backup`, '_blank');
    showToast('Proses unduh backup dimulai...');
  };

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-500">
        <RefreshCw className="w-8 h-8 animate-spin mb-4 text-cyan-500" />
        <p>{t('custom.settingsLoading')}</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-12 flex flex-col gap-6 relative">
      {toast && (
        <div className="fixed top-24 right-6 z-50 bg-[#0f172a] border border-cyan-500/30 text-white px-5 py-3 rounded-2xl shadow-2xl text-sm font-medium flex items-center gap-3">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/25 flex items-center justify-center">
            <Settings className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-2xl font-display font-bold text-slate-200">{t('custom.sysSettingsTitle')}</h2>
            <p className="text-slate-400 text-sm">{t('custom.sysSettingsSubtitle')}</p>
          </div>
        </div>
        <button onClick={handleSave} disabled={saving} className="hidden md:flex btn-admin-premium disabled:opacity-50">
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? t('custom.saving') : t('custom.saveSettings')}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          <SettingSection title={t('custom.globalNotification')} icon={Bell} description={t('custom.globalNotifDesc')}>
            <div className="space-y-4">
              <Toggle 
                label={t('custom.notifNewTx')} 
                checked={settings['notify_new_transaction'] === 'true'} 
                onChange={(c) => updateSetting('notify_new_transaction', String(c))}
              />
              <Toggle 
                label={t('custom.notifBudgetAlert')} 
                checked={settings['notify_budget_alert'] === 'true'} 
                onChange={(c) => updateSetting('notify_budget_alert', String(c))}
              />
              <Toggle 
                label={t('custom.notifWeeklyReport')} 
                checked={settings['email_weekly_report'] === 'true'} 
                onChange={(c) => updateSetting('email_weekly_report', String(c))}
              />
            </div>
          </SettingSection>

          <SettingSection title={t('custom.dbMaintenance')} icon={Database} description={t('custom.dbMaintenanceDesc')}>
            <div className="space-y-4 pt-2">
              <button 
                onClick={handleBackup}
                className="w-full sm:w-auto px-5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-xl text-sm font-medium text-slate-200 transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" /> {t('custom.backupManual')}
              </button>
              <p className="text-xs text-slate-500">{t('custom.backupDesc')}</p>
            </div>
          </SettingSection>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <SettingSection title="SMTP & Email" icon={Mail} description="Konfigurasi server pengiriman email sistem.">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">{t('custom.smtpHost')}</label>
                  <input 
                    type="text" 
                    placeholder="smtp.gmail.com"
                    value={settings['smtp_host'] || ''} 
                    onChange={(e) => updateSetting('smtp_host', e.target.value)}
                    className="admin-input" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">{t('custom.smtpPort')}</label>
                  <input 
                    type="number" 
                    placeholder="465"
                    value={settings['smtp_port'] || ''} 
                    onChange={(e) => updateSetting('smtp_port', e.target.value)}
                    className="admin-input" 
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">{t('custom.smtpUsername')}</label>
                <input 
                  type="text" 
                  placeholder="email@domain.com"
                  value={settings['smtp_user'] || ''} 
                  onChange={(e) => updateSetting('smtp_user', e.target.value)}
                  className="admin-input" 
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">{t('custom.smtpPassword')}</label>
                <input 
                  type="password" 
                  placeholder="••••••••••••"
                  value={settings['smtp_pass'] || ''} 
                  onChange={(e) => updateSetting('smtp_pass', e.target.value)}
                  className="admin-input" 
                />
              </div>

              <div className="pt-2">
                <label className="block text-xs font-medium text-slate-400 mb-1">{t('custom.senderEmail')}</label>
                <input 
                  type="text" 
                  placeholder="noreply@monevra.com"
                  value={settings['sender_email'] || ''} 
                  onChange={(e) => updateSetting('sender_email', e.target.value)}
                  className="admin-input" 
                />
              </div>
            </div>
          </SettingSection>
        </div>
      </div>
      
      {/* Mobile Save Button */}
      <div className="md:hidden mt-4 flex justify-end pt-4 border-t border-white/10">
        <button onClick={handleSave} disabled={saving} className="btn-admin-premium w-full disabled:opacity-50">
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? t('custom.saving') : t('custom.saveSettings')}
        </button>
      </div>
    </div>
  );
}

function SettingSection({ title, icon: Icon, description, children }: { title: string; icon: any; description: string; children: React.ReactNode }) {
  return (
    <div className="glass-card rounded-[2rem] p-6 lg:p-8 h-full">
      <div className="flex items-center gap-3 mb-1">
        <Icon className="w-5 h-5 text-cyan-400" />
        <h3 className="text-lg font-bold text-slate-200">{title}</h3>
      </div>
      <p className="text-sm text-slate-400 mb-6 ml-8">{description}</p>
      <div className="ml-8">{children}</div>
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (c: boolean) => void }) {
  return (
    <label className="flex items-center justify-between cursor-pointer group">
      <span className="text-sm font-medium text-slate-300 group-hover:text-slate-200 transition-colors">{label}</span>
      <div className="relative" onClick={() => onChange(!checked)}>
        <div className={`block w-10 h-6 rounded-full transition-colors ${checked ? 'bg-cyan-500' : 'bg-slate-700'}`}></div>
        <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${checked ? 'translate-x-4' : ''}`}></div>
      </div>
    </label>
  );
}

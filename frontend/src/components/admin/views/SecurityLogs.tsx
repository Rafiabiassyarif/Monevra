import React, { useEffect, useState } from 'react';
import { useLanguage } from "../../../context/LanguageContext";
import { ShieldAlert, Lock, Key, AlertOctagon, Trash, RefreshCw } from 'lucide-react';
import { apiRequest } from '../../../lib/api';

interface SecurityLog {
  id: string;
  action: string;
  userEmail: string | null;
  ipAddress: string | null;
  createdAt: string;
}

export default function SecurityLogs() {
  const { t } = useLanguage();
  const [logs, setLogs] = useState<SecurityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<SecurityLog[]>('/admin/logs');
      setLogs(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleClearLogs = async () => {
    if (confirm('Anda yakin ingin menghapus semua log keamanan secara permanen?')) {
      try {
        await apiRequest('/admin/logs', { method: 'DELETE' });
        showToast('Semua log berhasil dihapus');
        await fetchLogs();
      } catch (e: any) {
        showToast(`Gagal menghapus log: ${e.message}`);
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  };

  return (
    <div className="max-w-7xl mx-auto pb-12 flex flex-col gap-6 relative">
      {toast && (
        <div className="fixed top-24 right-6 z-50 bg-[#0f172a] border border-cyan-500/30 text-white px-5 py-3 rounded-2xl shadow-2xl text-sm font-medium">
          {toast}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/25 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h2 className="text-2xl font-display font-bold text-slate-200">Log Keamanan</h2>
            <p className="text-slate-400 text-sm">Pantau aktivitas mencurigakan dan riwayat sistem secara real-time.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchLogs} className="btn-secondary flex items-center gap-2">
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
          <button onClick={handleClearLogs} className="flex items-center justify-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-xl text-sm font-bold text-red-400 hover:bg-red-500/20 transition-colors">
            <Trash size={16} /> Bersihkan Log
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
        <div className="glass-card p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-red-500/10 text-red-400 rounded-xl"><AlertOctagon size={24}/></div>
          <div><p className="text-2xl font-bold text-slate-200">0</p><p className="text-xs text-slate-400">Peringatan Kritis (7hr)</p></div>
        </div>
        <div className="glass-card p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl"><Lock size={24}/></div>
          <div><p className="text-2xl font-bold text-slate-200">0</p><p className="text-xs text-slate-400">Blokir IP Otomatis</p></div>
        </div>
        <div className="glass-card p-5 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-green-500/10 text-green-400 rounded-xl"><Key size={24}/></div>
          <div><p className="text-2xl font-bold text-slate-200">100%</p><p className="text-xs text-slate-400">Enkripsi Aktif</p></div>
        </div>
      </div>

      <div className="glass-card rounded-[2rem] overflow-hidden">
        <div className="p-5 border-b border-white/5">
          <h3 className="font-semibold text-slate-200">Aktivitas Terbaru</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-slate-500 border-b border-border-dark text-xs uppercase tracking-wider bg-surface-dark">
                <th className="py-4 px-6 font-medium">Aksi</th>
                <th className="py-4 px-6 font-medium">Target</th>
                <th className="py-4 px-6 font-medium">IP Address</th>
                <th className="py-4 px-6 font-medium">Waktu</th>
                <th className="py-4 px-6 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan={5} className="py-12 text-center text-slate-500">Memuat log...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={5} className="py-12 text-center text-slate-500">Tidak ada log keamanan yang tercatat.</td></tr>
              ) : logs.map((log) => (
                <tr key={log.id} className="hover:bg-white/[0.02]">
                  <td className="py-4 px-6 font-medium text-slate-300">{log.action}</td>
                  <td className="py-4 px-6 text-slate-400">{log.userEmail || '-'}</td>
                  <td className="py-4 px-6 text-slate-400 font-mono text-xs">{log.ipAddress || '127.0.0.1'}</td>
                  <td className="py-4 px-6 text-slate-500">{formatDate(log.createdAt)}</td>
                  <td className="py-4 px-6">
                    <span className="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-green-500/20 text-green-400 border border-green-500/20">
                      INFO
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

import React, { useEffect, useMemo, useState } from 'react';
import { useLanguage } from "../../../context/LanguageContext";
import { useAuth } from '../../../context/AuthContext';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Crown,
  Eye,
  Pencil,
  RefreshCw,
  Search,
  ShieldAlert,
  Trash,
  UserCheck,
  UserCog,
  Users,
  UserX,
  Wallet,
  X,
} from 'lucide-react';
import { formatCurrency } from '../../../lib/format';
import { apiRequest } from '../../../lib/api';

interface UserRow {
  id: string;
  email: string;
  name: string;
  role: string;
  currency: string;
  createdAt: any;
  txCount?: number;
  walletCount?: number;
  budgetCount?: number;
  totalBalance?: number;
}

const parseDate = (value: any) => {
  if (!value) return 'N/A';
  if (value.toDate) return value.toDate().toLocaleDateString('id-ID');
  return new Date(value).toLocaleDateString('id-ID');
};

interface UserManagementProps {
  onViewUser?: (user: UserRow) => void;
}

export default function UserManagement({ onViewUser }: UserManagementProps) {
  const { t } = useLanguage();
  const { user, isAdmin } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'admin' | 'user'>('all');
  const [toast, setToast] = useState('');
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 3000);
  };

  const fetchUsers = async () => {
    setRefreshing(true);
    setError(null);
    try {
      const list = await apiRequest<UserRow[]>('/admin/users');
      list.sort((a, b) => (b.txCount || 0) - (a.txCount || 0));
      setUsers(list);
    } catch (err: any) {
      setError(err.message || 'Gagal mengambil data pengguna');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isAdmin) fetchUsers();
    else setLoading(false);
  }, [isAdmin]);

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const q = search.toLowerCase();
      const matchSearch = (u.name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q);
      const matchRole = filterRole === 'all' || u.role === filterRole;
      return matchSearch && matchRole;
    });
  }, [users, search, filterRole]);

  const totals = useMemo(() => {
    const totalTx = users.reduce((sum, u) => sum + (u.txCount || 0), 0);
    const totalWallets = users.reduce((sum, u) => sum + (u.walletCount || 0), 0);
    const totalBudgets = users.reduce((sum, u) => sum + (u.budgetCount || 0), 0);
    const totalBalance = users.reduce((sum, u) => sum + (u.totalBalance || 0), 0);
    const adminCount = users.filter(u => u.role === 'admin').length;
    return { totalTx, totalWallets, totalBudgets, totalBalance, adminCount };
  }, [users]);

  const handleDeleteUser = async (target: UserRow) => {
    if (target.id === user?.uid) {
      showToast('Tidak bisa menghapus akun sendiri.');
      return;
    }
    if (!window.confirm(`Hapus profil ${target.name} beserta semua data keuangannya?`)) return;
    try {
      await apiRequest(`/admin/users/${target.id}`, { method: 'DELETE' });
      setUsers(prev => prev.filter(u => u.id !== target.id));
      showToast('Pengguna berhasil dihapus.');
    } catch (err: any) {
      showToast(`Gagal menghapus user: ${err.message}`);
    }
  };

  const handleToggleRole = async (target: UserRow) => {
    if (target.id === user?.uid) {
      showToast('Tidak bisa mengubah role akun sendiri.');
      return;
    }
    const newRole = target.role === 'admin' ? 'user' : 'admin';
    try {
      await apiRequest(`/admin/users/${target.id}`, {
        method: 'PUT',
        body: JSON.stringify({ ...target, role: newRole }),
      });
      setUsers(prev => prev.map(u => u.id === target.id ? { ...u, role: newRole } : u));
      showToast(`${target.name} sekarang menjadi ${newRole}.`);
    } catch (err: any) {
      showToast(`Gagal mengubah role: ${err.message}`);
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-400">
        <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center">
          <ShieldAlert size={40} className="text-red-400" />
        </div>
        <h2 className="text-2xl font-bold text-slate-200">Akses Ditolak</h2>
        <p className="text-slate-400">Akun ini tidak memiliki hak admin.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-12 flex flex-col gap-6">
      {toast && (
        <div className="fixed top-24 right-6 z-50 bg-[#0f172a] border border-cyan-500/30 text-white px-5 py-3 rounded-2xl shadow-2xl text-sm font-medium">
          {toast}
        </div>
      )}

      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/25 flex items-center justify-center">
              <UserCog className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-2xl font-display font-bold text-slate-200">Manajemen Pengguna</h2>
              <p className="text-slate-400 text-sm">Kelola semua pengguna, role, dan data akun.</p>
            </div>
          </div>
        </div>
        <button
          onClick={fetchUsers}
          disabled={refreshing}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-sm text-cyan-300 hover:bg-cyan-500/20 transition-colors disabled:opacity-60"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh Data
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-400/20 text-red-300 text-sm flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <div>
            <p className="font-semibold">Gagal memuat data</p>
            <p className="text-red-300/80">{error}</p>
          </div>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
        <MetricCard title={t('custom.usersTab')} value={users.length} detail={t('custom.umAdminCount').replace('{count}', String(totals.adminCount))} icon={Users} />
        <MetricCard title={t('custom.txTab')} value={totals.totalTx} detail={t('custom.umAllUsers')} icon={Activity} />
        <MetricCard title={t('custom.walletsTab')} value={totals.totalWallets} detail={t('custom.umBudgets').replace('{count}', String(totals.totalBudgets))} icon={Wallet} />
        <MetricCard title={t('custom.recordedBalance')} value={formatCurrency(totals.totalBalance, 'IDR')} detail={t('custom.umEstimate')} icon={BarChart3} />
        <MetricCard title={t('custom.activeUsers')} value={users.filter(u => (u.txCount || 0) > 0).length} detail={t('custom.umHasTx')} icon={CheckCircle2} />
      </div>

      {/* User Table */}
      <div className="glass-card rounded-[2rem] overflow-hidden">
        <div className="p-5 border-b border-white/5 flex flex-col lg:flex-row gap-4 lg:items-center justify-between">
          <div>
            <h3 className="font-semibold text-slate-200">{t('custom.umUserList')}</h3>
            <p className="text-xs text-slate-500">{t('custom.umShown').replace('{shown}', String(filteredUsers.length)).replace('{total}', String(users.length))}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex bg-white/5 border border-white/10 rounded-xl p-0.5 text-xs">
              {(['all', 'admin', 'user'] as const).map(role => (
                <button
                  key={role}
                  onClick={() => setFilterRole(role)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${filterRole === role ? 'bg-cyan-500/25 text-cyan-300' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  {role === 'all' ? t('custom.umAll') : role === 'admin' ? t('custom.roleAdmin') : t('custom.roleUser')}
                </button>
              ))}
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={t('custom.searchUser')}
                className="w-full sm:w-56 bg-surface-dark border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="text-slate-500 border-b border-white/5 text-xs uppercase tracking-wider">
                <th className="py-3 px-5 font-medium">Pengguna</th>
                <th className="py-3 px-5 font-medium">Role</th>
                <th className="py-3 px-5 font-medium text-right">Saldo</th>
                <th className="py-3 px-5 font-medium text-center">Data</th>
                <th className="py-3 px-5 font-medium">Bergabung</th>
                <th className="py-3 px-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan={6} className="py-16 text-center text-slate-500">Memuat data pengguna...</td></tr>
              ) : filteredUsers.map(u => (
                <tr key={u.id} className="hover:bg-white/[0.03] transition-colors">
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 font-semibold">
                        {(u.name || u.email || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-slate-200 flex items-center gap-2">
                          <span className="truncate max-w-[180px]">{u.name || 'N/A'}</span>
                          {u.id === user?.uid && <span className="text-[10px] px-1.5 py-0.5 bg-cyan-500/20 text-cyan-300 rounded">KAMU</span>}
                        </div>
                        <div className="text-xs text-slate-500 truncate max-w-[220px]">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-5"><RoleBadge role={u.role} /></td>
                  <td className="py-4 px-5 text-right text-slate-200 font-medium">
                    {formatCurrency(u.totalBalance || 0, u.currency || 'IDR')}
                  </td>
                  <td className="py-4 px-5">
                    <div className="flex justify-center gap-3 text-xs text-slate-400">
                      <span>{u.txCount || 0} tx</span>
                      <span>{u.walletCount || 0} dompet</span>
                      <span>{u.budgetCount || 0} budget</span>
                    </div>
                  </td>
                  <td className="py-4 px-5 text-slate-500 text-xs">{parseDate(u.createdAt)}</td>
                  <td className="py-4 px-5">
                    <div className="flex items-center justify-end gap-1">
                      {onViewUser && (
                        <button onClick={() => onViewUser(u)} className="px-3 py-1.5 rounded-lg bg-brand-500/10 text-brand-400 hover:bg-brand-500/20 text-xs font-bold border border-brand-500/20 mr-2 flex items-center gap-1.5 transition-colors">
                          <Eye size={14} /> Kelola Data
                        </button>
                      )}
                      <button onClick={() => setEditingUser(u)} className="p-2 rounded-lg text-slate-500 hover:text-amber-300 hover:bg-amber-500/10" title="Edit profil">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => handleToggleRole(u)} disabled={u.id === user?.uid} className="p-2 rounded-lg text-slate-500 hover:text-green-300 hover:bg-green-500/10 disabled:opacity-30" title="Ubah role">
                        {u.role === 'admin' ? <UserX size={16} /> : <UserCheck size={16} />}
                      </button>
                      <button onClick={() => handleDeleteUser(u)} disabled={u.id === user?.uid} className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 disabled:opacity-30" title="Hapus pengguna">
                        <Trash size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && filteredUsers.length === 0 && (
                <tr><td colSpan={6} className="py-16 text-center text-slate-500">Tidak ada pengguna ditemukan.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSaved={(updated) => {
            setUsers(prev => prev.map(u => u.id === updated.id ? { ...u, ...updated } : u));
            setEditingUser(null);
            showToast('Profil user berhasil diperbarui.');
          }}
        />
      )}
    </div>
  );
}

/* ─── Sub-components ─── */

function MetricCard({ title, value, detail, icon: Icon }: { title: string; value: React.ReactNode; detail: string; icon: any }) {
  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex items-start justify-between mb-4 gap-3">
        <Icon className="w-5 h-5 text-cyan-400" />
        <span className="text-xs text-slate-500 text-right">{detail}</span>
      </div>
      <div className="text-2xl font-display font-bold text-slate-200 truncate">{value}</div>
      <div className="text-sm text-slate-400 mt-1">{title}</div>
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  if (role === 'admin') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
        <Crown className="w-3 h-3" /> Admin
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/15 text-slate-300 border border-white/10">
      <CheckCircle2 className="w-3 h-3" /> User
    </span>
  );
}

function EditUserModal({ user: editUser, onClose, onSaved }: { user: UserRow; onClose: () => void; onSaved: (user: UserRow) => void }) {
  const { t } = useLanguage();
  const [form, setForm] = useState({
    name: editUser.name || '',
    email: editUser.email || '',
    role: editUser.role || 'user',
    currency: editUser.currency || 'IDR',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiRequest(`/admin/users/${editUser.id}`, {
        method: 'PUT',
        body: JSON.stringify({ name: form.name, email: form.email, role: form.role, currency: form.currency }),
      });
      onSaved({ ...editUser, ...form });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <form onSubmit={handleSubmit} className="relative z-10 w-full max-w-md glass-card rounded-[2rem] p-6 border border-white/10">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-display font-bold text-slate-200">Edit Pengguna</h3>
          <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>
        <div className="space-y-4">
          <FormField label="Nama">
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="admin-input" required />
          </FormField>
          <FormField label="Email">
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="admin-input" required />
          </FormField>
          <FormField label={t('custom.umRoleLabel')}>
            <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="admin-input">
              <option value="user">{t('custom.roleUser')}</option>
              <option value="admin">{t('custom.roleAdmin')}</option>
            </select>
          </FormField>
          <FormField label={t('custom.umCurrencyLabel')}>
            <select value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })} className="admin-input">
              <option value="IDR">{t('custom.umCurrencyIdr')}</option>
              <option value="USD">{t('custom.umCurrencyUsd')}</option>
              <option value="EUR">{t('custom.umCurrencyEur')}</option>
              <option value="SGD">{t('custom.umCurrencySgd')}</option>
              <option value="JPY">{t('custom.umCurrencyJpy')}</option>
            </select>
          </FormField>
        </div>
        <button disabled={saving} className="mt-6 w-full py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition-colors disabled:opacity-60">
          {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
        </button>
      </form>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-slate-400 mb-1">{label}</span>
      {children}
    </label>
  );
}

import React, { useEffect, useState } from 'react';
import { useLanguage } from "../../../context/LanguageContext";
import { useAuth } from '../../../context/AuthContext';
import {
  ArrowLeft,
  FileText,
  Pencil,
  Plus,
  RefreshCw,
  Target,
  Trash,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet
} from 'lucide-react';
import { formatCurrency } from '../../../lib/format';
import { apiRequest } from '../../../lib/api';
import { AdminTransactionModal, AdminWalletModal, AdminBudgetModal } from '../AdminModals';

interface UserRow {
  id: string;
  email: string;
  name: string;
  role: string;
  currency: string;
  createdAt: any;
  totalBalance?: number;
}

interface UserDetailData {
  transactions: any[];
  wallets: any[];
  budgets: any[];
}

type DetailTab = 'overview' | 'transactions' | 'wallets' | 'budgets';

const emptyDetail: UserDetailData = { transactions: [], wallets: [], budgets: [] };

interface UserDetailProps {
  user: UserRow;
  onBack: () => void;
}

export default function UserDetail({ user, onBack }: UserDetailProps) {
  const { t } = useLanguage();
  const { isAdmin } = useAuth();
  const [detail, setDetail] = useState<UserDetailData>(emptyDetail);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');
  const [toast, setToast] = useState('');
  
  const [addingKind, setAddingKind] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<{ kind: string, item: any } | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 3000);
  };

  const fetchUserDetail = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await apiRequest<UserDetailData>(`/admin/users/${user.id}/detail`);
      setDetail(data);
    } catch (err: any) {
      showToast(`Gagal memuat detail user: ${err.message}`);
      setDetail(emptyDetail);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin && user) {
      fetchUserDetail();
    }
  }, [isAdmin, user]);

  const handleDeleteSubDoc = async (kind: 'transactions' | 'wallets' | 'budgets', id: string) => {
    if (!window.confirm('Hapus data ini dari user terpilih?')) return;
    try {
      await apiRequest(`/admin/users/${user.id}/${kind}/${id}`, { method: 'DELETE' });
      await fetchUserDetail();
      showToast('Data berhasil dihapus.');
    } catch (err: any) {
      showToast(`Gagal menghapus data: ${err.message}`);
    }
  };

  const handleSaveSubDoc = async (kind: string, id: string | undefined, data: any) => {
    try {
      if (id) {
        await apiRequest(`/admin/users/${user.id}/${kind}/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data)
        });
        showToast('Data berhasil diperbarui.');
      } else {
        await apiRequest(`/admin/users/${user.id}/${kind}`, {
          method: 'POST',
          body: JSON.stringify(data)
        });
        showToast('Data berhasil ditambahkan.');
      }
      await fetchUserDetail();
      setAddingKind(null);
      setEditingItem(null);
    } catch (err: any) {
      showToast(`Gagal menyimpan data: ${err.message}`);
      throw err;
    }
  };

  const income = detail.transactions.filter(t => t.type === 'income' && t.status === 'Completed').reduce((sum, t) => sum + Number(t.amount), 0);
  const expense = detail.transactions.filter(t => t.type === 'expense' && t.status === 'Completed').reduce((sum, t) => sum + Number(t.amount), 0);
  const currency = user.currency || 'IDR';

  return (
    <div className="max-w-7xl mx-auto pb-12 flex flex-col gap-6">
      {toast && (
        <div className="fixed top-24 right-6 z-50 bg-[#0f172a] border border-cyan-500/30 text-white px-5 py-3 rounded-2xl shadow-2xl text-sm font-medium">
          {toast}
        </div>
      )}

      <div className="flex items-center gap-4 mb-2">
        <button onClick={onBack} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors border border-white/10">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-2xl font-display font-bold text-slate-200">Detail Pengguna: {user.name}</h2>
          <p className="text-slate-400 text-sm">{user.email}</p>
        </div>
      </div>

      <div className="glass-card rounded-[2rem] overflow-hidden">
        <div className="p-5 border-b border-white/5 flex gap-1 overflow-x-auto justify-between items-center">
          <div className="flex gap-1">
            {[
              { id: 'overview', label: 'Ringkas' },
              { id: 'transactions', label: 'Transaksi' },
              { id: 'wallets', label: 'Dompet' },
              { id: 'budgets', label: 'Budget' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as DetailTab)}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${activeTab === tab.id ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          {activeTab !== 'overview' && (
            <button 
              onClick={() => setAddingKind(activeTab)} 
              className="px-4 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-bold flex items-center gap-1.5 hover:bg-cyan-500/20 transition-colors"
            >
              <Plus size={16} /> Tambah Data
            </button>
          )}
        </div>

        <div className="p-6 min-h-[400px]">
          {loading ? (
            <div className="h-60 flex items-center justify-center text-slate-500">
              <RefreshCw className="w-6 h-6 animate-spin mr-3 text-cyan-500" /> Memuat detail...
            </div>
          ) : activeTab === 'overview' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <DetailMetric icon={Wallet} label="Total saldo" value={formatCurrency(user.totalBalance || 0, currency)} />
              <DetailMetric icon={TrendingUp} label="Total pemasukan" value={formatCurrency(income, currency)} tone="green" />
              <DetailMetric icon={TrendingDown} label="Total pengeluaran" value={formatCurrency(expense, currency)} tone="red" />
              <DetailMetric icon={FileText} label="Role & Mata Uang" value={`${user.role} - ${currency}`} />
              
              <div className="col-span-full mt-4 grid grid-cols-3 gap-4">
                 <MiniStat label="Total Transaksi" value={detail.transactions.length} />
                 <MiniStat label="Total Dompet" value={detail.wallets.length} />
                 <MiniStat label="Total Anggaran" value={detail.budgets.length} />
              </div>
            </div>
          ) : activeTab === 'transactions' ? (
            <div className="space-y-3">
              {detail.transactions.map(tx => (
                <div key={tx.id} className="p-4 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-medium text-slate-200">{tx.title}</p>
                    <p className="text-sm text-slate-500">{tx.category} • {tx.wallet} • {tx.date}</p>
                  </div>
                  <div className={`text-base font-bold ${tx.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                    {formatCurrency(tx.amount, currency)}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setEditingItem({ kind: 'transactions', item: tx })} className="p-2 rounded-lg text-slate-500 hover:text-cyan-400 hover:bg-cyan-500/10">
                      <Pencil size={18} />
                    </button>
                    <button onClick={() => handleDeleteSubDoc('transactions', tx.id)} className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10">
                      <Trash size={18} />
                    </button>
                  </div>
                </div>
              ))}
              {detail.transactions.length === 0 && <EmptyDetail label="Belum ada transaksi." />}
            </div>
          ) : activeTab === 'wallets' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {detail.wallets.map(wallet => (
                <div key={wallet.id} className="p-5 rounded-xl bg-white/[0.03] border border-white/5">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-base font-medium text-slate-200">{wallet.name}</p>
                      <p className="text-xs text-slate-500">{wallet.type} • {wallet.accountNumber || 'tanpa nomor'}</p>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => setEditingItem({ kind: 'wallets', item: wallet })} className="p-1.5 rounded-md text-slate-500 hover:text-cyan-400 hover:bg-cyan-500/10">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => handleDeleteSubDoc('wallets', wallet.id)} className="p-1.5 rounded-md text-slate-500 hover:text-red-400 hover:bg-red-500/10">
                        <Trash size={14} />
                      </button>
                    </div>
                  </div>
                  <p className="text-xl font-bold text-slate-200">{formatCurrency(wallet.balance, currency)}</p>
                </div>
              ))}
              {detail.wallets.length === 0 && <div className="col-span-full"><EmptyDetail label="Belum ada dompet." /></div>}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {detail.budgets.map(budget => (
                <div key={budget.id} className="p-5 rounded-xl bg-white/[0.03] border border-white/5">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <p className="text-base font-medium text-slate-200">{budget.category}</p>
                      <p className="text-xs text-slate-500">Limit bulanan</p>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => setEditingItem({ kind: 'budgets', item: budget })} className="p-1.5 rounded-md text-slate-500 hover:text-cyan-400 hover:bg-cyan-500/10">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => handleDeleteSubDoc('budgets', budget.id)} className="p-1.5 rounded-md text-slate-500 hover:text-red-400 hover:bg-red-500/10">
                        <Trash size={14} />
                      </button>
                    </div>
                  </div>
                  <p className="text-xl font-bold text-slate-200">{formatCurrency(budget.limit, currency)}</p>
                </div>
              ))}
              {detail.budgets.length === 0 && <div className="col-span-full"><EmptyDetail label="Belum ada budget." /></div>}
            </div>
          )}
        </div>
      </div>

      {/* Modals for CRUD operations */}
      {(addingKind === 'transactions' || editingItem?.kind === 'transactions') && (
        <AdminTransactionModal
          wallets={detail.wallets}
          item={editingItem?.kind === 'transactions' ? editingItem.item : undefined}
          onClose={() => { setAddingKind(null); setEditingItem(null); }}
          onSave={(data) => handleSaveSubDoc('transactions', editingItem?.kind === 'transactions' ? editingItem.item?.id : undefined, data)}
        />
      )}
      
      {(addingKind === 'wallets' || editingItem?.kind === 'wallets') && (
        <AdminWalletModal
          item={editingItem?.kind === 'wallets' ? editingItem.item : undefined}
          onClose={() => { setAddingKind(null); setEditingItem(null); }}
          onSave={(data) => handleSaveSubDoc('wallets', editingItem?.kind === 'wallets' ? editingItem.item?.id : undefined, data)}
        />
      )}

      {(addingKind === 'budgets' || editingItem?.kind === 'budgets') && (
        <AdminBudgetModal
          item={editingItem?.kind === 'budgets' ? editingItem.item : undefined}
          onClose={() => { setAddingKind(null); setEditingItem(null); }}
          onSave={(data) => handleSaveSubDoc('budgets', editingItem?.kind === 'budgets' ? editingItem.item?.id : undefined, data)}
        />
      )}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-white/[0.03] border border-white/5 p-4 flex flex-col items-center justify-center text-center">
      <div className="text-3xl font-display font-bold text-slate-200 mb-1">{value}</div>
      <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</div>
    </div>
  );
}

function DetailMetric({ icon: Icon, label, value, tone = 'brand' }: { icon: any; label: string; value: string; tone?: 'brand' | 'green' | 'red' }) {
  const toneClass = tone === 'green' ? 'text-green-400 bg-green-500/10 border-green-500/20' : tone === 'red' ? 'text-red-400 bg-red-500/10 border-red-500/20' : 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';
  return (
    <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/5">
      <div className={`p-3 rounded-xl border ${toneClass}`}>
        <Icon size={20} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</p>
        <p className="text-base font-bold text-slate-200 truncate">{value}</p>
      </div>
    </div>
  );
}

function EmptyDetail({ label }: { label: string }) {
  return (
    <div className="py-16 text-center text-slate-500">
      <Target className="w-12 h-12 mx-auto mb-3 text-slate-600/50" />
      <p className="text-lg">{label}</p>
    </div>
  );
}

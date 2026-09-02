import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useFinance } from '../../../context/FinanceContext';
import { useLanguage } from '../../../context/LanguageContext';
import { Plus, Search, Filter, Pencil, Trash, TrendingUp, ShoppingCart, AlertTriangle } from 'lucide-react';
import TransactionModal from '../TransactionModal';
import { Transaction } from '../../../types';
import { formatCurrency } from '../../../lib/format';

export default function TransactionsView() {
  const { t } = useLanguage();
  const { transactions, deleteTransaction, deleteAllTransactions, profile } = useFinance();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [txToEdit, setTxToEdit] = useState<Transaction | null>(null);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');

  const openModal = (tx?: Transaction) => { setTxToEdit(tx || null); setIsModalOpen(true); };

  const filteredTransactions = transactions.filter(tx => {
    const q = search.toLowerCase();
    const matchesSearch = tx.title.toLowerCase().includes(q) || tx.category.toLowerCase().includes(q) || tx.wallet.toLowerCase().includes(q);
    const matchesType = filterType === 'All' || (filterType === 'Income' && tx.type === 'income') || (filterType === 'Expense' && tx.type === 'expense');
    const matchesStatus = filterStatus === 'All' || tx.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const currency = profile.currency || 'IDR';

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="max-w-7xl mx-auto pb-12 flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-slate-200 tracking-tight mb-1">{t('custom.txTitle') || 'Daftar Transaksi'}</h2>
          <p className="text-slate-400 text-sm">{t('custom.txSubtitle') || 'Kelola semua riwayat pemasukan dan pengeluaran Anda.'}</p>
        </div>
        <div className="flex gap-3">
          {transactions.length > 0 && (<button onClick={() => setIsDeleteAllModalOpen(true)} className="btn-premium-danger shadow-lg shadow-red-500/20"><Trash size={16} /> {t('custom.txDeleteAll') || 'Hapus Semua'}</button>)}
          <button onClick={() => openModal()} className="btn-premium shadow-lg shadow-brand-500/20"><Plus size={16} /> {t('custom.modalNewTx') || 'Transaksi Baru'}</button>
        </div>
      </div>

      <div className="glass-card rounded-[2.5rem] p-6 sm:p-8 flex flex-col relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-500/5 blur-[120px] rounded-full pointer-events-none translate-x-1/3 -translate-y-1/3" />
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-8 relative z-10">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-hover:text-brand-400 transition-colors" />
            <input type="text" placeholder={t('custom.txSearchPlaceholder') || 'Cari transaksi, kategori, atau dompet...'} value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-surface-hover border border-border-dark rounded-2xl pl-12 pr-4 py-3.5 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/50 transition-all hover:border-slate-300/30 shadow-inner" />
          </div>
          <div className="flex gap-3 flex-wrap">
            <div className="relative"><select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="appearance-none pl-4 pr-10 py-3.5 rounded-2xl border border-border-dark bg-surface-hover text-sm font-semibold text-slate-300 hover:border-slate-300/30 transition-all focus:outline-none shadow-sm cursor-pointer"><option value="All">{t('custom.txAllTypes') || 'Semua Tipe'}</option><option value="Income">{t('custom.commonIncome') || 'Pemasukan'}</option><option value="Expense">{t('custom.commonExpense') || 'Pengeluaran'}</option></select><Filter size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" /></div>
            <div className="relative"><select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="appearance-none pl-4 pr-10 py-3.5 rounded-2xl border border-border-dark bg-surface-hover text-sm font-semibold text-slate-300 hover:border-slate-300/30 transition-all focus:outline-none shadow-sm cursor-pointer"><option value="All">{t('custom.txAllStatus') || 'Semua Status'}</option><option value="Completed">{t('custom.commonCompleted') || 'Selesai'}</option><option value="Pending">{t('custom.commonPending') || 'Tertunda'}</option><option value="Failed">{t('custom.commonFailed') || 'Gagal'}</option></select><Filter size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" /></div>
          </div>
        </div>
        <div className="overflow-x-auto relative z-10">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-surface-dark"><tr className="text-slate-400 border-b border-border-dark text-xs uppercase tracking-wider"><th className="py-4 px-5 font-semibold rounded-tl-2xl">{t('custom.txName') || 'Transaksi'}</th><th className="py-4 px-5 font-semibold text-right">{t('custom.modalAmount') || 'Jumlah'}</th><th className="py-4 px-5 font-semibold hidden md:table-cell">{t('custom.modalDate') || 'Tanggal'}</th><th className="py-4 px-5 font-semibold hidden lg:table-cell">{t('custom.modalWallet') || 'Dompet'}</th><th className="py-4 px-5 font-semibold hidden sm:table-cell">Status</th><th className="py-4 px-5 text-right rounded-tr-2xl">{t('custom.txAction') || 'Aksi'}</th></tr></thead>
            <tbody className="divide-y divide-white/5">
              {filteredTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-surface-hover transition-colors group">
                  <td className="py-4 px-5"><div className="flex items-center gap-4"><div className="w-12 h-12 rounded-2xl bg-surface-dark border border-border-dark flex items-center justify-center group-hover:border-brand-500/30 group-hover:bg-brand-500/10 transition-colors shrink-0 shadow-lg shadow-black/20">{tx.type === 'income' ? <TrendingUp size={24} className="text-green-400" /> : <ShoppingCart size={24} className="text-slate-400" />}</div><div><p className="font-semibold text-slate-200 group-hover:text-white transition-colors truncate max-w-[160px]">{tx.title}</p><p className="text-xs text-slate-500 mt-0.5">{t('custom.cat' + tx.category) || tx.category}</p></div></div></td>
                  <td className="py-4 px-5 text-right"><span className={`font-bold text-base ${tx.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>{tx.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(tx.amount), currency)}</span></td>
                  <td className="py-4 px-5 text-slate-400 hidden md:table-cell text-xs">{new Date(tx.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                  <td className="py-4 px-5 hidden lg:table-cell"><span className="inline-flex items-center gap-1.5 text-xs font-medium bg-surface-dark border border-border-dark px-3 py-1.5 rounded-xl text-slate-300">{tx.wallet}</span></td>
                  <td className="py-4 px-5 hidden sm:table-cell"><span className={`inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-xl border ${tx.status === 'Completed' ? 'text-green-400 bg-green-400/10 border-green-400/20' : tx.status === 'Pending' ? 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20' : 'text-red-400 bg-red-400/10 border-red-400/20'}`}>{tx.status === 'Completed' ? (t('custom.commonCompleted') || 'Selesai') : tx.status === 'Pending' ? (t('custom.commonPending') || 'Tertunda') : (t('custom.commonFailed') || 'Gagal')}</span></td>
                  <td className="py-4 px-5 text-right"><div className="flex items-center justify-end gap-1.5 transition-opacity"><button onClick={() => openModal(tx)} className="p-2.5 rounded-xl text-slate-400 hover:text-brand-400 hover:bg-brand-500/10 transition-colors border border-transparent hover:border-brand-500/20" title="Edit"><Pencil size={16} /></button><button onClick={() => { if (window.confirm(t('custom.txConfirmDelete') || 'Hapus transaksi ini?')) deleteTransaction(tx.id); }} className="p-2.5 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors border border-transparent hover:border-red-500/20" title="Hapus"><Trash size={16} /></button></div></td>
                </tr>
              ))}
              {filteredTransactions.length === 0 && (<tr><td colSpan={6} className="py-20 text-center"><div className="flex flex-col items-center justify-center text-slate-500 gap-4"><div className="w-20 h-20 bg-surface-dark rounded-full flex items-center justify-center border border-border-dark shadow-2xl"><Search className="w-10 h-10 text-slate-600" /></div><div><p className="font-semibold text-slate-300 text-base mb-1">{t('custom.txNoTx') || 'Tidak Ada Transaksi'}</p><p className="text-sm">{transactions.length === 0 ? (t('custom.txEmpty') || 'Belum ada transaksi.') : (t('custom.txFilterEmpty') || 'Tidak ada yang cocok dengan filter.')}</p></div></div></td></tr>)}
            </tbody>
          </table>
        </div>
        {filteredTransactions.length > 0 && (<div className="mt-6 pt-5 border-t border-border-dark flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider"><span>{t('custom.txTotalShowing') || 'Total Menampilkan'}</span><span className="bg-surface-hover px-3 py-1.5 rounded-lg text-slate-300">{filteredTransactions.length} {t('custom.txOf') || 'dari'} {transactions.length}</span></div>)}
      </div>

      <AnimatePresence>
        {isModalOpen && <TransactionModal onClose={() => { setIsModalOpen(false); setTxToEdit(null); }} txToEdit={txToEdit} />}
        {isDeleteAllModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => !isDeletingAll && setIsDeleteAllModalOpen(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="w-full max-w-md bg-gradient-to-br from-surface-dark to-bg-dark rounded-[2rem] p-1 relative z-10 shadow-2xl shadow-red-500/10 overflow-hidden">
              <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-red-500/20 blur-[100px] pointer-events-none translate-x-1/2 -translate-y-1/2 rounded-full" />
              <div className="bg-surface-dark/90 backdrop-blur-xl rounded-[1.9rem] p-6 sm:p-8 relative border border-red-500/20 text-center">
                <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner shadow-red-500/20"><AlertTriangle size={32} /></div>
                <h3 className="text-xl font-display font-bold text-white mb-2">{t('custom.txDeleteAllConfirmTitle') || 'Hapus Semua Transaksi?'}</h3>
                <p className="text-slate-400 text-sm mb-8 leading-relaxed">Apakah Anda yakin ingin menghapus <strong>{transactions.length} transaksi</strong>? Tindakan ini tidak dapat dibatalkan.</p>
                <div className="flex gap-3">
                  <button onClick={() => setIsDeleteAllModalOpen(false)} disabled={isDeletingAll} className="flex-1 btn-secondary">{t('custom.commonCancel') || 'Batal'}</button>
                  <button onClick={async () => { setIsDeletingAll(true); try { await deleteAllTransactions(); setIsDeleteAllModalOpen(false); } catch { alert('Gagal menghapus semua transaksi.'); } finally { setIsDeletingAll(false); } }} disabled={isDeletingAll} className="flex-1 btn-premium-danger flex items-center justify-center gap-2">{isDeletingAll ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Trash size={16} /> {t('custom.txDeleteAllConfirmBtn') || 'Ya, Hapus Semua'}</>}</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

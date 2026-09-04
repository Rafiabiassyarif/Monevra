import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useFinance } from '../../../context/FinanceContext';
import { Wallet as WalletIcon, Plus, CreditCard, Building2, Smartphone, Pencil, Trash, X, Globe } from 'lucide-react';
import { Wallet } from '../../../types';
import { useLanguage } from '../../../context/LanguageContext';
import { formatCurrency } from '../../../lib/format';
import { blockNonNumericKey, sanitizeNumericPaste } from '../../../lib/utils';

import { convertToBase, convertFromBase } from '../../../lib/exchangeRates';

export default function WalletsView() {
  const { t } = useLanguage();
  const { wallets, deleteWallet, getTotalBalance, profile } = useFinance();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [walletToEdit, setWalletToEdit] = useState<Wallet | null>(null);

  const openModal = (wallet?: Wallet) => {
    setWalletToEdit(wallet || null);
    setIsModalOpen(true);
  };

  const currency = profile.currency || 'IDR';
  const totalBalance = getTotalBalance();

  return (
    <div className="max-w-7xl mx-auto pb-12 flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-slate-200">{t('custom.walletsPageTitle') || 'Dompet & Akun'}</h2>
          <p className="text-slate-400 text-sm">{t('custom.walletsPageDesc') || 'Kelola akun bank tertaut, kartu, dan uang elektronik Anda.'}</p>
        </div>
        <button
          onClick={() => openModal()}
          className="btn-premium"
        >
          <Plus size={16} /> {t('custom.walletAddBtn') || 'Tambah Dompet'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Total Balance Summary Card */}
        <div className="rounded-[2rem] p-6 relative overflow-hidden bg-surface-dark shadow-2xl shadow-slate-900/10 border border-border-dark group">
          <div className="absolute top-0 right-0 w-48 h-48 bg-brand-500/5 blur-3xl rounded-full translate-x-1/3 -translate-y-1/3 pointer-events-none group-hover:bg-brand-500/10 transition-all duration-700" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-accent-500/5 blur-2xl rounded-full -translate-x-1/3 translate-y-1/3 pointer-events-none group-hover:bg-accent-500/10 transition-all duration-700" />

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-xl bg-surface-hover backdrop-blur-md text-slate-300 border border-border-dark shadow-sm">
                <WalletIcon size={20} />
              </div>
              <span className="font-semibold text-slate-400 uppercase tracking-wider text-xs">{t('custom.walletNetWorth')}</span>
            </div>
            <div className="text-4xl font-display font-bold text-slate-200 tracking-tight mb-3">
              {formatCurrency(totalBalance, currency)}
            </div>
            <p className="text-sm text-slate-400 font-medium">
              {t('custom.walletTotalIn')} {wallets.length} {t('custom.walletWallets')}
            </p>
            {wallets.length === 0 && (
              <button
                onClick={() => openModal()}
                className="mt-4 text-xs font-semibold text-brand-500 hover:text-brand-400 transition-colors flex items-center gap-1"
              >
                <Plus size={12} /> {t('custom.walletAddFirst')}
              </button>
            )}
          </div>
        </div>

        {wallets.map(wallet => (
          <WalletCard
            key={wallet.id}
            wallet={wallet}
            onEdit={() => openModal(wallet)}
            onDelete={() => {
              if (window.confirm(t('custom.walletConfirmDelete')?.replace('{name}', wallet.name) || `Hapus dompet "${wallet.name}"? Transaksi terkait tidak akan ikut terhapus.`)) {
                deleteWallet(wallet.id);
              }
            }}
            currency={currency}
          />
        ))}
      </div>

      {wallets.length === 0 && (
        <div className="glass-card rounded-[2rem] p-8 text-center flex flex-col items-center gap-3 text-slate-500">
          <WalletIcon className="w-10 h-10 text-slate-600" />
          <p className="text-sm">{t('custom.walletEmptyTitle') || 'Belum ada dompet. Mulai dengan menambahkan rekening bank, e-wallet, atau kartu kredit.'}</p>
        </div>
      )}

      <AnimatePresence>
        {isModalOpen && <AddWalletModal onClose={() => setIsModalOpen(false)} walletToEdit={walletToEdit} />}
      </AnimatePresence>
    </div>
  );
}

const WalletCard: React.FC<{ wallet: Wallet; onEdit: () => void; onDelete: () => void, currency: string }> = ({ wallet, onEdit, onDelete, currency }) => {
  const { t } = useLanguage();
  const getIcon = () => {
    switch (wallet.type) {
      case 'Bank': return <Building2 size={24} className="text-slate-300" />;
      case 'Crypto': return <Smartphone size={24} className="text-slate-300" />;
      case 'eWallet': return <Globe size={24} className="text-slate-300" />;
      default: return <CreditCard size={24} className="text-slate-300" />;
    }
  };

  const typeLabel: Record<string, string> = {
    Bank: t('custom.walletTypeBank'),
    Crypto: t('custom.walletTypeCrypto'),
    eWallet: t('custom.walletTypeEwallet'),
  };

  const cardGradient = 'bg-surface-dark';

  const glowColor = wallet.type === 'Bank'
    ? 'from-blue-500/20 to-indigo-600/20'
    : wallet.type === 'Crypto'
    ? 'from-amber-400/20 to-orange-600/20'
    : 'from-emerald-400/20 to-teal-600/20';

  const accentColor = wallet.type === 'Bank'
    ? 'border-blue-500/30'
    : wallet.type === 'Crypto'
    ? 'border-amber-500/30'
    : 'border-emerald-500/30';

  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.015 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="relative group cursor-pointer"
    >
      {/* Outer glow on hover */}
      <div className={`absolute inset-0 bg-gradient-to-br ${glowColor} rounded-[2rem] blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-600 scale-105`} />

      <div className={`relative rounded-[2rem] overflow-hidden border ${accentColor} shadow-xl ${cardGradient}`}
        style={{ minHeight: '220px' }}
      >
        {/* Subtle sheen line at the top */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        {/* Background texture circles */}
        <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-surface-hover blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-surface-hover blur-2xl pointer-events-none" />

        <div className="p-6 flex flex-col h-full" style={{ minHeight: '220px' }}>
          {/* Top row: Chip + Contactless + Action buttons */}
          <div className="flex justify-between items-start mb-auto">
            <div className="flex items-center gap-3">
              {/* Clean gold chip */}
              <div className="relative w-11 h-8 rounded-[6px] overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #f5e27a 0%, #d4a017 40%, #f5e27a 60%, #b8860b 100%)',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.4)'
                }}
              >
                {/* Chip lines */}
                <div className="absolute inset-0 flex flex-col justify-between p-1 opacity-60">
                  <div className="w-full h-px bg-amber-900/60" />
                  <div className="w-full h-px bg-amber-900/60" />
                  <div className="w-full h-px bg-amber-900/60" />
                </div>
                <div className="absolute inset-0 flex justify-between p-1 opacity-60">
                  <div className="h-full w-px bg-amber-900/60" />
                  <div className="h-full w-px bg-amber-900/60" />
                </div>
                {/* Center square */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-4 h-3 rounded-sm border border-amber-900/40 bg-amber-400/30" />
                </div>
              </div>
            </div>

            {/* Edit/Delete — visible on hover */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-black/30 rounded-xl p-1 backdrop-blur-sm">
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(); }}
                className="p-1.5 text-slate-300 hover:text-white transition-colors rounded-lg hover:bg-white/10"
                title={t('custom.walletsEdit')}
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="p-1.5 text-slate-300 hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/20"
                title={t('custom.walletsDelete')}
              >
                <Trash size={14} />
              </button>
            </div>
          </div>

          {/* Middle: wallet name + account number */}
          <div className="mt-6">
            <h3 className="text-lg font-bold text-slate-200 tracking-widest uppercase">{wallet.name}</h3>
            {wallet.accountNumber ? (
              <p className="text-xs text-slate-400 font-mono tracking-[0.3em] mt-1">{wallet.accountNumber}</p>
            ) : (
              <p className="text-xs text-slate-500 font-mono tracking-[0.3em] mt-1">•••• •••• ••••</p>
            )}
          </div>

          {/* Bottom row: balance + type badge + icon */}
          <div className="mt-5 pt-4 border-t border-border-dark flex justify-between items-end">
            <div>
              <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-[0.2em] mb-1">
                {t('custom.walletBalance') || 'Balance'}
              </div>
              <div className={`text-xl font-display font-bold tracking-tight ${wallet.balance < 0 ? 'text-red-400' : 'text-slate-200'}`}>
                {formatCurrency(wallet.balance, currency)}
              </div>
              {wallet.balance < 0 && <p className="text-[9px] text-red-400 mt-0.5">{t('custom.walletsNegative') || 'Negative'}</p>}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] uppercase font-bold tracking-widest text-slate-400 bg-surface-hover px-2.5 py-1 rounded-full border border-border-dark">
                {typeLabel[wallet.type] || wallet.type}
              </span>
              <div className="w-9 h-9 rounded-full bg-surface-hover flex items-center justify-center border border-border-dark shadow-sm">
                {getIcon()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

function AddWalletModal({ onClose, walletToEdit }: { onClose: () => void, walletToEdit?: Wallet | null }) {
  const { addWallet, updateWallet, profile } = useFinance();
  const { t } = useLanguage();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const initialBalanceStr = walletToEdit?.balance
    ? convertFromBase(walletToEdit.balance, profile.currency).toString()
    : '0';

  const [formData, setFormData] = useState({
    name: walletToEdit?.name || '',
    initialBalance: initialBalanceStr,
    type: walletToEdit?.type || 'Bank' as Wallet['type'],
    accountNumber: walletToEdit?.accountNumber || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!formData.name) { setError('Nama dompet wajib diisi.'); return; }

    const balanceInBase = convertToBase(parseFloat(formData.initialBalance || '0'), profile.currency);
    setSaving(true);
    try {
      if (walletToEdit) {
        await updateWallet(walletToEdit.id, {
          name: formData.name,
          type: formData.type,
          accountNumber: formData.accountNumber || undefined,
          balance: parseFloat(formData.initialBalance) || 0,
        });
      } else {
        await addWallet({
          name: formData.name,
          type: formData.type,
          initialBalance: parseFloat(formData.initialBalance) || 0,
          accountNumber: formData.accountNumber || undefined,
        });
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan dompet.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-md glass-card rounded-[2rem] p-6 relative z-10 border border-border-dark"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-display font-bold text-slate-200">{walletToEdit ? 'Ubah Dompet' : 'Tambah Dompet'}</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-hover text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mb-4 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">{t('custom.walletNameLabel')}</label>
            <input
              type="text"
              required
              className="w-full bg-surface-dark border border-border-dark rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-brand-500/50 transition-colors"
              placeholder={t('custom.walletNameHint')}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">{t('custom.walletTypeLabel')}</label>
            <select
              className="w-full bg-surface-dark border border-border-dark rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-brand-500/50 transition-colors"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as Wallet['type'] })}
            >
              <option value="Bank">{t('custom.walletBankAccount')}</option>
              <option value="eWallet">{t('custom.walletDigitalWallet')}</option>
              <option value="Crypto">{t('custom.walletCryptoWallet')}</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">{walletToEdit ? t('custom.walletCurrentBalance') : t('custom.walletInitialBalance')}</label>
            <input
              type="number"
              step="0.01"
              onKeyDown={blockNonNumericKey}
              onPaste={sanitizeNumericPaste}
              className="w-full bg-surface-dark border border-border-dark rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-brand-500/50 transition-colors"
              placeholder="0"
              value={formData.initialBalance}
              onChange={(e) => setFormData({ ...formData, initialBalance: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">{t('custom.walletAccountId')}</label>
            <input
              type="text"
              className="w-full bg-surface-dark border border-border-dark rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-brand-500/50 transition-colors"
              placeholder={t('custom.walletIdHint')}
              value={formData.accountNumber}
              onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="btn-premium w-full text-white -500/20 disabled:opacity-60"
          >
            {saving ? 'Menyimpan...' : walletToEdit ? 'Simpan Perubahan' : 'Tambah Dompet'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

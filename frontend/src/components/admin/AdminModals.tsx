import React, { useState } from 'react';
import { useLanguage } from "../../context/LanguageContext";
import { X } from 'lucide-react';
import { Transaction, Wallet, Budget } from '../../types';

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-slate-400 mb-1">{label}</span>
      {children}
    </label>
  );
}

export function AdminTransactionModal({ 
  item, 
  wallets, 
  onClose, 
  onSave 
}: { 
  item?: Transaction | null, 
  wallets: Wallet[], 
  onClose: () => void, 
  onSave: (data: any) => Promise<void> 
}) {
  const [form, setForm] = useState({
    title: item?.title || '',
    category: item?.category || '',
    amount: item?.amount?.toString() || '',
    wallet: item?.wallet || (wallets.length > 0 ? wallets[0].name : ''),
    date: item?.date || new Date().toISOString().slice(0, 10),
    type: item?.type || 'expense',
  });
  const [saving, setSaving] = useState(false);
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        ...form,
        amount: parseFloat(form.amount) || 0,
      });
      onClose();
    } catch {
      // error handled by parent
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <form onSubmit={handleSubmit} className="relative z-10 w-full max-w-md glass-card rounded-[2rem] p-6 border border-white/10">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-display font-bold text-slate-200">{item ? t('custom.txEditTitle') : t('custom.txAddTitle')}</h3>
          <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>
        <div className="space-y-4">
          <FormField label={t('custom.txFormTitle')}>
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full bg-surface-dark border border-white/10 rounded-xl px-4 py-2 text-slate-200" required />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label={t('custom.txFormType')}>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as any })} className="w-full bg-surface-dark border border-white/10 rounded-xl px-4 py-2 text-slate-200">
                <option value="expense">{t('custom.typeExpense')}</option>
                <option value="income">{t('custom.typeIncome')}</option>
              </select>
            </FormField>
            <FormField label={t('custom.txFormCategory')}>
              <input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full bg-surface-dark border border-white/10 rounded-xl px-4 py-2 text-slate-200" required />
            </FormField>
          </div>
          <FormField label={t('custom.txFormAmount')}>
            <input type="number" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className="w-full bg-surface-dark border border-white/10 rounded-xl px-4 py-2 text-slate-200" required />
          </FormField>
          <FormField label={t('custom.txFormWallet')}>
            <select value={form.wallet} onChange={e => setForm({ ...form, wallet: e.target.value })} className="w-full bg-surface-dark border border-white/10 rounded-xl px-4 py-2 text-slate-200" required>
              {wallets.map(w => <option key={w.id} value={w.name}>{w.name}</option>)}
              {wallets.length === 0 && <option value="">{t('custom.noWallets')}</option>}
            </select>
          </FormField>
          <FormField label={t('custom.txFormDate')}>
            <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="w-full bg-surface-dark border border-white/10 rounded-xl px-4 py-2 text-slate-200" required />
          </FormField>
        </div>
        <button disabled={saving || wallets.length === 0} className="btn-admin-premium w-full disabled:opacity-60 disabled:cursor-not-allowed mt-6">
          {saving ? 'Menyimpan...' : 'Simpan'}
        </button>
      </form>
    </div>
  );
}

export function AdminWalletModal({ 
  item, 
  onClose, 
  onSave 
}: { 
  item?: Wallet | null, 
  onClose: () => void, 
  onSave: (data: any) => Promise<void> 
}) {
  const [form, setForm] = useState({
    name: item?.name || '',
    type: item?.type || 'Bank',
    balance: item?.balance?.toString() || '0',
    accountNumber: item?.accountNumber || '',
  });
  const [saving, setSaving] = useState(false);
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        ...form,
        balance: parseFloat(form.balance) || 0,
      });
      onClose();
    } catch {
      // error handled by parent
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <form onSubmit={handleSubmit} className="relative z-10 w-full max-w-md glass-card rounded-[2rem] p-6 border border-white/10">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-display font-bold text-slate-200">{item ? t('custom.walletEditTitle') : t('custom.walletAddTitle')}</h3>
          <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>
        <div className="space-y-4">
          <FormField label={t('custom.walletFormName')}>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full bg-surface-dark border border-white/10 rounded-xl px-4 py-2 text-slate-200" required />
          </FormField>
          <FormField label={t('custom.walletFormType')}>
            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as any })} className="w-full bg-surface-dark border border-white/10 rounded-xl px-4 py-2 text-slate-200">
              <option value="Bank">{t('custom.typeBank')}</option>
              <option value="eWallet">{t('custom.typeEWallet')}</option>
              <option value="Crypto">{t('custom.typeCrypto')}</option>
            </select>
          </FormField>
          <FormField label={t('custom.walletFormBalance')}>
            <input type="number" step="0.01" value={form.balance} onChange={e => setForm({ ...form, balance: e.target.value })} className="w-full bg-surface-dark border border-white/10 rounded-xl px-4 py-2 text-slate-200" required />
          </FormField>
          <FormField label={t('custom.walletFormAccount')}>
            <input value={form.accountNumber} onChange={e => setForm({ ...form, accountNumber: e.target.value })} className="w-full bg-surface-dark border border-white/10 rounded-xl px-4 py-2 text-slate-200" />
          </FormField>
        </div>
        <button disabled={saving} className="btn-admin-premium w-full disabled:opacity-60 disabled:cursor-not-allowed mt-6">
          {saving ? t('custom.saving') : t('custom.save')}
        </button>
      </form>
    </div>
  );
}

export function AdminBudgetModal({ 
  item, 
  onClose, 
  onSave 
}: { 
  item?: Budget | null, 
  onClose: () => void, 
  onSave: (data: any) => Promise<void> 
}) {
  const [form, setForm] = useState({
    category: item?.category || '',
    limit: item?.limit?.toString() || '0',
  });
  const [saving, setSaving] = useState(false);
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        ...form,
        limit: parseFloat(form.limit) || 0,
      });
      onClose();
    } catch {
      // error handled by parent
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <form onSubmit={handleSubmit} className="relative z-10 w-full max-w-md glass-card rounded-[2rem] p-6 border border-white/10">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-display font-bold text-slate-200">{item ? t('custom.budgetEditTitle') : t('custom.budgetAddTitle')}</h3>
          <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>
        <div className="space-y-4">
          <FormField label={t('custom.txFormCategory')}>
            <input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full bg-surface-dark border border-white/10 rounded-xl px-4 py-2 text-slate-200" required />
          </FormField>
          <FormField label={t('custom.budgetLimitLabel')}>
            <input type="number" step="0.01" value={form.limit} onChange={e => setForm({ ...form, limit: e.target.value })} className="w-full bg-surface-dark border border-white/10 rounded-xl px-4 py-2 text-slate-200" required />
          </FormField>
        </div>
        <button disabled={saving} className="btn-admin-premium w-full disabled:opacity-60 disabled:cursor-not-allowed mt-6">
          {saving ? t('custom.saving') : t('custom.save')}
        </button>
      </form>
    </div>
  );
}

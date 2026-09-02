import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Receipt, Wallet, Calendar, Tag, ChevronDown, Save, ShoppingCart, TrendingUp, Scan, Plus, Trash, AlertTriangle } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { Transaction } from '../../types';
import { convertToBase, convertFromBase } from '../../lib/exchangeRates';
import CameraScannerModal from './CameraScannerModal';

const CATEGORIES = {
  income: [
    { id: 'Salary', label: 'Gaji' },
    { id: 'Freelance', label: 'Freelance' },
    { id: 'Investment', label: 'Investasi' },
    { id: 'Gift', label: 'Hadiah' },
    { id: 'Other', label: 'Lainnya' }
  ],
  expense: [
    { id: 'Food', label: 'Makanan & Minuman' },
    { id: 'Transport', label: 'Transportasi' },
    { id: 'Housing', label: 'Tempat Tinggal' },
    { id: 'Entertainment', label: 'Hiburan' },
    { id: 'Health', label: 'Kesehatan' },
    { id: 'Shopping', label: 'Belanja' },
    { id: 'Education', label: 'Pendidikan' },
    { id: 'Utilities', label: 'Tagihan' },
    { id: 'Other', label: 'Lainnya' }
  ]
};

export default function TransactionModal({ onClose, txToEdit }: { onClose: () => void, txToEdit?: Transaction | null }) {
  const { addTransaction, updateTransaction, wallets, profile } = useFinance();
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const today = () => new Date().toISOString().split('T')[0];

  const sanitizeScannedDate = (dateStr: string | undefined): string => {
    if (!dateStr) return today();
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return today();
    const diffDays = (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays > 31 ? today() : dateStr;
  };

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initialAmount = txToEdit?.amount
    ? convertFromBase(Math.abs(txToEdit.amount), profile.currency).toString()
    : '';

  const [globalData, setGlobalData] = useState({
    type: txToEdit?.type || 'expense' as 'expense' | 'income',
    wallet: txToEdit?.wallet || (wallets[0]?.name || ''),
    date: txToEdit?.date || new Date().toISOString().split('T')[0],
    status: txToEdit?.status || 'Completed' as 'Completed' | 'Pending' | 'Failed',
  });

  const [items, setItems] = useState<{ id: number, title: string, amount: string, category: string }[]>(
    txToEdit
      ? [{ id: Date.now(), title: txToEdit.title, amount: initialAmount, category: txToEdit.category }]
      : [{ id: Date.now(), title: '', amount: '', category: '' }]
  );

  const processReceiptFile = async (file: File) => {
    const formDataToUpload = new FormData();
    formDataToUpload.append('receipt', file);

    setIsScanning(true);
    setError('');
    try {
      const token = localStorage.getItem('monevra_token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/users/${user?.uid}/scan-receipt`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formDataToUpload
      });

      const data = await response.json();
      if (!response.ok) {
        if (response.status === 429 || (data.message && data.message === 'QUOTA_EXCEEDED')) {
          throw new Error(t('custom.quotaExceeded') || 'Kuota sistem gratis habis. Silakan buka Pengaturan > Profil untuk memasukkan Gemini API Key pribadi Anda agar dapat melakukan scan.');
        }
        if (response.status === 401 || (data.message && data.message === 'INVALID_API_KEY')) {
          throw new Error(t('custom.invalidApiKey') || 'API Key Gemini yang Anda masukkan tidak valid. Silakan periksa kembali di Pengaturan > Profil.');
        }
        if (data.message && data.message === 'SCAN_FAILED') {
          throw new Error(t('custom.scanFailed') || 'Layanan AI Gemini sedang sibuk atau gambar gagal diproses. Silakan coba lagi.');
        }
        if (data.message && data.message.includes('Layanan OCR AI (Python) tidak dapat dihubungi')) {
          throw new Error(t('custom.scanErrorOffline') || 'AI is still loading! Please wait a few seconds.');
        }
        throw new Error(data.message || t('custom.modalFailedScanReceipt'));
      }

      if (data.items && data.items.length > 0) {
        let parsedItems = data.items.map((i: any, idx: number) => ({
          id: Date.now() + idx,
          title: i.title || '',
          amount: i.amount ? convertFromBase(i.amount, profile.currency).toString() : '',
          category: i.category || ''
        }));
        
        // Adjust if sum doesn't match root amount
        if (data.amount) {
          const rootAmount = parseFloat(data.amount);
          const sumItems = parsedItems.reduce((acc: number, curr: any) => acc + (parseFloat(curr.amount) || 0), 0);
          if (rootAmount > 0 && Math.abs(sumItems - rootAmount) > 0.01) {
            const diff = rootAmount - sumItems;
            parsedItems.push({
              id: Date.now() + 999,
              title: diff < 0 ? 'Diskon / Penyesuaian' : 'Pajak / Penyesuaian',
              amount: convertFromBase(diff, profile.currency).toString(),
              category: 'Other'
            });
          }
        }
        setItems(parsedItems);
        setGlobalData(prev => ({ ...prev, type: data.type || prev.type, date: sanitizeScannedDate(data.date) }));
      } else {
        setItems([{
          id: Date.now(),
          title: data.title || '',
          amount: data.amount ? convertFromBase(data.amount, profile.currency).toString() : '',
          category: data.category || ''
        }]);
        setGlobalData(prev => ({ ...prev, type: data.type || prev.type, date: sanitizeScannedDate(data.date) }));
      }
    } catch (err: any) {
      setError(err.message || t('custom.modalFailedScanApiKey'));
    } finally {
      setIsScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleScanReceipt = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processReceiptFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!globalData.wallet) { setError(t('custom.modalTitleRequired')); return; }
    if (!globalData.date) { setError(t('custom.goalDeadlineInvalid')); return; }

    const validItems = items.filter(i => {
      if (i.title.trim() === '') return false;
      return true; // We don't filter out 0 or negative anymore, let them through
    });

    if (validItems.length === 0) {
      setError('Harap isi minimal 1 transaksi dengan jumlah lebih dari 0.');
      return;
    }

    setSaving(true);
    try {
      if (txToEdit && validItems.length > 0) {
        const item = validItems[0];
        const amt = parseFloat(item.amount) || 0;
        const finalTitle = item.title;
        const finalAmount = convertToBase(amt, profile.currency);

        await updateTransaction(txToEdit.id, {
          title: finalTitle,
          amount: finalAmount,
          category: item.category || 'Other',
          type: globalData.type as 'income' | 'expense',
          wallet: globalData.wallet,
          date: globalData.date,
          status: globalData.status as 'Completed' | 'Pending' | 'Failed',
        });
      } else {
        for (const item of validItems) {
          const amt = parseFloat(item.amount) || 0;
          const finalTitle = item.title;
          const finalAmount = convertToBase(amt, profile.currency);

          await addTransaction({
            title: finalTitle,
            amount: finalAmount,
            category: item.category || 'Other',
            type: globalData.type as 'income' | 'expense',
            wallet: globalData.wallet,
            date: globalData.date,
            status: globalData.status as 'Completed' | 'Pending' | 'Failed',
          });
        }
      }
      onClose();
    } catch (err: any) {
      setError(err.message || t('custom.goalFailedSave'));
    } finally {
      setSaving(false);
    }
  };

  const currentCategories = globalData.type === 'income' ? CATEGORIES.income : CATEGORIES.expense;

  const updateItem = (id: number, field: string, value: string) => {
    setItems(items.map(it => it.id === id ? { ...it, [field]: value } : it));
  };
  const removeItem = (id: number) => {
    setItems(items.filter(it => it.id !== id));
  };
  const addItem = () => {
    setItems([...items, { id: Date.now(), title: '', amount: '', category: '' }]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: "spring", bounce: 0.4, duration: 0.6 }}
        className="w-full max-w-md bg-gradient-to-br from-surface-dark to-bg-dark rounded-[2rem] p-1 relative z-10 shadow-2xl shadow-brand-500/10 overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-brand-500/20 blur-[100px] pointer-events-none translate-x-1/2 -translate-y-1/2 rounded-full" />

        <div className="bg-surface-dark/90 backdrop-blur-xl rounded-[1.9rem] p-6 relative border border-border-dark flex flex-col flex-1 min-h-0">
          <div className="flex items-center justify-between mb-6 shrink-0">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-2xl text-white shadow-lg ${globalData.type === 'expense' ? 'bg-gradient-to-br from-red-400 to-rose-600 shadow-red-500/30' : 'bg-gradient-to-br from-green-400 to-emerald-600 shadow-green-500/30'}`}>
                <Receipt size={22} />
              </div>
              <div>
                <h2 className="text-xl font-display font-bold text-white tracking-tight">{txToEdit ? t('custom.modalEditTx') : t('custom.modalNewTx')}</h2>
                <p className="text-xs text-slate-400">{t('custom.modalRecordFlow') || 'Record your cash flow.'}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input type="file" accept="image/*" ref={fileInputRef} onChange={handleScanReceipt} className="hidden" />
              <button
                type="button"
                onClick={() => setIsCameraOpen(true)}
                disabled={isScanning || !!txToEdit}
                className="w-9 h-9 rounded-full bg-brand-500/15 flex items-center justify-center text-brand-400 hover:bg-brand-500/25 hover:text-brand-300 transition-colors shadow-lg shadow-brand-500/10 disabled:opacity-50"
                title={t('custom.modalScanAI')}
              >
                {isScanning ? <div className="w-4 h-4 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" /> : <Scan size={18} />}
              </button>
              <button onClick={onClose} className="w-9 h-9 rounded-full bg-surface-hover flex items-center justify-center hover:bg-border-dark text-slate-400 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-medium flex items-center gap-2 shrink-0"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">
            {/* Top Config */}
            <div className="shrink-0 space-y-4 mb-4">
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-colors relative z-10 flex items-center justify-center gap-2 ${globalData.type === 'expense' ? 'bg-white text-bg-dark' : 'text-slate-400 hover:text-slate-300'}`}
                  onClick={() => setGlobalData({ ...globalData, type: 'expense' })}
                >
                  <span className={globalData.type === 'expense' ? 'text-red-500' : ''}><ShoppingCart size={16} /></span> {t('custom.commonExpense') || 'Expense'}
                </button>
                <button
                  type="button"
                  className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-colors relative z-10 flex items-center justify-center gap-2 ${globalData.type === 'income' ? 'bg-white text-bg-dark' : 'text-slate-400 hover:text-slate-300'}`}
                  onClick={() => setGlobalData({ ...globalData, type: 'income' })}
                >
                  <span className={globalData.type === 'income' ? 'text-green-500' : ''}><TrendingUp size={16} /></span> {t('custom.commonIncome') || 'Income'}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5"><Calendar size={12} /> {t('custom.modalDate') || 'Date'}</label>
                  <input
                    type="date"
                    required
                    className="w-full bg-surface-hover border border-border-dark rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-500/50 transition-all hover:border-slate-300/30 text-sm"
                    value={globalData.date}
                    onChange={(e) => setGlobalData({ ...globalData, date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5"><Wallet size={12} /> {t('custom.modalWallet') || 'Wallet'}</label>
                  <div className="relative">
                    <select
                      className="w-full appearance-none bg-surface-hover border border-border-dark rounded-xl pl-3 pr-8 py-2 text-slate-200 focus:outline-none focus:border-brand-500/50 transition-all hover:border-slate-300/30 text-sm font-medium"
                      value={globalData.wallet}
                      onChange={(e) => setGlobalData({ ...globalData, wallet: e.target.value })}
                      required
                    >
                      <option value="">{t('custom.modalSelectWallet') || 'Select Wallet'}</option>
                      {wallets.map(w => <option key={w.id} value={w.name}>{w.name}</option>)}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

            {/* Items List (Scrollable) */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-3 custom-scrollbar min-h-[150px]">
              {items.map((item, idx) => (
                <div key={item.id} className="p-4 bg-surface-hover/50 border border-border-dark rounded-2xl relative group transition-all hover:border-brand-500/30">
                  {!txToEdit && items.length > 1 && (
                    <button type="button" onClick={() => removeItem(item.id)} className="absolute top-3 right-3 text-red-400/70 hover:text-red-400 bg-red-400/10 p-1.5 rounded-lg transition-colors opacity-0 group-hover:opacity-100" title="Remove Item">
                      <Trash size={14} />
                    </button>
                  )}

                  <div className="flex flex-col gap-3">
                    <div className={!txToEdit && items.length > 1 ? "pr-8" : ""}>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">{t('custom.modalTitleLabel') || 'Title / Description'}</label>
                      <input
                        type="text"
                        required
                        className="w-full bg-bg-dark border border-border-dark rounded-xl px-3 py-2 text-white focus:outline-none focus:border-brand-500/50 transition-all text-sm font-medium"
                        placeholder={t('custom.goalNameExample') || 'mis. Belanja Bulanan'}
                        value={item.title}
                        onChange={(e) => updateItem(item.id, 'title', e.target.value)}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">{t('custom.modalAmount') || 'Amount'}</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">{profile.currency || 'IDR'}</span>
                          <input
                            type="number"
                            step="0.01" required
                            className="w-full bg-bg-dark border border-border-dark rounded-xl pl-11 pr-3 py-2 text-white focus:outline-none focus:border-brand-500/50 transition-all text-sm font-bold"
                            placeholder="0"
                            value={item.amount}
                            onChange={(e) => updateItem(item.id, 'amount', e.target.value)}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1"><Tag size={12} className="inline mr-1" />{t('custom.modalCategory') || 'Category'}</label>
                        <div className="relative">
                          <select
                            className="w-full appearance-none bg-bg-dark border border-border-dark rounded-xl pl-3 pr-8 py-2 text-slate-300 focus:outline-none focus:border-brand-500/50 transition-all text-sm font-medium"
                            value={item.category}
                            onChange={(e) => updateItem(item.id, 'category', e.target.value)}
                            required
                          >
                            <option value="">{t('custom.modalSelectCategory') || 'Select'}</option>
                            {currentCategories.map(c => <option key={c.id} value={c.id}>{t(`custom.cat${c.id}`) || c.label}</option>)}
                          </select>
                          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {!txToEdit && (
                <button
                  type="button"
                  onClick={addItem}
                  className="w-full py-3 border border-dashed border-slate-700 rounded-2xl text-slate-400 text-sm font-medium hover:border-brand-500 hover:text-brand-400 hover:bg-brand-500/5 transition-all flex items-center justify-center gap-2 mt-2"
                >
                  <Plus size={16} /> {t('custom.addItem') || 'Tambah Transaksi Lain'}
                </button>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="shrink-0 pt-4 mt-2 border-t border-border-dark">
              <div className="flex items-center justify-between mb-4">
                <div className="text-xs font-medium text-slate-400 flex items-center gap-2">
                  Status:
                  <div className="relative inline-block">
                    <select
                      className="appearance-none bg-surface-dark border border-border-dark rounded-lg pl-2 pr-6 py-1 text-white font-bold outline-none cursor-pointer focus:border-brand-500 text-xs"
                      value={globalData.status}
                      onChange={(e) => setGlobalData({ ...globalData, status: e.target.value as any })}
                    >
                      <option className="bg-bg-dark" value="Completed">{t('custom.commonCompleted') || 'Completed'}</option>
                      <option className="bg-bg-dark" value="Pending">{t('custom.commonPending') || 'Pending'}</option>
                      <option className="bg-bg-dark" value="Failed">{t('custom.commonFailed') || 'Failed'}</option>
                    </select>
                    <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                  </div>
                </div>
                <div className="text-sm text-slate-300 font-medium">
                  Total: <span className="text-white font-bold text-lg ml-1">{new Intl.NumberFormat(language === 'id' ? 'id-ID' : 'en-US', { style: 'currency', currency: profile.currency || 'IDR' }).format(items.reduce((acc, curr) => {
                    const amt = parseFloat(curr.amount) || 0;
                    return acc + amt;
                  }, 0))}</span>
                </div>
              </div>
              <button
                type="submit"
                disabled={saving || wallets.length === 0}
                className={`w-full py-3.5 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)] disabled:opacity-50 disabled:cursor-not-allowed
                  ${globalData.type === 'expense' ? 'bg-white text-bg-dark hover:bg-slate-200' : 'bg-brand-500 text-white hover:bg-brand-400 shadow-brand-500/20'}`}
              >
                <Save size={18} />
                {saving ? (t('custom.modalSavingBtn') || 'Menyimpan...') : txToEdit ? (t('custom.modalSaveChangesBtn') || 'Simpan Perubahan') : (t('custom.modalAddTxBtn') || 'Simpan Transaksi')}
              </button>
              {wallets.length === 0 && (
                <p className="text-center text-xs text-amber-400 mt-2 font-medium bg-amber-500/10 py-2 rounded-lg">Harap buat dompet terlebih dahulu.</p>
              )}
            </div>
          </form>
        </div>
      </motion.div>

      {isCameraOpen && (
        <CameraScannerModal
          onClose={() => setIsCameraOpen(false)}
          onCapture={(file) => {
            setIsCameraOpen(false);
            processReceiptFile(file);
          }}
        />
      )}
    </div>
  );
}

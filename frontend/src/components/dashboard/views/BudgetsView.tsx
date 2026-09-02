import React, { useState } from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import { motion, AnimatePresence } from 'motion/react';
import { useFinance } from '../../../context/FinanceContext';
import { Target, Plus, Pencil, Trash, X, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Budget } from '../../../types';
import { formatCurrency } from '../../../lib/format';

import { convertToBase, convertFromBase } from '../../../lib/exchangeRates';

const CATEGORIES = [
  { value: 'Food', labelKey: 'catFood' },
  { value: 'Transport', labelKey: 'catTransport' },
  { value: 'Housing', labelKey: 'catHousing' },
  { value: 'Entertainment', labelKey: 'catEntertainment' },
  { value: 'Health', labelKey: 'catHealth' },
  { value: 'Shopping', labelKey: 'catShopping' },
  { value: 'Education', labelKey: 'catEducation' },
  { value: 'Utilities', labelKey: 'catUtilities' },
  { value: 'Other', labelKey: 'catOther' },
];

export default function BudgetsView() {
  const { t } = useLanguage();
  const { transactions, budgets, deleteBudget, profile } = useFinance();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [budgetToEdit, setBudgetToEdit] = useState<Budget | null>(null);

  const now = new Date();
  const currency = profile.currency || 'IDR';

  // Get spending for THIS MONTH only by category
  const getMonthlySpent = (category: string) => {
    return transactions
      .filter(t => {
        if (t.type !== 'expense' || t.category !== category) return false;
        const d = new Date(t.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((sum, t) => sum + Number(t.amount), 0);
  };

  const openModal = (budget?: Budget) => {
    setBudgetToEdit(budget || null);
    setIsModalOpen(true);
  };

  const totalBudget = budgets.reduce((sum, b) => sum + b.limit, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + getMonthlySpent(b.category), 0);
  const budgetsOver = budgets.filter(b => getMonthlySpent(b.category) > b.limit).length;

  return (
    <div className="max-w-7xl mx-auto pb-12 flex flex-col gap-6 text-slate-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-slate-200">{t('dashboard.budgets')}</h2>
          <p className="text-slate-400 text-sm">{t('custom.budgetSubtitle')}</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="btn-premium"
        >
          <Plus size={16} /> {t('custom.budgetNew')}
        </button>
      </div>

      {/* Summary */}
      {budgets.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="glass-card rounded-2xl p-4 text-center">
            <div className="text-2xl font-bold text-slate-200">{budgets.length}</div>
            <div className="text-xs text-slate-500 mt-1">{t('custom.budgetTotal')}</div>
          </div>
          <div className="glass-card rounded-2xl p-4 text-center">
            <div className="text-lg font-bold text-slate-200 truncate">{formatCurrency(totalSpent, currency)}</div>
            <div className="text-xs text-slate-500 mt-1">{t('custom.budgetUsedThisMonth')}</div>
          </div>
          <div className={`glass-card rounded-2xl p-4 text-center ${budgetsOver > 0 ? 'border-red-500/30' : ''}`}>
            <div className={`text-2xl font-bold ${budgetsOver > 0 ? 'text-red-400' : 'text-green-400'}`}>{budgetsOver}</div>
            <div className="text-xs text-slate-500 mt-1">{t('custom.budgetOverLimit')}</div>
          </div>
        </div>
      )}

      {budgets.length === 0 ? (
        <div className="glass-card rounded-[2rem] p-12 text-center flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-brand-500/10 flex items-center justify-center">
            <Target className="w-8 h-8 text-brand-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-200 mb-1">{t('custom.budgetNoData')}</h3>
            <p className="text-slate-400 text-sm">{t('custom.budgetNoDataDesc')}</p>
          </div>
          <button 
            onClick={() => openModal()}
            className="btn-premium"
          >
            <Plus size={16} /> {t('custom.budgetCreateFirst')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {budgets.map((b) => {
            const spent = getMonthlySpent(b.category);
            const percent = Math.min((spent / b.limit) * 100, 100);
            const isOver = spent > b.limit;
            const catKey = CATEGORIES.find(c => c.value === b.category)?.labelKey;
            const catLabel = catKey ? (t(`custom.${catKey}`) as string) : b.category;

            return (
              <div key={b.id} className={`glass-card rounded-[2rem] p-6 relative group ${isOver ? 'border-red-500/20' : ''}`}>
                <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                  <button 
                    onClick={() => openModal(b)}
                    className="p-2 text-slate-500 hover:text-brand-400 transition-colors rounded-full hover:bg-brand-500/10"
                    title={t('custom.budgetEdit')}
                  >
                    <Pencil size={14} />
                  </button>
                  <button 
                    onClick={() => {
                      if (window.confirm(t('prompts.confirmBudgetDelete'))) deleteBudget(b.id);
                    }}
                    className="p-2 text-slate-500 hover:text-red-400 transition-colors rounded-full hover:bg-red-500/10"
                    title={t('custom.budgetDelete')}
                  >
                    <Trash size={14} />
                  </button>
                </div>

                <div className="flex justify-between items-center mb-4 pr-16">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-xl ${isOver ? 'bg-red-500/20 text-red-400' : 'bg-brand-500/20 text-brand-400'}`}>
                      {isOver ? <AlertTriangle size={18} /> : <Target size={18} />}
                    </div>
                    <h3 className="font-bold text-slate-200 truncate">{t('custom.cat' + b.category) || b.category}</h3>
                  </div>
                </div>

                <div className="flex justify-between text-sm mb-2">
                  <span className={`font-bold ${isOver ? 'text-red-400' : 'text-slate-200'}`}>{formatCurrency(spent, currency)}</span>
                  <span className="text-slate-400">{t('custom.txOf')} {formatCurrency(b.limit, currency)}</span>
                </div>
                <div className="h-2.5 w-full bg-surface-dark rounded-full overflow-hidden mb-3">
                  <div 
                    className={`h-full rounded-full transition-all duration-700 ${isOver ? 'bg-red-500' : percent > 75 ? 'bg-amber-500' : 'bg-brand-500'}`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <p className={`text-xs ${isOver ? 'text-red-400' : 'text-slate-400'}`}>
                    {isOver 
                      ? t('custom.budgetOverBy').replace('{amount}', formatCurrency(spent - b.limit, currency)) 
                      : t('custom.budgetLeft').replace('{amount}', formatCurrency(b.limit - spent, currency))
                    }
                  </p>
                  <span className="text-xs font-semibold text-slate-400">{percent.toFixed(0)}%</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Overall Budget Bar */}
      {budgets.length > 0 && (
        <div className="glass-card rounded-[2rem] p-6">
          <h3 className="font-semibold text-slate-200 mb-4">{t('custom.budgetSummary')}</h3>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-400">{t('custom.budgetTotalSpent')}</span>
            <span className="text-slate-200 font-semibold">
              {formatCurrency(totalSpent, currency)} / {formatCurrency(totalBudget, currency)}
            </span>
          </div>
          <div className="h-3 bg-surface-dark rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-700 ${totalSpent > totalBudget ? 'bg-red-500' : totalSpent / totalBudget > 0.75 ? 'bg-amber-500' : 'bg-brand-500'}`}
              style={{ width: `${Math.min((totalSpent / (totalBudget || 1)) * 100, 100)}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-2">
            {totalBudget > 0 ? `${((totalSpent / totalBudget) * 100).toFixed(1)}% ${t('custom.budgetOfTotalUsed')}` : ''}
          </p>
        </div>
      )}

      <AnimatePresence>
        {isModalOpen && <BudgetModal onClose={() => setIsModalOpen(false)} budgetToEdit={budgetToEdit} />}
      </AnimatePresence>
    </div>
  );
}

function BudgetModal({ onClose, budgetToEdit }: { onClose: () => void, budgetToEdit?: Budget | null }) {
  const { t } = useLanguage();
  const { addBudget, updateBudget, profile } = useFinance();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    category: budgetToEdit?.category || '',
    limit: budgetToEdit?.limit ? convertFromBase(budgetToEdit.limit, profile.currency).toString() : ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!formData.category) { setError(t('custom.budgetSelectCatErr')); return; }
    if (!formData.limit || parseFloat(formData.limit) <= 0) { setError(t('custom.budgetLimitErr')); return; }
    setSaving(true);
    try {
      if (budgetToEdit) {
        await updateBudget(budgetToEdit.id, { category: formData.category, limit: convertToBase(parseFloat(formData.limit), profile.currency) });
      } else {
        await addBudget({ category: formData.category, limit: convertToBase(parseFloat(formData.limit), profile.currency) });
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save budget.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: "spring", bounce: 0.4, duration: 0.6 }}
        className="w-full max-w-md bg-gradient-to-br from-surface-dark to-bg-dark rounded-[2rem] p-1 relative z-10 shadow-2xl shadow-brand-500/10 overflow-hidden flex flex-col"
      >
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-brand-500/20 blur-[100px] pointer-events-none translate-x-1/2 -translate-y-1/2 rounded-full" />
        
        <div className="bg-surface-dark/90 backdrop-blur-xl rounded-[1.9rem] p-6 sm:p-8 relative border border-border-dark flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-brand-400 to-indigo-600 text-white shadow-lg shadow-brand-500/30">
                <Target size={24} />
              </div>
              <div>
                <h2 className="text-xl font-display font-bold text-white tracking-tight">{budgetToEdit ? t('custom.budgetEdit') : t('custom.budgetNew')}</h2>
                <p className="text-xs text-slate-400">{t('custom.budgetSubtitle')}</p>
              </div>
            </div>
            <button onClick={onClose} className="w-10 h-10 rounded-full bg-surface-hover flex items-center justify-center hover:bg-border-dark text-slate-400 hover:text-white transition-colors shrink-0">
              <X size={20} />
            </button>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="mb-6 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-medium flex items-center gap-3"
              >
                <AlertTriangle size={18} />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">{t('custom.modalCategory')}</label>
              <div className="relative">
                <select
                  className="w-full appearance-none bg-bg-dark border border-border-dark rounded-xl pl-4 pr-10 py-3.5 text-white focus:outline-none focus:border-brand-500/50 transition-all font-medium text-sm hover:border-slate-300/30 cursor-pointer"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                >
                  <option value="">{t('custom.modalSelectCategory')}</option>
                  {CATEGORIES.map(c => (
                    <option key={c.value} value={c.value}>{(t(`custom.${c.labelKey}`) as string)}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">{t('custom.budgetMonthlyLimit')}</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">{profile.currency || 'IDR'}</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  className="w-full bg-bg-dark border border-border-dark rounded-xl pl-14 pr-4 py-3.5 text-white focus:outline-none focus:border-brand-500/50 transition-all font-bold text-lg hover:border-slate-300/30"
                  placeholder="0"
                  value={formData.limit}
                  onChange={(e) => setFormData({ ...formData, limit: e.target.value })}
                />
              </div>
            </div>

            <div className="pt-4 mt-2">
              <button
                type="submit"
                disabled={saving}
                className="w-full py-4 rounded-xl flex items-center justify-center gap-2 font-bold text-sm bg-brand-500 text-white transition-all duration-300 hover:bg-brand-400 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (t('custom.modalSavingBtn') || 'Saving...') : budgetToEdit ? (t('custom.modalSaveChangesBtn') || 'Save Changes') : (t('custom.modalAddTxBtn') || 'Add')}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

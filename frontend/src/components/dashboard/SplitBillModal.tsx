import React, { useState } from 'react';
import { useLanguage } from "../../context/LanguageContext";
import { motion, AnimatePresence } from 'motion/react';
import { X, Users, Calculator, Receipt, Copy, Check, Sparkles, Percent, Tag } from 'lucide-react';
import { formatCurrency } from '../../lib/format';
import { convertToBase } from '../../lib/exchangeRates';
import { blockNonNumericKey, sanitizeNumericPaste } from '../../lib/utils';

export default function SplitBillModal({ onClose, currency = 'IDR' }: { onClose: () => void, currency?: string }) {
  const { t } = useLanguage();
  const [amount, setAmount] = useState<string>('');
  const [people, setPeople] = useState<number>(2);
  const [tax, setTax] = useState<number>(0);
  const [service, setService] = useState<number>(0);
  const [discount, setDiscount] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const baseAmount = convertToBase(parseFloat(amount) || 0, currency);
  const discountAmount = convertToBase(parseFloat(discount) || 0, currency);
  const taxAmount = baseAmount * (tax / 100);
  const serviceAmount = baseAmount * (service / 100);
  const total = baseAmount + taxAmount + serviceAmount;
  const perPerson = people > 0 ? total / people : 0;

  const handleCopy = () => {
    let text = `Tagihan Patungan\nTotal: ${formatCurrency(total, currency)}\nDibagi ${people} orang: ${formatCurrency(perPerson, currency)} per orang.\n\n(Base: ${formatCurrency(baseAmount, currency)}, Pajak: ${tax}%, Servis: ${service}%)`;
    if (discountAmount > 0) {
      text += `\n*Terdapat diskon sebesar ${formatCurrency(discountAmount, currency)} yang sudah termasuk dalam perhitungan.`;
    }
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-md bg-surface-dark border border-border-dark shadow-2xl rounded-[2rem] sm:rounded-[2.5rem] relative z-10 overflow-hidden flex flex-col max-h-[95vh] sm:max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 flex items-center justify-between border-b border-border-dark/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 text-[#ffffff] shadow-lg shadow-brand-500/30">
              <Calculator size={18} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-display font-bold text-slate-200">{t('custom.splitTitle') || 'Split Bill'}</h2>
              <p className="text-[11px] sm:text-xs text-slate-400 font-medium">Bagi tagihan dengan mudah</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-full bg-surface-hover hover:bg-border-dark text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-4 sm:p-5 overflow-y-auto custom-scrollbar flex-1 space-y-4">
          
          {/* Base Amount */}
          <div className="relative group">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 ml-1">{t('custom.splitBaseAmount')}</label>
            <div className="relative flex items-center">
              <div className="absolute left-3 text-slate-400 group-focus-within:text-brand-500 transition-colors">
                <Receipt size={16} />
              </div>
              <input
                type="number"
                min="0"
                onKeyDown={blockNonNumericKey}
                onPaste={sanitizeNumericPaste}
                className="w-full bg-surface-hover border border-border-dark rounded-xl pl-9 pr-4 py-2.5 sm:py-3 text-slate-200 focus:outline-none focus:border-brand-500/50 focus:ring-4 focus:ring-brand-500/10 text-lg font-bold transition-all shadow-sm"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {/* Tax */}
            <div className="relative group">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 ml-1">{t('custom.splitTax')}</label>
              <div className="relative flex items-center">
                <div className="absolute left-3 text-slate-400 group-focus-within:text-brand-500 transition-colors">
                  <Percent size={14} />
                </div>
                <input
                  type="number"
                  min="0"
                  max="100"
                  onKeyDown={blockNonNumericKey}
                  onPaste={sanitizeNumericPaste}
                  className="w-full bg-surface-hover border border-border-dark rounded-xl pl-9 pr-4 py-2 sm:py-2.5 text-slate-200 focus:outline-none focus:border-brand-500/50 focus:ring-4 focus:ring-brand-500/10 text-base font-semibold transition-all shadow-sm"
                  placeholder="0"
                  value={tax || ''}
                  onChange={(e) => setTax(parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
            
            {/* Service */}
            <div className="relative group">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 ml-1">{t('custom.splitService')}</label>
              <div className="relative flex items-center">
                <div className="absolute left-3 text-slate-400 group-focus-within:text-brand-500 transition-colors">
                  <Sparkles size={14} />
                </div>
                <input
                  type="number"
                  min="0"
                  max="100"
                  onKeyDown={blockNonNumericKey}
                  onPaste={sanitizeNumericPaste}
                  className="w-full bg-surface-hover border border-border-dark rounded-xl pl-9 pr-4 py-2 sm:py-2.5 text-slate-200 focus:outline-none focus:border-brand-500/50 focus:ring-4 focus:ring-brand-500/10 text-base font-semibold transition-all shadow-sm"
                  placeholder="0"
                  value={service || ''}
                  onChange={(e) => setService(parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
          </div>

          {/* Discount & People Counter Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {/* Discount */}
            <div className="relative group">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 ml-1">{t('custom.splitDiscount') || 'Diskon'}</label>
              <div className="relative flex items-center">
                <div className="absolute left-3 text-slate-400 group-focus-within:text-brand-500 transition-colors">
                  <Tag size={14} />
                </div>
                <input
                                  type="number"
                                  min="0"
                                  onKeyDown={blockNonNumericKey}
                                  onPaste={sanitizeNumericPaste}
                                  className="w-full bg-surface-hover border border-border-dark rounded-xl pl-9 pr-4 py-2 sm:py-2.5 text-slate-200 focus:outline-none focus:border-brand-500/50 focus:ring-4 focus:ring-brand-500/10 text-base font-semibold transition-all shadow-sm"
                                  placeholder="0"
                                  value={discount}
                                  onChange={(e) => setDiscount(e.target.value)}
                                />
              </div>
            </div>

            {/* People Counter */}
            <div className="relative group">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 ml-1">{t('custom.splitPeople')}</label>
              <div className="bg-surface-hover border border-border-dark rounded-xl p-1 flex items-center justify-between shadow-sm h-[38px] sm:h-[42px]">
                <button 
                  onClick={() => setPeople(Math.max(1, people - 1))}
                  className="w-10 h-full rounded-lg bg-surface-dark border border-border-dark hover:border-brand-500/30 flex items-center justify-center text-slate-400 hover:text-brand-500 transition-all active:scale-95 shadow-sm"
                >
                  <span className="text-xl leading-none mt-[-2px]">-</span>
                </button>
                <div className="flex-1 text-center font-display font-bold text-lg text-slate-200 flex items-center justify-center gap-2">
                  <Users size={14} className="text-brand-500 opacity-80" />
                  {people}
                </div>
                <button 
                  onClick={() => setPeople(people + 1)}
                  className="w-10 h-full rounded-lg bg-surface-dark border border-border-dark hover:border-brand-500/30 flex items-center justify-center text-slate-400 hover:text-brand-500 transition-all active:scale-95 shadow-sm"
                >
                  <span className="text-xl leading-none mt-[-2px]">+</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Receipt Footer */}
        <div className="p-4 sm:p-5 pt-0 shrink-0">
          <div className="rounded-[1.5rem] sm:rounded-[2rem] bg-gradient-to-br from-brand-600 to-accent-600 shadow-xl shadow-brand-500/20 relative overflow-hidden group p-4 sm:p-5">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#ffffff]/10 blur-2xl rounded-full translate-x-1/3 -translate-y-1/3 pointer-events-none group-hover:bg-[#ffffff]/20 transition-all duration-700" />
            
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-3 sm:mb-4 pb-3 sm:pb-4 border-b border-[#ffffff]/20 border-dashed">
                <span className="text-[11px] sm:text-xs font-semibold text-[#ffffff]/80 uppercase tracking-widest">{t('custom.splitTotal')}</span>
                <span className="font-bold text-[#ffffff] text-base sm:text-lg">{formatCurrency(total, currency)}</span>
              </div>
              <div className="flex justify-between items-end mb-4 sm:mb-5">
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-[#ffffff]/70 uppercase tracking-widest mb-1">{t('custom.splitPerPerson')}</span>
                  <div className="flex items-center gap-1.5 px-2 py-0.5 sm:py-1 bg-[#ffffff]/10 rounded-md sm:rounded-lg border border-[#ffffff]/10">
                     <Users size={10} className="text-[#ffffff]" />
                     <span className="text-[10px] sm:text-xs font-bold text-[#ffffff]">{people}</span>
                  </div>
                </div>
                <span className="text-3xl sm:text-4xl font-display font-bold text-[#ffffff] drop-shadow-md tracking-tight">
                  {formatCurrency(perPerson, currency)}
                </span>
              </div>
              
              <button
                onClick={handleCopy}
                className="w-full relative overflow-hidden bg-[#ffffff]/20 hover:bg-[#ffffff]/30 border border-[#ffffff]/30 backdrop-blur-md text-[#ffffff] font-bold transition-all duration-300 rounded-xl py-2.5 sm:py-3 flex items-center justify-center gap-2 active:scale-95 shadow-lg group/btn"
              >
                {copied ? <Check size={16} /> : <Copy size={16} className="group-hover/btn:scale-110 transition-transform" />}
                {copied ? t('custom.splitCopied') : t('custom.splitCopy')}
              </button>
            </div>
          </div>
        </div>

      </motion.div>
    </div>
  );
}

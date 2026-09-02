import React, { useState } from 'react';
import { useLanguage } from "../../context/LanguageContext";
import { motion } from 'motion/react';
import { X, Users, Calculator, Receipt, Copy, Check } from 'lucide-react';
import { formatCurrency } from '../../lib/format';
import { convertToBase } from '../../lib/exchangeRates';

export default function SplitBillModal({ onClose, currency = 'IDR' }: { onClose: () => void, currency?: string }) {
  const { t } = useLanguage();
  const [amount, setAmount] = useState<string>('');
  const [people, setPeople] = useState<number>(2);
  const [tax, setTax] = useState<number>(0); // Percentage
  const [service, setService] = useState<number>(0); // Percentage
  const [discount, setDiscount] = useState<string>(''); // Nominal
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
      text += `\n*Terdapat diskon sebesar ${formatCurrency(discountAmount, currency)} yang sudah termasuk dalam Base Amount.`;
    }
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-md glass-card rounded-[2rem] p-6 relative z-10 border border-border-dark shadow-2xl"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-brand-500/20 text-brand-400">
              <Calculator size={20} />
            </div>
            <h2 className="text-xl font-display font-bold text-slate-200">{t('custom.splitTitle')}</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-hover text-slate-400 hover:text-slate-200 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1.5">
              <Receipt size={14} /> {t('custom.splitBaseAmount')}
            </label>
            <input
              type="number"
              min="0"
              className="w-full bg-surface-dark border border-border-dark rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-brand-500/50 text-lg font-medium"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1.5">
              <Receipt size={14} /> {t('custom.splitDiscount') || 'Diskon (Nominal)'}
            </label>
            <input
              type="number"
              min="0"
              className="w-full bg-surface-dark border border-border-dark rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-brand-500/50 text-lg font-medium"
              placeholder="0"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">{t('custom.splitTax')}</label>
              <input
                type="number"
                min="0"
                max="100"
                className="w-full bg-surface-dark border border-border-dark rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-brand-500/50"
                value={tax}
                onChange={(e) => setTax(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">{t('custom.splitService')}</label>
              <input
                type="number"
                min="0"
                max="100"
                className="w-full bg-surface-dark border border-border-dark rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-brand-500/50"
                value={service}
                onChange={(e) => setService(parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1.5">
              <Users size={14} /> {t('custom.splitPeople')}
            </label>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setPeople(Math.max(1, people - 1))}
                className="w-10 h-10 rounded-xl bg-surface-dark border border-border-dark flex items-center justify-center text-slate-300 hover:bg-surface-hover"
              >-</button>
              <div className="flex-1 text-center font-display font-bold text-xl text-brand-400">{people}</div>
              <button 
                onClick={() => setPeople(people + 1)}
                className="w-10 h-10 rounded-xl bg-surface-dark border border-border-dark flex items-center justify-center text-slate-300 hover:bg-surface-hover"
              >+</button>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 rounded-2xl bg-gradient-to-br from-brand-500/10 to-transparent border border-brand-500/20">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-slate-400">{t('custom.splitTotal')}</span>
            <span className="font-semibold text-slate-200">{formatCurrency(total, currency)}</span>
          </div>
          <div className="flex justify-between items-end">
            <span className="text-sm text-brand-300 font-medium">{t('custom.splitPerPerson')}</span>
            <span className="text-2xl font-display font-bold text-brand-400">{formatCurrency(perPerson, currency)}</span>
          </div>
        </div>

        <button
          onClick={handleCopy}
          className="btn-premium w-full"
        >
          {copied ? <Check size={16} className="text-white" /> : <Copy size={16} />}
          {copied ? t('custom.splitCopied') : t('custom.splitCopy')}
        </button>
      </motion.div>
    </div>
  );
}

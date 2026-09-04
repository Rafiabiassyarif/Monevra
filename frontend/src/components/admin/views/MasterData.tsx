import React, { useState, useEffect } from 'react';
import { useLanguage } from "../../../context/LanguageContext";
import { Database, Plus, Pencil, Trash, X, Save, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { apiRequest } from '../../../lib/api';
import { blockNonNumericKey, sanitizeNumericPaste } from '../../../lib/utils';

// Interfaces
interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  color: string;
}

interface Currency {
  code: string;
  rate: number; // Rate to IDR
}

export default function MasterData() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'categories' | 'currencies'>('categories');
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto pb-12 flex flex-col gap-6 relative min-h-screen">
      {toast && (
        <div className="fixed top-24 right-6 z-50 bg-[#0f172a] border border-cyan-500/30 text-white px-5 py-3 rounded-2xl shadow-2xl text-sm font-medium">
          {toast}
        </div>
      )}

      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/25 flex items-center justify-center">
          <Database className="w-5 h-5 text-cyan-400" />
        </div>
        <div>
          <h2 className="text-2xl font-display font-bold text-slate-200">Data Master</h2>
          <p className="text-slate-400 text-sm">Kelola data kategori transaksi dan nilai tukar mata uang global (CRUD Penuh).</p>
        </div>
      </div>

      <div className="flex bg-surface-dark border border-white/5 rounded-2xl p-1 w-max">
        <button
          onClick={() => setActiveTab('categories')}
          className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-colors ${activeTab === 'categories' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-slate-200'}`}
        >
          Kategori Transaksi
        </button>
        <button
          onClick={() => setActiveTab('currencies')}
          className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-colors ${activeTab === 'currencies' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400 hover:text-slate-200'}`}
        >
          Mata Uang & Kurs
        </button>
      </div>

      <div className="flex-1 mt-4">
        {activeTab === 'categories' ? <CategoriesManager showToast={showToast} /> : <CurrenciesManager showToast={showToast} />}
      </div>
    </div>
  );
}

// ==========================================
// CATEGORIES MANAGER (CRUD)
// ==========================================
const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat_1', name: 'Makanan & Minuman', type: 'expense', color: '#f43f5e' },
  { id: 'cat_2', name: 'Transportasi', type: 'expense', color: '#f59e0b' },
  { id: 'cat_3', name: 'Gaji', type: 'income', color: '#10b981' },
];

function CategoriesManager({ showToast }: { showToast: (m: string) => void }) {
  const { t } = useLanguage();
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchCategories = async () => {
    try {
      const data = await apiRequest<Category[]>('/admin/categories');
      setCategories(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleDelete = async (id: string) => {
    if (confirm('Yakin ingin menghapus kategori ini?')) {
      try {
        await apiRequest(`/admin/categories/${id}`, { method: 'DELETE' });
        await fetchCategories();
        showToast('Kategori berhasil dihapus');
      } catch (e: any) {
        showToast(`Gagal menghapus: ${e.message}`);
      }
    }
  };

  const filtered = categories.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="glass-card rounded-[2rem] overflow-hidden">
      <div className="p-5 border-b border-white/5 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('custom.searchCategory')}
            className="w-full bg-surface-dark border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-200 focus:border-cyan-500/50 outline-none"
          />
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/30 rounded-xl text-sm font-bold transition-colors"
        >
          <Plus size={16} /> Tambah Kategori
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead>
            <tr className="text-slate-500 border-b border-border-dark text-xs uppercase tracking-wider bg-surface-dark">
              <th className="py-4 px-6 font-medium">Nama Kategori</th>
              <th className="py-4 px-6 font-medium">Tipe</th>
              <th className="py-4 px-6 font-medium text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr><td colSpan={3} className="py-12 text-center text-slate-500">Memuat kategori...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={3} className="py-12 text-center text-slate-500">Tidak ada kategori ditemukan.</td></tr>
            ) : filtered.map(cat => (
              <tr key={cat.id} className="hover:bg-white/[0.03] transition-colors">
                <td className="py-4 px-6">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: cat.color }}></div>
                    <span className="font-medium text-slate-200">{cat.name}</span>
                  </div>
                </td>
                <td className="py-4 px-6">
                  <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-semibold ${cat.type === 'income' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                    {cat.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                  </span>
                </td>
                <td className="py-4 px-6 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => setEditingCat(cat)} className="p-2 rounded-lg text-slate-500 hover:text-amber-300 hover:bg-amber-500/10 transition-colors">
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => handleDelete(cat.id)} className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                      <Trash size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {(isAdding || editingCat) && (
          <CategoryModal
            cat={editingCat}
            onClose={() => { setIsAdding(false); setEditingCat(null); }}
            onSave={async (newCat) => {
              try {
                if (editingCat) {
                  await apiRequest(`/admin/categories/${editingCat.id}`, { method: 'PUT', body: JSON.stringify(newCat) });
                  showToast('Kategori berhasil diperbarui');
                } else {
                  await apiRequest('/admin/categories', { method: 'POST', body: JSON.stringify(newCat) });
                  showToast('Kategori berhasil ditambahkan');
                }
                await fetchCategories();
                setIsAdding(false);
                setEditingCat(null);
              } catch (e: any) {
                showToast(`Gagal: ${e.message}`);
              }
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function CategoryModal({ cat, onClose, onSave }: { cat: Category | null, onClose: () => void, onSave: (c: Category) => void }) {
  const { t } = useLanguage();
  const [form, setForm] = useState<Omit<Category, 'id'>>({
    name: cat?.name || '',
    type: cat?.type || 'expense',
    color: cat?.color || '#3b82f6',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: cat?.id || `cat_${Date.now()}`,
      ...form
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.form 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onSubmit={handleSubmit} 
        className="relative z-10 w-full max-w-md glass-card rounded-[2rem] p-6 lg:p-8 shadow-2xl border border-white/10"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-display font-bold text-slate-200">{cat ? 'Edit Kategori' : 'Tambah Kategori'}</h3>
          <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-slate-400">
            <X size={20} />
          </button>
        </div>
        <div className="space-y-4">
          <label className="block">
            <span className="block text-xs font-medium text-slate-400 mb-1">{t('custom.catNameLabel')}</span>
            <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50 transition-colors" placeholder={t('custom.catNameHint')} />
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-slate-400 mb-1">{t('custom.txFormType')}</span>
            <select value={form.type} onChange={e => setForm({...form, type: e.target.value as any})} className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50 transition-colors appearance-none">
              <option value="expense">{t('custom.typeExpense')}</option>
              <option value="income">{t('custom.typeIncome')}</option>
            </select>
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-slate-400 mb-2">Warna Identitas</span>
            <div className="flex items-center gap-3">
              <input type="color" value={form.color} onChange={e => setForm({...form, color: e.target.value})} className="w-12 h-12 rounded-xl cursor-pointer bg-transparent border-0 p-0" />
              <span className="text-sm font-mono text-slate-400">{form.color}</span>
            </div>
          </label>
        </div>
        <div className="mt-8">
          <button type="submit" className="w-full py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition-colors flex items-center justify-center gap-2">
            <Save size={18} /> Simpan Data
          </button>
        </div>
      </motion.form>
    </div>
  );
}

// ==========================================
// CURRENCIES MANAGER (CRUD)
// ==========================================
const DEFAULT_CURRENCIES: Currency[] = [
  { code: 'USD', rate: 16400 },
  { code: 'EUR', rate: 17500 },
  { code: 'SGD', rate: 12100 },
  { code: 'MYR', rate: 3480 },
];

function CurrenciesManager({ showToast }: { showToast: (m: string) => void }) {
  const { t } = useLanguage();
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [search, setSearch] = useState('');
  const [editingCur, setEditingCur] = useState<Currency | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchRates = async () => {
    try {
      const data = await apiRequest<Currency[]>('/admin/rates');
      setCurrencies(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
  }, []);

  const handleDelete = async (code: string) => {
    if (confirm(`Yakin ingin menghapus mata uang ${code}?`)) {
      try {
        await apiRequest(`/admin/rates/${code}`, { method: 'DELETE' });
        await fetchRates();
        showToast('Mata uang berhasil dihapus');
      } catch (e: any) {
        showToast(`Gagal: ${e.message}`);
      }
    }
  };

  const filtered = currencies.filter(c => c.code.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="glass-card rounded-[2rem] overflow-hidden">
      <div className="p-5 border-b border-white/5 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('custom.searchCurrency')}
            className="w-full bg-surface-dark border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-200 focus:border-cyan-500/50 outline-none"
          />
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/30 rounded-xl text-sm font-bold transition-colors"
        >
          <Plus size={16} /> Tambah Mata Uang
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead>
            <tr className="text-slate-500 border-b border-border-dark text-xs uppercase tracking-wider bg-surface-dark">
              <th className="py-4 px-6 font-medium">Kode (Base IDR)</th>
              <th className="py-4 px-6 font-medium">Nilai Tukar (Rp)</th>
              <th className="py-4 px-6 font-medium text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr><td colSpan={3} className="py-12 text-center text-slate-500">Memuat mata uang...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={3} className="py-12 text-center text-slate-500">Tidak ada mata uang ditemukan.</td></tr>
            ) : filtered.map(cur => (
              <tr key={cur.code} className="hover:bg-white/[0.03] transition-colors">
                <td className="py-4 px-6 font-display font-bold text-slate-200">
                  {cur.code}
                </td>
                <td className="py-4 px-6 text-slate-300 font-medium">
                  {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(cur.rate)}
                </td>
                <td className="py-4 px-6 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => setEditingCur(cur)} className="p-2 rounded-lg text-slate-500 hover:text-amber-300 hover:bg-amber-500/10 transition-colors">
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => handleDelete(cur.code)} className="p-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                      <Trash size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {(isAdding || editingCur) && (
          <CurrencyModal
            cur={editingCur}
            onClose={() => { setIsAdding(false); setEditingCur(null); }}
            onSave={async (newCur) => {
              try {
                if (editingCur) {
                  await apiRequest(`/admin/rates/${editingCur.code}`, { method: 'PUT', body: JSON.stringify(newCur) });
                  showToast('Kurs berhasil diperbarui');
                } else {
                  await apiRequest('/admin/rates', { method: 'POST', body: JSON.stringify(newCur) });
                  showToast('Mata uang berhasil ditambahkan');
                }
                await fetchRates();
                setIsAdding(false);
                setEditingCur(null);
              } catch (e: any) {
                showToast(`Gagal: ${e.message}`);
              }
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function CurrencyModal({ cur, onClose, onSave }: { cur: Currency | null, onClose: () => void, onSave: (c: Currency) => void }) {
  const [form, setForm] = useState<Currency>({
    code: cur?.code || '',
    rate: cur?.rate || 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code) return;
    onSave({ ...form, code: form.code.toUpperCase() });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.form 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onSubmit={handleSubmit} 
        className="relative z-10 w-full max-w-md glass-card rounded-[2rem] p-6 lg:p-8 shadow-2xl border border-white/10"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-display font-bold text-slate-200">{cur ? 'Edit Kurs Mata Uang' : 'Tambah Mata Uang'}</h3>
          <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-white/10 text-slate-400">
            <X size={20} />
          </button>
        </div>
        <div className="space-y-4">
          <label className="block">
            <span className="block text-xs font-medium text-slate-400 mb-1">Kode Mata Uang (3 Huruf)</span>
            <input required maxLength={3} value={form.code} onChange={e => setForm({...form, code: e.target.value.toUpperCase()})} className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50 transition-colors uppercase" placeholder="Mis. GBP" />
          </label>
          <label className="block">
            <span className="block text-xs font-medium text-slate-400 mb-1">Nilai Tukar ke IDR (Rp)</span>
            <input required type="number" step="0.01" onKeyDown={blockNonNumericKey} onPaste={sanitizeNumericPaste} value={form.rate || ''} onChange={e => setForm({...form, rate: Number(e.target.value)})} className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50 transition-colors" placeholder="Mis. 20700" />
          </label>
        </div>
        <div className="mt-8">
          <button type="submit" className="w-full py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition-colors flex items-center justify-center gap-2">
            <Save size={18} /> Simpan Data
          </button>
        </div>
      </motion.form>
    </div>
  );
}

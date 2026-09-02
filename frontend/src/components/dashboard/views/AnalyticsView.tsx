import React, { useMemo } from 'react';
import { useLanguage } from "../../../context/LanguageContext";
import { useFinance } from '../../../context/FinanceContext';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';
import { TrendingUp, TrendingDown, Wallet, Target } from 'lucide-react';
import { formatCurrency } from '../../../lib/format';

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#f43f5e', '#06b6d4'];

export default function AnalyticsView() {
  const { t, language } = useLanguage();
  const locale = language === 'id' ? 'id-ID' : 'en-US';
  const { transactions, wallets, budgets, getTotalBalance, getMonthlyIncome, getMonthlyExpense, profile } = useFinance();
  const currency = profile.currency || 'IDR';

  // Last 7 days area chart
  const last7DaysData = useMemo(() => {
    const days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });

    return days.map(date => {
      const dayTxs = transactions.filter(t => t.date === date);
      const income = dayTxs.filter(t => t.type === 'income' && t.status === 'Completed').reduce((sum, t) => sum + Number(t.amount), 0);
      const expense = Math.abs(dayTxs.filter(t => t.type === 'expense' && t.status === 'Completed').reduce((sum, t) => sum + Number(t.amount), 0));
      const label = new Date(date).toLocaleDateString(locale, { weekday: 'short', day: 'numeric' });
      return { date: label, income, expense };
    });
  }, [transactions]);

  // Category breakdown for expenses
  const categoryData = useMemo(() => {
    const expenses = transactions.filter(t => t.type === 'expense' && t.status === 'Completed');
    const reduced = expenses.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
      return acc;
    }, {} as Record<string, number>);

    let totalNegative = 0;
    Object.keys(reduced).forEach(key => {
      if (reduced[key] < 0) {
        totalNegative += reduced[key];
        delete reduced[key];
      }
    });

    if (totalNegative < 0) {
      const sortedKeys = Object.keys(reduced).filter(k => reduced[k] > 0).sort((a, b) => reduced[b] - reduced[a]);
      if (sortedKeys.length > 0) {
        reduced[sortedKeys[0]] = Math.max(0, reduced[sortedKeys[0]] + totalNegative);
      }
    }

    return Object.entries(reduced)
      .map(([name, value]) => ({ name, value: Math.max(0, value as number) }))
      .filter(c => c.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [transactions]);

  // Monthly comparison (last 4 months)
  const monthlyData = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 4 }).map((_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (3 - i), 1);
      const label = d.toLocaleDateString(locale, { month: 'short', year: '2-digit' });
      const monthTxs = transactions.filter(t => {
        const txDate = new Date(t.date);
        return txDate.getMonth() === d.getMonth() && txDate.getFullYear() === d.getFullYear();
      });
      const income = monthTxs.filter(t => t.type === 'income' && t.status === 'Completed').reduce((sum, t) => sum + Number(t.amount), 0);
      const expense = monthTxs.filter(t => t.type === 'expense' && t.status === 'Completed').reduce((sum, t) => sum + Number(t.amount), 0);
      return { label, income, expense, net: income - expense };
    });
  }, [transactions]);

  // Wallet distribution
  const walletData = wallets.map(w => ({ name: w.name, value: Math.max(w.balance, 0) }));

  const totalBalance = getTotalBalance();
  const monthlyIncome = getMonthlyIncome();
  const monthlyExpense = getMonthlyExpense();

  return (
    <div className="max-w-7xl mx-auto pb-12 flex flex-col gap-6 text-slate-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-slate-200">{t('dashboard.analytics')}</h2>
          <p className="text-slate-400 text-sm">{t('custom.analyticsDesc')}</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard 
          label={t('custom.analyticsTotalBalance')} 
          value={formatCurrency(totalBalance, currency)} 
          icon={Wallet} 
          color="text-brand-400 bg-brand-500/10"
        />
        <SummaryCard 
          label={t('custom.analyticsMonthlyIncLbl')} 
          value={formatCurrency(monthlyIncome, currency)} 
          icon={TrendingUp} 
          color="text-green-400 bg-green-500/10"
        />
        <SummaryCard 
          label={t('custom.analyticsMonthlyExpLbl')} 
          value={formatCurrency(monthlyExpense, currency)} 
          icon={TrendingDown} 
          color="text-red-400 bg-red-500/10"
        />
        <SummaryCard 
          label={t('custom.analyticsNetBalance')} 
          value={formatCurrency(monthlyIncome - monthlyExpense, currency)} 
          icon={Target} 
          color={monthlyIncome >= monthlyExpense ? 'text-green-400 bg-green-500/10' : 'text-red-400 bg-red-500/10'}
        />
      </div>

      {/* Area Chart - Last 7 Days */}
      <div className="glass-card rounded-[2rem] p-6 flex flex-col" style={{ height: 340 }}>
        <h3 className="font-semibold text-lg text-slate-200 mb-4">{t('custom.analyticsCashFlow7d')}</h3>
        <div className="flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={last7DaysData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
              <XAxis dataKey="date" stroke="#ffffff50" fontSize={11} tickLine={false} axisLine={false} dy={8} />
              <YAxis stroke="#ffffff50" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => {
                if (val >= 1000000) return `${(val/1000000).toFixed(0)}M`;
                if (val >= 1000) return `${(val/1000).toFixed(0)}K`;
                return `${val}`;
              }} />
              <Tooltip 
                cursor={{fill: '#ffffff05'}} 
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', color: '#fff', fontSize: 12 }} 
                formatter={(val: number) => [formatCurrency(val, currency), '']}
              />
              <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
              <Area type="monotone" dataKey="income" name={t('custom.reportIncome')} stroke="#10b981" fillOpacity={1} fill="url(#colorIncome)" strokeWidth={2} />
              <Area type="monotone" dataKey="expense" name={t('custom.reportExpense')} stroke="#f43f5e" fillOpacity={1} fill="url(#colorExpense)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly Bar + Category Pie side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Comparison */}
        <div className="glass-card rounded-[2rem] p-6 flex flex-col" style={{ height: 320 }}>
          <h3 className="font-semibold text-lg text-slate-200 mb-4">{t('custom.analyticsMonthly')}</h3>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} barGap={4} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="label" stroke="#ffffff50" fontSize={11} tickLine={false} axisLine={false} dy={8} />
                <YAxis stroke="#ffffff50" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => {
                  if (val >= 1000000) return `${(val/1000000).toFixed(0)}M`;
                  if (val >= 1000) return `${(val/1000).toFixed(0)}K`;
                  return `${val}`;
                }} />
                <Tooltip 
                  cursor={{fill: '#ffffff05'}} 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', color: '#fff', fontSize: 12 }} 
                  formatter={(val: number) => [formatCurrency(val, currency), '']}
                />
                <Bar dataKey="income" name="Pemasukan" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={30} />
                <Bar dataKey="expense" name="Pengeluaran" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="glass-card rounded-[2rem] p-6 flex flex-col" style={{ height: 320 }}>
          <h3 className="font-semibold text-lg text-slate-200 mb-4">{t('custom.analyticsExpByCat')}</h3>
          {categoryData.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
              {t('custom.dashNoExpData')}
            </div>
          ) : (
            <div className="flex gap-4 flex-1 min-h-0">
              <div className="flex-1 min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius="40%"
                      outerRadius="70%"
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                    >
                      {categoryData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', color: '#fff', fontSize: 12 }} 
                      formatter={(val: number) => [formatCurrency(val, currency), '']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-col justify-center gap-2 min-w-[130px]">
                {categoryData.map((cat, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <div className="min-w-0">
                      <div className="text-slate-300 truncate">{cat.name}</div>
                      <div className="text-slate-500">{formatCurrency(cat.value, currency)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Wallet Distribution */}
      {wallets.length > 0 && (
        <div className="glass-card rounded-[2rem] p-6">
          <h3 className="font-semibold text-lg text-slate-200 mb-4">{t('custom.analyticsBalanceDist')}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {wallets.map((wallet, i) => {
              const pct = totalBalance > 0 ? (Math.max(wallet.balance, 0) / Math.max(totalBalance, 1)) * 100 : 0;
              return (
                <div key={wallet.id} className="p-4 rounded-2xl bg-surface-hover border border-border-dark">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-slate-200 truncate">{wallet.name}</span>
                    <span className="text-xs text-slate-500 shrink-0 ml-2">{pct.toFixed(0)}%</span>
                  </div>
                  <div className="text-lg font-bold text-slate-200 mb-2">{formatCurrency(wallet.balance, currency)}</div>
                  <div className="h-1.5 bg-surface-dark rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Budget Progress */}
      {budgets.length > 0 && (
        <div className="glass-card rounded-[2rem] p-6">
          <h3 className="font-semibold text-lg text-slate-200 mb-4">{t('custom.analyticsBudgetProgress')}</h3>
          <div className="space-y-4">
            {budgets.map(budget => {
              const now = new Date();
              const spent = transactions
                .filter(t => t.type === 'expense' && t.status === 'Completed' && t.category === budget.category)
                .filter(t => {
                  const d = new Date(t.date);
                  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                })
                .reduce((sum, t) => sum + Number(t.amount), 0);
              const pct = Math.min((spent / budget.limit) * 100, 100);
              const isOver = spent > budget.limit;
              return (
                <div key={budget.id}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-slate-200 font-medium">{budget.category}</span>
                    <span className={isOver ? 'text-red-400' : 'text-slate-400'}>
                      {formatCurrency(spent, currency)} / {formatCurrency(budget.limit, currency)}
                    </span>
                  </div>
                  <div className="h-2 bg-surface-dark rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${isOver ? 'bg-red-500' : 'bg-brand-500'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ label, value, icon: Icon, color }: { label: string; value: string; icon: any; color: string }) {
  return (
    <div className="glass-card rounded-2xl p-5">
      <div className={`p-2 rounded-xl w-fit mb-3 ${color}`}>
        <Icon size={18} />
      </div>
      <div className="text-xl font-display font-bold text-slate-200 truncate">{value}</div>
      <div className="text-xs text-slate-400 mt-1">{label}</div>
    </div>
  );
}

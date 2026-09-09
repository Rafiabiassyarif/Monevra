import React from 'react';
import { motion } from 'motion/react';
import { BarChart, Bar, PieChart as RePieChart, Pie, Cell, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Wallet, TrendingUp, TrendingDown, Sparkles, Target } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#f43f5e'];

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val);
};

export default function DashboardPreviewSection() {
  const { t } = useLanguage();

  const chartIncomeExpenseData = [
    { name: t('preview.monthJan'), income: 15000000, expense: 12000000 },
    { name: t('preview.monthFeb'), income: 16500000, expense: 11000000 },
    { name: t('preview.monthMar'), income: 14000000, expense: 13500000 },
    { name: t('preview.monthApr'), income: 18000000, expense: 14000000 },
    { name: t('preview.monthMay'), income: 21000000, expense: 12500000 },
    { name: t('preview.monthJun'), income: 24000000, expense: 15000000 },
  ];

  const chartCategoryData = [
    { name: t('preview.catFood'), value: 4500000 },
    { name: t('preview.catTransport'), value: 2100000 },
    { name: t('preview.catShopping'), value: 3200000 },
    { name: t('preview.catBills'), value: 3700000 },
    { name: t('preview.catEntertainment'), value: 1500000 },
  ];

  return (
    <section id="preview" className="py-16 md:py-32 relative z-10 overflow-hidden">
      {/* Decorative Gradients */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand-600/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent-600/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-600/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24">

        <div className="text-center mb-12 md:mb-16 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/10 text-brand-400 text-sm font-semibold mb-6 border border-brand-500/20"
          >
            <Sparkles className="w-4 h-4" /> {t('preview.tag')}
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight text-white"
          >
            {t('preview.title1')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-400 to-brand-400">{t('preview.title2')}</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-slate-400 max-w-2xl mx-auto text-lg md:text-xl font-light"
          >
            {t('preview.subtitle')}
          </motion.p>
        </div>

        <div className="w-full relative perspective-1000 z-20">
          {/* Grid Layout matching the app style but aesthetic */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Left Column */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              {/* Large Balance Card */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="glass-card rounded-[2rem] p-8 md:p-10 relative overflow-hidden group border border-brand-500/30 bg-gradient-to-br from-surface-dark/60 to-brand-900/20"
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 blur-[80px] rounded-full pointer-events-none group-hover:bg-brand-500/20 transition-colors" />

                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 rounded-2xl bg-brand-500/20 text-brand-400">
                    <Wallet size={24} />
                  </div>
                  <span className="text-slate-300 font-medium">{t('preview.totalBalance')}</span>
                </div>

                <div className="text-5xl md:text-6xl font-display font-bold text-white tracking-tight mb-4">
                  {formatCurrency(84500000)}
                </div>

                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-500/10 text-green-400 border border-green-500/20 font-medium">
                    <TrendingUp size={16} /> {t('preview.deltaValue')} ({t('preview.thisMonth')})
                  </div>
                  <div className="text-slate-400">{t('preview.activeWallets')}</div>
                </div>
              </motion.div>

              {/* Bar Chart Card */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="glass-card rounded-[2rem] p-6 md:p-8 h-[400px] flex flex-col"
              >
                <div className="flex justify-between items-center mb-8">
                  <h3 className="font-semibold text-xl text-slate-200">{t('preview.cashFlow')}</h3>
                  <div className="flex gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-[#10b981]"></div>
                      <span className="text-slate-400">{t('preview.income')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-[#f43f5e]"></div>
                      <span className="text-slate-400">{t('preview.expense')}</span>
                    </div>
                  </div>
                </div>
                <div className="flex-1 w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartIncomeExpenseData} barGap={8} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                      <XAxis dataKey="name" stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                      <YAxis stroke="#ffffff50" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => {
                        if (val >= 1000000) return `${(val / 1000000).toFixed(0)}${t('preview.axisSuffix')}`;
                        return `${val}`;
                      }} />
                      <Tooltip
                        cursor={{ fill: '#ffffff05' }}
                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', color: '#fff', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}
                        formatter={(val: number) => [formatCurrency(val), '']}
                      />
                      <Bar dataKey="income" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={40} />
                      <Bar dataKey="expense" fill="#f43f5e" radius={[6, 6, 0, 0]} maxBarSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            </div>

            {/* Right Column */}
            <div className="flex flex-col gap-6">
              {/* Pie Chart Card */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="glass-card rounded-[2rem] p-6 md:p-8 flex flex-col min-h-[400px]"
              >
                <h3 className="font-semibold text-xl text-slate-200 mb-6">{t('preview.distribution')}</h3>
                <div className="flex-1 relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height={220}>
                    <RePieChart>
                      <Pie
                        data={chartCategoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={100}
                        paddingAngle={4}
                        dataKey="value"
                        stroke="none"
                      >
                        {chartCategoryData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', color: '#fff', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}
                        formatter={(val: number) => [formatCurrency(val), '']}
                      />
                    </RePieChart>
                  </ResponsiveContainer>
                  {/* Center overlay */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-xs text-slate-400 mb-1">{t('preview.total')}</span>
                    <span className="text-xl font-bold text-slate-200">
                      {t('preview.totalValue')}
                    </span>
                  </div>
                </div>

                {/* Custom Legend */}
                <div className="mt-6 space-y-3">
                  {chartCategoryData.map((cat, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full shrink-0 shadow-lg" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-slate-300">{cat.name}</span>
                      </div>
                      <span className="font-medium text-slate-200">{formatCurrency(cat.value)}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* AI Insight Card */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="glass-card rounded-[2rem] p-6 relative overflow-hidden group border border-accent-500/30 bg-gradient-to-br from-surface-dark/40 to-accent-900/10"
              >
                <div className="absolute top-0 right-0 p-6 opacity-10 text-accent-500 pointer-events-none">
                  <Sparkles size={80} />
                </div>
                <div className="flex gap-4 relative z-10">
                  <div className="p-3 rounded-2xl bg-accent-500/20 text-accent-400 shrink-0 h-min">
                    <Target size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-accent-300 mb-2">{t('preview.aiInsight')}</h3>
                    <p className="text-slate-300 text-sm leading-relaxed">
                      {t('preview.aiInsightDesc')}
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}

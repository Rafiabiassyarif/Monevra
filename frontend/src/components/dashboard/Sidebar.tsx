import React from 'react';
import { 
  LayoutDashboard, ArrowRightLeft, Wallet, 
  BarChart3, PieChart, FileText, Settings, LogOut, X, ShieldAlert, Target
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
}

export default function Sidebar({ open, setOpen, activeTab, setActiveTab, onLogout }: SidebarProps) {
  const { isAdmin } = useAuth();
  const { t } = useLanguage();
  
  const items = [
    { id: 'overview', icon: LayoutDashboard, label: t('dashboard.overview') },
    { id: 'transactions', icon: ArrowRightLeft, label: t('dashboard.transactions') },
    { id: 'wallets', icon: Wallet, label: t('dashboard.wallets') },
    { id: 'analytics', icon: BarChart3, label: t('dashboard.analytics') },
    { id: 'budgets', icon: Target, label: t('dashboard.budgets') },
    { id: 'goals', icon: PieChart, label: t('dashboard.goals') },
    { id: 'reports', icon: FileText, label: t('dashboard.reports') },
  ];

  return (
    <aside className={cn(
      "fixed inset-y-0 left-0 z-50 w-[260px] bg-bg-dark border-r border-border-dark flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:flex print:hidden",
      open ? "translate-x-0" : "-translate-x-full"
    )}>
      <div className="h-20 flex items-center justify-between px-6 border-b border-border-dark relative bg-surface-dark/20">
        <div className="flex items-center gap-3">
          <img src="/logo-monevra.png" alt="Monevra" className="w-10 h-10 drop-shadow-[0_0_12px_rgba(255,255,255,0.15)] object-contain" />
          <span className="font-display font-bold text-xl tracking-tight text-slate-200">Monevra</span>
        </div>
        <button className="lg:hidden text-slate-400 hover:text-white transition-colors" onClick={() => setOpen(false)}>
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1 scrollbar-hide">
        <div className="px-3 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('sidebar.mainMenu')}</div>
        {items.map((item, i) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={i}
              onClick={() => {
                setActiveTab(item.id);
                if(window.innerWidth < 1024) setOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative",
                isActive 
                  ? "bg-surface-hover text-slate-200" 
                  : "text-slate-400 hover:bg-white/[0.02] hover:text-slate-200"
              )}
            >
              {isActive && (
                <div className="absolute left-0 w-1 h-5 bg-brand-500 rounded-r-full shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
              )}
              <item.icon className={cn("w-[18px] h-[18px]", isActive ? "text-brand-400" : "text-slate-500 group-hover:text-slate-300")} />
              {item.label}
            </button>
          );
        })}
      </div>

      <div className="p-4 border-t border-border-dark bg-surface-dark/10">
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all group"
        >
          <LogOut className="w-[18px] h-[18px] text-slate-500 group-hover:text-red-400" />
          Logout
        </button>
      </div>
    </aside>
  );
}

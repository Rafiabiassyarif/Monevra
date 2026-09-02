import React from 'react';
import { 
  Users, Settings, LogOut, X, ShieldAlert,
  BarChart2, Shield, Database, Bell
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';

interface AdminSidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
}

const navItems = [
  { icon: BarChart2, label: 'Analitik Sistem' },
  { icon: Users, label: 'Manajemen Pengguna' },
  { icon: Database, label: 'Data Master' },
  { icon: Shield, label: 'Log Keamanan' },
  { icon: Bell, label: 'Pusat Notifikasi' },
  { icon: Settings, label: 'Pengaturan Sistem' },
];

export default function AdminSidebar({ open, setOpen, activeTab, setActiveTab, onLogout }: AdminSidebarProps) {
  return (
    <aside className={cn(
      "fixed inset-y-0 left-0 z-50 w-[260px] bg-slate-900 border-r border-white/10 flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:flex",
      open ? "translate-x-0" : "-translate-x-full"
    )}>
      <div className="h-20 flex items-center justify-between px-6 border-b border-white/10 relative bg-cyan-900/10">
        <div className="flex items-center gap-3">
          <img src="/logo-monevra.png" alt="AdminPanel" className="w-10 h-10 drop-shadow-[0_0_12px_rgba(255,255,255,0.15)] object-contain" />
          <span className="font-display font-bold text-xl tracking-tight text-slate-200">AdminPanel</span>
        </div>
        <button className="lg:hidden text-slate-400 hover:text-white transition-colors" onClick={() => setOpen(false)}>
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1 scrollbar-hide">
        <div className="px-3 mb-2 text-xs font-semibold text-cyan-400/70 uppercase tracking-wider">Admin Menu</div>
        {navItems.map((item, i) => {
          const isActive = activeTab === item.label;
          return (
            <button
              key={i}
              onClick={() => {
                setActiveTab(item.label);
                if(window.innerWidth < 1024) setOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative",
                isActive 
                  ? "bg-cyan-500/10 text-cyan-300" 
                  : "text-slate-400 hover:bg-white/[0.02] hover:text-slate-200"
              )}
            >
              {isActive && (
                <div className="absolute left-0 w-1 h-5 bg-cyan-500 rounded-r-full shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
              )}
              <item.icon className={cn("w-[18px] h-[18px]", isActive ? "text-cyan-400" : "text-slate-500 group-hover:text-slate-300")} />
              {item.label}
            </button>
          );
        })}
      </div>

      <div className="p-4 border-t border-border-dark bg-surface-dark">
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all group"
        >
          <LogOut className="w-[18px] h-[18px] text-slate-500 group-hover:text-red-400" />
          Keluar
        </button>
      </div>
    </aside>
  );
}

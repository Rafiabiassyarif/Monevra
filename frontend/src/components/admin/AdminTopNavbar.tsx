import React from 'react';
import { useLanguage } from "../../context/LanguageContext";
import { Menu, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AdminTopNavbarProps {
  onMenuClick: () => void;
  activeTab: string;
}

export default function AdminTopNavbar({ onMenuClick, activeTab }: AdminTopNavbarProps) {
  const { t } = useLanguage();
  const { user } = useAuth();

  return (
    <header className="h-20 flex-shrink-0 flex items-center justify-between px-6 md:px-8 border-b border-white/10 bg-slate-900/50 backdrop-blur-md relative z-30">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="btn-secondary lg:hidden p-2 -ml-2 text-slate-400 hover:text-white"
        >
          <Menu size={20} />
        </button>
        <h1 className="text-xl font-display font-bold text-slate-200 hidden sm:block">
          {activeTab}
        </h1>
      </div>

      <div className="flex items-center gap-4">
        <button className="btn-secondary p-2.5 text-slate-400 hover:text-white relative group">
          <Bell size={20} />
        </button>

        <div className="h-8 w-[1px] bg-white/10 mx-1 hidden sm:block"></div>

        <div className="flex items-center gap-3 pl-2">
          <div className="text-right hidden sm:block">
            <div className="text-sm font-semibold text-slate-200">{user?.name || 'Administrator'}</div>
            <div className="text-xs text-cyan-400 font-medium capitalize">{user?.role || 'Admin'}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-300 font-bold shadow-[0_0_10px_rgba(168,85,247,0.15)]">
            {(user?.name || 'A').charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
}

import React, { useState, useRef, useEffect } from 'react';
import { Search, Bell, Menu, Settings, X, ChevronRight, LogOut, Shield, Sun, Moon, TrendingUp, ShoppingCart } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { formatCurrency } from '../../lib/format';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../hooks/useTheme';
import SplitBillModal from './SplitBillModal';
import { useLanguage } from '../../context/LanguageContext';
import { apiRequest } from '../../lib/api';

interface TopNavbarProps {
  onMenuClick: () => void;
  setActiveTab: (tab: string) => void;
  activeTab: string;
}

  export default function TopNavbar({ onMenuClick, setActiveTab, activeTab }: TopNavbarProps) {
    const { profile, transactions, updateProfile } = useFinance();
    const { isAdmin, logout, user } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { t, language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSplitBillOpen, setIsSplitBillOpen] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      const fetchNotifications = async () => {
        try {
          const data = await apiRequest(`/users/${user.uid}/notifications`);
          setNotifications(data as any[]);
        } catch (e) {
          console.error(e);
        }
      };
      fetchNotifications();
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchResults = transactions
    .filter(tx => tx.title.toLowerCase().includes(searchQuery.toLowerCase()) || tx.category.toLowerCase().includes(searchQuery.toLowerCase()))
    .slice(0, 5);

  const safeNotifications = Array.isArray(notifications) ? notifications : [];
  const unreadCount = safeNotifications.filter(n => !n.is_read).length;

  const handleMarkAllRead = async () => {
    const unread = safeNotifications.filter(n => !n.is_read);
    setNotifications(notifications.map(n => ({ ...n, is_read: 1 })));
    for (const n of unread) {
      try {
        await apiRequest(`/users/${user?.uid}/notifications/${n.id}/read`, { method: 'PUT' });
      } catch (e) { console.error(e); }
    }
  };

  const handleMarkRead = async (id: number) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: 1 } : n));
    try {
      await apiRequest(`/users/${user?.uid}/notifications/${id}/read`, { method: 'PUT' });
    } catch (e) { console.error(e); }
  };

  const handleLogout = () => {
    try {
      logout();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out', error);
    }
  };

  return (
    <header className="h-20 bg-bg-dark border-b border-border-dark flex items-center justify-between px-6 lg:px-8 sticky top-0 z-30 print:hidden">
      <div className="flex items-center gap-4 flex-1">
        <button className="lg:hidden text-slate-400 hover:text-white" onClick={onMenuClick}>
          <Menu size={20} />
        </button>
        <h2 className="text-xl font-display font-bold text-slate-200 hidden lg:block">{t(`dashboard.${activeTab}`)}</h2>
        <div className="relative hidden md:block max-w-[320px] w-full lg:ml-6" ref={searchRef}>
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input 
            type="text" 
            name="search"
            autoComplete="off"
            placeholder={t('custom.navSearchPlaceholder')} 
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsSearchOpen(true);
            }}
            onFocus={() => setIsSearchOpen(true)}
            className="w-full bg-surface-hover border border-border-dark rounded-2xl pl-10 pr-4 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/50 transition-all"
          />
          
          <AnimatePresence>
            {isSearchOpen && searchQuery && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute top-full left-0 right-0 mt-2 bg-[#0f0f0f] border border-border-dark rounded-2xl shadow-2xl overflow-hidden z-50"
              >
                {searchResults.length > 0 ? (
                  <div className="p-2">
                    <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('custom.navTxSect')}</div>
                    {searchResults.map(tx => (
                      <button 
                        key={tx.id}
                        onClick={() => {
                          setIsSearchOpen(false);
                          setSearchQuery('');
                          setActiveTab('transactions');
                        }}
                        className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-surface-hover transition-colors text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-xl ${tx.type === 'income' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                            {tx.type === 'income' ? <TrendingUp size={16} /> : <ShoppingCart size={16} />}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-slate-200">{tx.title}</div>
                            <div className="text-xs text-slate-500">{t('custom.cat' + tx.category) || tx.category}</div>
                          </div>
                        </div>
                        <div className={`text-sm font-medium ${tx.type === 'income' ? 'text-green-400' : 'text-slate-200'}`}>
                          {tx.type === 'income' ? '+' : ''}{formatCurrency(tx.amount, profile.currency)}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-slate-400 text-sm">
                    Tidak ada hasil ditemukan untuk "{searchQuery}"
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={() => setIsSplitBillOpen(true)}
          className="w-10 h-10 rounded-full bg-brand-500/10 flex items-center justify-center text-brand-400 hover:bg-brand-500/20 hover:text-brand-300 transition-colors border border-brand-500/20"
          title={t('custom.navCalc')}
        >
          <span className="font-bold text-xs">%</span>
        </button>

        <button
          onClick={toggleTheme}
          className="w-10 h-10 rounded-full bg-surface-hover flex items-center justify-center text-slate-400 hover:text-white transition-colors border border-border-dark"
          title={`Beralih ke mode ${isDark ? 'terang' : 'gelap'}`}
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <button
          onClick={async () => {
            const next = language === 'en' ? 'id' : 'en';
            setLanguage(next);
            try {
              await updateProfile({ language: next });
            } catch (e) { console.error(e); }
          }}
          className="w-10 h-10 rounded-full bg-surface-hover flex items-center justify-center text-slate-400 hover:text-white transition-colors border border-border-dark text-xs font-bold"
          title={language === 'en' ? 'Ganti ke Bahasa Indonesia' : 'Switch to English'}
        >
          {language === 'en' ? 'ID' : 'EN'}
        </button>

        <div className="relative" ref={notifRef}>
          <button 
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative w-10 h-10 rounded-full bg-surface-hover flex items-center justify-center text-slate-400 hover:text-white transition-colors border border-border-dark"
          >
            <Bell size={18} />
            {unreadCount > 0 && <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-brand-500 shadow-[0_0_8px_rgba(139,92,246,0.8)]"></span>}
          </button>
          
          <AnimatePresence>
            {isNotifOpen && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="absolute top-full right-0 mt-3 w-80 bg-[#0f0f0f] border border-border-dark rounded-2xl shadow-2xl overflow-hidden z-50 origin-top-right"
              >
                <div className="flex items-center justify-between p-4 border-b border-border-dark">
                  <h3 className="font-semibold text-slate-200">Notifikasi {unreadCount > 0 && <span className="ml-2 bg-brand-500/20 text-brand-400 text-xs py-0.5 px-2 rounded-full">{unreadCount} baru</span>}</h3>
                  <button onClick={() => setIsNotifOpen(false)} className="text-slate-400 hover:text-white"><X size={16}/></button>
                </div>
                <div className="max-h-[320px] overflow-y-auto scrollbar-hide">
                  {safeNotifications.length > 0 ? safeNotifications.map(notif => {
                  const date = new Date(notif.created_at);
                  const timeStr = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
                    return (
                      <div 
                        key={notif.id} 
                        onClick={() => handleMarkRead(notif.id)}
                        className={`relative p-3 pr-4 border-b border-border-dark hover:bg-surface-hover transition-colors cursor-pointer group flex items-start gap-3 ${!notif.is_read ? 'bg-brand-500/5' : ''}`}
                      >
                        {!notif.is_read && <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-500" />}
                        
                        <div className={`mt-1 shrink-0 w-2 h-2 rounded-full shadow-[0_0_8px_currentColor] ${notif.type === 'success' ? 'bg-green-500 text-green-500' : notif.type === 'warning' ? 'bg-yellow-500 text-yellow-500' : notif.type === 'error' ? 'bg-red-500 text-red-500' : 'bg-brand-500 text-brand-500'}`}></div>
                        
                        <div className="flex-1 min-w-0">
                          <p className={`text-[13px] mb-0.5 truncate ${notif.is_read ? 'text-slate-400 font-medium' : 'text-slate-200 font-bold'}`}>{notif.title}</p>
                          <p className={`text-[11px] leading-relaxed line-clamp-2 ${notif.is_read ? 'text-slate-500' : 'text-slate-300'}`}>{notif.message}</p>
                          <span className="text-[10px] text-slate-500 mt-1 block">{timeStr}</span>
                        </div>
                      </div>
                    );
                }) : (
                  <div className="p-8 text-center text-slate-500 text-sm">
                    <Bell size={24} className="mx-auto mb-2 opacity-50" />
                    Belum ada notifikasi
                  </div>
                )}
                </div>
                {unreadCount > 0 && (
                  <div className="p-3 text-center border-t border-border-dark bg-surface-dark">
                    <button onClick={handleMarkAllRead} className="text-xs font-medium text-brand-400 hover:text-brand-300 transition-colors">{t('custom.navMarkRead')}</button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <div className="relative" ref={profileRef}>
          <div 
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-3 pl-4 py-1 border-l border-border-dark cursor-pointer group"
          >
            <div className="hidden md:block text-right">
              <div className="text-sm font-medium text-slate-200 group-hover:text-white transition-colors">{profile.name}</div>

            </div>
            <img 
              src={profile?.avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${profile.name}&backgroundColor=transparent`}
              alt={t('custom.navUser')} 
              className="w-10 h-10 rounded-full bg-surface-hover border border-border-dark group-hover:border-brand-500/50 transition-colors"
            />
          </div>

          <AnimatePresence>
            {isProfileOpen && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="absolute top-full right-0 mt-3 w-64 bg-[#0f0f0f] border border-border-dark rounded-2xl shadow-2xl overflow-hidden z-50 origin-top-right flex flex-col"
              >
                <div className="p-4 border-b border-border-dark mb-1 bg-gradient-to-b from-brand-500/10 to-transparent">
                  <div className="flex items-center gap-3">
                    <img 
                      src={profile?.avatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${profile.name}&backgroundColor=transparent`}
                      alt={t('custom.navUser')} 
                      className="w-12 h-12 rounded-full bg-black/50 border border-border-dark"
                    />
                    <div>
                      <p className="text-sm font-semibold text-white">{profile.name}</p>
                      <p className="text-xs text-slate-400 truncate">{profile.email}</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-2 space-y-1">
                  {isAdmin && (
                    <button 
                      onClick={() => {
                        navigate('/admin');
                        setIsProfileOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2.5 text-sm text-slate-300 hover:bg-surface-hover rounded-xl transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Shield size={18} className="text-slate-500" />
                        <span className="font-medium">{t('custom.navAdmin')}</span>
                      </div>
                      <ChevronRight size={14} className="text-slate-600" />
                    </button>
                  )}
                  <button 
                    onClick={() => {
                      setActiveTab('settings');
                      setIsProfileOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2.5 text-sm text-slate-300 hover:bg-surface-hover rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Settings size={18} className="text-slate-500" />
                      <span className="font-medium">{t('dashboard.settings')}</span>
                    </div>
                    <ChevronRight size={14} className="text-slate-600" />
                  </button>
                  

                </div>

                <div className="p-2 border-t border-border-dark">
                  <button 
                    onClick={() => {
                      setIsProfileOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-xl transition-colors font-medium"
                  >
                    <LogOut size={16} />
                    <span>{t('custom.navLogout')}</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>

      <AnimatePresence>
        {isSplitBillOpen && <SplitBillModal onClose={() => setIsSplitBillOpen(false)} currency={profile.currency} />}
      </AnimatePresence>
    </header>
  );
}

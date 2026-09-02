import React, { useState } from 'react';
import { useLanguage } from "../../context/LanguageContext";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AnimatePresence, motion } from 'motion/react';
import Sidebar from './Sidebar';
import TopNavbar from './TopNavbar';
import MainDashboardContent from './MainDashboardContent';
import TransactionsView from './views/TransactionsView';
import WalletsView from './views/WalletsView';
import AnalyticsView from './views/AnalyticsView';
import BudgetsView from './views/BudgetsView';
import ReportsView from './views/ReportsView';
import SettingsView from './views/SettingsView';

import GoalsView from './views/GoalsView';

interface DashboardPageProps {
  defaultTab?: string;
}

export default function DashboardPage({ defaultTab }: DashboardPageProps) {
  const { t } = useLanguage();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(defaultTab || 'overview');
  const navigate = useNavigate();

  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error("Error logging out", error);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'transactions':
        return <TransactionsView />;
      case 'wallets':
        return <WalletsView />;
      case 'analytics':
        return <AnalyticsView />;
      case 'budgets':
        return <BudgetsView />;
      case 'goals':
        return <GoalsView />;
      case 'reports':
        return <ReportsView />;
      case 'settings':
        return <SettingsView />;

      case 'overview':
      default:
        return <MainDashboardContent setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="flex h-screen bg-bg-dark overflow-hidden text-slate-200">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
      
      {/* Mobile Sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm print:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} />

      <main className="flex-1 flex flex-col relative z-10 w-full overflow-hidden">
        <TopNavbar onMenuClick={() => setSidebarOpen(true)} setActiveTab={setActiveTab} activeTab={activeTab} />
        
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 md:p-8 scrollbar-hide">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="h-full"
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

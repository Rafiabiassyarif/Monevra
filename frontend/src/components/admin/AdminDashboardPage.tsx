import React, { useState } from 'react';
import { useLanguage } from "../../context/LanguageContext";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { AnimatePresence, motion } from 'motion/react';
import AdminSidebar from './AdminSidebar';
import AdminTopNavbar from './AdminTopNavbar';
import SystemAnalytics from './views/SystemAnalytics';
import SecurityLogs from './views/SecurityLogs';
import SystemSettings from './views/SystemSettings';
import MasterData from './views/MasterData';
import UserManagement from './views/UserManagement';
import UserDetail from './views/UserDetail';
import NotificationManager from './views/NotificationManager';

export default function AdminDashboardPage() {
  const { t } = useLanguage();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('Analitik Sistem');
  const [selectedUser, setSelectedUser] = useState<any>(null);
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
    if (selectedUser && activeTab === 'Manajemen Pengguna') {
      return <UserDetail user={selectedUser} onBack={() => setSelectedUser(null)} />;
    }

    switch (activeTab) {
      case 'Analitik Sistem':
        return <SystemAnalytics />;
      case 'Manajemen Pengguna':
        return <UserManagement onViewUser={(u) => setSelectedUser(u)} />;
      case 'Log Keamanan':
        return <SecurityLogs />;
      case 'Pengaturan Sistem':
        return <SystemSettings />;
      case 'Data Master':
        return <MasterData />;
      case 'Pusat Notifikasi':
        return <NotificationManager />;
      default:
        return <SystemAnalytics />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden text-slate-200">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#a855f712_1px,transparent_1px),linear-gradient(to_bottom,#a855f712_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
      
      {/* Mobile Sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <AdminSidebar 
        open={sidebarOpen} 
        setOpen={setSidebarOpen} 
        activeTab={activeTab} 
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setSelectedUser(null);
        }} 
        onLogout={handleLogout} 
      />

      <main className="flex-1 flex flex-col relative z-10 w-full overflow-hidden">
        <AdminTopNavbar onMenuClick={() => setSidebarOpen(true)} activeTab={activeTab} />
        
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

import React, { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { showToast } from '../lib/toast';
import BottomNavBar from '@/components/ui/bottom-nav-bar';

interface LayoutProps { children: ReactNode }

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    showToast.info('Signed out', 'Session ended.');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#09080A] text-[#F5F0E8] flex flex-col relative pb-28">

      {/* Floating logo — top left */}
      <div className="fixed top-5 left-5 z-50 flex items-center gap-2 pointer-events-none">
        <div className="w-6 h-6 flex items-center justify-center bg-white rounded-md p-0.5 shadow-md">
          <img src="/logo.png" alt="Renew AI Logo" className="w-full h-full object-contain" />
        </div>
        <p className="text-xs font-bold text-[#F5F0E8] tracking-tight" style={{ fontFamily: 'Syne, sans-serif' }}>RENEW AI</p>
      </div>

      {/* Floating sign-out — top right */}
      <div className="fixed top-4 right-5 z-50 flex items-center gap-3">
        <span className="text-[10px] font-bold text-[#F5F0E8]/40 uppercase tracking-wider hidden sm:block" style={{ fontFamily: 'DM Mono, monospace' }}>
          {user?.fullName || 'Agent'}
        </span>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-2.5 py-1 border border-[#1e1c1f] bg-[#09080A]/80 text-[10px] font-bold uppercase tracking-[0.1em] text-[#F5F0E8]/40 hover:text-red-400 hover:border-red-400/30 transition-all"
          style={{ fontFamily: 'DM Mono, monospace', borderRadius: 0 }}
        >
          <LogOut className="w-3 h-3" />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>

      {/* Main content area */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-10">
        {children}
      </main>

      {/* Floating Center Bottom Navigation */}
      <BottomNavBar stickyBottom className="z-[9999]" />
    </div>
  );
};

export default Layout;
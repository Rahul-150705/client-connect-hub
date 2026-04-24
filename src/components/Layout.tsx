import React, { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileText, MessageSquare, LogOut, ChevronLeft, ChevronRight, ShieldCheck, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';

interface LayoutProps {
  children: ReactNode;
}

const navItems = [
  { 
    path: '/dashboard', 
    icon: LayoutDashboard, 
    label: 'Dashboard', 
    description: 'System overview & real-time KPIs' 
  },
  { 
    path: '/policies', 
    icon: FileText, 
    label: 'Policies', 
    description: 'Manage insurance policy inventory' 
  },
  { 
    path: '/messages', 
    icon: MessageSquare, 
    label: 'Message Logs', 
    description: 'WhatsApp & SMS delivery tracking' 
  },
];

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    toast.info('Logged out successfully');
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-[#000000] text-foreground">
      {/* Sidebar */}
      <aside
        className={`${collapsed ? 'w-[80px]' : 'w-72'} fixed top-0 left-0 h-screen z-40 flex flex-col
          bg-black/40 backdrop-blur-3xl border-r border-white/10
          transition-all duration-500 ease-in-out`}
      >
        {/* Logo Section */}
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} px-5 h-20 border-b border-white/5 flex-shrink-0`}>
          <div className="w-10 h-10 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)] flex-shrink-0 group cursor-pointer transition-transform hover:scale-105 active:scale-95">
            <ShieldCheck className="text-white w-6 h-6" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <h2 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 leading-tight">Renew AI</h2>
              <p className="text-[10px] text-primary font-bold tracking-[0.2em] uppercase opacity-80">Premium Portal</p>
            </div>
          )}
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 px-4 py-6 space-y-6 overflow-y-auto scrollbar-hide">
          <div className="space-y-4">
            {!collapsed && (
              <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] px-3 mb-2">Platform</p>
            )}
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`group relative flex items-start ${collapsed ? 'justify-center' : 'gap-4'} px-3 py-3 rounded-2xl transition-all duration-300
                    ${isActive
                      ? 'bg-white/5 border border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.03)]'
                      : 'text-muted-foreground hover:bg-white/[0.03] hover:text-white border border-transparent'
                    }`}
                  title={collapsed ? item.label : undefined}
                >
                  {/* Active Indicator Pin */}
                  <AnimatePresence>
                    {isActive && (
                      <motion.div 
                        layoutId="activeSide"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        className="absolute -left-1 top-1/2 -translate-y-1/2 w-1.5 h-6 rounded-full bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)] z-20" 
                      />
                    )}
                  </AnimatePresence>
                  
                  <div className={`flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300 flex-shrink-0
                    ${isActive ? 'bg-primary/20 text-primary' : 'bg-white/5 group-hover:bg-white/10'}`}>
                    <item.icon className="w-5 h-5" />
                  </div>

                  {!collapsed && (
                    <div className="flex flex-col min-w-0 pt-0.5">
                      <span className={`text-sm font-bold tracking-tight transition-colors ${isActive ? 'text-white' : 'text-white/60 group-hover:text-white'}`}>
                        {item.label}
                      </span>
                      <span className="text-[11px] text-white/30 leading-snug group-hover:text-white/50 transition-colors mt-0.5">
                        {item.description}
                      </span>
                    </div>
                  )}

                  {/* Tooltip for collapsed mode */}
                  {collapsed && (
                    <div className="absolute left-full ml-4 px-3 py-2 rounded-xl bg-black/95 border border-white/10 text-xs font-bold text-white opacity-0 pointer-events-none group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0 whitespace-nowrap z-50 shadow-2xl backdrop-blur-xl">
                      <p>{item.label}</p>
                      <p className="text-[10px] text-white/40 font-normal mt-1">{item.description}</p>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Help / Support Section */}
          <div className="space-y-4 pt-4">
            {!collapsed && (
              <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] px-3 mb-2">Support</p>
            )}
            <Link to="#" className={`group flex items-center ${collapsed ? 'justify-center' : 'gap-4'} px-3 py-2 rounded-xl text-white/40 hover:text-white hover:bg-white/5 transition-all`}>
              <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 group-hover:bg-white/10 flex-shrink-0">
                <LayoutDashboard className="w-4 h-4" />
              </div>
              {!collapsed && <span className="text-sm font-medium">Documentation</span>}
            </Link>
          </div>
        </nav>

        {/* User Info & Logout */}
        <div className="px-4 pb-6 border-t border-white/5 pt-6 space-y-4 flex-shrink-0">
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} p-3 rounded-2xl bg-white/[0.03] border border-white/5`}>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 border border-white/10 flex items-center justify-center flex-shrink-0 shadow-inner">
              <User className="text-white w-5 h-5" />
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">{user?.fullName || 'Rahul'}</p>
                <p className="text-[10px] text-white/30 font-medium truncate">{user?.email || 'rahul@renew.ai'}</p>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className={`w-full flex items-center ${collapsed ? 'justify-center' : 'gap-3'} px-4 py-3 rounded-2xl
              text-white/40 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20
              transition-all duration-300 text-sm`}
            title={collapsed ? 'Sign Out' : undefined}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span className="font-bold">Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 ${collapsed ? 'ml-[72px]' : 'ml-64'} transition-all duration-300 ease-in-out`}>
        <div className="p-6 lg:p-8 max-w-7xl mx-auto animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
import React, { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, FileText, MessageSquare, LogOut, ShieldCheck, 
  User, Search, Bell, Settings, ChevronLeft, ChevronRight, Menu 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { showToast } from '../lib/toast';
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
    showToast.info('Session Ended', 'You have been logged out successfully.');
    navigate('/login');
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground font-sans">
      
      {/* ═══ TOP NAVIGATION BAR (Enterprise Standard) ═══ */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-card border-b border-border/60 z-50 px-6 flex items-center justify-between backdrop-blur-md bg-card/80">
        <div className="flex items-center gap-8">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <ShieldCheck className="text-white w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-black tracking-tight text-white uppercase leading-tight">Renew AI</span>
              <span className="text-[9px] font-bold text-primary tracking-[0.2em] uppercase leading-tight">Enterprise Console</span>
            </div>
          </div>

          {/* Global Search */}
          <div className="hidden md:flex items-center relative group ml-4">
            <Search className="absolute left-3 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <input 
              type="text" 
              placeholder="Search assets, clients, or logs... ( / )" 
              className="bg-secondary/50 border border-border/50 rounded-lg pl-10 pr-4 py-1.5 text-xs w-[320px] focus:outline-none focus:ring-1 focus:ring-primary/50 focus:bg-secondary/80 transition-all"
            />
          </div>
        </div>

        {/* Top Right Actions */}
        <div className="flex items-center gap-2">
          <button className="p-2 text-muted-foreground hover:text-white hover:bg-white/5 rounded-lg transition-all relative">
            <Bell className="w-4.5 h-4.5" />
            <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full border border-card" />
          </button>
          <button className="p-2 text-muted-foreground hover:text-white hover:bg-white/5 rounded-lg transition-all">
            <Settings className="w-4.5 h-4.5" />
          </button>
          
          <div className="h-6 w-[1px] bg-border/50 mx-2" />
          
          <div className="flex items-center gap-3 pl-2">
            <div className="flex flex-col items-end hidden sm:flex">
              <span className="text-xs font-bold text-white leading-tight">{user?.fullName || 'Rahul'}</span>
              <span className="text-[10px] font-medium text-muted-foreground leading-tight">Administrator</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-secondary border border-border flex items-center justify-center overflow-hidden">
              <User className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 pt-16">
        
        {/* ═══ SIDE NAVIGATION (Clean & Focused) ═══ */}
        <aside
          className={`${collapsed ? 'w-16' : 'w-64'} fixed left-0 top-16 bottom-0 z-40 flex flex-col
            bg-card border-r border-border/60 transition-all duration-300 ease-in-out overflow-hidden`}
        >
          <nav className="flex-1 px-3 py-6 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`group relative flex items-center ${collapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 rounded-lg transition-all duration-200
                    ${isActive
                      ? 'bg-primary/10 text-primary border border-primary/20'
                      : 'text-muted-foreground hover:bg-white/[0.03] hover:text-white border border-transparent'
                    }`}
                  title={collapsed ? item.label : undefined}
                >
                  <item.icon className={`w-4.5 h-4.5 shrink-0 transition-colors ${isActive ? 'text-primary' : 'group-hover:text-white'}`} />
                  
                  {!collapsed && (
                    <span className="text-xs font-bold tracking-tight">
                      {item.label}
                    </span>
                  )}

                  {collapsed && (
                    <div className="absolute left-full ml-4 px-3 py-2 rounded-lg bg-popover border border-border text-[11px] font-bold text-white opacity-0 pointer-events-none group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0 whitespace-nowrap z-50 shadow-2xl">
                      {item.label}
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Footer Actions */}
          <div className="px-3 pb-6 space-y-1 border-t border-border/40 pt-6">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className={`w-full flex items-center ${collapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 rounded-lg
                text-muted-foreground hover:text-white hover:bg-white/5 transition-all text-xs font-bold`}
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <><ChevronLeft className="w-4 h-4" /> <span>Collapse Sidebar</span></>}
            </button>
            <button
              onClick={handleLogout}
              className={`w-full flex items-center ${collapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 rounded-lg
                text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all text-xs font-bold`}
            >
              <LogOut className="w-4 h-4" />
              {!collapsed && <span>Sign Out</span>}
            </button>
          </div>
        </aside>

        {/* ═══ MAIN CONTENT AREA ═══ */}
        <main className={`flex-1 ${collapsed ? 'ml-16' : 'ml-64'} transition-all duration-300 ease-in-out relative min-h-screen`}>
          {/* Subtle Background Pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.03),transparent_40%)] pointer-events-none" />
          
          <div className="p-8 lg:p-12 relative z-10">
            {children}
          </div>

          {/* Content Footer */}
          <footer className="mt-auto px-12 py-8 border-t border-border/20 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            <p>© 2026 Renew AI Enterprise Console. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <Link to="#" className="hover:text-primary transition-colors">Privacy Policy</Link>
              <Link to="#" className="hover:text-primary transition-colors">Terms of Service</Link>
              <Link to="#" className="hover:text-primary transition-colors">Support</Link>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default Layout;
import React, { ReactNode, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FileText, ShieldCheck, LogOut, Sparkles, Bell, Menu, User,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { showToast } from '../lib/toast';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface LayoutProps { children: ReactNode }

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/chat',      icon: Sparkles,        label: 'AI Chat' },
  { path: '/policies',  icon: FileText,        label: 'Policies' },
  { path: '/renewals',  icon: ShieldCheck,     label: 'Renewals' },
  { path: '/messages',  icon: Bell,            label: 'Message Logs' },
];

const VerticalNav: React.FC<{ onNavigate?: () => void }> = ({ onNavigate }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    showToast.info('Signed out', 'You have been logged out.');
    navigate('/login');
  };

  return (
    <div className="h-full flex flex-col bg-[#0a0a0f] border-r border-white/5">
      {/* Brand */}
      <Link to="/dashboard" onClick={onNavigate} className="flex items-center gap-3 px-5 py-6">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
          <ShieldCheck className="text-white w-5 h-5" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold text-white tracking-tight">Renew AI</span>
          <span className="text-[10px] font-medium text-indigo-400 uppercase tracking-[0.18em]">Enterprise</span>
        </div>
      </Link>

      {/* Nav */}
      <ScrollArea className="flex-1 px-3">
        <nav className="space-y-1 py-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                  isActive
                    ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                    : 'text-white/60 hover:text-white hover:bg-white/[0.04] border border-transparent'
                )
              }
            >
              <item.icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </ScrollArea>

      {/* User block */}
      <div className="border-t border-white/5 p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500/30 to-violet-500/30 border border-white/10 flex items-center justify-center">
            <User className="w-4 h-4 text-indigo-300" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-white truncate">{user?.fullName || 'Agent'}</p>
            <p className="text-[10px] text-white/40 truncate">Administrator</p>
          </div>
        </div>
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full justify-start gap-3 text-white/60 hover:text-rose-400 hover:bg-rose-500/10 h-9"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-xs font-medium">Sign out</span>
        </Button>
        <p className="text-[9px] text-white/30 tracking-wide pt-1">© 2026 Renew AI</p>
      </div>
    </div>
  );
};

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-foreground">
      {/* Mobile menu trigger */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="bg-[#111118] border border-white/10 rounded-xl">
              <Menu className="w-5 h-5 text-white" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72 bg-[#0a0a0f] border-r border-white/5">
            <VerticalNav onNavigate={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop resizable layout */}
      <div className="hidden lg:block h-screen">
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel defaultSize={18} minSize={14} maxSize={26}>
            <VerticalNav />
          </ResizablePanel>
          <ResizableHandle className="bg-white/5 hover:bg-indigo-500/30 transition-colors w-px" />
          <ResizablePanel defaultSize={82}>
            <main className="h-screen overflow-y-auto">
              <div className="p-8 lg:p-10">{children}</div>
            </main>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Mobile content */}
      <main className="lg:hidden min-h-screen pt-16">
        <div className="p-4 sm:p-6">{children}</div>
      </main>
    </div>
  );
};

export default Layout;
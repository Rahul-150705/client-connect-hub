import React, { ReactNode, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FileText, ShieldCheck, LogOut, Sparkles, Bell, Menu, User,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { showToast } from '../lib/toast';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import BottomNavBar from '@/components/ui/bottom-nav-bar';



interface LayoutProps { children: ReactNode }

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#09080A] text-[#F5F0E8] flex flex-col relative pb-28">
      {/* Branding */}
      <div className="absolute top-6 left-6 z-50 flex items-center gap-3">
        <div className="w-8 h-8 flex items-center justify-center bg-white rounded-md p-1 shadow-md">
          <img src="/logo.png" alt="Renew AI Logo" className="w-full h-full object-contain" />
        </div>
        <div>
          <p className="text-sm font-bold text-[#F5F0E8] tracking-tight" style={{ fontFamily: 'Syne, sans-serif' }}>RENEW AI</p>
        </div>
      </div>

      {/* Main content area */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-10 pt-20">
        {children}
      </main>

      {/* Floating Center Bottom Navigation */}
      <BottomNavBar stickyBottom className="z-[9999]" />
    </div>
  );
};

export default Layout;
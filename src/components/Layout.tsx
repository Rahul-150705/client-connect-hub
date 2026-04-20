import React, { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaHome, FaFileContract, FaSignOutAlt, FaUser, FaShieldAlt, FaPaperPlane } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.info('Logged out successfully');
    navigate('/login');
  };

  const navItems = [
    { path: '/', icon: FaHome, label: 'Dashboard' },
    { path: '/policies', icon: FaFileContract, label: 'Policies' },
    { path: '/messages', icon: FaPaperPlane, label: 'Message Logs' },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-72 bg-card flex flex-col border-r border-border shadow-lg">
        {/* Logo */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
              <FaShieldAlt className="text-white text-xl" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Renew AI</h2>
              <p className="text-xs text-muted-foreground font-medium">Insurance Portal</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <p className="px-4 mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Menu
          </p>
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                      ${isActive 
                        ? 'bg-gradient-primary text-white shadow-glow font-semibold' 
                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                      }`}
                  >
                    <item.icon className={`text-lg ${isActive ? '' : 'text-primary'}`} />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Info & Logout */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 mb-4 p-3 rounded-xl bg-secondary/50">
            <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center shadow-sm">
              <FaUser className="text-white text-sm" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">
                {user?.fullName}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl
              text-muted-foreground hover:text-destructive hover:bg-destructive/10 border border-transparent
              hover:border-destructive/20 transition-all duration-200"
          >
            <FaSignOutAlt />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8 animate-fade-in max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
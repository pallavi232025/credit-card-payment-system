/**
 * App layout with sidebar navigation for authenticated users.
 */
import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard, CreditCard, Wallet, History, LogOut,
  Menu, X, Shield, Users, FileText, BarChart3, ScrollText
} from 'lucide-react';

export default function AppLayout() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
      isActive
        ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/20 text-indigo-300 border border-indigo-500/30'
        : 'text-slate-400 hover:text-slate-900 hover:bg-white/5'
    }`;

  const userLinks = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/cards', icon: CreditCard, label: 'My Cards' },
    { to: '/payment', icon: Wallet, label: 'Make Payment' },
    { to: '/transactions', icon: History, label: 'Transactions' },
  ];

  const adminLinks = [
    { to: '/admin', icon: Shield, label: 'Admin Dashboard' },
    { to: '/admin/users', icon: Users, label: 'Users' },
    { to: '/admin/cards', icon: CreditCard, label: 'All Cards' },
    { to: '/admin/transactions', icon: FileText, label: 'All Transactions' },
    { to: '/admin/reports', icon: BarChart3, label: 'Reports' },
    { to: '/admin/logs', icon: ScrollText, label: 'Activity Logs' },
  ];

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-white/95 backdrop-blur-xl border-r border-slate-200/50 transform transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900">CCPay</h1>
                <p className="text-xs text-slate-400">Payment System</p>
              </div>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-slate-900">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            <p className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Menu</p>
            {userLinks.map(({ to, icon: Icon, label }) => (
              <NavLink key={to} to={to} className={navClass} onClick={() => setSidebarOpen(false)}>
                <Icon className="w-5 h-5" />
                {label}
              </NavLink>
            ))}

            {isAdmin && (
              <>
                <div className="my-4 border-t border-slate-200/50" />
                <p className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Admin</p>
                {adminLinks.map(({ to, icon: Icon, label }) => (
                  <NavLink key={to} to={to} className={navClass} end={to === '/admin'} onClick={() => setSidebarOpen(false)}>
                    <Icon className="w-5 h-5" />
                    {label}
                  </NavLink>
                ))}
              </>
            )}
          </nav>

          {/* User info & Logout */}
          <div className="p-4 border-t border-slate-200/50">
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-100/50 mb-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{user?.full_name}</p>
                <p className="text-xs text-slate-400 truncate">{user?.email}</p>
              </div>
              {isAdmin && (
                <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-500/20 text-amber-400 rounded-full">ADMIN</span>
              )}
            </div>
            <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors">
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center justify-between px-6 py-4 bg-white/50 border-b border-slate-200/50 lg:hidden">
          <button onClick={() => setSidebarOpen(true)} className="text-slate-400 hover:text-slate-900">
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-indigo-400" />
            <span className="font-bold text-slate-900">CCPay</span>
          </div>
          <div className="w-6" />
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

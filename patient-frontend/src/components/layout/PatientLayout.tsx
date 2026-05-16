import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  Home,
  Calendar,
  ClipboardList,
  Pill,
  User,
  LogOut,
  Menu,
  X,
  Stethoscope,
  ClipboardCheck,
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { path: '/', label: 'Нүүр', icon: Home },
  { path: '/appointments', label: 'Миний цагууд', icon: Calendar },
  { path: '/visits', label: 'Үзлэгийн түүх', icon: Stethoscope },
  { path: '/prescriptions', label: 'Жор', icon: Pill },
  { path: '/survey', label: 'Судалгаа', icon: ClipboardCheck },
  { path: '/profile', label: 'Профайл', icon: User },
];

export default function PatientLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-surface-50">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-surface-200">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-brand-500 rounded-xl flex items-center justify-center">
              <span className="text-white text-sm font-bold font-display">N</span>
            </div>
            <div className="hidden sm:block">
              <span className="text-base font-display text-surface-900">NUM Эмнэлэг</span>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = location.pathname === item.path ||
                (item.path !== '/' && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-surface-600 hover:bg-surface-100 hover:text-surface-800'
                  }`}
                >
                  <Icon size={16} strokeWidth={active ? 2.2 : 1.8} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-sm text-surface-600">
              <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-medium text-xs">
                {user?.firstname?.charAt(0)}{user?.lastname?.charAt(0)}
              </div>
              <span className="font-medium text-surface-800">{user?.firstname}</span>
            </div>
            <button onClick={logout} className="btn-ghost text-surface-500 p-2" title="Гарах">
              <LogOut size={18} />
            </button>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden btn-ghost p-2"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile nav overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-30 bg-black/20" onClick={() => setMobileOpen(false)}>
          <nav
            className="absolute top-16 left-0 right-0 bg-white border-b border-surface-200 shadow-lg p-4 space-y-1"
            onClick={(e) => e.stopPropagation()}
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    active ? 'bg-brand-50 text-brand-700' : 'text-surface-600 hover:bg-surface-50'
                  }`}
                >
                  <Icon size={18} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}

      {/* Main content */}
      <main className="max-w-5xl mx-auto px-4 py-6 page-enter">
        {children}
      </main>
    </div>
  );
}

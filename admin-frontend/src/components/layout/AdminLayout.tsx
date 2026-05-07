import { ReactNode, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import {
  LayoutDashboard,
  Users,
  Calendar,
  Stethoscope,
  Heart,
  Package,
  UserCog,
  Boxes,
  BarChart3,
  Shield,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Search,
  Bell,
  Menu
} from "lucide-react";

type NavItem = {
  label: string;
  icon: any;
  path: string;
  roles: string[];
};

const navigation: NavItem[] = [
  { label: "Хяналтын самбар", icon: LayoutDashboard, path: "/", roles: ["receptionist", "doctor", "nurse", "superadmin"] },
  { label: "Өвчтөн", icon: Users, path: "/patients", roles: ["receptionist", "doctor", "nurse", "superadmin"] },
  { label: "Цаг захиалга", icon: Calendar, path: "/appointments", roles: ["receptionist", "doctor", "nurse", "superadmin"] },
  { label: "Цаг хаах", icon: Calendar, path: "/schedule/unavailable", roles: ["doctor", "nurse", "superadmin"] },
  { label: "Эмчийн самбар", icon: Stethoscope, path: "/doctor/queue", roles: ["doctor"] },
  { label: "Сувилагч", icon: Heart, path: "/nurse/queue", roles: ["nurse"] },
  { label: "Эм, материал", icon: Package, path: "/inventory", roles: ["nurse", "superadmin"] },
  { label: "Ажилтан", icon: UserCog, path: "/staff", roles: ["superadmin"] },
  { label: "Үйлчилгээ", icon: Boxes, path: "/services", roles: ["superadmin"] },
  { label: "Тайлан", icon: BarChart3, path: "/reports", roles: ["doctor", "superadmin"] },
  { label: "Аудит", icon: Shield, path: "/audit", roles: ["superadmin"] },
  { label: "Тохиргоо", icon: Settings, path: "/settings", roles: ["superadmin"] }
];

const ROLE_LABELS: Record<string, string> = {
  superadmin: "Админ",
  doctor: "Эмч",
  nurse: "Сувилагч",
  receptionist: "Цаг бүртгэгч",
};

const ROLE_COLORS: Record<string, string> = {
  superadmin: "bg-amber-500",
  doctor: "bg-purple-500",
  nurse: "bg-pink-500",
  receptionist: "bg-teal-500",
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, logout, hasRole } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const visibleNav = navigation.filter((item) => item.roles.some((r) => hasRole(r)));

  const isActive = (path: string) => (path === "/" ? location.pathname === "/" : location.pathname.startsWith(path));

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 h-16 border-b border-white/5 flex-shrink-0 ${collapsed ? "justify-center" : ""}`}>
        <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center flex-shrink-0">
          <span className="text-white text-sm font-bold">N</span>
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <span className="text-white font-display text-sm font-semibold whitespace-nowrap">NUM Hospital</span>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {visibleNav.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all ${
                active ? "bg-brand-500 text-white shadow-md shadow-brand-500/20" : "text-sidebar-text hover:bg-sidebar-hover hover:text-white"
              } ${collapsed ? "justify-center" : ""}`}>
              <Icon size={18} strokeWidth={active ? 2.2 : 1.6} className="flex-shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className={`border-t border-white/5 p-3 flex-shrink-0 ${collapsed ? "flex justify-center" : ""}`}>
        {collapsed ? (
          <button
            onClick={logout}
            className="w-8 h-8 rounded-lg bg-sidebar-hover flex items-center justify-center text-sidebar-text hover:text-white"
            title="Гарах">
            <LogOut size={16} />
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg ${ROLE_COLORS[user?.role || ""]} flex items-center justify-center flex-shrink-0`}>
              <span className="text-white text-xs font-bold">{user?.firstname?.charAt(0)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white font-medium truncate">{user?.firstname}</p>
              <p className="text-[10px] text-sidebar-text">{ROLE_LABELS[user?.role || ""]}</p>
            </div>
            <button onClick={logout} className="text-sidebar-text hover:text-white p-1" title="Гарах">
              <LogOut size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-surface-50 flex">
      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex flex-col bg-sidebar-bg transition-all duration-200 flex-shrink-0 ${collapsed ? "w-16" : "w-56"}`}>
        <SidebarContent />
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute bottom-20 -right-3 w-6 h-6 bg-white border border-surface-200 rounded-full shadow flex items-center justify-center text-surface-500 hover:text-surface-700 z-50"
          style={{ left: collapsed ? "52px" : "212px" }}>
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-56 bg-sidebar-bg">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-surface-200 h-14 flex items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="md:hidden text-surface-600">
              <Menu size={20} />
            </button>
            <div className="hidden sm:flex items-center gap-2 bg-surface-100 rounded-lg px-3 py-1.5 w-64">
              <Search size={14} className="text-surface-400" />
              <input placeholder="Хайх..." className="bg-transparent text-sm outline-none flex-1 text-surface-700 placeholder:text-surface-400" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="relative p-2 text-surface-500 hover:text-surface-700 hover:bg-surface-100 rounded-lg">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 md:p-6 page-enter">{children}</main>
      </div>
    </div>
  );
}

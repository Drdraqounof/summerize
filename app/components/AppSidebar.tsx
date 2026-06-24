"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  Inbox,
  LayoutDashboard,
  ShieldAlert,
  Settings,
  Users,
  BarChart3,
  ChevronLeft,
  Menu,
  LogOut,
} from "lucide-react";
import { useEmail } from "../providers";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
}

const primaryNav: NavItem[] = [
  { label: "Inbox", href: "/inbox", icon: <Inbox size={20} /> },
  { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard size={20} /> },
  { label: "Analytics", href: "/analytics", icon: <BarChart3 size={20} /> },
  { label: "Contacts", href: "/contacts", icon: <Users size={20} /> },
  { label: "Spam", href: "/spam", icon: <ShieldAlert size={20} /> },
];

const secondaryNav: NavItem[] = [
  { label: "Settings", href: "/settings", icon: <Settings size={20} /> },
];

export default function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useEmail();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "#") return false;
    return pathname.startsWith(href);
  };

  const handleNav = (href: string) => {
    if (href === "#") return;
    router.push(href);
    setMobileOpen(false);
  };

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="flex items-center justify-between px-4 h-16 shrink-0 border-b border-gray-200">
        {!collapsed && (
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xl shrink-0">{String.fromCodePoint(0x1F422)}</span>
            <span className="font-bold text-gray-900 truncate">MailTurtle</span>
          </div>
        )}
        {collapsed && (
          <span className="text-xl mx-auto">{String.fromCodePoint(0x1F422)}</span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex items-center justify-center w-7 h-7 rounded-lg hover:bg-gray-100 text-gray-400 transition"
        >
          <ChevronLeft size={16} className={`transition ${collapsed ? "rotate-180" : ""}`} />
        </button>
      </div>

      {/* Primary Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className={`px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider ${collapsed ? "text-center" : ""}`}>
          {collapsed ? "..." : "Main"}
        </p>
        {primaryNav.map((item) => (
          <button
            key={item.href}
            onClick={() => handleNav(item.href)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
              isActive(item.href)
                ? "bg-emerald-100 text-emerald-900"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
            title={collapsed ? item.label : undefined}
          >
            <span className="shrink-0">{item.icon}</span>
            {!collapsed && (
              <>
                <span className="truncate">{item.label}</span>
                {item.badge && (
                  <span className="ml-auto text-xs bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full font-semibold">
                    {item.badge}
                  </span>
                )}
              </>
            )}
          </button>
        ))}

        {/* Secondary Nav */}
        <p className={`pt-4 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider ${collapsed ? "text-center" : ""}`}>
          {collapsed ? "..." : "System"}
        </p>
        {secondaryNav.map((item) => (
          <button
            key={item.href}
            onClick={() => handleNav(item.href)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
              isActive(item.href)
                ? "bg-emerald-100 text-emerald-900"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
            title={collapsed ? item.label : undefined}
          >
            <span className="shrink-0">{item.icon}</span>
            {!collapsed && <span className="truncate">{item.label}</span>}
          </button>
        ))}
      </nav>

      {/* User Section */}
      {user && (
        <div className={`shrink-0 border-t border-gray-200 p-3 ${collapsed ? "px-2" : ""}`}>
          {collapsed ? (
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center p-2 rounded-xl text-gray-400 hover:bg-red-50 hover:text-red-600 transition"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-semibold text-emerald-700 shrink-0">
                {user.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user.split("@")[0]}</p>
                <p className="text-xs text-gray-500 truncate">{user}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition"
                title="Logout"
              >
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex flex-col bg-white border-r border-gray-200 transition-all duration-200 ${
          collapsed ? "w-16" : "w-60"
        } shrink-0`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Hamburger */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="md:hidden fixed top-3 left-3 z-50 w-10 h-10 bg-white rounded-xl border border-gray-200 shadow-sm flex items-center justify-center text-gray-600 hover:bg-gray-50 transition"
      >
        <Menu size={20} />
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/30"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`md:hidden fixed top-0 left-0 z-50 h-full bg-white border-r border-gray-200 shadow-xl transition-transform duration-200 w-60 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}

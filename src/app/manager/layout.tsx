"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Link2,
  Menu,
  X,
  Grid3X3,
  Calendar,

} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const navItems = [
  { label: "Overview", href: "/manager", icon: LayoutDashboard },
  { label: "Requests", href: "/manager/requests", icon: ClipboardList },
  { label: "Tee Sheet", href: "/manager/tee-sheet", icon: Grid3X3 },

  { label: "Schedule", href: "/manager/schedule", icon: Calendar },
  { label: "Roster", href: "/manager/roster", icon: Users },
  { label: "Links", href: "/manager/links", icon: Link2 },
];

export default function ManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-cream flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-green-800 text-cream min-h-screen">
        <div className="p-6 border-b border-green-700">
          <Link href="/" className="flex items-center gap-3">
            <img
              src="/images/logo.png"
              alt="Fox Hollow"
              className="h-9 w-auto brightness-110"
            />
            <div>
              <p className="font-heading text-sm leading-tight">Fox Hollow</p>
              <p className="text-cream/50 text-xs">League Manager</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive =
              item.href === "/manager"
                ? pathname === "/manager"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                  isActive
                    ? "bg-green-700 text-brass font-medium"
                    : "text-cream/70 hover:bg-green-700/50 hover:text-cream"
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-green-700">
          <div className="flex items-center gap-3">
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8",
                },
              }}
            />
            <span className="text-cream/60 text-sm">Manager</span>
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-green-800 border-b border-green-700">
        <div className="flex items-center justify-between px-4 h-14">
          <Link href="/" className="flex items-center gap-2">
            <img
              src="/images/logo.png"
              alt="Fox Hollow"
              className="h-8 w-auto brightness-110"
            />
            <span className="font-heading text-cream text-sm">Fox Hollow</span>
          </Link>
          <div className="flex items-center gap-3">
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-7 h-7",
                },
              }}
            />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-cream p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <nav className="px-4 pb-4 space-y-1 bg-green-800 border-b border-green-700">
            {navItems.map((item) => {
              const isActive =
                item.href === "/manager"
                  ? pathname === "/manager"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-3 min-h-[44px] rounded-lg text-sm transition-colors",
                    isActive
                      ? "bg-green-700 text-brass font-medium"
                      : "text-cream/70 hover:bg-green-700/50 hover:text-cream"
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        )}
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden overflow-y-auto min-w-0">
        <div className="pt-14 md:pt-0">{children}</div>
      </main>
    </div>
  );
}

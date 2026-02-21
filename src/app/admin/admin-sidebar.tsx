"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Shield, LayoutDashboard, Users, FolderGit2, Ticket, BarChart3, LogOut, ChevronRight, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

const navItems = [
  { name: "Overview", href: "/admin", icon: LayoutDashboard },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Projects", href: "/admin/projects", icon: FolderGit2 },
  { name: "Redemptions", href: "/admin/redemptions", icon: Ticket },
  { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const NavigationList = () => (
    <nav className="flex-1 space-y-1.5 p-4">
      <div className="mb-6 px-2 flex items-center gap-2 text-xl font-bold tracking-tight">
        <span className="text-xl font-bold tracking-tight">&gt;&gt;&gt; vamo admin</span>
      </div>
      
      {navItems.map((item) => {
        const isActive = pathname === item.href || (item.href !== "/admin" && pathname?.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setIsOpen(false)}
            className={`group flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
              isActive
                ? "bg-white text-black shadow-sm ring-1 ring-black/5"
                : "text-zinc-500 hover:bg-black/5 hover:text-black"
            }`}
          >
            <div className="flex items-center gap-3">
              <item.icon className={`h-4 w-4 ${isActive ? "text-black" : "text-zinc-400 group-hover:text-black"}`} />
              {item.name}
            </div>
            {isActive && <ChevronRight className="h-4 w-4 text-black opacity-30" />}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Mobile Sidebar */}
      <div className="md:hidden flex items-center justify-between border-b border-black/5 bg-[#fafafa]/80 backdrop-blur-md p-4">
        <div className="flex items-center gap-2 font-bold text-lg tracking-tight">
           &gt;&gt;&gt; vamo admin
        </div>
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 flex flex-col w-64 bg-[#fafafa]">
            <NavigationList />
            <div className="p-4 border-t border-black/5">
              <Button variant="outline" className="w-full justify-start gap-2 border-black/10 rounded-full" asChild>
                <Link href="/projects"><LogOut className="h-4 w-4" /> Exit Admin</Link>
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-col w-64 border-r border-black/5 bg-[#fafafa]/80 backdrop-blur-md">
        <NavigationList />
        <div className="p-4 border-t border-black/5">
          <Button variant="ghost" className="w-full justify-start gap-2 text-zinc-500 hover:text-black hover:bg-black/5 rounded-full" asChild>
            <Link href="/projects"><LogOut className="h-4 w-4" /> Exit to App</Link>
          </Button>
        </div>
      </div>
    </>
  );
}

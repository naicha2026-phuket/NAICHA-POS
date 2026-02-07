"use client";

import React from "react";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  ChevronLeft,
  Coffee,
  Cookie,
  FolderOpen,
  LayoutDashboard,
  LogOut,
  Receipt,
  TrendingUp,
  Users,
  UserCog,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useAuth } from "@/lib/auth-context";

const navItems = [
  { href: "/admin", label: "ภาพรวม", icon: LayoutDashboard },
  { href: "/admin/orders", label: "จัดการออเดอร์", icon: Receipt },
  { href: "/admin/categories", label: "จัดการหมวดหมู่", icon: FolderOpen },
  { href: "/admin/menu", label: "จัดการเมนู", icon: Coffee },
  { href: "/admin/toppings", label: "จัดการท็อปปิ้ง", icon: Cookie },
  { href: "/admin/members", label: "จัดการสมาชิก", icon: Users },
  { href: "/admin/staff", label: "จัดการพนักงาน", icon: UserCog },
  { href: "/admin/sales", label: "รายงานยอดขาย", icon: BarChart3 },
  { href: "/admin/bestsellers", label: "เมนูขายดี", icon: TrendingUp },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = React.useState(false);
  const [isChecking, setIsChecking] = React.useState(true);
  const [checkTimeout, setCheckTimeout] = React.useState(false);
  const { employee, canAccessAdmin, logout } = useAuth();

  useEffect(() => {
    setMounted(true);

    // Set timeout to stop checking after 2 seconds
    const timer = setTimeout(() => {
      setCheckTimeout(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (mounted) {
      // Check localStorage directly for immediate feedback
      const storedEmployee = localStorage.getItem("employee");
      console.log("Admin layout check - stored employee:", storedEmployee);
      console.log("Admin layout check - employee state:", employee);
      console.log("Admin layout check - checkTimeout:", checkTimeout);
      // If no stored employee, redirect immediately
      if (!storedEmployee) {
        console.log("No stored employee, redirecting to /");
        router.push("/");
        return;
      }

      // If we have stored employee but state hasn't loaded yet, wait (unless timeout)
      if (!employee && !checkTimeout) {
        console.log("Waiting for employee state to load...");
        return;
      }

      // If timeout reached and still no employee state, try to parse localStorage
      if (!employee && checkTimeout && storedEmployee) {
        console.log("Timeout reached, checking localStorage directly");
        try {
          const parsedEmployee = JSON.parse(storedEmployee);
          if (parsedEmployee.role !== "admin") {
            console.log("Not admin role, redirecting");
            router.push("/");
            return;
          }
        } catch (e) {
          console.error("Failed to parse employee", e);
          router.push("/");
          return;
        }
      }

      // Now check access with loaded employee state
      const hasAccess = canAccessAdmin();
      console.log("Admin access check result:", hasAccess);

      if (!hasAccess) {
        console.log("No admin access, redirecting to /");
        router.push("/");
      } else {
        console.log("Admin access granted");
        setIsChecking(false);
      }
    }
  }, [mounted, employee, canAccessAdmin, router, checkTimeout]);

  if (!mounted || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground">กำลังตรวจสอบสิทธิ์...</p>
        </div>
      </div>
    );
  }

  if (!canAccessAdmin()) {
    return null;
  }

  return (
    <SidebarProvider>
      <Sidebar>
        {/* Logo */}
        <SidebarHeader>
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">
                N
              </span>
            </div>
            <div>
              <h1 className="font-semibold text-lg text-foreground">NAI CHA</h1>
              <p className="text-xs text-muted-foreground">ระบบจัดการ</p>
            </div>
          </div>
        </SidebarHeader>

        {/* Navigation */}
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={isActive}>
                        <Link href={item.href}>
                          <item.icon />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        {/* Back to POS */}
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/">
                  <ChevronLeft />
                  <span>กลับหน้าขาย</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <button onClick={() => router.push("/")}>
                  <LogOut />
                  <span>ออกจากระบบ</span>
                </button>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      {/* Main Content */}
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger />
        </header>
        <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}

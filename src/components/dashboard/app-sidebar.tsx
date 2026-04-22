"use client";

import { 
  LayoutGrid, 
  Users, 
  GraduationCap, 
  CalendarCheck, 
  Wallet, 
  LogOut,
  HardHat,
  BookOpen,
  ShieldCheck,
  ClipboardList
} from "lucide-react";
import { 
  Sidebar, 
  SidebarContent, 
  SidebarFooter, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem, 
  SidebarGroup,
  SidebarGroupContent,
  useSidebar
} from "@/components/ui/sidebar";
import { useSchoolStore } from "@/lib/store";
import { useRouter, usePathname } from "next/navigation";
import { SCHOOL_LOGO } from "@/lib/constants";
import Image from "next/image";
import { cn } from "@/lib/utils";

export function AppSidebar() {
  const { currentUser, logout } = useSchoolStore();
  const { setOpenMobile, isMobile } = useSidebar();
  const router = useRouter();
  const pathname = usePathname();

  if (!currentUser) return null;

  const isAdmin = currentUser.role === 'ADMIN' || currentUser.role === 'FOUNDER';

  const menuItems = isAdmin ? [
    { title: "Dashboard", icon: LayoutGrid, path: "/admin" },
    { title: "Academic Faculty", icon: Users, path: "/teachers" },
    { title: "Staff Faculty", icon: HardHat, path: "/staff" },
    { title: "Students", icon: GraduationCap, path: "/students" },
    { title: "Attendance", icon: CalendarCheck, path: "/attendance" },
    { title: "Records & Attendance", icon: ClipboardList, path: "/records-attendance" },
    { title: "Homework Tracker", icon: BookOpen, path: "/homework-status" },
    { title: "Fees & Salary", icon: Wallet, path: "/payments" },
    { title: "Portal Access", icon: ShieldCheck, path: "/portal-access" },
  ] : [
    { title: "My Dashboard", icon: LayoutGrid, path: "/teacher" },
  ];

  const handleNavigate = (path: string) => {
    router.push(path);
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar variant="sidebar" collapsible="icon" className="border-none bg-[#1F58B3]">
      <SidebarHeader className="p-6 flex flex-col items-center gap-2">
        <div className="bg-white rounded-full p-1 h-16 w-16 flex items-center justify-center overflow-hidden shrink-0 shadow-lg mb-2 ring-2 ring-white/20">
          <Image src={SCHOOL_LOGO} alt="Logo" width={64} height={64} className="object-cover" />
        </div>
        <div className="flex flex-col text-center group-data-[collapsible=icon]:hidden">
          <span className="font-bold text-lg text-white leading-tight tracking-wide uppercase">JIJAU ENGLISH SCHOOL</span>
          <span className="text-[10px] text-white/80 font-medium uppercase tracking-widest mt-0.5">TUNGI [B.K]</span>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="px-3 mt-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-2">
              {menuItems.map((item) => {
                const isActive = pathname === item.path;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      onClick={() => handleNavigate(item.path)}
                      tooltip={item.title}
                      className={cn(
                        "h-11 transition-all duration-200 hover:bg-white/10 active:scale-95",
                        isActive ? "bg-white/20 text-white font-semibold" : "text-white/80"
                      )}
                    >
                      <item.icon className={cn("h-5 w-5", isActive ? "text-white" : "text-white/80")} />
                      <span className="text-[15px]">{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={() => { logout(); router.push('/login'); }}
              className="text-white/80 hover:bg-white/20 hover:text-white transition-all gap-3 px-4 h-12 rounded-xl group"
            >
              <LogOut className="h-5 w-5 text-white" />
              <span className="font-bold text-[15px]">Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

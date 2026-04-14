"use client";

import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { useSchoolStore } from "@/lib/store";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import Link from "next/link";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { currentUser, isLoaded, logout } = useSchoolStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isLoaded && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, isLoaded, router]);

  if (!mounted || !isLoaded || !currentUser) return null;

  const displayName = currentUser.role === 'FOUNDER' ? "Hon. Dnyaneshwar Ingole" : currentUser.fullName;

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-[#EEF3F5] min-h-svh">
        <header className="sticky top-0 z-30 flex h-16 md:h-20 items-center justify-between bg-white/70 backdrop-blur-md px-4 md:px-8 border-b border-gray-100/50">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="h-10 w-10 text-[#1F58B3]" />
            <div className="flex flex-col">
              <span className="text-[10px] md:text-xs font-black text-primary uppercase leading-tight tracking-widest">Jijau School</span>
              <span className="text-[8px] md:text-[10px] text-muted-foreground font-bold uppercase tracking-widest hidden sm:inline">Connect Portal</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4">
            <div className="text-right hidden md:block">
              <p className="text-[13px] font-bold text-[#1F2937] leading-none">
                {displayName}
              </p>
              <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider mt-1">{currentUser.role}</p>
            </div>
            <Link href="/profile">
              <Avatar className="h-9 w-9 md:h-11 md:w-11 border-2 border-white shadow-sm cursor-pointer hover:ring-2 hover:ring-primary transition-all">
                <AvatarImage src={currentUser.photo} className="object-cover" />
                <AvatarFallback className="bg-[#EEF3F5] text-[#1F58B3] font-bold">
                  {displayName.charAt(0)}
                </AvatarFallback>
              </Avatar>
            </Link>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9 md:h-11 md:w-11 rounded-full text-red-500 hover:text-red-600 hover:bg-red-50 transition-all ml-1"
              onClick={handleLogout}
              title="Sign Out"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </header>
        <main className="px-4 md:px-8 py-6 max-w-[1600px] mx-auto w-full">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
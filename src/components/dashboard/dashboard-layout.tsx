"use client";

import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { useSchoolStore } from "@/lib/store";
import { useEffect, useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LogOut, Bell, Send, AlertTriangle, Camera, X, ImageIcon } from "lucide-react";
import Link from "next/link";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SCHOOL_NAME } from "@/lib/constants";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { currentUser, isLoaded, logout, staffAttendance, addBroadcastMessage, broadcastMessages } = useSchoolStore();
  const router = useRouter();
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [broadcastText, setBroadcastText] = useState("");
  const [broadcastPhoto, setBroadcastPhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
    if (isLoaded && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, isLoaded, router]);

  const isAdminOrFounder = useMemo(() => 
    currentUser?.role === 'ADMIN' || currentUser?.role === 'FOUNDER',
  [currentUser]);

  const todayStr = useMemo(() => new Date().toLocaleDateString(), []);
  
  const showHolidayAlert = useMemo(() => {
    if (!isAdminOrFounder) return false;
    const now = new Date();
    const isPast11PM = now.getHours() >= 23;
    const teachersLoggedToday = staffAttendance.filter(a => a.date === todayStr).length;
    return isPast11PM && teachersLoggedToday === 0;
  }, [isAdminOrFounder, staffAttendance, todayStr]);

  const handleSendBroadcast = () => {
    if (!broadcastText.trim() || !currentUser) return;
    addBroadcastMessage({
      id: Math.random().toString(36).substr(2, 9),
      senderName: currentUser.fullName,
      senderRole: currentUser.role,
      message: broadcastText,
      photo: broadcastPhoto || undefined,
      timestamp: new Date().toLocaleString()
    });
    toast({ title: "Message Broadcasted" });
    setBroadcastText("");
    setBroadcastPhoto(null);
  };

  const handleBroadcastShare = async (msg: any) => {
    const message = `*${SCHOOL_NAME} BROADCAST*\n\n📢 *FROM:* ${msg.senderName} (${msg.senderRole})\n\n📝 *MESSAGE:*\n${msg.message}\n\n📅 *DATE:* ${msg.timestamp}`;
    
    if (msg.photo && typeof navigator !== 'undefined' && navigator.share) {
      try {
        const res = await fetch(msg.photo);
        const blob = await res.blob();
        const file = new File([blob], `broadcast_${msg.id}.jpg`, { type: 'image/jpeg' });
        
        const shareData = {
          files: [file],
          title: 'School Broadcast',
          text: message,
        };

        if (navigator.canShare && navigator.canShare(shareData)) {
          await navigator.share(shareData);
          return;
        }
      } catch (e) {
        console.error("Broadcast share failed", e);
      }
    }

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBroadcastPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  if (!mounted || !isLoaded || !currentUser) return null;

  const displayName = currentUser.role === 'FOUNDER' ? "Hon. Dnyaneshwar Ingole" : currentUser.fullName;

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-[#EEF3F5] h-screen overflow-hidden flex flex-col relative">
        <header className="shrink-0 z-40 flex h-16 md:h-20 items-center justify-between bg-white px-4 md:px-8 border-b border-gray-100 shadow-sm">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="h-10 w-10 text-[#1F58B3] hover:bg-blue-50 active:scale-95 transition-transform" />
            <div className="flex flex-col">
              <span className="text-[10px] md:text-xs font-black text-primary uppercase leading-tight tracking-widest">{SCHOOL_NAME}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4">
            <Popover>
              <PopoverTrigger asChild>
                <div className="relative">
                  <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full bg-gray-50 hover:bg-blue-50 text-gray-500">
                    <Bell className="h-5 w-5" />
                    {(showHolidayAlert || broadcastMessages.length > 0) && (
                      <span className="absolute top-2 right-2 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse" />
                    )}
                  </Button>
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-80 md:w-96 p-0 rounded-2xl overflow-hidden border-none shadow-2xl z-[150]" align="end">
                <div className="bg-[#1F58B3] p-4 text-white">
                  <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                    <Bell className="h-4 w-4" /> Notification Hub
                  </h3>
                </div>
                
                <ScrollArea className="max-h-[400px]">
                  <div className="p-4 space-y-4">
                    {showHolidayAlert && (
                      <div className="bg-red-50 border border-red-100 p-4 rounded-xl space-y-3">
                        <div className="flex items-center gap-2 text-red-600">
                          <AlertTriangle className="h-4 w-4" />
                          <span className="text-xs font-black uppercase">Operation Alert</span>
                        </div>
                        <p className="text-sm font-bold text-gray-700">No faculty presence logged today. Is it a holiday?</p>
                        <div className="grid grid-cols-2 gap-2">
                          <Button size="sm" variant="outline" className="bg-white text-red-600 font-black text-[10px]" onClick={() => setBroadcastText("Notice: Today is a school holiday. Attendance not required.")}>Yes</Button>
                          <Button size="sm" variant="outline" className="bg-white text-gray-600 font-black text-[10px]" onClick={() => setBroadcastText("Urgent: No faculty logs found today. Immediate explanation required.")}>No</Button>
                        </div>
                      </div>
                    )}
                    {isAdminOrFounder && (
                      <div className="space-y-2 pb-4 border-b">
                        <Label className="text-[10px] font-black uppercase text-gray-400">Broadcast</Label>
                        <Textarea 
                          placeholder="Type an announcement..." 
                          className="bg-gray-50 border-none min-h-[80px] rounded-xl text-sm"
                          value={broadcastText}
                          onChange={e => setBroadcastText(e.target.value)}
                        />
                        
                        <div className="space-y-2">
                          {!broadcastPhoto ? (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="w-full border-dashed border-gray-200 h-10 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-400 gap-2 hover:bg-gray-50"
                              onClick={() => fileInputRef.current?.click()}
                            >
                              <Camera className="h-3.5 w-3.5" /> Attach Photo
                            </Button>
                          ) : (
                            <div className="relative h-24 w-full rounded-xl overflow-hidden border border-gray-100 group">
                              <img src={broadcastPhoto} className="h-full w-full object-cover" alt="Broadcast preview" />
                              <button 
                                type="button"
                                className="absolute top-1.5 right-1.5 bg-red-500 text-white p-1 rounded-full shadow-lg"
                                onClick={() => setBroadcastPhoto(null)}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          )}
                          <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            accept="image/*" 
                            onChange={handlePhotoUpload} 
                          />
                        </div>

                        <Button className="w-full bg-[#1F58B3] h-10 rounded-xl font-black gap-2 text-xs uppercase" onClick={handleSendBroadcast} disabled={!broadcastText.trim() && !broadcastPhoto}>
                          <Send className="h-3.5 w-3.5" /> Send
                        </Button>
                      </div>
                    )}
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase text-gray-400">Recent</Label>
                      {broadcastMessages.length === 0 ? (
                        <div className="py-8 text-center text-gray-300 italic text-xs">No active notifications</div>
                      ) : (
                        broadcastMessages.map((msg) => (
                          <div key={msg.id} className="bg-white border border-gray-100 p-3 rounded-xl shadow-sm space-y-1">
                            <div className="flex justify-between">
                              <Badge variant="outline" className="text-[9px] font-bold text-primary">{msg.senderRole}</Badge>
                              <span className="text-[8px] text-gray-400">{msg.timestamp}</span>
                            </div>
                             <p className="text-xs font-bold text-gray-700">{msg.message}</p>
                             {msg.photo && (
                               <div className="mt-2 rounded-lg overflow-hidden border border-gray-50 relative group">
                                 <img src={msg.photo} alt="Broadcast Attachment" className="w-full h-auto max-h-40 object-cover" />
                                 <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                   <Button 
                                     size="sm" 
                                     variant="secondary" 
                                     className="h-8 rounded-lg font-bold text-[10px]"
                                     onClick={() => window.open(msg.photo, '_blank')}
                                   >
                                     <ImageIcon className="h-3 w-3 mr-1" /> View
                                   </Button>
                                   <Button 
                                     size="sm" 
                                     variant="secondary" 
                                     className="h-8 rounded-lg font-bold text-[10px]"
                                     onClick={() => handleBroadcastShare(msg)}
                                   >
                                     <Send className="h-3 w-3 mr-1" /> Share
                                   </Button>
                                 </div>
                               </div>
                             )}
                             {!msg.photo && (
                               <div className="flex justify-end mt-2">
                                 <Button 
                                   variant="ghost" 
                                   size="sm" 
                                   className="h-7 text-[9px] font-bold text-primary gap-1"
                                   onClick={() => handleBroadcastShare(msg)}
                                 >
                                   <Send className="h-3 w-3" /> Share
                                 </Button>
                               </div>
                             )}
                             <p className="text-[9px] text-gray-400 text-right">— {msg.senderName}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </ScrollArea>
              </PopoverContent>
            </Popover>

            <Link href="/profile" className="hidden md:block text-right">
              <p className="text-[13px] font-bold text-[#1F2937] leading-none">{displayName}</p>
              <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider mt-1">{currentUser.role}</p>
            </Link>
            <Link href="/profile">
              <Avatar className="h-9 w-9 md:h-11 md:w-11 border-2 border-white shadow-sm">
                <AvatarImage src={currentUser.photo} className="object-cover" />
                <AvatarFallback className="bg-[#EEF3F5] text-[#1F58B3] font-bold">{displayName.charAt(0)}</AvatarFallback>
              </Avatar>
            </Link>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto scroll-touch no-scrollbar px-4 md:px-8 py-4 md:py-6">
          <div className="max-w-[1600px] mx-auto w-full pb-20 md:pb-6">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

"use client";

import { useSchoolStore } from "@/lib/store";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BookOpen, CheckCircle2, XCircle, Search, CalendarDays, Calendar as CalendarIcon, MessageCircle, ImageIcon, Plus, Camera, X, Save, Eye, Download, Share2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useEffect, useRef } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { SCHOOL_NAME } from "@/lib/constants";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Teacher } from "@/lib/types";
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';

export default function HomeworkStatusPage() {
  const { homeworks, teachers, currentUser, addHomework } = useSchoolStore();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dateDisplay, setDateDisplay] = useState("");
  const [viewImage, setViewImage] = useState<string | null>(null);
  
  // Admin Add Homework State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("");
  const [homeworkContent, setHomeworkContent] = useState("");
  const [homeworkPhoto, setHomeworkPhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDateDisplay(format(selectedDate, 'yyyy-MM-dd'));
  }, [selectedDate]);

  const academicTeachers = teachers.filter(t => t.category === 'Academic');
  
  const filteredStatus = academicTeachers.filter(t => 
    t.fullName.toLowerCase().includes(search.toLowerCase()) || 
    t.classDetails.toLowerCase().includes(search.toLowerCase())
  );

  const isAdmin = currentUser?.role === 'FOUNDER' || currentUser?.role === 'ADMIN';

  const handleWhatsAppShare = async (homework: any) => {
    const text = `*${SCHOOL_NAME}*\n\n📚 *DAILY HOMEWORK REPORT*\n\n📅 *DATE:* ${homework.date}\n🏫 *CLASS:* ${homework.class}\n👤 *TEACHER:* ${homework.teacherName}\n\n📝 *ASSIGNMENT DETAILS:*\n${homework.content}`;

    try {
      if (homework.photo) {
        // Convert base64 to blob
        const response = await fetch(homework.photo);
        const blob = await response.blob();
        const file = new File([blob], 'homework.jpg', { type: 'image/jpeg' });

        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'Homework',
            text: text,
          });
          return;
        }
      }

      // Fallback for text only
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
      window.open(whatsappUrl, '_blank');
    } catch (error) {
      console.error('Error sharing:', error);
      toast({
        title: "Sharing failed",
        description: "Could not share the image. Try downloading it instead.",
        variant: "destructive"
      });
    }
  };

  const handleDownload = async (imageData: string, subject: string) => {
    if (Capacitor.isNativePlatform()) {
      try {
        const fileName = `Homework_${subject}_${format(new Date(), 'yyyyMMdd_HHmmss')}.jpg`;
        const base64Data = imageData.includes(',') ? imageData.split(',')[1] : imageData;
        
        await Filesystem.writeFile({
          path: fileName,
          data: base64Data,
          directory: Directory.Documents,
        });
        
        toast({
          title: "Success!",
          description: "Image saved to your device's Documents/Downloads folder.",
        });
      } catch (error) {
        console.error('Error saving file', error);
        toast({
          title: "Error",
          description: "Could not save the image. Please check permissions.",
          variant: "destructive",
        });
      }
    } else {
      const link = document.createElement('a');
      link.href = imageData;
      link.download = `Homework_${subject}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleOpenAdd = (teacher?: Teacher) => {
    setSelectedTeacherId(teacher?.id || "");
    setHomeworkContent("");
    setHomeworkPhoto(null);
    setIsAddOpen(true);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          if (width > height && width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          } else if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          setHomeworkPhoto(canvas.toDataURL('image/jpeg', 0.6));
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveHomework = () => {
    const targetTeacher = teachers.find(t => t.id === selectedTeacherId);
    if (!targetTeacher) {
      toast({ title: "Error", description: "Please select a teacher.", variant: "destructive" });
      return;
    }

    addHomework({
      id: Math.random().toString(36).substr(2, 9),
      teacherId: targetTeacher.id,
      teacherName: targetTeacher.fullName,
      class: targetTeacher.classDetails,
      date: format(selectedDate, 'yyyy-MM-dd'),
      content: homeworkContent,
      photo: homeworkPhoto || undefined,
      createdAt: new Date().toISOString()
    });

    toast({ title: "Homework Posted", description: `Admin record created for ${targetTeacher.fullName}` });
    setIsAddOpen(false);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-3xl font-black text-[#1F58B3] uppercase tracking-tight">Homework Tracker</h2>
            <p className="text-muted-foreground font-medium">Daily compliance monitor for all classes</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {isAdmin && (
              <Button 
                className="bg-[#1F58B3] h-12 px-6 rounded-xl font-black gap-2 shadow-lg shadow-blue-50 flex-1 md:flex-none uppercase tracking-widest text-xs"
                onClick={() => handleOpenAdd()}
              >
                <Plus className="h-4 w-4" /> Add Homework
              </Button>
            )}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "flex-1 md:w-[240px] justify-start text-left font-black h-12 rounded-xl border-none shadow-sm bg-white text-[#1F58B3]",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 rounded-2xl border-none shadow-2xl z-[150]" align="end">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  initialFocus
                  className="rounded-2xl"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
          <CardHeader className="p-6 border-b border-gray-50 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                className="pl-12 h-12 bg-gray-50 border-none shadow-inner rounded-xl" 
                placeholder="Search teacher or class..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div className="hidden md:flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest">
              <CalendarDays className="h-4 w-4" />
              Showing records for: <span className="text-[#1F58B3]">{dateDisplay}</span>
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto scroll-touch">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                  <TableHead className="pl-8 py-5 text-[11px] font-black uppercase tracking-widest">Faculty Member</TableHead>
                  <TableHead className="py-5 text-[11px] font-black uppercase tracking-widest">Allotted Class</TableHead>
                  <TableHead className="py-5 text-[11px] font-black uppercase tracking-widest text-center">Status</TableHead>
                  <TableHead className="pr-8 py-5 text-[11px] font-black uppercase tracking-widest text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStatus.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-20 text-gray-300 font-black uppercase tracking-widest italic">No records found</TableCell>
                  </TableRow>
                ) : (
                  filteredStatus.map((t) => {
                    const selectedHW = homeworks.find(h => h.teacherId === t.id && h.date === format(selectedDate, 'yyyy-MM-dd'));
                    return (
                      <TableRow key={t.id} className="hover:bg-gray-50/50 border-b border-gray-50 last:border-0">
                        <TableCell className="pl-8 py-5">
                          <span className="font-black text-gray-700">{t.fullName}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-bold border-primary/20 text-primary">
                            {t.classDetails === 'None' ? 'N/A' : t.classDetails}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {selectedHW ? (
                            <div className="flex items-center justify-center gap-2 text-green-600 font-black text-xs uppercase">
                              <CheckCircle2 className="h-4 w-4" /> Completed
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-2 text-red-400 font-black text-xs uppercase">
                              <XCircle className="h-4 w-4" /> Not Posted
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="pr-8 text-right">
                          <div className="flex items-center justify-end gap-2">
                             {!selectedHW && isAdmin && (
                               <Button
                                 size="sm"
                                 className="h-9 px-4 rounded-xl bg-[#1F58B3] text-white font-bold gap-2 shadow-sm"
                                 onClick={() => handleOpenAdd(t)}
                               >
                                 <Plus className="h-4 w-4" /> Add
                               </Button>
                             )}
                             {selectedHW && (
                               <>
                                {selectedHW.photo && (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-9 px-3 rounded-xl text-primary font-bold gap-2"
                                      onClick={() => setViewImage(selectedHW.photo || null)}
                                    >
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-9 px-3 rounded-xl text-primary font-bold gap-2"
                                      onClick={() => handleDownload(selectedHW.photo!, selectedHW.class || 'All')}
                                    >
                                      <Download className="w-4 h-4" />
                                    </Button>
                                  </>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-9 px-3 rounded-xl text-green-600 font-bold gap-2"
                                  onClick={() => handleWhatsAppShare(selectedHW)}
                                >
                                  <Share2 className="w-4 h-4" />
                                </Button>
                               </>
                             )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* View Photo Dialog */}
        <Dialog open={!!viewImage} onOpenChange={(val) => !val && setViewImage(null)}>
          <DialogContent className="max-w-2xl w-[95vw] rounded-2xl overflow-hidden p-0 border-none shadow-2xl z-[150] flex flex-col max-h-[90vh]">
            <DialogHeader className="p-4 bg-[#1F58B3] text-white shrink-0">
              <DialogTitle className="font-black uppercase tracking-tight">Homework Attachment</DialogTitle>
            </DialogHeader>
            <div className="p-2 bg-white flex-1 overflow-y-auto flex items-center justify-center scroll-touch no-scrollbar">
              {viewImage && (
                <img src={viewImage} alt="Homework Attachment" className="w-full h-auto rounded-xl object-contain max-h-full" />
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Admin Add Homework Dialog */}
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogContent className="max-w-xl rounded-[2rem] p-0 overflow-hidden border-none shadow-2xl z-[150] w-[95vw] md:w-full flex flex-col max-h-[90vh]">
            <DialogHeader className="bg-[#1F58B3] text-white p-6 md:p-8 shrink-0">
              <DialogTitle className="text-2xl font-black uppercase tracking-tight">Post Manual Homework</DialogTitle>
              <DialogDescription className="text-white/80 font-bold">Override missing classroom records for {SCHOOL_NAME}</DialogDescription>
            </DialogHeader>
            <div className="p-6 md:p-8 space-y-6 bg-white overflow-y-auto flex-1 no-scrollbar">
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-xl flex items-center justify-between border border-gray-100">
                  <div>
                    <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Entry Date</Label>
                    <p className="font-black text-primary text-base">{selectedDate.toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="font-black text-gray-400 uppercase tracking-widest text-[10px]">Select Target Faculty</Label>
                  <Select value={selectedTeacherId} onValueChange={setSelectedTeacherId}>
                    <SelectTrigger className="bg-gray-50 border-none h-12 rounded-xl font-bold">
                      <SelectValue placeholder="Choose a teacher/class" />
                    </SelectTrigger>
                    <SelectContent className="z-[160]">
                      {academicTeachers.map(t => (
                        <SelectItem key={t.id} value={t.id}>{t.fullName} ({t.classDetails})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="font-black text-gray-400 uppercase tracking-widest text-[10px]">Assignment Details</Label>
                  <Textarea 
                    placeholder="Define tasks on behalf of teacher..." 
                    className="min-h-[150px] bg-gray-50 border-none rounded-2xl p-6 font-medium text-base leading-relaxed focus-visible:ring-1 focus-visible:ring-primary shadow-inner"
                    value={homeworkContent}
                    onChange={e => setHomeworkContent(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="font-black text-gray-400 uppercase tracking-widest text-[10px]">Attach Photo (Optional)</Label>
                  {!homeworkPhoto ? (
                    <div 
                      className="h-32 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Camera className="h-8 w-8 text-gray-300" />
                      <span className="text-xs font-bold text-gray-400">Click to Upload Image</span>
                    </div>
                  ) : (
                    <div className="relative h-48 w-full rounded-2xl overflow-hidden border border-gray-200 group">
                      <img src={homeworkPhoto} className="h-full w-full object-cover" alt="Homework" />
                      <button 
                        type="button"
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full shadow-lg"
                        onClick={() => setHomeworkPhoto(null)}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                </div>
              </div>
            </div>
            <DialogFooter className="p-6 md:p-8 bg-white border-t border-gray-50 shrink-0">
              <Button onClick={handleSaveHomework} className="w-full bg-[#1F58B3] hover:bg-[#1F58B3]/90 h-14 rounded-xl text-lg font-black gap-2 shadow-xl shadow-blue-50 transition-all active:scale-95">
                <Save className="h-5 w-5" /> Post to Hub
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

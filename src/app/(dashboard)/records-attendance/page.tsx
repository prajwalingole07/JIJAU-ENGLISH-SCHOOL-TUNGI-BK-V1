"use client";

import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { useSchoolStore } from "@/lib/store";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  GraduationCap, 
  CalendarCheck, 
  FileSpreadsheet, 
  AlertTriangle, 
  Plus, 
  Clock, 
  CheckCircle2, 
  XCircle,
  Search,
  UserCheck,
  History,
  ShieldCheck
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";
import { cn, formatDate } from "@/lib/utils";

export default function RecordsAttendancePage() {
  const { 
    students, 
    teachers, 
    studentAttendance, 
    staffAttendance, 
    currentUser,
    markStudentAttendance,
    markStaffAttendance
  } = useSchoolStore();
  const { toast } = useToast();
  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'FOUNDER';

  const [activeTab, setActiveTab] = useState("missing");
  const [selectedUnmarkedClass, setSelectedUnmarkedClass] = useState<string | null>(null);
  const [overrideAttendance, setOverrideAttendance] = useState<Record<string, 'Present' | 'Absent'>>({});
  const today = formatDate();

  const academicTeachers = useMemo(() => teachers.filter(t => t.category === 'Academic'), [teachers]);

  // Identify Official School Working Days
  const workingDays = useMemo(() => {
    const presenceByDate: Record<string, Set<string>> = {};
    staffAttendance.forEach(a => {
      if (a.status === 'Present' && a.approvalStatus === 'Approved') {
        const isAcademic = academicTeachers.some(t => t.id === a.teacherId);
        if (isAcademic) {
          if (!presenceByDate[a.date]) presenceByDate[a.date] = new Set();
          presenceByDate[a.date].add(a.teacherId);
        }
      }
    });

    return Object.keys(presenceByDate).filter(dateStr => {
      const [d, m, y] = dateStr.split('/').map(Number);
      const date = new Date(y, m - 1, d);
      const isSunday = date.getDay() === 0;
      return !isSunday && presenceByDate[dateStr].size > 2;
    });
  }, [staffAttendance, academicTeachers]);

  const missingAttendance = useMemo(() => {
    const classes = ["Nursery", "LKG", "UKG", "1st", "2nd", "3rd", "4th", "5th"];
    const [d, m, y] = today.split('/').map(Number);
    const dateToday = new Date(y, m - 1, d);
    const isSun = dateToday.getDay() === 0;

    if (isSun) return { unmarkedClasses: [], unmarkedTeachers: [] };

    const unmarkedClasses = classes.filter(c => 
      !studentAttendance.some(a => a.class === c && a.date === today)
    );

    const unmarkedTeachers = teachers.filter(t => 
      t.category === 'Academic' && 
      !staffAttendance.some(a => a.teacherId === t.id && a.date === today)
    );

    return { unmarkedClasses, unmarkedTeachers };
  }, [studentAttendance, staffAttendance, teachers, today]);

  if (!isAdmin) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center">
          <div className="h-20 w-20 rounded-full bg-red-50 flex items-center justify-center">
            <ShieldCheck className="h-10 w-10 text-red-500 opacity-40" />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-black text-gray-800 uppercase tracking-tight">Restricted Access</h2>
            <p className="text-muted-foreground font-bold max-w-md mx-auto">
              The Records & Attendance module is reserved for Institutional Leadership and Administrators only.
            </p>
          </div>
          <Button 
            className="bg-[#1F58B3] h-12 px-8 rounded-xl font-black uppercase tracking-widest"
            onClick={() => window.location.href = '/teacher'}
          >
            Return to Dashboard
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const handleOverrideSubmit = () => {
    if (!selectedUnmarkedClass) return;

    const classStudents = students.filter(s => s.class === selectedUnmarkedClass);
    const records = classStudents.map(s => ({
      id: Math.random().toString(36).substr(2, 9),
      studentId: s.id,
      date: today,
      status: overrideAttendance[s.id] || 'Present',
      class: selectedUnmarkedClass
    }));

    markStudentAttendance(records);
    toast({ title: "Admin Override Complete", description: `Attendance recorded for ${selectedUnmarkedClass}` });
    setSelectedUnmarkedClass(null);
    setOverrideAttendance({});
  };

  const formatDateForExcel = (dateStr: string) => {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const d = parts[0].padStart(2, '0');
      const m = parts[1].padStart(2, '0');
      const y = parts[2];
      return `${d}-${m}-${y}`;
    }
    return dateStr;
  };

  const handleExport = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Students Summary
    const studentData = students.map(s => {
      const studentRecords = studentAttendance.filter(a => a.studentId === s.id);
      const presentCount = studentRecords.filter(a => a.status === 'Present').length;
      const absentCount = studentRecords.filter(a => a.status === 'Absent').length;
      const totalDays = presentCount + absentCount;
      const percentage = totalDays > 0 ? Math.round((presentCount / totalDays) * 100) : 0;

      return {
        "Roll Number": s.rollNumber,
        "Full Name": s.fullName,
        "Class": s.class,
        "Contact": s.mobile,
        "Total Present": presentCount,
        "Total Absent": absentCount,
        "Percentage": `${percentage}%`
      };
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(studentData), "Students");

    // Sheet 2: Teachers Summary
    const teacherData = teachers.map(t => {
      const presentCount = staffAttendance.filter(a => 
        a.teacherId === t.id && a.status === 'Present' && a.approvalStatus === 'Approved' && workingDays.includes(a.date)
      ).length;
      const absentCount = workingDays.length - presentCount;

      return {
        "Full Name": t.fullName,
        "Role": t.academicRole,
        "Mobile": t.mobile,
        "Present Days": presentCount,
        "Absent Days": absentCount
      };
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(teacherData), "Teachers");

    // Sheet 3: Student Logs
    const studentAttData = studentAttendance.map(a => ({
      "Date": formatDateForExcel(a.date),
      "Student": students.find(s => s.id === a.studentId)?.fullName || "Unknown",
      "Class": a.class,
      "Status": a.status
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(studentAttData), "Student Attendance");

    // Sheet 4: Teacher Logs
    const teacherAttData = staffAttendance.map(a => ({
      "Date": formatDateForExcel(a.date),
      "Teacher": a.teacherName,
      "Status": a.status,
      "Approval": a.approvalStatus
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(teacherAttData), "Teacher Attendance");

    XLSX.writeFile(wb, `Jijau_Records_Full_${formatDateForExcel(new Date().toLocaleDateString())}.xlsx`);
    toast({ title: "Audit Records Ready", description: "Full institutional records exported." });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-3xl font-black text-[#1F58B3] uppercase tracking-tight">Records & Attendance</h2>
            <p className="text-muted-foreground font-medium">Institutional vault and administrative oversight.</p>
          </div>
          <Button 
            className="bg-[#22C55E] hover:bg-[#22C55E]/90 text-white font-black h-12 rounded-xl px-6 gap-2 shadow-lg shadow-green-50 uppercase tracking-widest text-xs w-full md:w-auto"
            onClick={handleExport}
          >
            <FileSpreadsheet className="h-4 w-4" /> Download Audit Records
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-white p-1 rounded-2xl h-auto flex flex-wrap gap-2 w-fit shadow-sm border border-gray-100">
            <TabsTrigger value="missing" className="rounded-xl px-6 py-3 gap-2 font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-[#1F58B3] data-[state=active]:text-white">
              <AlertTriangle className="h-4 w-4" /> Missing Alerts
            </TabsTrigger>
            <TabsTrigger value="students" className="rounded-xl px-6 py-3 gap-2 font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-[#1F58B3] data-[state=active]:text-white">
              <GraduationCap className="h-4 w-4" /> Student Vault
            </TabsTrigger>
            <TabsTrigger value="teachers" className="rounded-xl px-6 py-3 gap-2 font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-[#1F58B3] data-[state=active]:text-white">
              <Users className="h-4 w-4" /> Faculty Vault
            </TabsTrigger>
          </TabsList>

          <TabsContent value="missing" className="mt-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="border-none shadow-sm rounded-3xl bg-white">
                <CardHeader className="p-8 pb-4">
                  <CardTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-2 text-red-500">
                    <XCircle className="h-5 w-5" /> Unmarked Classes
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 pt-0">
                  {missingAttendance.unmarkedClasses.length === 0 ? (
                    <div className="bg-green-50 text-green-600 p-6 rounded-2xl flex items-center gap-3 font-bold">
                      <CheckCircle2 className="h-5 w-5" /> Attendance complete for today.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {missingAttendance.unmarkedClasses.map(c => (
                        <Button 
                          key={c} 
                          variant="outline"
                          className="bg-red-50 text-red-600 h-14 rounded-xl font-black text-xs uppercase tracking-widest border border-red-100 flex flex-col items-center justify-center gap-1 hover:bg-red-100 transition-colors"
                          onClick={() => setSelectedUnmarkedClass(c)}
                        >
                          <span>{c} Std.</span>
                          <span className="text-[8px] opacity-70">Mark Now</span>
                        </Button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-none shadow-sm rounded-3xl bg-white">
                <CardHeader className="p-8 pb-4">
                  <CardTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-2 text-orange-500">
                    <Clock className="h-5 w-5" /> Pending Faculty Logins
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 pt-0">
                  {missingAttendance.unmarkedTeachers.length === 0 ? (
                    <div className="bg-green-50 text-green-600 p-6 rounded-2xl flex items-center gap-3 font-bold">
                      <CheckCircle2 className="h-5 w-5" /> All faculty logged in today.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {missingAttendance.unmarkedTeachers.map(t => (
                        <div key={t.id} className="flex items-center justify-between bg-orange-50/50 p-4 rounded-xl border border-orange-100">
                          <div>
                            <p className="font-black text-gray-800 text-sm">{t.fullName}</p>
                            <p className="text-[10px] font-bold text-orange-600 uppercase">{t.subject}</p>
                          </div>
                          {isAdmin && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-8 rounded-lg font-bold border-orange-200 text-orange-600"
                              onClick={() => {
                                markStaffAttendance({
                                  id: Math.random().toString(36).substr(2, 9),
                                  teacherId: t.id,
                                  teacherName: t.fullName,
                                  date: today,
                                  time: new Date().toLocaleTimeString(),
                                  status: 'Present',
                                  approvalStatus: 'Approved'
                                });
                                toast({ title: "Override Logged", description: `Presence marked for ${t.fullName}` });
                              }}
                            >
                              Mark Presence
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="students" className="mt-6">
            <Card className="border-none shadow-sm rounded-3xl bg-white overflow-hidden">
              <CardContent className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/50">
                      <TableHead className="pl-8 py-5 text-[10px] font-black uppercase tracking-widest">Roll #</TableHead>
                      <TableHead className="py-5 text-[10px] font-black uppercase tracking-widest">Full Name</TableHead>
                      <TableHead className="py-5 text-[10px] font-black uppercase tracking-widest">Class / Div</TableHead>
                      <TableHead className="py-5 text-[10px] font-black uppercase tracking-widest text-center">Attendance %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map(s => {
                      const studentRecords = studentAttendance.filter(a => a.studentId === s.id);
                      const presentDays = studentRecords.filter(a => a.status === 'Present').length;
                      const absentDays = studentRecords.filter(a => a.status === 'Absent').length;
                      const totalDays = presentDays + absentDays;
                      const percentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;
                      return (
                        <TableRow key={s.id} className="hover:bg-gray-50 border-b last:border-0">
                          <TableCell className="pl-8 font-black text-gray-400">#{s.rollNumber}</TableCell>
                          <TableCell className="font-black text-gray-800">{s.fullName}</TableCell>
                          <TableCell className="font-bold text-primary">{s.class} - {s.division}</TableCell>
                          <TableCell className="text-center">
                            <Badge className={cn(
                              "font-black px-3 py-1",
                              percentage > 85 ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                            )}>
                              {percentage}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="teachers" className="mt-6">
            <Card className="border-none shadow-sm rounded-3xl bg-white overflow-hidden">
              <CardContent className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/50">
                      <TableHead className="pl-8 py-5 text-[10px] font-black uppercase tracking-widest">Faculty ID</TableHead>
                      <TableHead className="py-5 text-[10px] font-black uppercase tracking-widest">Name & Role</TableHead>
                      <TableHead className="py-5 text-[10px] font-black uppercase tracking-widest text-center">Present Days</TableHead>
                      <TableHead className="py-5 text-[10px] font-black uppercase tracking-widest text-center">Leaves/Absent</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teachers.map(t => {
                      const presentCount = staffAttendance.filter(a => a.teacherId === t.id && a.status === 'Present' && a.approvalStatus === 'Approved' && workingDays.includes(a.date)).length;
                      const absentCount = workingDays.length - presentCount;
                      return (
                        <TableRow key={t.id} className="hover:bg-gray-50 border-b last:border-0">
                          <TableCell className="pl-8 font-mono text-xs font-black text-primary">{t.id}</TableCell>
                          <TableCell>
                            <p className="font-black text-gray-800">{t.fullName}</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase">{t.academicRole}</p>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className="bg-green-50 text-green-600 font-black text-[10px] px-3 py-1">{presentCount} Days</Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className="bg-red-50 text-red-600 font-black text-[10px] px-3 py-1">{absentCount} Days</Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Override Attendance Dialog */}
      <Dialog open={!!selectedUnmarkedClass} onOpenChange={(val) => { if (!val) setSelectedUnmarkedClass(null); }}>
        <DialogContent className="max-w-2xl w-[95vw] md:w-full rounded-[2rem] p-0 overflow-hidden border-none shadow-2xl flex flex-col max-h-[90vh]">
          <DialogHeader className="bg-red-500 text-white p-6 md:p-8 shrink-0">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center">
                <UserCheck className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-black uppercase tracking-tight">Admin Override</DialogTitle>
                <DialogDescription className="text-white/80 font-bold">Marking attendance for {selectedUnmarkedClass} Std.</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto no-scrollbar">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/50">
                  <TableHead className="pl-8 py-4 text-[10px] font-black uppercase">Roll #</TableHead>
                  <TableHead className="py-4 text-[10px] font-black uppercase">Name</TableHead>
                  <TableHead className="text-center text-[10px] font-black uppercase">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.filter(s => s.class === selectedUnmarkedClass).map((s) => (
                  <TableRow key={s.id} className="hover:bg-gray-50 transition-colors border-b last:border-0">
                    <TableCell className="pl-8 font-black text-gray-400">#{s.rollNumber}</TableCell>
                    <TableCell className="font-bold text-gray-700">{s.fullName}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => setOverrideAttendance(prev => ({ ...prev, [s.id]: 'Present' }))}
                          className={cn(
                            "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                            overrideAttendance[s.id] === 'Present' || !overrideAttendance[s.id] ? "bg-green-500 text-white" : "bg-gray-100 text-gray-400"
                          )}
                        >Present</button>
                        <button
                          type="button"
                          onClick={() => setOverrideAttendance(prev => ({ ...prev, [s.id]: 'Absent' }))}
                          className={cn(
                            "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                            overrideAttendance[s.id] === 'Absent' ? "bg-red-500 text-white" : "bg-gray-100 text-gray-400"
                          )}
                        >Absent</button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="p-6 md:p-8 bg-gray-50/50 border-t shrink-0">
            <Button className="w-full bg-[#1F58B3] h-14 rounded-xl font-black uppercase tracking-widest shadow-xl shadow-blue-100" onClick={handleOverrideSubmit}>Commit Override Records</Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

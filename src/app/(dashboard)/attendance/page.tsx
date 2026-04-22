
"use client";

import { useState, useEffect } from 'react';
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { useSchoolStore } from "@/lib/store";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarIcon, XCircle, Check, ShieldAlert, History } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { cn, formatDate } from "@/lib/utils";

export default function AttendancePage() {
  const { students, staffAttendance, updateStaffAttendanceStatus, markStudentAttendance, currentUser } = useSchoolStore();
  const { toast } = useToast();
  const [selectedClass, setSelectedClass] = useState("1st");
  const [currentDate, setCurrentDate] = useState("");
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, 'Present' | 'Absent'>>({});

  useEffect(() => {
    setCurrentDate(new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }));
  }, []);

  const filteredStudents = students.filter(s => s.class === selectedClass);

  const handleSubmitAttendance = () => {
    const records = filteredStudents.map(s => ({
      id: Math.random().toString(36).substr(2, 9),
      studentId: s.id,
      date: formatDate(),
      status: attendanceRecords[s.id] || 'Present',
      class: selectedClass
    }));

    markStudentAttendance(records);
    toast({ title: "Attendance Submitted", description: `Attendance recorded for ${selectedClass}` });
  };

  const isPrivileged = currentUser?.role === 'FOUNDER' || currentUser?.role === 'ADMIN';
  
  // Sort staff attendance: Pending first, then by date
  const sortedStaffAttendance = [...staffAttendance].sort((a, b) => {
    if (a.approvalStatus === 'Pending' && b.approvalStatus !== 'Pending') return -1;
    if (a.approvalStatus !== 'Pending' && b.approvalStatus === 'Pending') return 1;
    return 0;
  });

  const classOptions = ["Nursery", "LKG", "UKG", "1st", "2nd", "3rd", "4th", "5th"];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl md:text-[32px] font-black tracking-tight text-[#1F58B3] uppercase">School Attendance</h2>
            <p className="text-muted-foreground font-medium text-sm md:text-[16px]">
              Daily presence monitoring & staff verification.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 font-bold text-[#1F58B3] text-xs md:text-sm self-end">
            <CalendarIcon className="h-4 w-4" />
            <span>{currentDate}</span>
          </div>
        </div>

        <Tabs defaultValue="student" className="w-full">
          <TabsList className="bg-[#EEF3F5] p-1 rounded-xl w-full md:w-auto mb-6">
            <TabsTrigger value="student" className="flex-1 md:flex-none rounded-lg px-8 font-black uppercase text-xs tracking-widest data-[state=active]:bg-white data-[state=active]:text-[#1F58B3] data-[state=active]:shadow-sm">Students</TabsTrigger>
            {isPrivileged && (
              <TabsTrigger value="staff" className="flex-1 md:flex-none rounded-lg px-8 font-black uppercase text-xs tracking-widest data-[state=active]:bg-white data-[state=active]:text-[#1F58B3] data-[state=active]:shadow-sm">Staff Approval</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="student" className="m-0">
            <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
              <CardHeader className="p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-4 border-b border-gray-50">
                <CardTitle className="text-lg md:text-[20px] font-black text-[#1F2937] uppercase tracking-tight">Student Register</CardTitle>
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                  <Select value={selectedClass} onValueChange={setSelectedClass}>
                    <SelectTrigger className="w-full sm:w-[160px] bg-muted/30 border-none h-12 rounded-xl font-bold">
                      <SelectValue placeholder="Class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classOptions.map(c => (
                        <SelectItem key={c} value={c}>
                          {["Nursery", "LKG", "UKG"].includes(c) ? c : `${c} Std.`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button 
                    className="w-full sm:w-auto bg-[#1F58B3] hover:bg-[#1F58B3]/90 text-white px-8 h-12 rounded-xl font-black uppercase tracking-widest shadow-lg shadow-blue-50"
                    onClick={handleSubmitAttendance}
                  >
                    Submit Ledger
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto scroll-touch">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[#F9FAFB] border-none">
                      <TableHead className="pl-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Roll #</TableHead>
                      <TableHead className="py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Student Name</TableHead>
                      <TableHead className="text-center py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Present</TableHead>
                      <TableHead className="text-center py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Absent</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-20 text-gray-300 font-black uppercase italic tracking-widest">
                          No students in {selectedClass}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredStudents.map((student, idx) => {
                        const status = attendanceRecords[student.id] || 'Present';
                        return (
                          <TableRow key={student.id} className="hover:bg-gray-50/50 transition-colors border-b border-gray-50 last:border-0">
                            <TableCell className="pl-8 font-black text-gray-400">#{student.rollNumber || idx + 1}</TableCell>
                            <TableCell className="font-bold text-gray-700">{student.fullName}</TableCell>
                            <TableCell className="text-center">
                              <div className="flex justify-center">
                                <button
                                  type="button"
                                  onClick={() => setAttendanceRecords(prev => ({ ...prev, [student.id]: 'Present' }))}
                                  className={cn(
                                    "h-8 w-8 rounded-full border-2 flex items-center justify-center transition-all",
                                    status === 'Present' ? "border-[#22C55E] bg-green-50 shadow-sm" : "border-gray-200"
                                  )}
                                >
                                  {status === 'Present' && <div className="h-3.5 w-3.5 rounded-full bg-[#22C55E]" />}
                                </button>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex justify-center">
                                <button
                                  type="button"
                                  onClick={() => setAttendanceRecords(prev => ({ ...prev, [student.id]: 'Absent' }))}
                                  className={cn(
                                    "h-8 w-8 rounded-full border-2 flex items-center justify-center transition-all",
                                    status === 'Absent' ? "border-[#EF4444] bg-red-50 shadow-sm" : "border-gray-200"
                                  )}
                                >
                                  {status === 'Absent' && <div className="h-3.5 w-3.5 rounded-full bg-[#EF4444]" />}
                                </button>
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
          </TabsContent>

          {isPrivileged && (
            <TabsContent value="staff" className="m-0">
              <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
                <CardHeader className="p-6 md:p-8 border-b border-gray-50">
                  <CardTitle className="text-lg md:text-[20px] font-black text-[#1F2937] uppercase tracking-tight">Staff Attendance Approval</CardTitle>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto scroll-touch">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-[#F9FAFB] border-none">
                        <TableHead className="pl-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Faculty Member</TableHead>
                        <TableHead className="py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Date</TableHead>
                        <TableHead className="py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Status</TableHead>
                        <TableHead className="text-right pr-8 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedStaffAttendance.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-20 text-gray-300 font-black uppercase italic tracking-widest">
                            No attendance records found
                          </TableCell>
                        </TableRow>
                      ) : (
                        sortedStaffAttendance.map((att) => (
                          <TableRow key={att.id} className="hover:bg-gray-50/50 transition-colors border-b border-gray-50 last:border-0">
                            <TableCell className="pl-8 py-4">
                              <span className="font-bold text-gray-700">{att.teacherName}</span>
                            </TableCell>
                            <TableCell className="text-gray-500 font-medium text-xs">{att.date}</TableCell>
                            <TableCell>
                              <Badge className={cn(
                                "font-black text-[10px] uppercase tracking-tighter px-2 h-6 border-none",
                                att.approvalStatus === 'Approved' ? 'bg-green-50 text-green-600' : 
                                att.approvalStatus === 'Rejected' ? 'bg-red-50 text-red-600' : 
                                'bg-orange-50 text-orange-600'
                              )}>
                                {att.approvalStatus}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right pr-8 space-x-2">
                              {att.approvalStatus === 'Pending' ? (
                                <>
                                  <Button 
                                    size="sm" 
                                    className="bg-green-600 hover:bg-green-700 h-9 px-4 rounded-xl font-bold"
                                    onClick={() => {
                                      updateStaffAttendanceStatus(att.id, 'Approved');
                                      toast({ title: "Approved", description: `${att.teacherName}'s presence verified.` });
                                    }}
                                  >
                                    <Check className="h-4 w-4 mr-1" /> Approve
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="destructive"
                                    className="h-9 px-4 rounded-xl font-bold"
                                    onClick={() => {
                                      updateStaffAttendanceStatus(att.id, 'Rejected');
                                      toast({ title: "Rejected", variant: "destructive" });
                                    }}
                                  >
                                    <XCircle className="h-4 w-4 mr-1" /> Reject
                                  </Button>
                                </>
                              ) : (
                                <Badge variant="outline" className="h-9 px-4 rounded-xl font-bold border-gray-100 text-gray-400 bg-gray-50/50">
                                  Actioned
                                </Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {!isPrivileged && (
            <TabsContent value="staff" className="m-0">
              <Card className="border-none shadow-sm rounded-[2rem] bg-white p-16 flex flex-col items-center justify-center text-center space-y-4">
                <div className="h-16 w-16 rounded-full bg-red-50 flex items-center justify-center text-red-500">
                  <ShieldAlert className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight">Access Restricted</h3>
                  <p className="text-muted-foreground font-medium text-sm">Staff verification is limited to administrative roles.</p>
                </div>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

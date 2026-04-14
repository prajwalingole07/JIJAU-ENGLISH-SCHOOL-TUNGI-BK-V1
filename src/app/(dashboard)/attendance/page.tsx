"use client";

import { useState, useEffect } from 'react';
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { useSchoolStore } from "@/lib/store";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar as CalendarIcon, XCircle, Check, ShieldAlert } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

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
      date: new Date().toLocaleDateString(),
      status: attendanceRecords[s.id] || 'Present',
      class: selectedClass
    }));

    markStudentAttendance(records);
    toast({ title: "Attendance Submitted", description: `Attendance recorded for ${selectedClass}` });
  };

  const isFounder = currentUser?.role === 'FOUNDER';
  const pendingStaff = staffAttendance.filter(a => a.approvalStatus === 'Pending');
  const classOptions = ["Nursery", "LKG", "UKG", "1st", "2nd", "3rd", "4th", "5th"];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-[#1F58B3]">School Attendance</h2>
            <p className="text-muted-foreground font-medium text-sm md:text-[16px]">
              Monitor and manage daily presence records.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100 font-semibold text-gray-500 text-xs md:text-sm self-end">
            <CalendarIcon className="h-4 w-4" />
            <span>{currentDate}</span>
          </div>
        </div>

        <Tabs defaultValue="student">
          <TabsList className="bg-[#EEF3F5] p-1 rounded-xl w-full md:w-auto">
            <TabsTrigger value="student" className="flex-1 md:flex-none rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Students</TabsTrigger>
            {isFounder && (
              <TabsTrigger value="staff" className="flex-1 md:flex-none rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Staff Approval</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="student" className="mt-6">
            <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden">
              <CardHeader className="p-4 md:p-8 flex flex-col md:flex-row items-center justify-between gap-4">
                <CardTitle className="text-lg md:text-[20px] font-bold text-[#1F2937]">Daily Attendance</CardTitle>
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                  <Select value={selectedClass} onValueChange={setSelectedClass}>
                    <SelectTrigger className="w-full sm:w-[160px] bg-muted/30 border-none h-11">
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
                    className="w-full sm:w-auto bg-[#1F58B3] hover:bg-[#1F58B3]/90 text-white px-8 h-11 font-bold"
                    onClick={handleSubmitAttendance}
                  >
                    Submit
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[#F9FAFB] border-y border-gray-100">
                      <TableHead className="pl-6 md:pl-8 text-[10px] font-black uppercase tracking-wider text-gray-400">Roll #</TableHead>
                      <TableHead className="text-[10px] font-black uppercase tracking-wider text-gray-400">Name</TableHead>
                      <TableHead className="text-center text-[10px] font-black uppercase tracking-wider text-gray-400">Present</TableHead>
                      <TableHead className="text-center text-[10px] font-black uppercase tracking-wider text-gray-400">Absent</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-16 text-gray-400 font-medium italic">
                          No students in {selectedClass}.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredStudents.map((student, idx) => (
                        <TableRow key={student.id} className="hover:bg-gray-50 transition-colors">
                          <TableCell className="pl-6 md:pl-8 font-bold text-gray-400">#{student.rollNumber || idx + 1}</TableCell>
                          <TableCell className="font-bold text-gray-700">{student.fullName}</TableCell>
                          <TableCell className="text-center">
                            <RadioGroup 
                              defaultValue="Present"
                              onValueChange={(val: any) => setAttendanceRecords(prev => ({...prev, [student.id]: val}))}
                              className="flex justify-center"
                            >
                              <RadioGroupItem value="Present" id={`p-${student.id}`} className="h-6 w-6 text-[#22C55E] border-[#22C55E]" />
                            </RadioGroup>
                          </TableCell>
                          <TableCell className="text-center">
                            <RadioGroup 
                              onValueChange={(val: any) => setAttendanceRecords(prev => ({...prev, [student.id]: val}))}
                              className="flex justify-center"
                            >
                              <RadioGroupItem value="Absent" id={`a-${student.id}`} className="h-6 w-6 text-[#EF4444] border-[#EF4444]" />
                            </RadioGroup>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {isFounder && (
            <TabsContent value="staff" className="mt-6">
              <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden">
                <CardHeader className="p-4 md:p-8">
                  <CardTitle className="text-lg md:text-[20px] font-bold text-[#1F2937]">Staff Approval</CardTitle>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-[#F9FAFB] border-y border-gray-100">
                        <TableHead className="pl-6 md:pl-8 text-[10px] font-black uppercase tracking-wider text-gray-400">Faculty</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-wider text-gray-400">Date</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-wider text-gray-400">Status</TableHead>
                        <TableHead className="text-right pr-6 md:pr-8 text-[10px] font-black uppercase tracking-wider text-gray-400">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingStaff.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-16 text-gray-400 font-medium italic">
                            No pending staff records.
                          </TableCell>
                        </TableRow>
                      ) : (
                        pendingStaff.map((att) => (
                          <TableRow key={att.id}>
                            <TableCell className="pl-6 md:pl-8 font-bold text-gray-700">{att.teacherName}</TableCell>
                            <TableCell className="text-gray-500 text-xs">{att.date}</TableCell>
                            <TableCell>
                              <Badge className={att.status === 'Present' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}>
                                {att.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right pr-6 md:pr-8 space-x-1 md:space-x-2">
                              <Button 
                                size="sm" 
                                className="bg-green-600 hover:bg-green-700 h-8 px-2"
                                onClick={() => {
                                  updateStaffAttendanceStatus(att.id, 'Approved');
                                  toast({ title: "Approved", description: `${att.teacherName}'s attendance approved.` });
                                }}
                              >
                                <Check className="h-4 w-4 md:mr-1" /> <span className="hidden md:inline">Approve</span>
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                className="h-8 px-2"
                                onClick={() => {
                                  updateStaffAttendanceStatus(att.id, 'Rejected');
                                  toast({ title: "Rejected", variant: "destructive" });
                                }}
                              >
                                <XCircle className="h-4 w-4 md:mr-1" /> <span className="hidden md:inline">Reject</span>
                              </Button>
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

          {!isFounder && (
            <TabsContent value="staff" className="mt-6">
              <Card className="border-none shadow-sm rounded-2xl bg-white p-12 md:p-20 flex flex-col items-center justify-center text-center space-y-4">
                <div className="h-14 w-14 rounded-full bg-red-50 flex items-center justify-center text-red-500">
                  <ShieldAlert className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Authorization Required</h3>
                  <p className="text-muted-foreground text-sm">Staff attendance is restricted to the Founder Chairman.</p>
                </div>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

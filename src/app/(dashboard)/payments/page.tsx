"use client";

import { useState, useRef, useMemo } from 'react';
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { useSchoolStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  IndianRupee, 
  Receipt, 
  History, 
  Wallet, 
  TrendingUp, 
  AlertCircle,
  Eye,
  Camera,
  GraduationCap,
  Users,
  HardHat,
  PlusCircle,
  X,
  Search
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Teacher, Payment, Student, FeePayment } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn, formatDate } from '@/lib/utils';

export default function FeesAndSalaryPage() {
  const { teachers, students, payments, feePayments, addPayment, addFeePayment, staffAttendance } = useSchoolStore();
  const { toast } = useToast();
  
  const [staffHistoryOpen, setStaffHistoryOpen] = useState(false);
  const [studentHistoryOpen, setStudentHistoryOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Teacher | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    amount: "",
    mode: "Cash" as "Cash" | "Online",
    screenshot: "",
    remarks: "",
    date: new Date().toISOString().split('T')[0]
  });

  const totalExpectedFees = students.reduce((sum, s) => sum + (s.totalFees || 0), 0);
  const totalCollectedFees = students.reduce((sum, s) => sum + (s.feesPaid || 0), 0);
  const outstandingDues = totalExpectedFees - totalCollectedFees;

  // Calculate working days to derive true absences/leaves
  const workingDays = useMemo(() => {
    const academicTeachers = teachers.filter(t => t.category === 'Academic');
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
  }, [staffAttendance, teachers]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, screenshot: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStaffPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff) return;

    const newPayment: Payment = {
      id: Math.random().toString(36).substr(2, 9),
      teacherId: selectedStaff.id,
      teacherName: selectedStaff.fullName,
      amount: parseFloat(formData.amount),
      status: 'Paid',
      mode: formData.mode,
      date: formatDate(new Date(formData.date)),
      screenshot: formData.screenshot,
      remarks: formData.remarks
    };

    addPayment(newPayment);
    toast({ title: "Disbursement Committed", description: `Transaction recorded for ${selectedStaff.fullName}` });
    resetForm();
  };

  const handleStudentFeePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    const newFeePayment: FeePayment = {
      id: Math.random().toString(36).substr(2, 9),
      studentId: selectedStudent.id,
      studentName: selectedStudent.fullName,
      amount: parseFloat(formData.amount),
      mode: formData.mode,
      date: formatDate(new Date(formData.date)),
      screenshot: formData.screenshot,
      remarks: formData.remarks
    };

    addFeePayment(newFeePayment);
    toast({ title: "Fee Collected", description: `Recorded payment of ₹${parseFloat(formData.amount).toLocaleString()} for ${selectedStudent.fullName}` });
    resetForm();
  };

  const resetForm = () => {
    setFormData({ amount: "", mode: "Cash", screenshot: "", remarks: "", date: new Date().toISOString().split('T')[0] });
  };

  const filteredStudents = useMemo(() => {
    return students.filter(s => 
      s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.class.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [students, searchQuery]);

  return (
    <DashboardLayout>
      <div className="space-y-6 md:space-y-8">
        <div className="flex flex-col gap-1">
          <h2 className="text-[24px] md:text-[28px] font-bold tracking-tight text-[#1F58B3] uppercase">Fees & Salary</h2>
          <p className="text-muted-foreground font-medium text-sm md:text-[15px]">
            School revenues & faculty payroll.
          </p>
        </div>

        <Tabs defaultValue="fees">
          <div className="bg-white rounded-xl p-1 md:p-2 shadow-sm border border-gray-100 mb-6 md:mb-8 flex overflow-x-auto no-scrollbar">
            <TabsList className="bg-transparent gap-1 md:gap-2 h-auto p-0 min-w-max">
              <TabsTrigger 
                value="fees" 
                className="rounded-lg px-4 md:px-6 py-2 md:py-2.5 data-[state=active]:bg-[#1F58B3] data-[state=active]:text-white transition-all gap-2 text-xs md:text-sm font-bold"
              >
                <GraduationCap className="h-3.5 w-3.5" /> Fees
              </TabsTrigger>
              <TabsTrigger 
                value="teachers" 
                className="rounded-lg px-4 md:px-6 py-2 md:py-2.5 data-[state=active]:bg-[#1F58B3] data-[state=active]:text-white transition-all gap-2 text-xs md:text-sm font-bold"
              >
                <Users className="h-3.5 w-3.5" /> Academic
              </TabsTrigger>
              <TabsTrigger 
                value="staff" 
                className="rounded-lg px-4 md:px-6 py-2 md:py-2.5 data-[state=active]:bg-[#1F58B3] data-[state=active]:text-white transition-all gap-2 text-xs md:text-sm font-bold"
              >
                <HardHat className="h-3.5 w-3.5" /> Staff
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="fees" className="space-y-6">
            <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-3">
              <Card className="border-none shadow-md rounded-2xl bg-white">
                <CardContent className="p-6 md:p-8 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Expected</p>
                    <p className="text-xl md:text-3xl font-black text-[#1F2937]">₹{totalExpectedFees.toLocaleString()}</p>
                  </div>
                  <div className="p-3 md:p-4 rounded-full bg-blue-50">
                    <TrendingUp className="h-6 w-6 md:h-8 md:w-8 text-[#1F58B3]" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-none shadow-md rounded-2xl bg-white">
                <CardContent className="p-6 md:p-8 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Collected</p>
                    <p className="text-xl md:text-3xl font-black text-[#22C55E]">₹{totalCollectedFees.toLocaleString()}</p>
                  </div>
                  <div className="p-3 md:p-4 rounded-full bg-green-50">
                    <Wallet className="h-6 w-6 md:h-8 md:w-8 text-[#22C55E]" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-none shadow-md rounded-2xl bg-white">
                <CardContent className="p-6 md:p-8 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Outstanding</p>
                    <p className="text-xl md:text-3xl font-black text-[#EF4444]">₹{outstandingDues.toLocaleString()}</p>
                  </div>
                  <div className="p-3 md:p-4 rounded-full bg-red-50">
                    <AlertCircle className="h-6 w-6 md:h-8 md:w-8 text-[#EF4444]" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-none shadow-xl rounded-[24px] overflow-hidden bg-white">
              <div className="bg-[#1F58B3] px-6 md:px-8 py-4 md:py-6 flex flex-col md:flex-row justify-between items-center gap-4">
                <h3 className="text-base md:text-xl font-black text-white tracking-wide uppercase">Student Fee Directory</h3>
                <div className="relative w-full max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
                  <Input 
                    placeholder="Search student..." 
                    className="pl-10 h-10 bg-white/10 border-none text-white placeholder:text-white/50 rounded-xl font-bold"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <CardContent className="p-0 overflow-x-auto scroll-touch">
                <Table className="min-w-[800px] md:min-w-full">
                  <TableHeader>
                    <TableRow className="bg-gray-50/80 border-none">
                      <TableHead className="pl-6 md:pl-8 py-4 md:py-6 text-[10px] md:text-[11px] font-black text-gray-400 uppercase tracking-widest">Student</TableHead>
                      <TableHead className="text-[10px] md:text-[11px] font-black text-gray-400 uppercase tracking-widest">Class</TableHead>
                      <TableHead className="text-[10px] md:text-[11px] font-black text-gray-400 uppercase tracking-widest">Expected</TableHead>
                      <TableHead className="text-[10px] md:text-[11px] font-black text-gray-400 uppercase tracking-widest">Paid</TableHead>
                      <TableHead className="text-[10px] md:text-[11px] font-black text-gray-400 uppercase tracking-widest">Balance</TableHead>
                      <TableHead className="text-right pr-6 md:pr-8 text-[10px] md:text-[11px] font-black text-gray-400 uppercase tracking-widest">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-16 text-gray-300 font-bold uppercase tracking-widest">
                          No records
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredStudents.map((student) => (
                        <TableRow key={student.id} className="hover:bg-gray-50/50 transition-colors border-b border-gray-100 last:border-0 group">
                          <TableCell className="pl-6 md:pl-8 py-4 md:py-6">
                            <span className="text-sm md:text-lg font-black text-[#1F58B3] tracking-tight">{student.fullName}</span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-bold border-gray-200 text-[10px] md:text-xs">Class {student.class}</Badge>
                          </TableCell>
                          <TableCell className="text-sm md:text-lg font-black text-[#1F2937]">₹{student.totalFees.toLocaleString()}</TableCell>
                          <TableCell className="text-sm md:text-lg font-black text-[#22C55E]">₹{student.feesPaid.toLocaleString()}</TableCell>
                          <TableCell className="text-sm md:text-lg font-black text-[#EF4444]">₹{(student.totalFees - student.feesPaid).toLocaleString()}</TableCell>
                          <TableCell className="text-right pr-6 md:pr-8">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="bg-white border-gray-200 text-gray-600 rounded-xl px-3 md:px-5 h-9 md:h-10 hover:bg-[#1F58B3] hover:text-white transition-all font-bold shadow-sm text-xs"
                              onClick={() => { setSelectedStudent(student); setStudentHistoryOpen(true); }}
                            >
                              <History className="h-3.5 w-3.5 md:mr-2" /> <span className="hidden md:inline">Ledger</span>
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

          <TabsContent value="teachers">
            <PayrollAuditCard 
              title="FACULTY PAYROLL" 
              staffType="Academic" 
              teachers={teachers} 
              payments={payments} 
              attendance={staffAttendance}
              workingDays={workingDays}
              onViewHistory={(s: Teacher) => { setSelectedStaff(s); setStaffHistoryOpen(true); }}
            />
          </TabsContent>

          <TabsContent value="staff">
            <PayrollAuditCard 
              title="STAFF PAYROLL" 
              staffType="Support" 
              teachers={teachers} 
              payments={payments} 
              attendance={staffAttendance}
              workingDays={workingDays}
              onViewHistory={(s: Teacher) => { setSelectedStaff(s); setStaffHistoryOpen(true); }}
            />
          </TabsContent>
        </Tabs>

        {/* Staff Ledger Dialog */}
        <Dialog open={staffHistoryOpen} onOpenChange={setStaffHistoryOpen}>
          <DialogContent className="max-w-[1000px] w-[95vw] md:w-full h-[90vh] flex flex-col p-0 overflow-hidden border-none rounded-[2rem] shadow-2xl z-[150]">
            <div className="bg-[#1F58B3] text-white px-6 md:px-8 py-4 md:py-6 flex items-center justify-between shrink-0 relative z-10">
              <div className="space-y-0.5">
                <h2 className="text-lg md:text-2xl font-black tracking-tight uppercase">Salary Profile</h2>
                <p className="text-[10px] md:text-[13px] font-medium opacity-80">{selectedStaff?.fullName}</p>
              </div>
            </div>

            <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-white text-gray-800">
              {/* History Column */}
              <div className="flex-1 md:w-[45%] border-b md:border-b-0 md:border-r border-gray-100 flex flex-col overflow-hidden">
                <div className="p-4 md:p-6 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2 text-[#1F58B3]">
                  <History className="h-4 w-4" />
                  <span className="text-[10px] md:text-[11px] font-black uppercase tracking-widest">Transaction Trail</span>
                </div>
                <div className="flex-1 overflow-y-auto scroll-touch p-4 md:p-6 no-scrollbar">
                  <div className="space-y-3 md:space-y-4 pb-12">
                    {payments.filter(p => p.teacherId === selectedStaff?.id).length === 0 ? (
                      <div className="py-12 md:py-20 text-center flex flex-col items-center gap-3 text-gray-300">
                        <History className="h-8 w-8 md:h-10 md:w-10 opacity-20" />
                        <p className="text-[10px] font-black uppercase tracking-widest">No entries</p>
                      </div>
                    ) : (
                      payments
                        .filter(p => p.teacherId === selectedStaff?.id)
                        .sort((a, b) => new Date(b.date.split('/').reverse().join('-')).getTime() - new Date(a.date.split('/').reverse().join('-')).getTime())
                        .map((p) => (
                          <div key={p.id} className="bg-white border border-gray-100 rounded-xl p-4 md:p-5 shadow-sm">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <p className="text-base md:text-xl font-black text-[#1F2937]">₹{p.amount.toLocaleString()}</p>
                                <p className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest">{p.mode}</p>
                              </div>
                              <Badge className={cn("text-[10px] h-5", p.mode === 'Online' ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-600')}>{p.mode}</Badge>
                            </div>
                            <div className="flex items-center justify-between mt-3 md:mt-4 pt-3 md:pt-4 border-t border-gray-50">
                              <span className="text-[10px] md:text-xs font-bold text-gray-400">{p.date}</span>
                              {p.screenshot && (
                                <Button variant="ghost" size="sm" className="h-7 md:h-8 text-[#1F58B3] font-bold text-[10px]" onClick={() => setSelectedScreenshot(p.screenshot || null)}>
                                  <Eye className="h-3 w-3 mr-1" /> View Proof
                                </Button>
                              )}
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              </div>

              {/* Form Column */}
              <div className="flex-1 flex flex-col bg-white overflow-hidden">
                <div className="flex-1 overflow-y-auto scroll-touch p-6 md:p-8 no-scrollbar">
                  <div className="grid grid-cols-2 gap-3 md:gap-4 mb-8">
                    <div className="bg-[#EFF6FF] p-4 md:p-6 rounded-2xl border border-blue-50">
                      <p className="text-[9px] md:text-[10px] font-black text-[#3B82F6] uppercase tracking-widest">Salary</p>
                      <p className="text-lg md:text-2xl font-black text-[#1F2937]">₹{selectedStaff?.baseSalary.toLocaleString()}</p>
                    </div>
                    <div className="bg-[#F0FDF4] p-4 md:p-6 rounded-2xl border border-green-50">
                      <p className="text-[9px] md:text-[10px] font-black text-[#22C55E] uppercase tracking-widest">Paid</p>
                      <p className="text-lg md:text-2xl font-black text-[#1F2937]">₹{payments.filter(p => p.teacherId === selectedStaff?.id).reduce((sum, p) => sum + p.amount, 0).toLocaleString()}</p>
                    </div>
                  </div>
                  <form onSubmit={handleStaffPayment} className="space-y-4 md:space-y-5 pb-12">
                    <div className="flex items-center gap-2 text-[#1F58B3] border-b border-gray-100 pb-3 md:pb-4 mb-2">
                      <PlusCircle className="h-4 w-4" />
                      <span className="text-[10px] md:text-[11px] font-black uppercase tracking-widest">Record Payment</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest">Amount (₹)</Label>
                        <Input type="number" className="bg-gray-50 border-none h-11 md:h-12 rounded-xl font-bold" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} required />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</Label>
                        <Input type="date" className="bg-gray-50 border-none h-11 md:h-12 rounded-xl" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest">Mode</Label>
                      <Select value={formData.mode} onValueChange={(val: any) => setFormData({...formData, mode: val})}>
                        <SelectTrigger className="bg-gray-50 border-none h-11 md:h-12 rounded-xl font-bold"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="Cash">Cash</SelectItem><SelectItem value="Online">Online</SelectItem></SelectContent>
                      </Select>
                    </div>
                    {formData.mode === 'Online' && (
                      <div 
                        className="h-20 border-2 border-dashed border-gray-100 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        {formData.screenshot ? <p className="text-[10px] font-bold text-green-600">Proof Attached</p> : <p className="text-[10px] font-bold text-gray-400">Upload Proof</p>}
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                      </div>
                    )}
                    <Button type="submit" className="w-full bg-[#1F58B3] h-12 md:h-14 font-black rounded-xl shadow-lg mt-4 text-white">Commit Transaction</Button>
                  </form>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Student Fee Ledger Dialog */}
        <Dialog open={studentHistoryOpen} onOpenChange={setStudentHistoryOpen}>
          <DialogContent className="max-w-[1000px] w-[95vw] md:w-full h-[90vh] flex flex-col p-0 overflow-hidden border-none rounded-[2rem] shadow-2xl z-[150]">
            <div className="bg-[#22C55E] text-white px-6 md:px-8 py-4 md:py-6 flex items-center justify-between shrink-0 relative z-10">
              <div className="space-y-0.5">
                <h2 className="text-lg md:text-2xl font-black tracking-tight uppercase">Fee Profile</h2>
                <p className="text-[10px] md:text-[13px] font-medium opacity-80">{selectedStudent?.fullName}</p>
              </div>
            </div>

            <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-white text-gray-800">
              <div className="flex-1 md:w-[45%] border-b md:border-b-0 md:border-r border-gray-100 flex flex-col overflow-hidden">
                <div className="p-4 md:p-6 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2 text-[#22C55E]">
                  <Receipt className="h-4 w-4" />
                  <span className="text-[10px] md:text-[11px] font-black uppercase tracking-widest">Fee Ledger</span>
                </div>
                <div className="flex-1 overflow-y-auto scroll-touch p-4 md:p-6 no-scrollbar">
                  <div className="space-y-3 md:space-y-4 pb-12">
                    {feePayments.filter(p => p.studentId === selectedStudent?.id).length === 0 ? (
                      <div className="py-12 md:py-20 text-center flex flex-col items-center gap-3 text-gray-300">
                        <Receipt className="h-8 w-8 md:h-10 md:w-10 opacity-20" />
                        <p className="text-[10px] font-black uppercase tracking-widest">No entries</p>
                      </div>
                    ) : (
                      feePayments
                        .filter(p => p.studentId === selectedStudent?.id)
                        .sort((a, b) => new Date(b.date.split('/').reverse().join('-')).getTime() - new Date(a.date.split('/').reverse().join('-')).getTime())
                        .map((p) => (
                          <div key={p.id} className="bg-white border border-gray-100 rounded-xl p-4 md:p-5 shadow-sm">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <p className="text-base md:text-xl font-black text-[#1F2937]">₹{p.amount.toLocaleString()}</p>
                                <p className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest">{p.mode}</p>
                              </div>
                              <Badge className="text-[10px] h-5 bg-green-50 text-green-700">{p.mode}</Badge>
                            </div>
                            <div className="flex items-center justify-between mt-3 md:mt-4 pt-3 md:pt-4 border-t border-gray-50">
                              <span className="text-[10px] md:text-xs font-bold text-gray-400">{p.date}</span>
                              {p.screenshot && (
                                <Button variant="ghost" size="sm" className="h-7 md:h-8 text-[#22C55E] font-bold text-[10px]" onClick={() => setSelectedScreenshot(p.screenshot || null)}>
                                  <Eye className="h-3 w-3 mr-1" /> Receipt
                                </Button>
                              )}
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              </div>

              <div className="flex-1 flex flex-col bg-white overflow-hidden">
                <div className="flex-1 overflow-y-auto scroll-touch p-6 md:p-8 no-scrollbar">
                  <div className="grid grid-cols-2 gap-3 md:gap-4 mb-8">
                    <div className="bg-[#EFF6FF] p-4 md:p-6 rounded-2xl border border-blue-50">
                      <p className="text-[9px] md:text-[10px] font-black text-[#3B82F6] uppercase tracking-widest">Total Fee</p>
                      <p className="text-lg md:text-2xl font-black text-[#1F2937]">₹{selectedStudent?.totalFees.toLocaleString()}</p>
                    </div>
                    <div className="bg-[#FEF2F2] p-4 md:p-6 rounded-2xl border border-red-50">
                      <p className="text-[9px] md:text-[10px] font-black text-[#EF4444] uppercase tracking-widest">Balance</p>
                      <p className="text-lg md:text-2xl font-black text-[#EF4444]">₹{(selectedStudent ? selectedStudent.totalFees - selectedStudent.feesPaid : 0).toLocaleString()}</p>
                    </div>
                  </div>
                  <form onSubmit={handleStudentFeePayment} className="space-y-4 md:space-y-5 pb-12">
                    <div className="flex items-center gap-2 text-[#22C55E] border-b border-gray-100 pb-3 md:pb-4 mb-2">
                      <PlusCircle className="h-4 w-4" />
                      <span className="text-[10px] md:text-[11px] font-black uppercase tracking-widest">Record Collection</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest">Collected (₹)</Label>
                        <Input type="number" className="bg-gray-50 border-none h-11 md:h-12 rounded-xl font-bold" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} required />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</Label>
                        <Input type="date" className="bg-gray-50 border-none h-11 md:h-12 rounded-xl" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} required />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest">Mode</Label>
                      <Select value={formData.mode} onValueChange={(val: any) => setFormData({...formData, mode: val})}>
                        <SelectTrigger className="bg-gray-50 border-none h-11 md:h-12 rounded-xl font-bold"><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="Cash">Cash</SelectItem><SelectItem value="Online">Online</SelectItem></SelectContent>
                      </Select>
                    </div>
                    {formData.mode === 'Online' && (
                      <div 
                        className="h-20 border-2 border-dashed border-gray-100 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        {formData.screenshot ? <p className="text-[10px] font-bold text-green-600">Receipt Ready</p> : <p className="text-[10px] font-bold text-gray-400">Upload Receipt</p>}
                        <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                      </div>
                    )}
                    <Button type="submit" className="w-full bg-[#22C55E] hover:bg-[#22C55E]/90 h-12 md:h-14 font-black rounded-xl shadow-lg mt-4 text-white">Save Entry</Button>
                  </form>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Screenshot Preview Dialog */}
        <Dialog open={!!selectedScreenshot} onOpenChange={(val) => !val && setSelectedScreenshot(null)}>
          <DialogContent className="max-w-2xl w-[95vw] p-0 overflow-hidden bg-black border-none rounded-2xl z-[150]">
            <div className="absolute top-4 right-4 z-[210]">
              <Button variant="ghost" size="icon" onClick={() => setSelectedScreenshot(null)} className="text-white hover:bg-white/20">
                <X className="h-6 w-6" />
              </Button>
            </div>
            <div className="h-full w-full flex items-center justify-center p-4">
               {selectedScreenshot && <img src={selectedScreenshot} className="max-w-full max-h-[80vh] object-contain" alt="Proof" />}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

function PayrollAuditCard({ title, staffType, teachers, payments, attendance, workingDays, onViewHistory }: any) {
  const filtered = teachers.filter((t: Teacher) => t.category === staffType);

  return (
    <Card className="border-none shadow-xl rounded-[24px] overflow-hidden bg-white">
      <div className="bg-[#1F58B3] px-6 md:px-8 py-4 md:py-6">
        <h3 className="text-base md:text-xl font-black text-white tracking-wide uppercase">{title}</h3>
      </div>
      <CardContent className="p-0 overflow-x-auto scroll-touch">
        <Table className="min-w-[900px] md:min-w-full">
          <TableHeader>
            <TableRow className="bg-gray-50/80 border-none">
              <TableHead className="pl-6 md:pl-8 py-4 md:py-6 text-[10px] md:text-[11px] font-black text-gray-400 uppercase tracking-widest">Employee</TableHead>
              <TableHead className="text-[10px] md:text-[11px] font-black text-gray-400 uppercase tracking-widest text-center">Absences</TableHead>
              <TableHead className="text-[10px] md:text-[11px] font-black text-gray-400 uppercase tracking-widest">Salary</TableHead>
              <TableHead className="text-[10px] md:text-[11px] font-black text-gray-400 uppercase tracking-widest">Cleared</TableHead>
              <TableHead className="text-[10px] md:text-[11px] font-black text-gray-400 uppercase tracking-widest">Balance</TableHead>
              <TableHead className="text-right pr-6 md:pr-8 text-[10px] md:text-[11px] font-black text-gray-400 uppercase tracking-widest">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-16 text-gray-300 font-bold uppercase tracking-widest">No records</TableCell>
              </TableRow>
            ) : (
              filtered.map((staff: Teacher) => {
                const totalPaid = payments
                  .filter((p: Payment) => p.teacherId === staff.id)
                  .reduce((sum: number, p: Payment) => sum + p.amount, 0);
                
                // Smart Absence Calculation
                const presentInWorkingDays = attendance.filter((a: any) => 
                  a.teacherId === staff.id && 
                  a.status === 'Present' && 
                  a.approvalStatus === 'Approved' && 
                  workingDays.includes(a.date)
                ).length;
                
                const leaves = workingDays.length - presentInWorkingDays;
                const balance = staff.baseSalary - totalPaid;

                return (
                  <TableRow key={staff.id} className="hover:bg-gray-50/50 transition-colors border-b border-gray-100 last:border-0 group">
                    <TableCell className="pl-6 md:pl-8 py-4 md:py-6">
                      <div className="flex flex-col">
                        <span className="text-sm md:text-lg font-black text-[#1F58B3] tracking-tight">{staff.fullName}</span>
                        <span className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest">{staff.academicRole === 'None' ? staff.subject : staff.academicRole}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className="bg-red-50 text-red-700 border-none font-black text-[10px] px-2 h-5">{leaves} Days</Badge>
                    </TableCell>
                    <TableCell className="text-sm md:text-lg font-black text-[#1F2937]">₹{staff.baseSalary.toLocaleString()}</TableCell>
                    <TableCell className="text-sm md:text-lg font-black text-[#22C55E]">₹{totalPaid.toLocaleString()}</TableCell>
                    <TableCell className="text-sm md:text-lg font-black text-[#EF4444]">₹{balance.toLocaleString()}</TableCell>
                    <TableCell className="text-right pr-6 md:pr-8">
                      <Button variant="outline" size="sm" className="bg-white border-gray-200 text-gray-600 rounded-xl px-3 md:px-5 h-9 md:h-10 hover:bg-[#1F58B3] hover:text-white transition-all font-bold text-xs" onClick={() => onViewHistory(staff)}>
                        <History className="h-3.5 w-3.5 md:mr-2" /> <span className="hidden md:inline">Ledger</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

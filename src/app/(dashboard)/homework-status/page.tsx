"use client";

import { useSchoolStore } from "@/lib/store";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BookOpen, CheckCircle2, XCircle, Search, CalendarDays, Calendar as CalendarIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export default function HomeworkStatusPage() {
  const { homeworks, teachers } = useSchoolStore();
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dateDisplay, setDateDisplay] = useState("");

  useEffect(() => {
    // Handling date formatting on client to avoid hydration mismatch
    setDateDisplay(selectedDate.toLocaleDateString());
  }, [selectedDate]);

  const academicTeachers = teachers.filter(t => t.category === 'Academic');
  
  const filteredStatus = academicTeachers.filter(t => 
    t.fullName.toLowerCase().includes(search.toLowerCase()) || 
    t.classDetails.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-3xl font-black text-[#1F58B3] uppercase tracking-tight">Homework Tracker</h2>
            <p className="text-muted-foreground font-medium">Daily compliance monitor for all classes</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-[240px] justify-start text-left font-black h-12 rounded-xl border-none shadow-sm bg-white text-[#1F58B3]",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 rounded-2xl border-none shadow-2xl" align="end">
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
          <CardHeader className="p-6 border-b border-gray-50 flex flex-row items-center justify-between">
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
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                  <TableHead className="pl-8 py-5 text-[11px] font-black uppercase tracking-widest">Faculty Member</TableHead>
                  <TableHead className="py-5 text-[11px] font-black uppercase tracking-widest">Allotted Class</TableHead>
                  <TableHead className="py-5 text-[11px] font-black uppercase tracking-widest text-center">Status</TableHead>
                  <TableHead className="pr-8 py-5 text-[11px] font-black uppercase tracking-widest text-right">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStatus.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-20 text-gray-300 font-black uppercase">No records found</TableCell>
                  </TableRow>
                ) : (
                  filteredStatus.map((t) => {
                    const selectedHW = homeworks.find(h => h.teacherId === t.id && h.date === selectedDate.toLocaleDateString());
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
                          <p className="text-xs font-medium text-gray-400 truncate max-w-[200px] ml-auto italic">
                            {selectedHW ? selectedHW.content : '---'}
                          </p>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

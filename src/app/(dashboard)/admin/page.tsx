"use client";

import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { useSchoolStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Users, 
  GraduationCap, 
  Wallet, 
  Clock,
  TrendingUp
} from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
  const { students, teachers, currentUser } = useSchoolStore();
  const [currentTime, setCurrentTime] = useState("");
  const router = useRouter();

  useEffect(() => {
    setCurrentTime(new Date().toLocaleDateString('en-GB', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    }));
  }, []);

  const totalFeesExpected = students.reduce((sum, s) => sum + (s.totalFees || 0), 0);
  const totalFeesCollected = students.reduce((sum, s) => sum + (s.feesPaid || 0), 0);
  const outstandingDues = totalFeesExpected - totalFeesCollected;

  const stats = [
    { 
      title: "Total Students", 
      value: students.length, 
      icon: GraduationCap, 
      color: "text-[#3B82F6]", 
      bg: "bg-blue-50",
      path: "/students"
    },
    { 
      title: "Total Staff", 
      value: teachers.length, 
      icon: Users, 
      color: "text-[#A855F7]", 
      bg: "bg-purple-50",
      path: "/teachers"
    },
    { 
      title: "Fees Collected", 
      value: `₹${(totalFeesCollected / 1000).toFixed(1)}K`, 
      icon: Wallet, 
      color: "text-[#22C55E]", 
      bg: "bg-green-50",
      path: "/payments"
    },
    { 
      title: "Outstanding Dues", 
      value: `₹${(outstandingDues / 1000).toFixed(1)}K`, 
      icon: Clock, 
      color: "text-[#EF4444]", 
      bg: "bg-red-50",
      path: "/payments"
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 md:space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl md:text-[32px] font-bold tracking-tight text-[#1F2937]">Dashboard Overview</h2>
            <p className="text-muted-foreground font-medium text-sm md:text-[16px]">
              Welcome back, {currentUser?.fullName || 'Admin'}. Here is what's happening today.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white px-3 md:px-4 py-2 rounded-xl shadow-sm border border-gray-100 font-semibold text-gray-500 text-xs md:text-sm">
            <Clock className="h-4 w-4" />
            <span>{currentTime}</span>
          </div>
        </div>

        <div className="grid gap-4 md:grid-gap-6 grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card 
              key={stat.title} 
              className="border-none shadow-sm h-32 md:h-[160px] flex items-center bg-white rounded-2xl group hover:shadow-md transition-all cursor-pointer active:scale-95"
              onClick={() => router.push(stat.path)}
            >
              <CardContent className="p-4 md:p-8 w-full flex items-center justify-between">
                <div className="space-y-1 md:space-y-2">
                  <p className="text-[10px] md:text-[14px] font-semibold text-gray-400 uppercase tracking-wider">{stat.title}</p>
                  <p className="text-xl md:text-[32px] font-black text-[#1F2937] leading-none">{stat.value}</p>
                </div>
                <div className={`p-2 md:p-4 rounded-2xl ${stat.bg} group-hover:scale-110 transition-transform`}>
                  <stat.icon className={`h-5 w-5 md:h-7 md:w-7 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 md:grid-gap-8 md:grid-cols-2 lg:grid-cols-3">
          <Card className="border-none shadow-sm rounded-3xl lg:col-span-2 bg-white">
            <div className="p-6 md:p-8 pb-0">
              <h3 className="text-lg md:text-[20px] font-bold text-[#1F2937] flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" /> Student Attendance Trends
              </h3>
            </div>
            <CardContent className="p-6 md:p-8 flex items-center justify-center min-h-[300px] md:min-h-[350px]">
              <div className="w-full h-48 md:h-64 bg-gray-50 rounded-2xl border border-dashed border-gray-200 flex items-center justify-center">
                 <div className="flex flex-col items-center gap-4 text-gray-400">
                    <div className="w-32 h-32 md:w-48 md:h-48 rounded-full border-[10px] md:border-[16px] border-[#EEF3F5] relative">
                      <div className="absolute inset-0 rounded-full border-[10px] md:border-[16px] border-primary border-t-transparent border-r-transparent animate-spin-slow"></div>
                      <div className="absolute inset-0 flex items-center justify-center flex-col">
                        <span className="text-xl md:text-2xl font-black text-primary">94%</span>
                        <span className="text-[8px] md:text-[10px] font-bold uppercase">Average</span>
                      </div>
                    </div>
                    <p className="text-xs md:text-sm font-medium text-center px-4">Tracking daily presence across all standards</p>
                 </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm rounded-3xl bg-white">
            <div className="p-6 md:p-8 pb-4">
              <h3 className="text-lg md:text-[20px] font-bold text-[#1F2937]">
                Recent Registrations
              </h3>
            </div>
            <CardContent className="px-6 md:px-8 pb-6 md:pb-8">
              <div className="space-y-4 md:space-y-6">
                {students.slice(-4).reverse().length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                    <GraduationCap className="h-12 w-12 opacity-10 mb-2" />
                    <p className="text-sm font-medium">No recent enrollments</p>
                  </div>
                ) : (
                  students.slice(-4).reverse().map((student) => (
                    <div key={student.id} className="flex items-center gap-3 md:gap-4 group">
                      <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-blue-50 flex items-center justify-center text-primary font-bold text-xs md:text-sm">
                        {student.fullName.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs md:text-sm font-bold text-gray-700 truncate group-hover:text-primary transition-colors">{student.fullName}</p>
                        <p className="text-[10px] md:text-[11px] text-gray-400 font-medium">Class {student.class}-{student.division}</p>
                      </div>
                      <div className="text-[8px] md:text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                        {student.admissionDate.split('-').reverse().join('/')}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
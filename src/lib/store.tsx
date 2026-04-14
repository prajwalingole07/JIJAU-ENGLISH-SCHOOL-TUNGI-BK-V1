"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Student, Teacher, Payment, FeePayment, User, StudentAttendance, StaffAttendance, Homework } from './types';

interface SchoolContextType {
  isLoaded: boolean;
  students: Student[];
  teachers: Teacher[];
  payments: Payment[];
  feePayments: FeePayment[];
  studentAttendance: StudentAttendance[];
  staffAttendance: StaffAttendance[];
  homeworks: Homework[];
  currentUser: User | null;
  addStudent: (student: Student) => void;
  updateStudent: (id: string, updated: Partial<Student>) => void;
  deleteStudent: (id: string) => void;
  addTeacher: (teacher: Teacher) => void;
  updateTeacher: (id: string, updated: Partial<Teacher>) => void;
  deleteTeacher: (id: string) => void;
  addPayment: (payment: Payment) => void;
  addFeePayment: (payment: FeePayment) => void;
  updatePayment: (id: string, updated: Partial<Payment>) => void;
  markStudentAttendance: (records: StudentAttendance[]) => void;
  markStaffAttendance: (record: StaffAttendance) => void;
  updateStaffAttendanceStatus: (id: string, status: StaffAttendance['approvalStatus']) => void;
  addHomework: (homework: Homework) => void;
  updateHomework: (id: string, content: string) => void;
  login: (user: User) => void;
  logout: () => void;
}

const SchoolContext = createContext<SchoolContextType | undefined>(undefined);

export function SchoolProvider({ children }: { children: ReactNode }) {
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [feePayments, setFeePayments] = useState<FeePayment[]>([]);
  const [studentAttendance, setStudentAttendance] = useState<StudentAttendance[]>([]);
  const [staffAttendance, setStaffAttendance] = useState<StaffAttendance[]>([]);
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const storedStudents = localStorage.getItem('jijau_students');
    const storedTeachers = localStorage.getItem('jijau_teachers');
    const storedPayments = localStorage.getItem('jijau_payments');
    const storedFeePayments = localStorage.getItem('jijau_fee_payments');
    const storedStudentAtt = localStorage.getItem('jijau_student_att');
    const storedStaffAtt = localStorage.getItem('jijau_staff_att');
    const storedHomeworks = localStorage.getItem('jijau_homeworks');
    const storedUser = localStorage.getItem('jijau_current_user');

    if (storedStudents) setStudents(JSON.parse(storedStudents));
    if (storedTeachers) setTeachers(JSON.parse(storedTeachers));
    if (storedPayments) setPayments(JSON.parse(storedPayments));
    if (storedFeePayments) setFeePayments(JSON.parse(storedFeePayments));
    if (storedStudentAtt) setStudentAttendance(JSON.parse(storedStudentAtt));
    if (storedStaffAtt) setStaffAttendance(JSON.parse(storedStaffAtt));
    if (storedHomeworks) setHomeworks(JSON.parse(storedHomeworks));
    if (storedUser) setCurrentUser(JSON.parse(storedUser));
    
    setIsLoaded(true);
  }, []);

  const saveToStorage = (key: string, data: any) => {
    localStorage.setItem(key, JSON.stringify(data));
  };

  const addStudent = (student: Student) => {
    setStudents(prev => {
      const next = [...prev, student];
      saveToStorage('jijau_students', next);
      return next;
    });
  };

  const updateStudent = (id: string, updated: Partial<Student>) => {
    setStudents(prev => {
      const next = prev.map(s => s.id === id ? { ...s, ...updated } : s);
      saveToStorage('jijau_students', next);
      return next;
    });
  };

  const deleteStudent = (id: string) => {
    setStudents(prev => {
      const next = prev.filter(s => s.id !== id);
      saveToStorage('jijau_students', next);
      return next;
    });
  };

  const addTeacher = (teacher: Teacher) => {
    setTeachers(prev => {
      const next = [...prev, teacher];
      saveToStorage('jijau_teachers', next);
      return next;
    });
  };

  const updateTeacher = (id: string, updated: Partial<Teacher>) => {
    setTeachers(prev => {
      const next = prev.map(t => t.id === id ? { ...t, ...updated } : t);
      saveToStorage('jijau_teachers', next);
      return next;
    });
  };

  const deleteTeacher = (id: string) => {
    setTeachers(prev => {
      const next = prev.filter(t => t.id !== id);
      saveToStorage('jijau_teachers', next);
      return next;
    });
  };

  const addPayment = (payment: Payment) => {
    setPayments(prev => {
      const next = [...prev, payment];
      saveToStorage('jijau_payments', next);
      return next;
    });
  };

  const addFeePayment = (payment: FeePayment) => {
    setFeePayments(prev => {
      const next = [...prev, payment];
      saveToStorage('jijau_fee_payments', next);
      return next;
    });

    // Automatically update student's total fees paid
    setStudents(prev => {
      const next = prev.map(s => {
        if (s.id === payment.studentId) {
          return { ...s, feesPaid: (s.feesPaid || 0) + payment.amount };
        }
        return s;
      });
      saveToStorage('jijau_students', next);
      return next;
    });
  };

  const updatePayment = (id: string, updated: Partial<Payment>) => {
    setPayments(prev => {
      const next = prev.map(p => p.id === id ? { ...p, ...updated } : p);
      saveToStorage('jijau_payments', next);
      return next;
    });
  };

  const markStudentAttendance = (records: StudentAttendance[]) => {
    setStudentAttendance(prev => {
      const next = [...prev, ...records];
      saveToStorage('jijau_student_att', next);
      return next;
    });
  };

  const markStaffAttendance = (record: StaffAttendance) => {
    setStaffAttendance(prev => {
      const existing = prev.find(a => a.teacherId === record.teacherId && a.date === record.date);
      if (existing) return prev;
      const next = [...prev, record];
      saveToStorage('jijau_staff_att', next);
      return next;
    });
  };

  const updateStaffAttendanceStatus = (id: string, status: StaffAttendance['approvalStatus']) => {
    setStaffAttendance(prev => {
      const next = prev.map(a => a.id === id ? { ...a, approvalStatus: status } : a);
      saveToStorage('jijau_staff_att', next);
      return next;
    });
  };

  const addHomework = (homework: Homework) => {
    setHomeworks(prev => {
      const next = [...prev, homework];
      saveToStorage('jijau_homeworks', next);
      return next;
    });
  };

  const updateHomework = (id: string, content: string) => {
    setHomeworks(prev => {
      const next = prev.map(h => h.id === id ? { ...h, content } : h);
      saveToStorage('jijau_homeworks', next);
      return next;
    });
  };

  const login = (user: User) => {
    setCurrentUser(user);
    saveToStorage('jijau_current_user', user);
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('jijau_current_user');
  };

  return (
    <SchoolContext.Provider value={{
      isLoaded, students, teachers, payments, feePayments, studentAttendance, staffAttendance, homeworks, currentUser,
      addStudent, updateStudent, deleteStudent,
      addTeacher, updateTeacher, deleteTeacher,
      addPayment, addFeePayment, updatePayment, markStudentAttendance, markStaffAttendance, updateStaffAttendanceStatus,
      addHomework, updateHomework,
      login, logout
    }}>
      {children}
    </SchoolContext.Provider>
  );
}

export function useSchoolStore() {
  const context = useContext(SchoolContext);
  if (context === undefined) {
    throw new Error('useSchoolStore must be used within a SchoolProvider');
  }
  return context;
}

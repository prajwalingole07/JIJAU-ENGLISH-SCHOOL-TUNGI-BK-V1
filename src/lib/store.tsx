
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  Student, 
  Teacher, 
  Payment, 
  FeePayment, 
  User, 
  StudentAttendance, 
  StaffAttendance, 
  Homework, 
  BroadcastMessage 
} from './types';
import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy
} from 'firebase/firestore';
import { db } from '@/firebase';

interface SchoolContextType {
  isLoaded: boolean;
  students: Student[];
  teachers: Teacher[];
  payments: Payment[];
  feePayments: FeePayment[];
  studentAttendance: StudentAttendance[];
  staffAttendance: StaffAttendance[];
  homeworks: Homework[];
  broadcastMessages: BroadcastMessage[];
  currentUser: User | null;
  addStudent: (student: Student) => void;
  updateStudent: (id: string, updated: Partial<Student>) => void;
  deleteStudent: (id: string) => void;
  addTeacher: (teacher: Teacher) => void;
  updateTeacher: (id: string, updated: Partial<Teacher>) => void;
  deleteTeacher: (id: string) => void;
  addPayment: (payment: Payment) => void;
  addFeePayment: (payment: FeePayment) => void;
  markStudentAttendance: (records: StudentAttendance[]) => void;
  markStaffAttendance: (record: StaffAttendance) => void;
  updateStaffAttendanceStatus: (id: string, status: StaffAttendance['approvalStatus']) => void;
  addHomework: (homework: Homework) => void;
  updateHomework: (id: string, content: string, photo?: string) => void;
  addBroadcastMessage: (msg: BroadcastMessage) => void;
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
  const [broadcastMessages, setBroadcastMessages] = useState<BroadcastMessage[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Real-time Sync for all modules
    const unsubStudents = onSnapshot(collection(db, 'students'), (snap) => {
      setStudents(snap.docs.map(d => ({ ...d.data(), id: d.id } as Student)));
    });

    const unsubTeachers = onSnapshot(collection(db, 'teachers'), (snap) => {
      setTeachers(snap.docs.map(d => ({ ...d.data(), id: d.id } as Teacher)));
    });

    const unsubPayments = onSnapshot(collection(db, 'payments'), (snap) => {
      setPayments(snap.docs.map(d => ({ ...d.data(), id: d.id } as Payment)));
    });

    const unsubFeePayments = onSnapshot(collection(db, 'feePayments'), (snap) => {
      setFeePayments(snap.docs.map(d => ({ ...d.data(), id: d.id } as FeePayment)));
    });

    const unsubStudentAtt = onSnapshot(collection(db, 'studentAttendance'), (snap) => {
      setStudentAttendance(snap.docs.map(d => ({ ...d.data(), id: d.id } as StudentAttendance)));
    });

    const unsubStaffAtt = onSnapshot(collection(db, 'staffAttendance'), (snap) => {
      setStaffAttendance(snap.docs.map(d => ({ ...d.data(), id: d.id } as StaffAttendance)));
    });

    const unsubHomeworks = onSnapshot(query(collection(db, 'homeworks'), orderBy('createdAt', 'desc')), (snap) => {
      setHomeworks(snap.docs.map(d => ({ ...d.data(), id: d.id } as Homework)));
    });

    const unsubBroadcasts = onSnapshot(query(collection(db, 'broadcasts'), orderBy('timestamp', 'desc')), (snap) => {
      setBroadcastMessages(snap.docs.map(d => ({ ...d.data(), id: d.id } as BroadcastMessage)));
    });

    const storedUser = typeof window !== 'undefined' ? localStorage.getItem('jijau_current_user') : null;
    if (storedUser) setCurrentUser(JSON.parse(storedUser));
    
    setIsLoaded(true);

    return () => {
      unsubStudents(); unsubTeachers(); unsubPayments(); unsubFeePayments();
      unsubStudentAtt(); unsubStaffAtt(); unsubHomeworks(); unsubBroadcasts();
    };
  }, []);

  const addStudent = async (student: Student) => {
    try {
      await setDoc(doc(db, 'students', student.id), student);
    } catch (e) {
      console.error("Add Student Error:", e);
      alert("Save Failed: " + (e instanceof Error ? e.message : "Unknown error"));
    }
  };

  const updateStudent = async (id: string, updated: Partial<Student>) => {
    try {
      await updateDoc(doc(db, 'students', id), updated);
    } catch (e) {
      console.error("Update Student Error:", e);
      alert("Update Failed.");
    }
  };

  const deleteStudent = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'students', id));
    } catch (e) {
      console.error("Delete Student Error:", e);
    }
  };

  const addTeacher = async (teacher: Teacher) => {
    try {
      await setDoc(doc(db, 'teachers', teacher.id), teacher);
    } catch (e) {
      console.error("Add Teacher Error:", e);
      alert("Save Failed: " + (e instanceof Error ? e.message : "Unknown error"));
    }
  };

  const updateTeacher = async (id: string, updated: Partial<Teacher>) => {
    try {
      await updateDoc(doc(db, 'teachers', id), updated);
    } catch (e) {
      console.error("Update Teacher Error:", e);
    }
  };

  const deleteTeacher = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'teachers', id));
    } catch (e) {
      console.error("Delete Teacher Error:", e);
    }
  };

  const addPayment = async (payment: Payment) => {
    try {
      await setDoc(doc(db, 'payments', payment.id), payment);
    } catch (e) {
      console.error("Add Payment Error:", e);
      alert("Save Failed: " + (e instanceof Error ? e.message : "Unknown error"));
    }
  };

  const addFeePayment = async (payment: FeePayment) => {
    try {
      await setDoc(doc(db, 'feePayments', payment.id), payment);
      
      // Also update the student's total paid amount
      const student = students.find(s => s.id === payment.studentId);
      if (student) {
        const newPaidAmount = (student.feesPaid || 0) + payment.amount;
        await updateDoc(doc(db, 'students', student.id), { feesPaid: newPaidAmount });
      }
    } catch (e) {
      console.error("Add Fee Error:", e);
      alert("Save Failed: " + (e instanceof Error ? e.message : "Unknown error"));
    }
  };

  const markStudentAttendance = async (records: StudentAttendance[]) => {
    try {
      const promises = records.map(r => setDoc(doc(db, 'studentAttendance', r.id), r));
      await Promise.all(promises);
    } catch (e) {
      console.error("Attendance Error:", e);
      alert("Attendance Save Failed: " + (e instanceof Error ? e.message : "Unknown error"));
    }
  };

  const markStaffAttendance = async (record: StaffAttendance) => {
    try {
      await setDoc(doc(db, 'staffAttendance', record.id), record);
    } catch (e) {
      console.error("Staff Attendance Error:", e);
      alert("Self Attendance Save Failed: " + (e instanceof Error ? e.message : "Unknown error"));
    }
  };

  const updateStaffAttendanceStatus = (id: string, status: StaffAttendance['approvalStatus']) => {
    try {
      updateDoc(doc(db, 'staffAttendance', id), { approvalStatus: status });
    } catch (e) {
      console.error("Update Status Error:", e);
    }
  };

  const addHomework = async (homework: Homework) => {
    try {
      await setDoc(doc(db, 'homeworks', homework.id), homework);
    } catch (e) {
      console.error("Add Homework Error:", e);
      alert("Save Failed: " + (e instanceof Error ? e.message : "Unknown error"));
    }
  };

  const updateHomework = async (id: string, content: string, photo?: string) => {
    try {
      await updateDoc(doc(db, 'homeworks', id), { content, photo: photo || null });
    } catch (e) {
      console.error("Update Homework Error:", e);
    }
  };

  const addBroadcastMessage = async (msg: BroadcastMessage) => {
    try {
      await setDoc(doc(db, 'broadcasts', msg.id), msg);
    } catch (e) {
      console.error("Broadcast Error:", e);
    }
  };

  const login = (user: User) => {
    setCurrentUser(user);
    if (typeof window !== 'undefined') {
      localStorage.setItem('jijau_current_user', JSON.stringify(user));
    }
  };

  const logout = () => {
    setCurrentUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('jijau_current_user');
    }
  };

  return (
    <SchoolContext.Provider value={{
      isLoaded, students, teachers, payments, feePayments, studentAttendance, staffAttendance, homeworks, broadcastMessages, currentUser,
      addStudent, updateStudent, deleteStudent,
      addTeacher, updateTeacher, deleteTeacher,
      addPayment, addFeePayment, markStudentAttendance, markStaffAttendance, updateStaffAttendanceStatus,
      addHomework, updateHomework, addBroadcastMessage,
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

"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSchoolStore } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';
import { DEFAULT_CREDENTIALS, SCHOOL_NAME, SCHOOL_LOGO } from '@/lib/constants';
import Image from 'next/image';
import { Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, teachers } = useSchoolStore();
  const { toast } = useToast();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const inputUsername = username.trim();
    const normalizedUsername = inputUsername.toLowerCase();

    // Founder Check
    if (normalizedUsername === DEFAULT_CREDENTIALS.FOUNDER.username.toLowerCase() && password === DEFAULT_CREDENTIALS.FOUNDER.password) {
      const savedPhoto = typeof window !== 'undefined' ? localStorage.getItem('jijau_founder_photo') : null;
      login({ id: 'founder', username: inputUsername, fullName: 'Hon. Dnyaneshwar Ingole', role: 'FOUNDER', photo: savedPhoto || undefined });
      toast({ title: "Welcome back, Hon. Dnyaneshwar Ingole!" });
      router.push('/admin');
      return;
    }

    // Admin Check
    if (normalizedUsername === DEFAULT_CREDENTIALS.ADMIN.username.toLowerCase() && password === DEFAULT_CREDENTIALS.ADMIN.password) {
      const savedPhoto = typeof window !== 'undefined' ? localStorage.getItem('jijau_admin_photo') : null;
      login({ id: 'admin', username: inputUsername, fullName: 'Prajwal (Admin)', role: 'ADMIN', photo: savedPhoto || undefined });
      toast({ title: "Welcome back, Admin!" });
      router.push('/admin');
      return;
    }

    // Teacher Check
    const teacher = teachers.find(t => (t.username || "").trim().toLowerCase() === normalizedUsername);
    if (teacher && teacher.password === password) {
      login({ 
        id: teacher.id, 
        username: teacher.username, 
        fullName: teacher.fullName, 
        role: 'TEACHER', 
        photo: teacher.photo 
      });
      toast({ title: `Welcome, Prof. ${teacher.fullName.split(' ')[0]}!` });
      router.push('/teacher');
      return;
    }

    toast({ 
      title: "Login Failed", 
      description: "Invalid credentials. Please check your username and password.",
      variant: "destructive" 
    });
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4">
      <div className="w-full max-w-[350px] flex flex-col items-center">
        
        {/* Logo and Title */}
        <div className="mb-8 flex flex-col items-center">
          <Image 
            src={SCHOOL_LOGO} 
            alt="School Logo" 
            width={80} 
            height={80} 
            className="rounded-full w-[80px] h-[80px] mb-4 border border-gray-200" 
          />
          <h1 className="text-2xl font-bold text-gray-900 text-center leading-tight">
            {SCHOOL_NAME}
          </h1>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="w-full space-y-3">
          <div className="relative">
            <Input 
              id="username" 
              placeholder="Username or ID" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              required 
              className="h-[46px] bg-[#fafafa] border-[#dbdbdb] rounded-[4px] text-sm focus-visible:ring-1 focus-visible:ring-gray-300 px-3 placeholder:text-gray-400"
            />
          </div>
          
          <div className="relative">
            <Input 
              id="password" 
              type={showPassword ? "text" : "password"} 
              placeholder="Password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              className="h-[46px] bg-[#fafafa] border-[#dbdbdb] rounded-[4px] text-sm focus-visible:ring-1 focus-visible:ring-gray-300 px-3 placeholder:text-gray-400 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-800 font-semibold text-sm hover:text-gray-500"
            >
              {showPassword ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
            </button>
          </div>

          <Button 
            type="submit" 
            disabled={loading}
            className="w-full h-[44px] bg-[#0095f6] hover:bg-[#1877f2] text-white font-semibold rounded-[8px] mt-2 transition-colors disabled:opacity-70"
          >
            {loading ? "Logging in..." : "Log In"}
          </Button>
        </form>

      </div>
    </div>
  );
}

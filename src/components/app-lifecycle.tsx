"use client";

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { useSchoolStore } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';

export function AppLifecycle() {
  const router = useRouter();
  const pathname = usePathname();
  const { logout } = useSchoolStore();
  const { toast } = useToast();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let lastBackPressTime = 0;

    // Handle Hardware Back Button
    const backButtonListener = App.addListener('backButton', ({ canGoBack }) => {
      const rootPaths = ['/', '/login', '/admin', '/teacher'];
      
      if (!rootPaths.includes(pathname)) {
        // Not at root, go back one step
        router.back();
      } else {
        // At root, require double press to exit
        const currentTime = new Date().getTime();
        if (currentTime - lastBackPressTime < 2000) {
          App.exitApp();
        } else {
          lastBackPressTime = currentTime;
          toast({
            title: "Press back again to exit",
            duration: 2000,
          });
        }
      }
    });

    // Inactivity Timer (10 minutes)
    let inactivityTimer: NodeJS.Timeout;
    const INACTIVITY_LIMIT = 10 * 60 * 1000; // 10 minutes

    const resetInactivityTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        logout();
        router.push('/login');
        toast({
          title: "Session Expired",
          description: "You have been logged out due to inactivity.",
        });
      }, INACTIVITY_LIMIT);
    };

    const handleInteraction = () => resetInactivityTimer();

    // Listen for user interactions
    window.addEventListener('touchstart', handleInteraction);
    window.addEventListener('click', handleInteraction);
    window.addEventListener('keypress', handleInteraction);
    window.addEventListener('scroll', handleInteraction);

    // Pause timer when app goes to background, resume when foreground
    const appStateListener = App.addListener('appStateChange', ({ isActive }) => {
      if (isActive) {
        resetInactivityTimer();
      } else {
        clearTimeout(inactivityTimer); // Do not logout while in background
      }
    });

    resetInactivityTimer();

    return () => {
      backButtonListener.then(listener => listener.remove());
      appStateListener.then(listener => listener.remove());
      clearTimeout(inactivityTimer);
      window.removeEventListener('touchstart', handleInteraction);
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keypress', handleInteraction);
      window.removeEventListener('scroll', handleInteraction);
    };
  }, [pathname, router, toast, logout]);

  return null;
}

"use client";

import { Bell, Search, Settings, LogOut, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { EnhancedSearch } from "@/components/enhanced-search";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

interface DashboardHeaderProps {
  firstName?: string;
  onRefresh?: () => Promise<void>;
  assignments?: any[];
  classes?: any[];
  onAssignmentClick?: (assignment: any) => void;
  onClassClick?: (classEvent: any) => void;
  mobileSearchOpen?: boolean;
  setMobileSearchOpen?: (open: boolean) => void;
}

// Abstract gradient avatar component
function AbstractAvatar({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
  // Generate a consistent gradient based on name
  const getGradient = (name: string) => {
    const colors = [
      ['from-violet-500', 'to-purple-600'],
      ['from-blue-500', 'to-cyan-500'],
      ['from-emerald-500', 'to-teal-500'],
      ['from-orange-500', 'to-red-500'],
      ['from-pink-500', 'to-rose-500'],
      ['from-indigo-500', 'to-blue-600'],
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const [from, to] = getGradient(name);
  const initial = name.charAt(0).toUpperCase();
  const sizeClasses = size === "sm" ? "w-6 h-6 text-xs" : "w-8 h-8 text-sm";

  return (
    <div
      className={`${sizeClasses} rounded-full bg-gradient-to-br ${from} ${to} flex items-center justify-center text-white font-semibold shadow-md`}
    >
      {initial}
    </div>
  );
}

export function DashboardHeader({
  firstName,
  onRefresh,
  assignments = [],
  classes = [],
  onAssignmentClick,
  onClassClick,
  mobileSearchOpen: externalSearchOpen,
  setMobileSearchOpen: externalSetSearchOpen
}: DashboardHeaderProps) {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [internalSearchOpen, setInternalSearchOpen] = useState(false);

  // Use external state if provided, otherwise use internal state
  const mobileSearchOpen = externalSearchOpen !== undefined ? externalSearchOpen : internalSearchOpen;
  const setMobileSearchOpen = externalSetSearchOpen || setInternalSearchOpen;

  // Load firstName from props or fetch from API
  useEffect(() => {
    if (firstName && firstName !== "there") {
      setDisplayName(firstName);
    } else {
      // Fetch from session/API if not provided
      async function fetchName() {
        try {
          const response = await fetch('/api/user/data', { credentials: 'include' });
          if (response.ok) {
            const data = await response.json();
            if (data.firstName) {
              setDisplayName(data.firstName);
            }
          }
        } catch (error) {
          console.log('Could not fetch user name');
        }
      }
      fetchName();
    }
  }, [firstName]);

  // Handle logout
  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
      window.location.href = '/login';
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);
    try {
      if (onRefresh) {
        await onRefresh();
      } else {
        // Default refresh behavior - call user data POST
        const response = await fetch('/api/user/data', {
          method: 'POST',
          credentials: 'include'
        });
        if (response.ok) {
          window.location.reload();
        }
      }
    } catch (error) {
      console.error('Failed to refresh data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Navigate to settings page
  const handleSettings = () => {
    router.push('/settings');
  };

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  // Use displayName if available, otherwise show loading indicator or "there"
  const nameToShow = displayName || "there";

  return (
    <header className="h-14 md:h-16 border-b border-border/40 bg-card/80 backdrop-blur-xl px-3 md:px-6 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-2 md:gap-4">
        <h1 className="text-lg md:text-3xl font-serif font-bold text-foreground tracking-tight">
          <span className="hidden sm:inline italic opacity-80">{getGreeting()}, </span>
          <span className="sm:hidden">Hi, </span>
          {nameToShow}
        </h1>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        {/* Refresh Button - always show */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="gap-2"
          title="Refresh data from calendar"
        >
          <RefreshCw className={`w-4 h-4 md:w-5 md:h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span className="hidden md:inline">
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </span>
        </Button>

        {/* Enhanced Search - hidden on mobile */}
        <div className="hidden md:block w-60 lg:w-80">
          <EnhancedSearch
            assignments={assignments}
            classes={classes}
            onAssignmentClick={onAssignmentClick}
            onClassClick={onClassClick}
            onSettingClick={(key) => router.push(`/settings${key ? `?tab=${key}` : ''}`)}
          />
        </div>

        {/* Show search icon only on mobile */}
        <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setMobileSearchOpen(true)}>
          <Search className="w-5 h-5" />
        </Button>

        {/* Mobile Search Dialog */}
        <Dialog open={mobileSearchOpen} onOpenChange={setMobileSearchOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogTitle className="sr-only">Search</DialogTitle>
            <div className="pt-2">
              <EnhancedSearch
                assignments={assignments}
                classes={classes}
                onAssignmentClick={(a) => { onAssignmentClick?.(a); setMobileSearchOpen(false); }}
                onClassClick={(c) => { onClassClick?.(c); setMobileSearchOpen(false); }}
                onSettingClick={(key) => { router.push(`/settings${key ? `?tab=${key}` : ''}`); setMobileSearchOpen(false); }}
              />
            </div>
          </DialogContent>
        </Dialog>

        <Button variant="ghost" size="sm" className="relative">
          <Bell className="w-4 h-4 md:w-5 md:h-5" />
          <span className="absolute -top-1 -right-1 w-2 h-2 md:w-3 md:h-3 bg-destructive rounded-full text-xs"></span>
        </Button>

        {/* Theme toggle button */}
        <ThemeToggle />

        {/* Hide settings on mobile to save space */}
        <Button variant="ghost" size="sm" onClick={handleSettings} className="hidden sm:flex">
          <Settings className="w-4 h-4 md:w-5 md:h-5" />
        </Button>

        {/* Simplify sign out button on mobile */}
        <Button variant="ghost" size="sm" onClick={handleLogout} className="hidden sm:flex">
          <LogOut className="w-4 h-4 md:w-5 md:h-5 mr-2" />
          <span className="hidden md:inline">Sign Out</span>
          <span className="md:hidden">Out</span>
        </Button>

        {/* Mobile: Show just logout icon */}
        <Button variant="ghost" size="sm" onClick={handleLogout} className="sm:hidden">
          <LogOut className="w-4 h-4" />
        </Button>

        {/* Abstract gradient avatar */}
        <AbstractAvatar name={nameToShow} size="md" />
      </div>
    </header>
  )
}
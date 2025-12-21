"use client";

import { Bell, Settings, LogOut, RefreshCw, BookOpen, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { EnhancedSearch } from "@/components/enhanced-search";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";

// localStorage keys for notification tracking
const LAST_LOGIN_KEY = 'tmusync_last_login';
const KNOWN_ASSIGNMENTS_KEY = 'tmusync_known_assignments';
const KNOWN_CLASSES_KEY = 'tmusync_known_classes';

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

// Notification tracking utilities
function getLastLoginTime(): Date | null {
  if (typeof window === 'undefined') return null;
  const stored = localStorage.getItem(LAST_LOGIN_KEY);
  return stored ? new Date(stored) : null;
}

function getKnownIds(key: string): string[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : [];
}

function saveCurrentSession(assignmentIds: string[], classIds: string[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LAST_LOGIN_KEY, new Date().toISOString());
  localStorage.setItem(KNOWN_ASSIGNMENTS_KEY, JSON.stringify(assignmentIds));
  localStorage.setItem(KNOWN_CLASSES_KEY, JSON.stringify(classIds));
}

export function DashboardHeader({
  firstName,
  onRefresh,
  assignments = [],
  classes = [],
  onAssignmentClick,
  onClassClick,
  mobileSearchOpen,
  setMobileSearchOpen,
}: DashboardHeaderProps) {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [lastLogin, setLastLogin] = useState<Date | null>(null);
  const [sessionSaved, setSessionSaved] = useState(false);

  // Load firstName from props or fetch from API
  useEffect(() => {
    if (firstName && firstName !== "there") {
      setDisplayName(firstName);
    } else {
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

  // Load last login time
  useEffect(() => {
    setLastLogin(getLastLoginTime());
  }, []);

  // Calculate new items since last login
  const { newAssignments, newClasses } = useMemo(() => {
    const knownAssignmentIds = getKnownIds(KNOWN_ASSIGNMENTS_KEY);
    const knownClassIds = getKnownIds(KNOWN_CLASSES_KEY);

    const newAssigns = assignments.filter(a => !knownAssignmentIds.includes(a.id));
    const newCls = classes.filter(c => !knownClassIds.includes(c.id));

    return { newAssignments: newAssigns, newClasses: newCls };
  }, [assignments, classes]);

  const totalNewItems = newAssignments.length + newClasses.length;

  // Save current session when user dismisses notifications
  const handleDismissNotifications = () => {
    const assignmentIds = assignments.map(a => a.id);
    const classIds = classes.map(c => c.id);
    saveCurrentSession(assignmentIds, classIds);
    setSessionSaved(true);
    setNotificationsOpen(false);
  };

  // Handle logout
  const handleLogout = async () => {
    // Save session before logout
    const assignmentIds = assignments.map(a => a.id);
    const classIds = classes.map(c => c.id);
    saveCurrentSession(assignmentIds, classIds);

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

  const handleSettings = () => {
    router.push('/settings');
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const formatLastLogin = (date: Date | null) => {
    if (!date) return "First visit!";
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

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
        {/* Refresh Button */}
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

        {/* Enhanced Search - hidden on mobile (search is in bottom nav) */}
        <div className="hidden md:block w-60 lg:w-80">
          <EnhancedSearch
            assignments={assignments}
            classes={classes}
            onAssignmentClick={onAssignmentClick}
            onClassClick={onClassClick}
            onSettingClick={(key) => router.push(`/settings${key ? `?tab=${key}` : ''}`)}
          />
        </div>

        {/* Notification Bell with Dropdown */}
        <Popover open={notificationsOpen} onOpenChange={setNotificationsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              type="button"
              className="relative"
              aria-label="Notifications"
              onClick={() => setNotificationsOpen(!notificationsOpen)}
            >
              <Bell className="w-4 h-4 md:w-5 md:h-5" />
              {totalNewItems > 0 && !sessionSaved && (
                <span className="absolute -top-1 -right-1 w-4 h-4 md:w-5 md:h-5 bg-destructive rounded-full text-[10px] md:text-xs flex items-center justify-center text-white font-medium">
                  {totalNewItems > 9 ? '9+' : totalNewItems}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="end">
            <div className="p-3 border-b border-border/50">
              <h3 className="font-semibold text-sm">Notifications</h3>
              <p className="text-xs text-muted-foreground">
                Last login: {formatLastLogin(lastLogin)}
              </p>
            </div>

            <div className="max-h-64 overflow-y-auto">
              {totalNewItems === 0 || sessionSaved ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  <p>You're all caught up! ✨</p>
                  <p className="text-xs mt-1">No new items since your last visit.</p>
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {newAssignments.length > 0 && (
                    <div className="mb-2">
                      <p className="text-xs font-medium text-muted-foreground px-2 py-1">
                        New Assignments ({newAssignments.length})
                      </p>
                      {newAssignments.slice(0, 5).map((assignment) => (
                        <button
                          key={assignment.id}
                          onClick={() => {
                            onAssignmentClick?.(assignment);
                            setNotificationsOpen(false);
                          }}
                          className="w-full text-left px-2 py-1.5 rounded-md hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <BookOpen className="w-3 h-3 text-orange-500 flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{assignment.title}</p>
                              <p className="text-xs text-muted-foreground">{assignment.course}</p>
                            </div>
                          </div>
                        </button>
                      ))}
                      {newAssignments.length > 5 && (
                        <p className="text-xs text-muted-foreground px-2">
                          +{newAssignments.length - 5} more
                        </p>
                      )}
                    </div>
                  )}

                  {newClasses.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground px-2 py-1">
                        New Classes ({newClasses.length})
                      </p>
                      {newClasses.slice(0, 5).map((classEvent) => (
                        <button
                          key={classEvent.id}
                          onClick={() => {
                            onClassClick?.(classEvent);
                            setNotificationsOpen(false);
                          }}
                          className="w-full text-left px-2 py-1.5 rounded-md hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3 h-3 text-blue-500 flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate">{classEvent.title}</p>
                              <p className="text-xs text-muted-foreground">{classEvent.course}</p>
                            </div>
                          </div>
                        </button>
                      ))}
                      {newClasses.length > 5 && (
                        <p className="text-xs text-muted-foreground px-2">
                          +{newClasses.length - 5} more
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {totalNewItems > 0 && !sessionSaved && (
              <div className="p-2 border-t border-border/50">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs"
                  onClick={handleDismissNotifications}
                >
                  Mark all as seen
                </Button>
              </div>
            )}
          </PopoverContent>
        </Popover>

        {/* Theme toggle button */}
        <ThemeToggle />

        {/* Settings button - visible on all screen sizes */}
        <Button variant="ghost" size="sm" onClick={handleSettings} aria-label="Settings">
          <Settings className="w-4 h-4 md:w-5 md:h-5" />
        </Button>

        {/* Simplify sign out button on mobile */}
        <Button variant="ghost" size="sm" onClick={handleLogout} className="hidden sm:flex" aria-label="Sign out">
          <LogOut className="w-4 h-4 md:w-5 md:h-5 mr-2" />
          <span className="hidden md:inline">Sign Out</span>
          <span className="md:hidden">Out</span>
        </Button>

        {/* Mobile: Show just logout icon */}
        <Button variant="ghost" size="sm" onClick={handleLogout} className="sm:hidden" aria-label="Sign out">
          <LogOut className="w-4 h-4" />
        </Button>

        {/* Abstract gradient avatar */}
        <AbstractAvatar name={nameToShow} size="md" />
      </div>

      {/* Mobile Search Modal */}
      {mobileSearchOpen && (
        <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-md md:hidden">
          <div className="flex flex-col h-full p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Search</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileSearchOpen?.(false)}
                aria-label="Close search"
              >
                ✕
              </Button>
            </div>
            <div className="flex-1">
              <EnhancedSearch
                autoOpen={true}
                assignments={assignments}
                classes={classes}
                onAssignmentClick={(assignment) => {
                  onAssignmentClick?.(assignment);
                  setMobileSearchOpen?.(false);
                }}
                onClassClick={(classEvent) => {
                  onClassClick?.(classEvent);
                  setMobileSearchOpen?.(false);
                }}
                onSettingClick={(key) => {
                  router.push(`/settings${key ? `?tab=${key}` : ''}`);
                  setMobileSearchOpen?.(false);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
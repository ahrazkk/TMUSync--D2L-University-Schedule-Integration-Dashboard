"use client"; // This component needs to be a Client Component for interactivity

import { Bell, Search, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";
import { useRouter } from "next/navigation";

export function DashboardHeader() {
  const router = useRouter();

  // This function will handle the logout process
  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
      // Redirect to the login page after a successful logout
      window.location.href = '/login';
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  // Navigate to settings page
  const handleSettings = () => {
    router.push('/settings');
  };

  return (
    <header className="h-14 md:h-16 border-b border-border bg-card px-3 md:px-6 flex items-center justify-between">
      <div className="flex items-center gap-2 md:gap-4">
        {/* Hide "Good morning" text on mobile, show abbreviated version on small screens */}
        <h1 className="text-lg md:text-2xl font-bold text-foreground">
          <span className="hidden sm:inline">Good morning </span>
          <span className="sm:hidden">Hi </span>
          !
        </h1>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        {/* Hide search on mobile to save space */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input placeholder="Search courses, assignments..." className="pl-10 w-60 lg:w-80" />
        </div>

        {/* Show search icon only on mobile */}
        <Button variant="ghost" size="sm" className="md:hidden">
          <Search className="w-5 h-5" />
        </Button>

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

        <Avatar className="w-6 h-6 md:w-8 md:h-8">
          <AvatarImage src="/student-avatar.png" />
          <AvatarFallback className="text-xs md:text-sm">AH</AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}
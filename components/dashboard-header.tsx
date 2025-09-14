"use client"; // This component needs to be a Client Component for interactivity

import { Bell, Search, Settings, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
    <header className="h-16 border-b border-border bg-card px-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold text-foreground">Good morning, Ahraz!</h1>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input placeholder="Search courses, assignments..." className="pl-10 w-80" />
        </div>

        <Button variant="ghost" size="sm" className="relative">
          <Bell className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full text-xs"></span>
        </Button>

        <Button variant="ghost" size="sm" onClick={handleSettings}>
          <Settings className="w-5 h-5" />
        </Button>

        {/* --- NEW SIGN OUT BUTTON --- */}
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          <LogOut className="w-5 h-5 mr-2" />
          Sign Out
        </Button>
        {/* --- END OF NEW BUTTON --- */}

        <Avatar className="w-8 h-8">
          <AvatarImage src="/student-avatar.png" />
          <AvatarFallback>AH</AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}
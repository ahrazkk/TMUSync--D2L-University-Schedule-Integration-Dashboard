"use client";

import { useState } from "react";
import { Home, Calendar, BookOpen, BarChart3, Settings, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MobileBottomNavProps {
  onSearchClick?: () => void;
}

export function MobileBottomNav({ onSearchClick }: MobileBottomNavProps) {
  const [activeTab, setActiveTab] = useState("home");

  const navItems = [
    { id: "home", icon: Home, label: "Home" },
    { id: "calendar", icon: Calendar, label: "Calendar" },
    { id: "search", icon: Search, label: "Search" },
    { id: "courses", icon: BookOpen, label: "Courses" },
    { id: "stats", icon: BarChart3, label: "Stats" },
  ];

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);

    // Handle specific actions
    if (tabId === "search" && onSearchClick) {
      onSearchClick();
    }

    // Scroll to relevant sections
    switch (tabId) {
      case "home":
        window.scrollTo({ top: 0, behavior: "smooth" });
        break;
      case "calendar":
        const calendarElement = document.querySelector('[data-testid="weekly-calendar"]');
        calendarElement?.scrollIntoView({ behavior: "smooth" });
        break;
      case "courses":
        const statsElement = document.querySelector('[data-testid="stats-cards"]');
        statsElement?.scrollIntoView({ behavior: "smooth" });
        break;
      case "stats":
        const assignmentsElement = document.querySelector('[data-testid="assignments-panel"]');
        assignmentsElement?.scrollIntoView({ behavior: "smooth" });
        break;
    }
  };

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-xl border-t border-border">
      <div className="flex items-center justify-around py-2 px-2">
        {navItems.map((item) => (
          <Button
            key={item.id}
            variant="ghost"
            size="sm"
            onClick={() => handleTabClick(item.id)}
            className={cn(
              "flex flex-col items-center gap-1 h-auto py-2 px-2 min-w-0 flex-1",
              activeTab === item.id && "text-primary bg-primary/10"
            )}
          >
            <item.icon className="w-4 h-4" />
            <span className="text-xs font-medium truncate">{item.label}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
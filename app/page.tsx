"use client"

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/sidebar";
import { DashboardHeader } from "@/components/dashboard-header";
import { WeeklyCalendar } from "@/components/weekly-calendar";
import { AssignmentsPanel } from "@/components/assignments-panel";
import { StatsCards } from "@/components/stats-cards";
import { QuickActions } from "@/components/quick-actions";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const [schedule, setSchedule] = useState<any[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedSchedule = localStorage.getItem('userSchedule');
    
    if (savedSchedule) {
      setSchedule(JSON.parse(savedSchedule));
      setIsLoading(false);
    } else {
      async function fetchSchedule() {
        try {
          const response = await fetch('/api/schedule', { credentials: 'include' });
          if (!response.ok) {
            window.location.href = '/login';
            return;
          }
          const data = await response.json();
          localStorage.setItem('userSchedule', JSON.stringify(data.schedule));
          setSchedule(data.schedule);
        } catch (error) {
          console.error("Failed to fetch schedule, redirecting to login.", error);
          window.location.href = '/login';
        } finally {
          setIsLoading(false);
        }
      }
      fetchSchedule();
    }
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <main className="flex-1 flex flex-col">
          <DashboardHeader />
          <div className="flex-1 p-6 space-y-6">
            <StatsCards />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg-col-span-2 space-y-2">
                <Skeleton className="h-12 w-1/3" />
                <Skeleton className="h-[500px] w-full" />
              </div>
              <div className="space-y-6">
                <Skeleton className="h-[300px] w-full" />
                <Skeleton className="h-[200px] w-full" />
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }
  
  // --- THIS IS THE FIX ---
  // Ensure the schedule state feeds BOTH the calendar and the assignments panel.
  const allEvents = schedule || [];
  const upcomingAssignments = allEvents.filter(event => event.type === 'assignment');
  const finishedAssignments: any[] = [];

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 flex flex-col">
        <DashboardHeader />
        <div className="flex-1 p-6 space-y-6">
          <StatsCards />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              {/* The calendar receives all events to display them visually */}
              <WeeklyCalendar events={allEvents} />
            </div>
            <div className="space-y-6">
              {/* The assignments panel receives only the assignment events for its list */}
              <AssignmentsPanel 
                upcoming={upcomingAssignments}
                finished={finishedAssignments}
              />
              <QuickActions />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
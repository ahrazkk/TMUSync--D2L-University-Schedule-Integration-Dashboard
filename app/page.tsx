"use client"

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/sidebar";
import { DashboardHeader } from "@/components/dashboard-header";
import { WeeklyCalendar } from "@/components/weekly-calendar";
import { AssignmentsPanel } from "@/components/assignments-panel";
import { StatsCards } from "@/components/stats-cards";
import { QuickActions } from "@/components/quick-actions";
import { CourseDetailCard } from "@/components/course-detail-card";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const [schedule, setSchedule] = useState<any[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<any | null>(null);
  const [assignmentStats, setAssignmentStats] = useState<{
    completed: number;
    total: number;
    viewContext: string;
  } | null>(null);

  useEffect(() => {
    async function loadSchedule() {
      const savedSchedule = localStorage.getItem('userSchedule');
      
      if (savedSchedule) {
        const parsed = JSON.parse(savedSchedule);
        setSchedule(parsed);
        setIsLoading(false);
      } else {
        // No saved schedule, fetch fresh from backend
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
    }
    
    loadSchedule();
  }, []);

  const handleCourseClick = (courseData: any) => {
    // If course details are available, use them directly
    if (courseData && courseData.sessions && courseData.allTimeSlots) {
      setSelectedCourse(courseData);
      return;
    }
    
    // Fallback: Generate course details from available schedule data
    if (courseData && courseData.key && schedule) {
      const courseKey = courseData.key;
      const courseEvents = schedule.filter(event => 
        event.type === 'class' && event.courseName === courseKey
      );
      
      if (courseEvents.length > 0) {
        const generatedDetails = {
          key: courseKey,
          title: `${courseKey} Course`,
          description: `Course information for ${courseKey}. For more detailed information including instructor details and course descriptions, please log out and log in again to refresh course data.`,
          credits: 'N/A',
          campus: 'Toronto Metropolitan University',
          sessions: courseEvents.map(event => {
            const parts = event.title.split(' - ');
            return {
              type: parts[1] || 'Class',
              day: event.day,
              startTime: event.startTime,
              endTime: 'N/A', // Will be calculated or shown as N/A
              duration: event.duration || 1,
              instructor: 'TBA',
              location: 'TBA'
            };
          }),
          allTimeSlots: courseEvents.map(event => ({
            type: event.title.split(' - ')[1] || 'Class',
            day: event.day,
            startTime: event.startTime,
            endTime: 'N/A',
            duration: event.duration || 1,
            instructor: 'TBA',
            location: 'TBA'
          }))
        };
        setSelectedCourse(generatedDetails);
      }
    }
  };

  const handleCloseCourseDetail = () => {
    setSelectedCourse(null);
  };

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

  // Calculate course statistics
  const courseStats = allEvents.length > 0 ? (() => {
    // Use the course keys from VSB (stored in courseName field from scraper)
    // This properly groups labs/lectures under the same course key
    const uniqueCourseKeys = new Set<string>();
    const courseKeyToDisplayName = new Map<string, string>();
    
    allEvents.forEach(event => {
      // The courseName field contains the actual course key from VSB (e.g., "CPS109")
      // This is the key from the first file (enrollment data) that groups all sections
      const courseKey = event.courseName; // This is course.key from the scraper
      
      if (courseKey && courseKey.trim() !== '') {
        uniqueCourseKeys.add(courseKey);
        
        // Use the course key as display name (since it's already clean like "CPS109")
        courseKeyToDisplayName.set(courseKey, courseKey);
      }
    });

    // Debug: Show the VSB course structure
    console.log('📚 VSB Course Analysis:', {
      totalEvents: allEvents.length,
      sampleEvents: allEvents.slice(0, 5).map(e => ({
        title: e.title,           // e.g., "CPS109 - LEC"
        courseName: e.courseName, // e.g., "CPS109" (the course key)
        type: e.type              // e.g., "class"
      })),
      uniqueCourseKeys: Array.from(uniqueCourseKeys).sort(),
      totalUniqueCourses: uniqueCourseKeys.size
    });

    const courseKeys = Array.from(uniqueCourseKeys);
    const courseNames = courseKeys.map(key => courseKeyToDisplayName.get(key) || key);
    
    return {
      activeCourses: courseNames.length,
      courseNames: courseNames
    };
  })() : undefined;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 flex flex-col">
        <DashboardHeader />
        <div className="flex-1 p-6 space-y-6">
          <StatsCards 
            assignmentStats={assignmentStats || undefined} 
            courseStats={courseStats}
          />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Course Detail Card - shown above calendar when a course is selected */}
              {selectedCourse && (
                <CourseDetailCard 
                  courseDetails={selectedCourse} 
                  onClose={handleCloseCourseDetail}
                />
              )}
              {/* The calendar receives all events to display them visually */}
              <WeeklyCalendar 
                events={allEvents} 
                onCourseClick={handleCourseClick}
              />
            </div>
            <div className="space-y-6">
              {/* The assignments panel receives only the assignment events for its list */}
              <AssignmentsPanel 
                upcoming={upcomingAssignments}
                finished={finishedAssignments}
                onStatsChange={setAssignmentStats}
              />
              <QuickActions />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
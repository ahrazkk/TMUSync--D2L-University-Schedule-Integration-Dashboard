"use client"

import { useState, useEffect, useMemo } from "react";
import { Sidebar } from "@/components/sidebar";
import { DashboardHeader } from "@/components/dashboard-header";
import { WeeklyCalendar } from "@/components/weekly-calendar";
import { AssignmentsPanel } from "@/components/assignments-panel";
import { StatsCards } from "@/components/stats-cards";
import { QuickActions } from "@/components/quick-actions";
import { CourseDetailCard } from "@/components/course-detail-card";
import { AssignmentDetailCard } from "@/components/assignment-detail-card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  saveAssignmentsWithBindings, 
  loadAssignmentsWithBindings, 
  syncAssignmentsAfterLogin,
  clearAssignmentData 
} from "@/lib/assignment-persistence";

export default function DashboardPage() {
  const [schedule, setSchedule] = useState<any[] | null>(null);
  const [assignments, setAssignments] = useState<any[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<any | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<any | null>(null);
  const [assignmentStats, setAssignmentStats] = useState<{
    completed: number;
    total: number;
    viewContext: string;
  } | null>(null);

  useEffect(() => {
    async function loadSchedule() {
      // Clear test assignments first
      clearTestAssignments();
      
      // Clear old CP830 assignments that are duplicates
      clearOldCP830Assignments();
      
      const savedSchedule = localStorage.getItem('userSchedule');
      
      // Use the new assignment persistence system
      const savedAssignments = loadAssignmentsWithBindings();
      
      if (savedSchedule) {
        const parsed = JSON.parse(savedSchedule);
        setSchedule(parsed);
      }
      
      if (savedAssignments) {
        setAssignments(savedAssignments);
      }
      
      if (savedSchedule && savedAssignments) {
        setIsLoading(false);
        console.log('📚 Loaded cached data with preserved course bindings');
      } else {
        // No saved data, fetch fresh from backend
        async function fetchData() {
          try {
            const scheduleResponse = await fetch('/api/schedule', { credentials: 'include' });
            
            if (!scheduleResponse.ok) {
              window.location.href = '/login';
              return;
            }
            
            const scheduleData = await scheduleResponse.json();
            
            // Separate classes and assignments from the combined schedule
            const allData = scheduleData.schedule || [];
            const classes = allData.filter((item: any) => item.type === 'class');
            const serverAssignments = allData.filter((item: any) => item.type === 'assignment');
            
            // Store schedule normally
            localStorage.setItem('userSchedule', JSON.stringify(classes));
            
            // Use the new assignment persistence system with sync
            const syncedAssignments = syncAssignmentsAfterLogin(serverAssignments);
            
            setSchedule(classes);
            setAssignments(syncedAssignments);
            
            console.log('📚 Fetched fresh data and synced with local course bindings');
          } catch (error) {
            console.error("Failed to fetch data, redirecting to login.", error);
            window.location.href = '/login';
          } finally {
            setIsLoading(false);
          }
        }
        fetchData();
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

  const handleAssignmentClick = (assignment: any) => {
    setSelectedAssignment(assignment);
  };

  // DEBUG: Test function to manually add sample assignments
  const addTestAssignments = () => {
    // First check what course keys we actually have
    const availableCourseKeys = schedule ? Array.from(new Set(schedule.map(event => event.courseName))) : [];
    console.log('🎯 Available course keys for test assignments:', availableCourseKeys);
    
    const testAssignments = [
      {
        title: "Quiz#1 - Available",
        dueDate: "2025-09-15T08:00:00Z",
        course: availableCourseKeys[0] || "CP8307", // Use first available course key
        courseName: availableCourseKeys[0] || "CP8307",
        description: "Test assignment for Computer Vision course",
        d2lUrl: "https://example.com"
      },
      {
        title: "Assignment 1",
        dueDate: "2025-09-20T23:59:00Z", 
        course: availableCourseKeys[1] || "CPS843", // Use second available course key
        courseName: availableCourseKeys[1] || "CPS843",
        description: "Test assignment for second course"
      }
    ];
    console.log('🧪 Adding test assignments:', testAssignments);
    setAssignments(testAssignments);
    saveAssignmentsWithBindings(testAssignments);
  };

  // Function to clear old CP830 assignments that are duplicates
  const clearOldCP830Assignments = () => {
    try {
      const savedAssignments = loadAssignmentsWithBindings();
      if (savedAssignments) {
        console.log('Before cleanup - Total assignments:', savedAssignments.length);
        
        // Filter out assignments with old CP830 course name
        const filteredAssignments = savedAssignments.filter((assignment: any) => {
          const course = assignment.courseName || assignment.course || assignment.vsbCourseKey || '';
          const isOldCP830 = course.toLowerCase().includes('cp830') || course.toLowerCase().includes('cp-830');
          return !isOldCP830;
        });
        
        console.log('After cleanup - Total assignments:', filteredAssignments.length);
        console.log('Removed', savedAssignments.length - filteredAssignments.length, 'old CP830 assignments');
        
        // Use the new persistence system
        saveAssignmentsWithBindings(filteredAssignments);
        
        // Update state to reflect changes
        setAssignments(filteredAssignments);
        
        console.log('✅ Old CP830 assignments removed successfully');
      }
    } catch (error) {
      console.error('Error clearing old CP830 assignments:', error);
    }
  };

  // Clear test assignments and use real ones
  const clearTestAssignments = () => {
    clearAssignmentData();
    setAssignments([]);
    console.log('🧹 Cleared test assignments');
  };

  const closeAssignmentDetails = () => {
    setSelectedAssignment(null);
  };

  // Function to get assignments for a specific course
  const getAssignmentsForCourse = (courseKey: string): any[] => {
    if (!assignments) return [];
    
    // Normalize course key for comparison
    const normalizeCourseCode = (code: string): string => {
      return code.replace(/[-\s]/g, '').toUpperCase();
    };
    
    const normalizedCourseKey = normalizeCourseCode(courseKey);
    
    return assignments.filter((assignment: any) => {
      // Try multiple course fields - prioritize vsbCourseKey which has the correct VSB format
      const assignmentCourse = assignment.vsbCourseKey || assignment.courseName || assignment.course || '';
      const normalizedAssignmentCourse = normalizeCourseCode(assignmentCourse);
      
      return normalizedAssignmentCourse === normalizedCourseKey ||
             normalizedAssignmentCourse.includes(normalizedCourseKey) ||
             normalizedCourseKey.includes(normalizedAssignmentCourse);
    });
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
  // Combine schedule and assignments data for the calendar
  const scheduleEvents = schedule || [];
  const assignmentEvents = assignments ? assignments.map((assignment: any) => ({
    ...assignment,
    type: 'assignment'
  })) : [];
  
  const allEvents = [...scheduleEvents, ...assignmentEvents];
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
                  assignments={getAssignmentsForCourse(selectedCourse.key)}
                  onClose={() => setSelectedCourse(null)}
                  onAssignmentClick={handleAssignmentClick}
                />
              )}
              {/* Assignment Detail Card - shown above calendar when an assignment is selected */}
              {selectedAssignment && (
                <AssignmentDetailCard 
                  assignment={selectedAssignment}
                  onClose={() => setSelectedAssignment(null)}
                />
              )}
              {/* The calendar receives all events to display them visually */}
              <WeeklyCalendar 
                events={allEvents} 
                onCourseClick={handleCourseClick}
                onAssignmentClick={handleAssignmentClick}
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
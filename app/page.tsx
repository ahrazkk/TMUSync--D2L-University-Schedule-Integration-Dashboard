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
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
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
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  
  // Shared assignment completion state - initialized with a flag to prevent premature saving
  const [completedAssignmentIds, setCompletedAssignmentIds] = useState<Set<string>>(new Set());
  const [completionStateLoaded, setCompletionStateLoaded] = useState(false);

  // Load completion state from localStorage on mount
  useEffect(() => {
    try {
      const savedCompletions = localStorage.getItem('completedAssignmentIds');
      console.log('🔄 LOADING completion state from localStorage:', savedCompletions);
      if (savedCompletions) {
        const parsed = JSON.parse(savedCompletions);
        const completionSet = new Set<string>(parsed);
        setCompletedAssignmentIds(completionSet);
        console.log('🔄 RESTORED completion state:', completionSet.size, 'completed assignments');
      } else {
        console.log('🔄 NO saved completion state found');
      }
      setCompletionStateLoaded(true); // Mark as loaded
    } catch (error) {
      console.error('Error loading completion state:', error);
      setCompletionStateLoaded(true); // Mark as loaded even on error
    }
  }, []);

  // Save completion state to localStorage whenever it changes (but only after initial load)
  useEffect(() => {
    if (!completionStateLoaded) {
      console.log('🔄 SKIPPING save - completion state not loaded yet');
      return; // Don't save until we've loaded the initial state
    }
    try {
      const idsArray = Array.from(completedAssignmentIds);
      localStorage.setItem('completedAssignmentIds', JSON.stringify(idsArray));
      console.log('🔄 SAVED completion state:', idsArray.length, 'completed assignments');
    } catch (error) {
      console.error('Error saving completion state:', error);
    }
  }, [completedAssignmentIds, completionStateLoaded]);

  useEffect(() => {
    async function loadSchedule() {
      const savedSchedule = localStorage.getItem('userSchedule');
      
      // Use the new assignment persistence system
      const savedAssignments = loadAssignmentsWithBindings();
      
      if (savedSchedule) {
        const parsed = JSON.parse(savedSchedule);
        setSchedule(parsed);
      }
      
      if (savedAssignments) {
        // Deduplicate and clean assignments (but don't overwrite completion state)
        const cleanedAssignments = (() => {
          console.log('Before deduplication - Total assignments:', savedAssignments.length);
          
          // First pass: Remove problematic assignments
          const cleaned = savedAssignments.filter((assignment: any) => {
            const course = assignment.courseName || assignment.course || assignment.vsbCourseKey || '';
            const title = assignment.title || '';
            
            // Remove CP830 assignments
            const isOldCP830 = course.toLowerCase().includes('cp830') || course.toLowerCase().includes('cp-830');
            
            // Remove problematic Quiz#1 variants (keep only "Available" ones, remove "Due" and "Availability Ends")
            const isProblematicQuiz = title.includes('Quiz#1') && (
              title.includes('Availability Ends') || 
              title.includes('Due')
            );
            
            if (isOldCP830 || isProblematicQuiz) {
              console.log(`🗑️ REMOVING: "${title}" - Course: "${course}"`);
              return false;
            }
            
            return true;
          });
          
          // Second pass: Deduplicate by creating unique keys
          const seenAssignments = new Map<string, any>();
          const deduplicated = cleaned.filter((assignment: any) => {
            const course = assignment.courseName || assignment.course || assignment.vsbCourseKey || '';
            const title = assignment.title || '';
            const dueDate = assignment.dueDate || '';
            
            const normalizedTitle = title
              .replace(/ - Available$/, '')
              .replace(/ - Due$/, '')
              .replace(/ - Availability Ends$/, '')
              .trim();
            
            const uniqueKey = `${normalizedTitle}-${course}-${dueDate}`;
            
            if (seenAssignments.has(uniqueKey)) {
              console.log(`🔄 DUPLICATE FOUND: "${title}" - Course: "${course}" (keeping original)`);
              return false;
            } else {
              const normalizedAssignment = {
                ...assignment,
                title: normalizedTitle
              };
              seenAssignments.set(uniqueKey, normalizedAssignment);
              return true;
            }
          });
          
          const finalAssignments = Array.from(seenAssignments.values());
          
          console.log('After deduplication - Total assignments:', finalAssignments.length);
          console.log('Removed', savedAssignments.length - finalAssignments.length, 'duplicates and problematic assignments');
          
          return finalAssignments;
        })();
        
        // Save cleaned assignments
        saveAssignmentsWithBindings(cleanedAssignments);
        setAssignments(cleanedAssignments);
        console.log('✅ Assignment deduplication completed successfully');
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
              // --- Robust Refresh Prevention ---
              const now = Date.now();
              const attemptsRaw = sessionStorage.getItem('refreshAttempts');
              let attempts: { count: number; first: number } = attemptsRaw ? JSON.parse(attemptsRaw) : { count: 0, first: now };
              // If first attempt is older than 30s, reset
              if (now - attempts.first > 30_000) {
                attempts = { count: 0, first: now };
              }
              attempts.count++;
              sessionStorage.setItem('refreshAttempts', JSON.stringify(attempts));
              if (attempts.count > 3) {
                // Too many attempts in 30s, stop redirecting
                setIsLoading(false);
                console.error('Too many failed login attempts. Please check your credentials or try again later.');
                // Optionally show a message to the user here
                return;
              } else {
                window.location.href = '/login';
                return;
              }
            }
            
            const scheduleData = await scheduleResponse.json();
            
            // Separate classes and assignments from the combined schedule
            const allData = scheduleData.schedule || [];
            const classes = allData.filter((item: any) => item.type === 'class');
            const serverAssignments = allData.filter((item: any) => item.type === 'assignment');
            
            console.log('🔄 FRESH LOGIN: Server provided', serverAssignments.length, 'assignments');
            
            // Clean server assignments BEFORE syncing
            const cleanedServerAssignments = serverAssignments.filter((assignment: any) => {
              const course = assignment.courseName || assignment.course || assignment.vsbCourseKey || '';
              const title = assignment.title || '';
              
              // Remove problematic Quiz#1 variants (keep only clean ones)
              const isProblematicQuiz = title.includes('Quiz#1') && (
                title.includes('Availability Ends') || 
                title.includes('Due')
              );
              
              if (isProblematicQuiz) {
                console.log(`🗑️ REMOVING from server data: "${title}" - Course: "${course}"`);
                return false;
              }
              
              return true;
            });
            
            console.log('🔄 AFTER CLEANING: Server has', cleanedServerAssignments.length, 'clean assignments');
            
            // Store schedule normally (without assignments to prevent double-counting)
            localStorage.setItem('userSchedule', JSON.stringify(classes));
            
            // Use the new assignment persistence system with sync
            const syncedAssignments = syncAssignmentsAfterLogin(cleanedServerAssignments);
            
            setSchedule(classes); // Only store classes, not assignments
            setAssignments(syncedAssignments);
            
            console.log('📚 Fetched fresh data and synced with local course bindings');
            console.log('📊 Final counts - Classes:', classes.length, 'Assignments:', syncedAssignments.length);
          } catch (error) {
            // --- Robust Refresh Prevention (network error) ---
            const now = Date.now();
            const attemptsRaw = sessionStorage.getItem('refreshAttempts');
            let attempts: { count: number; first: number } = attemptsRaw ? JSON.parse(attemptsRaw) : { count: 0, first: now };
            if (now - attempts.first > 30_000) {
              attempts = { count: 0, first: now };
            }
            attempts.count++;
            sessionStorage.setItem('refreshAttempts', JSON.stringify(attempts));
            if (attempts.count > 3) {
              setIsLoading(false);
              console.error('Too many failed login attempts (network error). Please check your connection or try again later.');
              return;
            } else {
              window.location.href = '/login';
              return;
            }
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

  // Function to deduplicate and clean assignments
  const deduplicateAndCleanAssignments = () => {
    try {
      // Clear from main assignment data
      const savedAssignments = loadAssignmentsWithBindings();
      if (savedAssignments) {
        console.log('Before deduplication - Total assignments:', savedAssignments.length);
        
        // First pass: Remove problematic assignments
        const cleanedAssignments = savedAssignments.filter((assignment: any) => {
          const course = assignment.courseName || assignment.course || assignment.vsbCourseKey || '';
          const title = assignment.title || '';
          
          // Remove CP830 assignments
          const isOldCP830 = course.toLowerCase().includes('cp830') || course.toLowerCase().includes('cp-830');
          
          // Remove problematic Quiz#1 variants (keep only "Available" ones, remove "Due" and "Availability Ends")
          const isProblematicQuiz = title.includes('Quiz#1') && (
            title.includes('Availability Ends') || 
            title.includes('Due')
          );
          
          if (isOldCP830 || isProblematicQuiz) {
            console.log(`🗑️ REMOVING: "${title}" - Course: "${course}"`);
            return false;
          }
          
          return true;
        });
        
        // Second pass: Deduplicate by creating unique keys
        const seenAssignments = new Map<string, any>();
        const deduplicatedAssignments = cleanedAssignments.filter((assignment: any) => {
          const course = assignment.courseName || assignment.course || assignment.vsbCourseKey || '';
          const title = assignment.title || '';
          const dueDate = assignment.dueDate || '';
          
          // Create a unique key for deduplication
          // Normalize the title by removing status suffixes
          const normalizedTitle = title
            .replace(/ - Available$/, '')
            .replace(/ - Due$/, '')
            .replace(/ - Availability Ends$/, '')
            .trim();
          
          const uniqueKey = `${normalizedTitle}-${course}-${dueDate}`;
          
          if (seenAssignments.has(uniqueKey)) {
            console.log(`� DUPLICATE FOUND: "${title}" - Course: "${course}" (keeping original)`);
            return false; // Skip duplicate
          } else {
            // Store the normalized assignment
            const normalizedAssignment = {
              ...assignment,
              title: normalizedTitle
            };
            seenAssignments.set(uniqueKey, normalizedAssignment);
            return true;
          }
        });
        
        // Update the assignments with normalized titles
        const finalAssignments = Array.from(seenAssignments.values());
        
        console.log('After deduplication - Total assignments:', finalAssignments.length);
        console.log('Removed', savedAssignments.length - finalAssignments.length, 'duplicates and problematic assignments');
        
        // Use the new persistence system
        saveAssignmentsWithBindings(finalAssignments);
        
        // Update state to reflect changes
        setAssignments(finalAssignments);
        
        console.log('✅ Assignment deduplication completed successfully');
      }
      
    } catch (error) {
      console.error('Error deduplicating assignments:', error);
    }
  };

  // Clear old CP830 assignments - only remove specific problematic assignments
  const clearTestAssignments = () => {
    // Only clear if there are no real assignments, don't clear everything
    const savedAssignments = loadAssignmentsWithBindings();
    if (!savedAssignments || savedAssignments.length === 0) {
      clearAssignmentData();
      setAssignments([]);
      console.log('🧹 Cleared test assignments (no real assignments found)');
    } else {
      console.log('🧹 Skipped clearing assignments - real assignments found:', savedAssignments.length);
    }
  };

  // Manual cleanup function for debugging
  const manualCleanup = () => {
    console.log('🔧 Manual cleanup initiated...');
    window.location.reload(); // Reload to see changes
  };

  // Expose cleanup function for debugging
  useEffect(() => {
    (window as any).manualCleanup = manualCleanup;
    (window as any).clearTestAssignments = clearTestAssignments;
  }, []);

  const closeAssignmentDetails = () => {
    setSelectedAssignment(null);
  };

  // Helper functions for assignment completion management
  const getAssignmentId = (assignment: any) => {
    return `${assignment.title}-${assignment.course || assignment.courseName}-${assignment.dueDate}`;
  };

  const isAssignmentCompleted = (assignment: any) => {
    return completedAssignmentIds.has(getAssignmentId(assignment));
  };

  const markAssignmentAsComplete = (assignment: any) => {
    const assignmentId = getAssignmentId(assignment);
    if (!completedAssignmentIds.has(assignmentId)) {
      setCompletedAssignmentIds(prev => new Set([...prev, assignmentId]));
    }
  };

  const markAssignmentAsIncomplete = (assignment: any) => {
    const assignmentId = getAssignmentId(assignment);
    setCompletedAssignmentIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(assignmentId);
      return newSet;
    });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-background">
        {/* Hide sidebar on mobile */}
        <div className="hidden lg:block">
          <Sidebar />
        </div>
        <main className="flex-1 flex flex-col">
          <DashboardHeader />
          <div className="flex-1 p-3 md:p-6 space-y-4 md:space-y-6 pb-20 lg:pb-6">
            <StatsCards />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
              <div className="lg:col-span-2 space-y-2">
                <Skeleton className="h-8 md:h-12 w-1/2 md:w-1/3" />
                <Skeleton className="h-[300px] md:h-[500px] w-full" />
              </div>
              <div className="space-y-4 md:space-y-6">
                <Skeleton className="h-[200px] md:h-[300px] w-full" />
                <Skeleton className="h-[150px] md:h-[200px] w-full" />
              </div>
            </div>
          </div>
          
          {/* Mobile Bottom Navigation */}
          <MobileBottomNav onSearchClick={() => setShowMobileSearch(true)} />
        </main>
      </div>
    )
  }
  
  // --- FIXED: Deduplicate ALL assignment sources ---
  const scheduleEvents = schedule || [];
  const assignmentEvents = assignments ? assignments.map((assignment: any) => ({
    ...assignment,
    type: 'assignment'
  })) : [];
  
  console.log('🔍 DEBUG: Creating assignment events from assignments state:', assignments?.length || 0);
  console.log('🔍 DEBUG: Assignment events created:', assignmentEvents.length);
  console.log('🔍 DEBUG: Schedule events:', scheduleEvents.length);
  
  // Get assignments from schedule data (these might be duplicates)
  const scheduleAssignments = scheduleEvents.filter(event => event.type === 'assignment');
  console.log('🔍 DEBUG: Assignments from schedule:', scheduleAssignments.length);
  
  // Combine ALL assignments and deduplicate them
  const allAssignments = [...assignmentEvents, ...scheduleAssignments];
  console.log('🔍 DEBUG: Total assignments before final dedup:', allAssignments.length);
  
  // Apply the same deduplication logic here
  const deduplicatedAssignments = (() => {
    const seenAssignments = new Map<string, any>();
    return allAssignments.filter((assignment: any) => {
      const course = assignment.courseName || assignment.course || assignment.vsbCourseKey || '';
      const title = assignment.title || '';
      const dueDate = assignment.dueDate || '';
      
      // Normalize the title by removing status suffixes
      const normalizedTitle = title
        .replace(/ - Available$/, '')
        .replace(/ - Due$/, '')
        .replace(/ - Availability Ends$/, '')
        .trim();
      
      const uniqueKey = `${normalizedTitle}-${course}-${dueDate}`;
      
      if (seenAssignments.has(uniqueKey)) {
        console.log(`🚫 RUNTIME DUPLICATE: "${title}" - Course: "${course}"`);
        return false; // Skip duplicate
      } else {
        seenAssignments.set(uniqueKey, {
          ...assignment,
          title: normalizedTitle
        });
        return true;
      }
    });
  })();
  
  console.log('🔍 DEBUG: Assignments after final dedup:', deduplicatedAssignments.length);
  
  // Use only non-assignment schedule events + deduplicated assignments
  const nonAssignmentScheduleEvents = scheduleEvents.filter(event => event.type !== 'assignment');
  const allEvents = [...nonAssignmentScheduleEvents, ...deduplicatedAssignments];
  const upcomingAssignments = deduplicatedAssignments;
  
  console.log('🔍 DEBUG: Upcoming assignments for panel:', upcomingAssignments.length);
  console.log('🔍 DEBUG: First few upcoming assignments:', upcomingAssignments.slice(0, 3));
  
  // Generate finished assignments from completed state
  const finishedAssignments = upcomingAssignments
    .filter(assignment => isAssignmentCompleted(assignment))
    .map(assignment => ({
      title: assignment.title,
      course: assignment.course || assignment.courseName,
      completedDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      grade: 'Completed'
    }));

  console.log('🎯 COMPLETION DEBUG:', {
    totalAssignments: upcomingAssignments.length,
    completedCount: finishedAssignments.length,
    completedIds: Array.from(completedAssignmentIds),
    finishedAssignments: finishedAssignments.map(a => a.title)
  });

  // Function to get assignments for a specific course - defined here so it can access upcomingAssignments
  const getAssignmentsForCourse = (courseKey: string): { pending: any[], completed: any[] } => {
    // Use the actual upcoming assignments from allEvents, not the empty assignments state
    const availableAssignments = upcomingAssignments;
    
    if (!availableAssignments || availableAssignments.length === 0) {
      console.log(`🔍 No assignments available for course: ${courseKey}`);
      return { pending: [], completed: [] };
    }
    
    console.log(`🔍 Looking for assignments for course: "${courseKey}"`);
    console.log(`📋 Total assignments available:`, availableAssignments.length);
    
    // Normalize course key for comparison
    const normalizeCourseCode = (code: string): string => {
      return code.replace(/[-\s]/g, '').toUpperCase();
    };
    
    const normalizedCourseKey = normalizeCourseCode(courseKey);
    console.log(`🎯 Normalized course key: "${normalizedCourseKey}"`);
    
    const matchedAssignments = availableAssignments.filter((assignment: any) => {
      // Try multiple course fields - prioritize vsbCourseKey which has the correct VSB format
      const vsbKey = assignment.vsbCourseKey || '';
      const courseName = assignment.courseName || '';
      const course = assignment.course || '';
      
      const normalizedVsbKey = normalizeCourseCode(vsbKey);
      const normalizedCourseName = normalizeCourseCode(courseName);
      const normalizedCourse = normalizeCourseCode(course);
      
      // Check multiple matching strategies
      const vsbMatch = normalizedVsbKey === normalizedCourseKey;
      const courseNameMatch = normalizedCourseName === normalizedCourseKey;
      const courseMatch = normalizedCourse === normalizedCourseKey;
      
      // Also try partial matches (contains)
      const vsbContains = normalizedVsbKey.includes(normalizedCourseKey) || normalizedCourseKey.includes(normalizedVsbKey);
      const courseNameContains = normalizedCourseName.includes(normalizedCourseKey) || normalizedCourseKey.includes(normalizedCourseName);
      const courseContains = normalizedCourse.includes(normalizedCourseKey) || normalizedCourseKey.includes(normalizedCourse);
      
      const isMatch = vsbMatch || courseNameMatch || courseMatch || vsbContains || courseNameContains || courseContains;
      
      if (isMatch) {
        console.log(`✅ MATCH FOUND for "${assignment.title}" with course "${courseKey}"`);
      }
      
      return isMatch;
    });
    
    // Separate into completed and pending assignments
    const pending = matchedAssignments.filter(assignment => !isAssignmentCompleted(assignment));
    const completed = matchedAssignments.filter(assignment => isAssignmentCompleted(assignment));
    
    console.log(`🎯 Found ${pending.length} pending and ${completed.length} completed assignments for course "${courseKey}"`);
    return { pending, completed };
  };

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
      
      // Only count items that look like actual course codes (e.g., "CPS-710", "COE-758")
      // Filter out descriptive titles like "Intro to Computer Vision"
      const courseCodePattern = /^[A-Z]{2,4}-?\d{2,4}[A-Z]?$/;
      
      if (courseKey && courseKey.trim() !== '' && courseCodePattern.test(courseKey)) {
        uniqueCourseKeys.add(courseKey);
        
        // Use the course key as display name (since it's already clean like "CPS109")
        courseKeyToDisplayName.set(courseKey, courseKey);
      }
    });

    // Debug: Show the VSB course structure
    const courseKeys = Array.from(uniqueCourseKeys);
    const courseNames = courseKeys.map(key => courseKeyToDisplayName.get(key) || key);
    
    console.log("Active courses being counted:", courseNames);

    return {
      activeCourses: courseNames.length,
      courseNames: courseNames
    };
  })() : undefined;

  return (
    <div className="flex min-h-screen bg-background">
      {/* Hide sidebar on mobile devices (screens smaller than lg) */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>
      <main className="flex-1 flex flex-col">
        <DashboardHeader />
        {/* Add bottom padding on mobile to account for bottom navigation */}
        <div className="flex-1 p-3 md:p-6 space-y-4 md:space-y-6 pb-20 lg:pb-6">
          <div data-testid="stats-cards">
            <StatsCards 
              assignmentStats={assignmentStats || undefined} 
              courseStats={courseStats}
            />
          </div>
          
          {/* Mobile: Stack everything vertically, Desktop: 3-column grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
            <div className="lg:col-span-2 space-y-4 md:space-y-6">
              {/* Course Detail Card - shown above calendar when a course is selected */}
              {selectedCourse && (
                <CourseDetailCard 
                  courseDetails={selectedCourse} 
                  assignments={getAssignmentsForCourse(selectedCourse.key)}
                  onClose={() => setSelectedCourse(null)}
                  onAssignmentClick={handleAssignmentClick}
                  isAssignmentCompleted={isAssignmentCompleted}
                  markAssignmentAsComplete={markAssignmentAsComplete}
                  markAssignmentAsIncomplete={markAssignmentAsIncomplete}
                />
              )}
              {/* Assignment Detail Card - shown above calendar when an assignment is selected */}
              {selectedAssignment && (
                <AssignmentDetailCard 
                  assignment={selectedAssignment}
                  onClose={() => setSelectedAssignment(null)}
                  isAssignmentCompleted={isAssignmentCompleted}
                  markAssignmentAsComplete={markAssignmentAsComplete}
                  markAssignmentAsIncomplete={markAssignmentAsIncomplete}
                />
              )}
              {/* The calendar receives all events to display them visually */}
              <div data-testid="weekly-calendar">
                <WeeklyCalendar 
                  events={allEvents} 
                  onCourseClick={handleCourseClick}
                  onAssignmentClick={handleAssignmentClick}
                />
              </div>
            </div>
            <div className="space-y-4 md:space-y-6">
              {/* The assignments panel receives only the assignment events for its list */}
              <div data-testid="assignments-panel">
                <AssignmentsPanel 
                  upcoming={upcomingAssignments}
                  finished={finishedAssignments}
                  onStatsChange={setAssignmentStats}
                  isAssignmentCompleted={isAssignmentCompleted}
                  markAssignmentAsComplete={markAssignmentAsComplete}
                  markAssignmentAsIncomplete={markAssignmentAsIncomplete}
                />
              </div>
              <QuickActions />
            </div>
          </div>
        </div>
        
        {/* Mobile Bottom Navigation */}
        <MobileBottomNav onSearchClick={() => setShowMobileSearch(true)} />
      </main>
    </div>
  )
}
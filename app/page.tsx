"use client"

import { useState, useEffect, useMemo } from "react";
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
dayjs.extend(isBetween);
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
import { ClassEditModal, getHiddenClasses } from "@/components/class-edit-modal";
import {
  saveAssignmentsWithBindings,
  loadAssignmentsWithBindings,
  syncAssignmentsAfterLogin,
  clearAssignmentData
} from "@/lib/assignment-persistence";

export default function DashboardPage() {
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [mounted, setMounted] = useState(false);
  const [schedule, setSchedule] = useState<any[] | null>(null);
  const [assignments, setAssignments] = useState<any[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshAssignments = async () => {
    try {
      const res = await fetch('/api/user/assignments');
      if (res.ok) {
        const serverData = await res.json();
        const merged = syncAssignmentsAfterLogin(serverData);
        setAssignments(merged);
      }
    } catch (e) {
      console.error("Failed to refresh assignments", e);
    }
  };
  const [selectedCourse, setSelectedCourse] = useState<any | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<any | null>(null);
  const [assignmentStats, setAssignmentStats] = useState<{
    completed: number;
    total: number;
    viewContext: string;
  } | null>(null);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [classEditModalOpen, setClassEditModalOpen] = useState(false);
  const [selectedClassForEdit, setSelectedClassForEdit] = useState<any | null>(null);

  // Shared assignment completion state - initialized with a flag to prevent premature saving
  const [completedAssignmentIds, setCompletedAssignmentIds] = useState<Set<string>>(new Set());
  const [completionStateLoaded, setCompletionStateLoaded] = useState(false);

  // New: User data from Firebase
  const [firstName, setFirstName] = useState<string>("there");
  const [weeklyClassHours, setWeeklyClassHours] = useState<number>(0);

  // New: Class Customizations State
  interface ClassCustomization {
    classId: string;
    customDescription?: string;
    customNotes?: string;
    linkedAssignments?: string[];
    hidden?: boolean;
    customColor?: string;
  }

  const [classCustomizations, setClassCustomizations] = useState<Record<string, ClassCustomization>>({});

  // Load class customizations from API on mount
  useEffect(() => {
    async function loadCustomizations() {
      try {
        const response = await fetch('/api/user/customizations');
        if (response.ok) {
          const data = await response.json();
          if (data.customizations) {
            setClassCustomizations(data.customizations);
          }
        }
      } catch (error) {
        console.error('Error loading customizations:', error);
      }
    }
    loadCustomizations();
  }, []);

  // Handle saving class customizations
  const handleClassSave = async (customization: any) => {
    // Update local state immediately
    const updated = { ...classCustomizations, [customization.classId]: customization };
    setClassCustomizations(updated);

    // Persist to API
    try {
      await fetch('/api/user/customizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId: customization.classId,
          customization
        })
      });
      console.log('Class customization saved to API');
    } catch (error) {
      console.error('Failed to save customization:', error);
    }
  };

  // Handle hiding a class
  const handleClassHide = async (classId: string) => {
    // Create new customization with hidden=true, preserving other fields
    const existing = classCustomizations[classId] || { classId };
    const customization = { ...existing, hidden: true };

    await handleClassSave(customization);
  };

  // Filter schedule to exclude hidden classes
  const visibleSchedule = useMemo(() => {
    if (!schedule) return [];
    return schedule.filter(event => {
      const classId = event.id || event.title; // Match ID logic in ClassEditModal
      const customization = classCustomizations[classId];
      // If no ID match, try matching by Title as fallback since ICS events might re-generate IDs
      // But titles are usually stable for courses
      const customizationByTitle = classCustomizations[event.title];
      return !(customization?.hidden || customizationByTitle?.hidden);
    });
  }, [schedule, classCustomizations]);

  // Apply customizations to selected course for display
  const displaySelectedCourse = useMemo(() => {
    if (!selectedCourse) return null;
    const classId = selectedCourse.id || selectedCourse.title; // ID or Title
    const customization = classCustomizations[classId] || classCustomizations[selectedCourse.title];

    if (customization) {
      return {
        ...selectedCourse,
        description: customization.customDescription || selectedCourse.description,
        // We could also inject notes or color here if CourseDetailCard supports it
      };
    }
    return selectedCourse;
  }, [selectedCourse, classCustomizations]);

  // Hydration safety check
  useEffect(() => {
    setMounted(true);
  }, []);

  // Load completion state from Firebase on mount
  useEffect(() => {
    async function loadCompletionState() {
      try {
        // First try to load from Firebase
        const response = await fetch('/api/user/assignment-states', { credentials: 'include' });
        if (response.ok) {
          const data = await response.json();
          if (data.completedIds && data.completedIds.length > 0) {
            const completionSet = new Set<string>(data.completedIds);
            setCompletedAssignmentIds(completionSet);
            console.log('🔄 RESTORED completion state from Firebase:', completionSet.size, 'completed assignments');
            // Also sync to localStorage as backup
            localStorage.setItem('completedAssignmentIds', JSON.stringify(data.completedIds));
          } else {
            // Fall back to localStorage
            const savedCompletions = localStorage.getItem('completedAssignmentIds');
            if (savedCompletions) {
              const parsed = JSON.parse(savedCompletions);
              const completionSet = new Set<string>(parsed);
              setCompletedAssignmentIds(completionSet);
              console.log('🔄 RESTORED completion state from localStorage:', completionSet.size);
            }
          }
        } else {
          // API not available, use localStorage
          const savedCompletions = localStorage.getItem('completedAssignmentIds');
          if (savedCompletions) {
            const parsed = JSON.parse(savedCompletions);
            setCompletedAssignmentIds(new Set<string>(parsed));
          }
        }
      } catch (error) {
        console.error('Error loading completion state:', error);
        // Fall back to localStorage
        const savedCompletions = localStorage.getItem('completedAssignmentIds');
        if (savedCompletions) {
          setCompletedAssignmentIds(new Set<string>(JSON.parse(savedCompletions)));
        }
      } finally {
        setCompletionStateLoaded(true);
      }
    }
    loadCompletionState();
  }, []);

  // Save completion state to Firebase (and localStorage as backup) whenever it changes
  useEffect(() => {
    if (!completionStateLoaded) {
      return; // Don't save until we've loaded the initial state
    }

    const idsArray = Array.from(completedAssignmentIds);

    // Save to localStorage immediately
    try {
      localStorage.setItem('completedAssignmentIds', JSON.stringify(idsArray));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }

    // Save to Firebase (debounced)
    const saveToFirebase = async () => {
      try {
        await fetch('/api/user/assignment-states', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ completedIds: idsArray }),
          credentials: 'include',
        });
        console.log('🔄 SAVED completion state to Firebase:', idsArray.length, 'completed');
      } catch (error) {
        console.error('Error saving to Firebase:', error);
      }
    };

    // Debounce Firebase saves to avoid too many requests
    const timeoutId = setTimeout(saveToFirebase, 500);
    return () => clearTimeout(timeoutId);
  }, [completedAssignmentIds, completionStateLoaded]);

  // Load user data (firstName) from Firebase/API
  useEffect(() => {
    async function loadUserData() {
      try {
        const response = await fetch('/api/user/data', { credentials: 'include' });
        if (response.ok) {
          const data = await response.json();
          if (data.firstName) {
            setFirstName(data.firstName);
          }
          if (data.cachedData?.weeklyClassHours) {
            setWeeklyClassHours(data.cachedData.weeklyClassHours);
          }
        }
      } catch (error) {
        console.log('User data not available, using defaults');
      }
    }
    loadUserData();
  }, []);

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
        // No saved data, fetch from Firebase/ICS backend
        async function fetchData() {
          try {
            // Use the new Firebase-based user data API
            const response = await fetch('/api/user/data', { credentials: 'include' });

            if (!response.ok) {
              if (response.status === 401) {
                // Not logged in - redirect to login
                console.log('📚 Not authenticated, redirecting to login');
                window.location.href = '/login';
                return;
              }

              const data = await response.json();
              if (data.needsSetup) {
                // User is logged in but needs to set up ICS URLs
                console.log('📚 User needs to configure ICS URLs in settings');
                setIsLoading(false);
                return;
              }

              throw new Error(data.error || 'Failed to load user data');
            }

            const userData = await response.json();
            console.log('📚 Loaded user data from Firebase:', userData);

            // Set firstName if available
            if (userData.firstName) {
              setFirstName(userData.firstName);
            }

            // Process cached data if available
            if (userData.cachedData) {
              const { assignments: cachedAssignments, classEvents: cachedClasses, weeklyClassHours } = userData.cachedData;

              if (cachedAssignments && cachedAssignments.length > 0) {
                // Transform ICS assignments to match expected format
                const formattedAssignments = cachedAssignments.map((a: any) => ({
                  ...a,
                  type: 'assignment',
                  priority: 'medium', // Default priority
                }));

                setAssignments(formattedAssignments);
                saveAssignmentsWithBindings(formattedAssignments);
                console.log('📚 Loaded', formattedAssignments.length, 'assignments from ICS');
              }

              // Handle class events for calendar display
              if (cachedClasses && cachedClasses.length > 0) {
                const formattedClasses = cachedClasses.map((c: any) => {
                  const startDate = dayjs(c.startDate);
                  const endDate = dayjs(c.endDate);
                  const durationHours = endDate.diff(startDate, 'hour', true);

                  // Use dayOfWeek from ICS parser if available (for recurring events)
                  // Otherwise calculate from startDate
                  const dayOfWeek = c.dayOfWeek !== undefined ? c.dayOfWeek : startDate.day();

                  return {
                    id: c.id,
                    title: c.title,
                    course: c.course,
                    courseName: c.title,
                    // WeeklyCalendar expected format: day is 0-6 (Sunday=0), gridColumnStart adds 2
                    day: dayOfWeek + 1, // 1-7 format for the calendar grid
                    startTime: startDate.format('h:mm A'),
                    duration: Math.max(durationHours, 1), // Minimum 1 hour
                    // Also keep original dates for filtering
                    startDate: c.startDate,
                    endDate: c.endDate,
                    location: c.location,
                    type: 'class',
                  };
                });
                setSchedule(formattedClasses);
                localStorage.setItem('userSchedule', JSON.stringify(formattedClasses));
                console.log('📚 Loaded', formattedClasses.length, 'class events for calendar');
              }

              if (weeklyClassHours) {
                setWeeklyClassHours(weeklyClassHours);
              }

              // Also trigger refresh if we have ICS URLs but no classEvents in cache (migration case)
              const hasIcsUrls = userData.icsUrls?.d2l || userData.icsUrls?.googleCalendar;
              const missingClassEvents = !cachedClasses || cachedClasses.length === 0;

              if (hasIcsUrls && missingClassEvents) {
                console.log('📚 Cached data missing classEvents, triggering refresh...');
                try {
                  const refreshResponse = await fetch('/api/user/data', {
                    method: 'POST',
                    credentials: 'include'
                  });

                  if (refreshResponse.ok) {
                    const refreshedData = await refreshResponse.json();
                    if (refreshedData.cachedData?.classEvents) {
                      const formattedClasses = refreshedData.cachedData.classEvents.map((c: any) => {
                        const startDate = dayjs(c.startDate);
                        const endDate = dayjs(c.endDate);
                        const durationHours = endDate.diff(startDate, 'hour', true);
                        const dayOfWeek = c.dayOfWeek !== undefined ? c.dayOfWeek : startDate.day();

                        return {
                          id: c.id,
                          title: c.title,
                          course: c.course,
                          courseName: c.title,
                          day: dayOfWeek + 1,
                          startTime: startDate.format('h:mm A'),
                          duration: Math.max(durationHours, 1),
                          startDate: c.startDate,
                          endDate: c.endDate,
                          location: c.location,
                          type: 'class',
                        };
                      });
                      setSchedule(formattedClasses);
                      localStorage.setItem('userSchedule', JSON.stringify(formattedClasses));
                      console.log('📚 Refreshed and loaded', formattedClasses.length, 'class events');
                    }
                  }
                } catch (refreshError) {
                  console.error('Failed to refresh for classEvents:', refreshError);
                }
              }
            } else if (userData.icsUrls?.d2l || userData.icsUrls?.googleCalendar) {
              // User has ICS URLs but no cached data at all - trigger a refresh
              console.log('📚 ICS URLs configured but no cached data, triggering refresh...');
              try {
                const refreshResponse = await fetch('/api/user/data', {
                  method: 'POST',
                  credentials: 'include'
                });

                if (refreshResponse.ok) {
                  const refreshedData = await refreshResponse.json();
                  if (refreshedData.cachedData?.assignments) {
                    const formattedAssignments = refreshedData.cachedData.assignments.map((a: any) => ({
                      ...a,
                      type: 'assignment',
                      priority: 'medium',
                    }));
                    setAssignments(formattedAssignments);
                    saveAssignmentsWithBindings(formattedAssignments);
                    console.log('📚 Refreshed and loaded', formattedAssignments.length, 'assignments');
                  }
                  if (refreshedData.cachedData?.classEvents) {
                    const formattedClasses = refreshedData.cachedData.classEvents.map((c: any) => {
                      const startDate = dayjs(c.startDate);
                      const endDate = dayjs(c.endDate);
                      const durationHours = endDate.diff(startDate, 'hour', true);
                      const dayOfWeek = c.dayOfWeek !== undefined ? c.dayOfWeek : startDate.day();

                      return {
                        id: c.id,
                        title: c.title,
                        course: c.course,
                        courseName: c.title,
                        day: dayOfWeek + 1,
                        startTime: startDate.format('h:mm A'),
                        duration: Math.max(durationHours, 1),
                        startDate: c.startDate,
                        endDate: c.endDate,
                        location: c.location,
                        type: 'class',
                      };
                    });
                    setSchedule(formattedClasses);
                    localStorage.setItem('userSchedule', JSON.stringify(formattedClasses));
                    console.log('📚 Refreshed and loaded', formattedClasses.length, 'class events');
                  }
                  if (refreshedData.cachedData?.weeklyClassHours) {
                    setWeeklyClassHours(refreshedData.cachedData.weeklyClassHours);
                  }
                }
              } catch (refreshError) {
                console.error('Failed to refresh ICS data:', refreshError);
              }
            }

            console.log('📚 Dashboard data loading complete');
          } catch (error) {
            console.error('Failed to load dashboard data:', error);
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
    // Store for potential editing - Normalize to ensure we have title/id
    // If we have clickedEvent (from WeeklyCalendar), use that as it's the raw event
    const editData = courseData.clickedEvent || courseData;
    setSelectedClassForEdit(editData);

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



  // --- FIXED: Deduplicate ALL assignment sources ---
  const rawScheduleEvents = schedule || [];

  // Apply customizations (Hide/Description) to schedule events
  const scheduleEvents = rawScheduleEvents
    .map((event: any) => {
      if (event.type === 'assignment') return event;

      const classId = event.id || event.title;
      const custom = classCustomizations[classId] || classCustomizations[event.title];
      const result = { ...event };

      if (custom?.hidden) result.hidden = true;
      // Apply custom description if exists
      if (custom?.customDescription) {
        result.description = custom.customDescription;
      }
      return result;
    });
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

    // First, apply linking from customizations to all assignments
    const linkedAssignments = allAssignments.map((assignment: any) => {
      const linkedCustom = Object.values(classCustomizations).find(c => c.linkedAssignments?.includes(assignment.title));
      if (linkedCustom) {
        const linkedCourseId = linkedCustom.classId;
        // Extract code (e.g. "ELE 888") from ID if possible
        const codeMatch = linkedCourseId.match(/^([A-Z]{3,4}\s?\d{3})/i);
        const code = codeMatch ? codeMatch[1].toUpperCase() : linkedCourseId;

        // Return updated assignment with linked course info
        return {
          ...assignment,
          course: code,
          courseName: code,
          vsbCourseKey: code,
          // Force type to assignments
          type: 'assignment'
        };
      }
      return assignment;
    });

    return linkedAssignments.filter((assignment: any) => {
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

  // Filter events for the currently visible week
  const visibleEventsForStats = useMemo(() => {
    const start = currentDate.startOf('week');
    const end = currentDate.endOf('week');

    return allEvents.filter((event: any) => {
      if (event.hidden) return false;

      if (event.type === 'assignment') {
        if (!event.dueDate) return false;
        return dayjs(event.dueDate).isBetween(start, end, 'day', '[]');
      }

      // For classes, they are technically active every week, 
      // but we should respect if they are hidden.
      return true;
    });
  }, [allEvents, currentDate]);

  // Calculate course statistics
  const courseStats = visibleEventsForStats.length > 0 ? (() => {
    // Use the course keys from VSB (stored in courseName field from scraper)
    const uniqueCourseKeys = new Set<string>();
    const courseKeyToDisplayName = new Map<string, string>();

    visibleEventsForStats.forEach((event: any) => { // Use typed event
      const courseKey = event.courseName;

      // RELAXED PATTERN: Just check if it looks like a course code (letters + numbers)
      // or if it's a known course key format
      const isLikelyCourse = courseKey && (
        /^[A-Z]{2,4}[\s-]?\d{2,4}/i.test(courseKey) || // Starts with code like CPS109
        (event.type === 'class') // Or is explicitly a class event
      );

      if (isLikelyCourse && courseKey && courseKey.trim() !== '') {
        uniqueCourseKeys.add(courseKey);
        courseKeyToDisplayName.set(courseKey, courseKey);
      }
    });

    // Debug: Show the VSB course structure
    const courseKeys = Array.from(uniqueCourseKeys);
    const courseNames = courseKeys.map(key => courseKeyToDisplayName.get(key) || key);

    console.log("Active courses being counted:", courseNames);

    // Calculate weekly class hours from schedule events for THIS WEEK ONLY
    // Each class event that appears on the calendar for the current week counts once
    const weeklyHours = visibleEventsForStats
      .filter((event: any) => event.type === 'class')
      .reduce((total: any, event: any) => total + (event.duration || 0), 0);

    return {
      activeCourses: courseNames.length,
      courseNames: courseNames,
      weeklyClassHours: weeklyHours
    };
  })() : undefined;

  if (!mounted) {
    // Return minimal loading state to prevent hydration mismatch
    return (
      <div className="flex min-h-screen bg-background" suppressHydrationWarning>
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
          <MobileBottomNav onSearchClick={() => { }} />
        </main>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen bg-background">
        {/* Hide sidebar on mobile */}
        <div className="hidden lg:block">
          <Sidebar />
        </div>
        <main className="flex-1 flex flex-col">
          <DashboardHeader firstName={firstName} />
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

  return (
    <div className="flex min-h-screen bg-background" suppressHydrationWarning>
      {/* Hide sidebar on mobile devices (screens smaller than lg) */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>
      <main className="flex-1 flex flex-col">
        <DashboardHeader
          assignments={upcomingAssignments}
          classes={schedule || []}
          onAssignmentClick={handleAssignmentClick}
          onClassClick={handleCourseClick}
        />
        {/* Add bottom padding on mobile to account for bottom navigation */}
        <div className="flex-1 p-3 md:p-6 space-y-4 md:space-y-6 pb-20 lg:pb-6">
          <div data-testid="stats-cards">
            <StatsCards
              currentDate={currentDate}
              assignmentStats={assignmentStats || undefined}
              courseStats={courseStats}
              weeklyHours={{
                classHours: courseStats?.weeklyClassHours || 0,
                assignmentHours: upcomingAssignments?.length || 0,
                lastWeekTotal: 0,
              }}
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
                  onEdit={() => setClassEditModalOpen(true)}
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
                  currentDate={currentDate}
                  onDateChange={setCurrentDate}
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
                  onAssignmentClick={handleAssignmentClick}
                  onAssignmentAdded={refreshAssignments}
                />
              </div>
              <QuickActions />
            </div>
          </div>
        </div>

        {/* Mobile Bottom Navigation */}
        <MobileBottomNav onSearchClick={() => setShowMobileSearch(true)} />
      </main>

      {/* Class Edit Modal */}
      <ClassEditModal
        classEvent={selectedClassForEdit}
        open={classEditModalOpen}
        onOpenChange={setClassEditModalOpen}
        assignments={upcomingAssignments}
        customizations={selectedClassForEdit ? (classCustomizations[selectedClassForEdit.id || selectedClassForEdit.title] || classCustomizations[selectedClassForEdit.title]) : undefined}
        onSave={handleClassSave}
        onHide={handleClassHide}
      />
    </div>
  )
}
/**
 * Assignment Persistence & Course Binding Management
 * 
 * Ensures assignments retain their course bindings even when offline/logged out
 * and can re-sync properly when back online.
 */

interface Assignment {
  title: string;
  course: string;
  courseName?: string;
  vsbCourseKey?: string;
  vsbCourseName?: string;
  matchedToVSB?: boolean;
  matchedFromICS?: boolean;
  dueDate: string;
  description?: string;
  d2lUrl?: string;
  fullCourseInfo?: string;
  location?: string;
  priority?: 'high' | 'medium' | 'low';
  status?: string;
}

interface CourseBinding {
  originalCourse: string;
  vsbCourseKey?: string;
  vsbCourseName?: string;
  courseName?: string;
  matchedToVSB?: boolean;
  matchedFromICS?: boolean;
  lastUpdated: string;
}

const STORAGE_KEYS = {
  ASSIGNMENTS: 'userAssignments',
  COURSE_BINDINGS: 'courseBindings',
  ASSIGNMENTS_METADATA: 'assignmentsMetadata'
};

/**
 * Save assignments with their course bindings preserved
 */
export function saveAssignmentsWithBindings(assignments: Assignment[]): void {
  try {
    // Extract course bindings from assignments
    const courseBindings: Record<string, CourseBinding> = {};
    
    assignments.forEach(assignment => {
      const key = assignment.course;
      if (key && (assignment.vsbCourseKey || assignment.courseName || assignment.matchedToVSB)) {
        courseBindings[key] = {
          originalCourse: assignment.course,
          vsbCourseKey: assignment.vsbCourseKey,
          vsbCourseName: assignment.vsbCourseName,
          courseName: assignment.courseName,
          matchedToVSB: assignment.matchedToVSB,
          matchedFromICS: assignment.matchedFromICS,
          lastUpdated: new Date().toISOString()
        };
      }
    });

    // Save assignments
    localStorage.setItem(STORAGE_KEYS.ASSIGNMENTS, JSON.stringify(assignments));
    
    // Save course bindings separately for persistence
    localStorage.setItem(STORAGE_KEYS.COURSE_BINDINGS, JSON.stringify(courseBindings));
    
    // Save metadata
    const metadata = {
      lastSaved: new Date().toISOString(),
      assignmentCount: assignments.length,
      bindingCount: Object.keys(courseBindings).length
    };
    localStorage.setItem(STORAGE_KEYS.ASSIGNMENTS_METADATA, JSON.stringify(metadata));
    
    console.log('📚 Assignments saved with', Object.keys(courseBindings).length, 'course bindings preserved');
  } catch (error) {
    console.error('Error saving assignments with bindings:', error);
  }
}

/**
 * Load assignments and restore their course bindings
 */
export function loadAssignmentsWithBindings(): Assignment[] | null {
  try {
    const savedAssignments = localStorage.getItem(STORAGE_KEYS.ASSIGNMENTS);
    const savedBindings = localStorage.getItem(STORAGE_KEYS.COURSE_BINDINGS);
    
    if (!savedAssignments) {
      console.log('📚 No saved assignments found');
      return null;
    }

    let assignments: Assignment[] = JSON.parse(savedAssignments);
    
    // If we have saved bindings, restore them
    if (savedBindings) {
      const courseBindings: Record<string, CourseBinding> = JSON.parse(savedBindings);
      
      assignments = assignments.map(assignment => {
        const binding = courseBindings[assignment.course];
        if (binding) {
          return {
            ...assignment,
            vsbCourseKey: assignment.vsbCourseKey || binding.vsbCourseKey,
            vsbCourseName: assignment.vsbCourseName || binding.vsbCourseName,
            courseName: assignment.courseName || binding.courseName,
            matchedToVSB: assignment.matchedToVSB ?? binding.matchedToVSB,
            matchedFromICS: assignment.matchedFromICS ?? binding.matchedFromICS
          };
        }
        return assignment;
      });
      
      console.log('📚 Assignments loaded with course bindings restored');
    } else {
      console.log('📚 Assignments loaded without course bindings');
    }
    
    return assignments;
  } catch (error) {
    console.error('Error loading assignments with bindings:', error);
    return null;
  }
}

/**
 * Sync assignments after login - merge server data with local bindings
 */
export function syncAssignmentsAfterLogin(serverAssignments: Assignment[]): Assignment[] {
  try {
    const localBindings = localStorage.getItem(STORAGE_KEYS.COURSE_BINDINGS);
    
    if (!localBindings) {
      // No local bindings, use server data as-is
      saveAssignmentsWithBindings(serverAssignments);
      return serverAssignments;
    }

    const courseBindings: Record<string, CourseBinding> = JSON.parse(localBindings);
    
    // Merge server assignments with local course bindings
    const mergedAssignments = serverAssignments.map(assignment => {
      const binding = courseBindings[assignment.course];
      if (binding) {
        // Prefer server data, but fall back to local bindings if missing
        return {
          ...assignment,
          vsbCourseKey: assignment.vsbCourseKey || binding.vsbCourseKey,
          vsbCourseName: assignment.vsbCourseName || binding.vsbCourseName,
          courseName: assignment.courseName || binding.courseName,
          matchedToVSB: assignment.matchedToVSB ?? binding.matchedToVSB,
          matchedFromICS: assignment.matchedFromICS ?? binding.matchedFromICS
        };
      }
      return assignment;
    });

    // Save the merged result
    saveAssignmentsWithBindings(mergedAssignments);
    
    console.log('📚 Assignments synced after login with', Object.keys(courseBindings).length, 'local bindings preserved');
    return mergedAssignments;
  } catch (error) {
    console.error('Error syncing assignments after login:', error);
    return serverAssignments;
  }
}

/**
 * Clear all assignment data
 */
export function clearAssignmentData(): void {
  localStorage.removeItem(STORAGE_KEYS.ASSIGNMENTS);
  localStorage.removeItem(STORAGE_KEYS.COURSE_BINDINGS);
  localStorage.removeItem(STORAGE_KEYS.ASSIGNMENTS_METADATA);
  console.log('📚 All assignment data cleared');
}

/**
 * Get assignment metadata
 */
export function getAssignmentMetadata() {
  try {
    const metadata = localStorage.getItem(STORAGE_KEYS.ASSIGNMENTS_METADATA);
    return metadata ? JSON.parse(metadata) : null;
  } catch (error) {
    console.error('Error getting assignment metadata:', error);
    return null;
  }
}
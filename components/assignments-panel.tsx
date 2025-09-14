import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, CheckCircle, AlertCircle, Plus, Eye, EyeOff, RotateCcw } from "lucide-react"
import dayjs from 'dayjs';

interface Assignment {
  title: string;
  course: string;
  courseName?: string; // Full course name from ICS (e.g., "Software Project Management")
  fullCourseInfo?: string; // Complete location field from ICS
  description?: string; // Assignment description from ICS
  location?: string; // Location field from ICS
  d2lUrl?: string; // Direct link to assignment
  matchedFromICS?: boolean; // Whether course info was extracted from ICS location
  vsbCourseKey?: string; // Matched VSB course key
  vsbCourseName?: string; // Matched VSB course name
  matchedToVSB?: boolean; // Whether assignment was matched to a VSB course
  dueDate: string;
  priority: 'high' | 'medium' | 'low';
  status?: string; // e.g. 'pending', 'in-progress'
}

interface FinishedAssignment {
  title: string;
  course: string;
  completedDate: string;
  grade?: string;
}

interface AssignmentsPanelProps {
  upcoming: Assignment[];
  finished: FinishedAssignment[];
  onStatsChange?: (stats: { completed: number; total: number; viewContext: string }) => void;
}

export function AssignmentsPanel({ upcoming = [], finished = [], onStatsChange }: AssignmentsPanelProps) {
  console.log("AssignmentsPanel received props:", { upcoming: upcoming.length, finished: finished.length });
  
  const [showAllUpcoming, setShowAllUpcoming] = useState(false);
  const [completedAssignmentIds, setCompletedAssignmentIds] = useState<Set<string>>(new Set());
  const [localCompletedAssignments, setLocalCompletedAssignments] = useState<FinishedAssignment[]>([]);

  // Debug function to track state
  const debugCurrentState = () => {
    console.log('=== ASSIGNMENT PANEL DEBUG ===');
    console.log('Completed IDs:', Array.from(completedAssignmentIds));
    console.log('Local completed assignments:', localCompletedAssignments);
    console.log('Upcoming assignments from props:', upcoming.length);
    console.log('Filtered upcoming assignments:', remainingAssignments.length);
    console.log('================================');
  };

  // Load completion status on component mount
  useEffect(() => {
    const loadCompletionStatus = async () => {
      // First load from localStorage for immediate UI update
      const localData = localStorage.getItem('completedAssignments');
      if (localData) {
        try {
          const parsed = JSON.parse(localData);
          if (parsed.ids && parsed.ids.length > 0) {
            setCompletedAssignmentIds(new Set(parsed.ids));
          }
          if (parsed.assignments && parsed.assignments.length > 0) {
            setLocalCompletedAssignments(parsed.assignments);
          }
        } catch (error) {
          console.error('Error parsing localStorage data:', error);
        }
      }

      // Then sync with backend
      try {
        const response = await fetch('/api/assignments', {
          method: 'GET',
          credentials: 'include',
        });
        
        if (response.ok) {
          const backendData = await response.json();
          
          if (backendData.ids && backendData.ids.length > 0) {
            setCompletedAssignmentIds(new Set(backendData.ids));
          }
          if (backendData.assignments && backendData.assignments.length > 0) {
            setLocalCompletedAssignments(backendData.assignments);
          }
          console.log('Assignment completions loaded:', backendData.ids?.length || 0, 'completed');
        }
      } catch (error) {
        console.error('Failed to sync with backend, using localStorage data:', error);
      }
    };

    loadCompletionStatus();
  }, []); // Only run once on mount

  // Debug effect to track when props change
  useEffect(() => {
    console.log('AssignmentsPanel: Loaded', upcoming.length, 'upcoming,', finished.length, 'finished, completed count:', completedAssignmentIds.size);
  }, [upcoming, finished, completedAssignmentIds, localCompletedAssignments]);

  // Save completion status to both localStorage and backend whenever it changes
  useEffect(() => {
    const dataToSave = {
      ids: Array.from(completedAssignmentIds),
      assignments: localCompletedAssignments
    };
    
    // Save to localStorage immediately
    localStorage.setItem('completedAssignments', JSON.stringify(dataToSave));
    
    // Sync with backend
    const syncWithBackend = async () => {
      try {
        await fetch('/api/assignments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(dataToSave),
        });
      } catch (error) {
        console.error('Failed to sync with backend:', error);
      }
    };

    // Only sync if we have data (avoid initial empty sync)
    if (completedAssignmentIds.size > 0 || localCompletedAssignments.length > 0) {
      syncWithBackend();
    }
  }, [completedAssignmentIds, localCompletedAssignments]);

  // Create unique ID for assignment
  const getAssignmentId = (assignment: Assignment) => {
    const id = `${assignment.title}-${assignment.course}-${assignment.dueDate}`;
    return id;
  };

  // Handle marking assignment as complete
  const markAsComplete = (assignment: Assignment) => {
    const assignmentId = getAssignmentId(assignment);
    console.log('Marking assignment as complete:', assignmentId);
    
    if (!completedAssignmentIds.has(assignmentId)) {
      // Create completed assignment
      const completedAssignment: FinishedAssignment = {
        title: assignment.title,
        course: assignment.course,
        completedDate: dayjs().format('MMM D, YYYY'),
        grade: 'Completed'
      };
      
      // Add to completed
      const newCompletedIds = new Set([...completedAssignmentIds, assignmentId]);
      const newCompletedAssignments = [completedAssignment, ...localCompletedAssignments];
      
      setCompletedAssignmentIds(newCompletedIds);
      setLocalCompletedAssignments(newCompletedAssignments);
      
      console.log('Assignment marked complete:', assignmentId);
      console.log('New completed count:', newCompletedIds.size);
    } else {
      console.log('Assignment already completed:', assignmentId);
    }
  };

  // Handle moving assignment back to upcoming
  const moveBackToUpcoming = (completedAssignment: FinishedAssignment, index: number) => {
    // Find the original assignment to get the ID
    const originalAssignment = upcoming.find(a => 
      a.title === completedAssignment.title && 
      a.course === completedAssignment.course
    );
    
    if (originalAssignment) {
      const assignmentId = getAssignmentId(originalAssignment);
      
      // Remove from completed
      setCompletedAssignmentIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(assignmentId);
        return newSet;
      });
      
      // Remove from local completed assignments
      setLocalCompletedAssignments(prev => prev.filter((_, i) => i !== index));
    }
  };

  // Filter out completed assignments from upcoming
  const remainingAssignments = upcoming.filter(assignment => 
    !completedAssignmentIds.has(getAssignmentId(assignment))
  );
  
  // Combine original finished assignments with locally completed ones
  const allCompletedAssignments = [...localCompletedAssignments, ...finished];
  
  // Filter assignments within next 2 weeks
  const twoWeeksFromNow = dayjs().add(2, 'weeks');
  const upcomingWithinTwoWeeks = remainingAssignments.filter(assignment => 
    dayjs(assignment.dueDate).isBefore(twoWeeksFromNow)
  );
  const upcomingBeyondTwoWeeks = remainingAssignments.filter(assignment => 
    dayjs(assignment.dueDate).isAfter(twoWeeksFromNow) || dayjs(assignment.dueDate).isSame(twoWeeksFromNow)
  );
  
  const displayedUpcoming = showAllUpcoming ? remainingAssignments : upcomingWithinTwoWeeks;
  
  // Calculate completion stats based on current view
  const totalCompletedCount = allCompletedAssignments.length;
  
  // Dynamic stats based on current view (2-week vs all assignments)
  if (showAllUpcoming) {
    // When showing all assignments, use all data
    var currentViewTotalAssignments = upcoming.length; // upcoming.length is the original total from server
    var currentViewCompletedCount = totalCompletedCount;
  } else {
    // When showing 2-week view, count only assignments within 2 weeks
    const twoWeeksFromNow = dayjs().add(2, 'weeks');
    
    // Count remaining assignments within 2 weeks
    const remainingWithinTwoWeeks = upcomingWithinTwoWeeks.length;
    
    // Count completed assignments that were originally within 2 weeks
    const completedWithinTwoWeeks = Array.from(completedAssignmentIds).filter(id => {
      const originalAssignment = upcoming.find(assignment => getAssignmentId(assignment) === id);
      return originalAssignment && dayjs(originalAssignment.dueDate).isBefore(twoWeeksFromNow);
    }).length;
    
    var currentViewTotalAssignments = remainingWithinTwoWeeks + completedWithinTwoWeeks; // Total = remaining + completed
    var currentViewCompletedCount = completedWithinTwoWeeks;
  }

  // Notify parent component of stats changes
  useEffect(() => {
    if (onStatsChange) {
      onStatsChange({
        completed: currentViewCompletedCount,
        total: currentViewTotalAssignments,
        viewContext: showAllUpcoming ? 'all' : '2 weeks'
      });
    }
  }, [currentViewCompletedCount, currentViewTotalAssignments, showAllUpcoming, onStatsChange]);


  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg font-semibold">Upcoming Assignments</CardTitle>
              {!showAllUpcoming && upcomingBeyondTwoWeeks.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {upcomingBeyondTwoWeeks.length} more
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {upcomingBeyondTwoWeeks.length > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowAllUpcoming(!showAllUpcoming)}
                  className="text-xs"
                >
                  {showAllUpcoming ? (
                    <>
                      <EyeOff className="w-3 h-3 mr-1" />
                      Show Next 2 Weeks
                    </>
                  ) : (
                    <>
                      <Eye className="w-3 h-3 mr-1" />
                      View All
                    </>
                  )}
                </Button>
              )}
              <Button variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {displayedUpcoming.length > 0 ? displayedUpcoming.map((assignment, index) => (
            <div
              key={index}
              className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
            >
              <div className="flex-shrink-0 mt-1">
                {assignment.status === "in-progress" ? (
                  <Clock className="w-4 h-4 text-secondary" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-chart-3" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm text-foreground">{assignment.title}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${
                      assignment.matchedToVSB 
                        ? 'border-blue-500 text-blue-700 dark:text-blue-400' 
                        : assignment.matchedFromICS 
                          ? 'border-green-500 text-green-700 dark:text-green-400' 
                          : 'border-gray-500 text-gray-700 dark:text-gray-400'
                    }`}
                  >
                    {assignment.course}
                  </Badge>
                  {assignment.matchedToVSB && (
                    <span className="text-xs text-blue-600 dark:text-blue-400" title="Matched to VSB course">📚</span>
                  )}
                  {assignment.matchedFromICS && !assignment.matchedToVSB && (
                    <span className="text-xs text-green-600 dark:text-green-400" title="Course info from ICS">✓</span>
                  )}
                </div>
                {assignment.courseName && assignment.courseName !== assignment.course && (
                  <p className="text-xs text-muted-foreground mt-1 truncate" title={assignment.courseName}>
                    {assignment.courseName}
                  </p>
                )}
                {assignment.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2" title={assignment.description}>
                    {assignment.description.substring(0, 100)}...
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Due: {dayjs(assignment.dueDate).format('MMM D, h:mm A')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    assignment.priority === "high"
                      ? "destructive"
                      : assignment.priority === "medium"
                        ? "default"
                        : "secondary"
                  }
                >
                  {assignment.priority}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => markAsComplete(assignment)}
                  className="h-6 w-6 p-0 hover:bg-primary/10"
                  title="Mark as complete"
                >
                  <CheckCircle className="w-4 h-4 text-muted-foreground hover:text-primary" />
                </Button>
                {assignment.d2lUrl && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(assignment.d2lUrl, '_blank')}
                    className="h-6 w-6 p-0 hover:bg-primary/10"
                    title="Open in D2L"
                  >
                    <svg className="w-3 h-3 text-muted-foreground hover:text-primary" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.25 5.5a.75.75 0 00-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 00.75-.75v-4a.75.75 0 011.5 0v4A2.25 2.25 0 0112.75 17h-8.5A2.25 2.25 0 012 14.75v-8.5A2.25 2.25 0 014.25 4h5a.75.75 0 010 1.5h-5z" clipRule="evenodd" />
                      <path fillRule="evenodd" d="M6.194 12.753a.75.75 0 001.06.053L16.5 4.44v2.81a.75.75 0 001.5 0v-4.5a.75.75 0 00-.75-.75h-4.5a.75.75 0 000 1.5h2.553l-9.056 8.194a.75.75 0 00-.053 1.06z" clipRule="evenodd" />
                    </svg>
                  </Button>
                )}
              </div>
            </div>
          )) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              {showAllUpcoming ? "No upcoming assignments." : "No assignments due in the next 2 weeks."}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg font-semibold">Recent Completions</CardTitle>
              {currentViewCompletedCount > 0 && (
                <Badge variant="outline" className="text-primary border-primary text-xs">
                  {currentViewCompletedCount} completed{showAllUpcoming ? '' : ' (2 weeks)'}
                </Badge>
              )}
            </div>
            {currentViewTotalAssignments > 0 && (
              <div className="text-xs text-muted-foreground">
                {((currentViewCompletedCount / currentViewTotalAssignments) * 100).toFixed(0)}% done{showAllUpcoming ? '' : ' (2 weeks)'}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {allCompletedAssignments.length > 0 ? allCompletedAssignments.map((assignment, index) => (
            <div key={index} className="flex items-start gap-3 p-3 rounded-lg border border-border">
              <CheckCircle className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm text-foreground">{assignment.title}</h4>
                <p className="text-xs text-muted-foreground">{assignment.course}</p>
                <p className="text-xs text-muted-foreground mt-1">Completed: {assignment.completedDate}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-primary border-primary">
                  {assignment.grade}
                </Badge>
                {index < localCompletedAssignments.length && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => moveBackToUpcoming(assignment, index)}
                    className="h-6 w-6 p-0 hover:bg-secondary/50"
                    title="Move back to upcoming"
                  >
                    <RotateCcw className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                  </Button>
                )}
              </div>
            </div>
          )) : (
             <p className="text-sm text-muted-foreground text-center py-4">No recently completed assignments.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
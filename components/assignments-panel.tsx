import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, CheckCircle, AlertCircle, Plus, Eye, EyeOff, RotateCcw } from "lucide-react"
import dayjs from 'dayjs'
import { cn } from "@/lib/utils"

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
  isAssignmentCompleted?: (assignment: Assignment) => boolean;
  markAssignmentAsComplete?: (assignment: Assignment) => void;
  markAssignmentAsIncomplete?: (assignment: Assignment) => void;
}

export function AssignmentsPanel({ 
  upcoming = [], 
  finished = [], 
  onStatsChange,
  isAssignmentCompleted,
  markAssignmentAsComplete,
  markAssignmentAsIncomplete
}: AssignmentsPanelProps) {
  console.log("AssignmentsPanel received props:", { upcoming: upcoming.length, finished: finished.length });
  
  const [showAllUpcoming, setShowAllUpcoming] = useState(false);
  const [localCompletedAssignments, setLocalCompletedAssignments] = useState<FinishedAssignment[]>([]);
  const [isMobileView, setIsMobileView] = useState(false);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(window.innerWidth < 768); // md breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Debug function to track state
  const debugCurrentState = () => {
    console.log('=== ASSIGNMENT PANEL DEBUG ===');
    console.log('Local completed assignments:', localCompletedAssignments);
    console.log('Upcoming assignments from props:', upcoming.length);
    console.log('Parent completion function available:', !!isAssignmentCompleted);
    console.log('================================');
  };

  // Load local completed assignments for display only
  useEffect(() => {
    const localData = localStorage.getItem('completedAssignments');
    if (localData) {
      try {
        const parsed = JSON.parse(localData);
        if (parsed.assignments) {
          setLocalCompletedAssignments(parsed.assignments);
        }
        console.log('Local completed assignments loaded for display');
      } catch (error) {
        console.error('Error loading local completed assignments:', error);
      }
    }
  }, []); // Only run once on mount

  // Debug effect to track when props change
  useEffect(() => {
    const completedCount = upcoming.filter(assignment => isAssignmentCompleted?.(assignment)).length;
    console.log('AssignmentsPanel: Loaded', upcoming.length, 'upcoming,', finished.length, 'finished, completed count:', completedCount);
  }, [upcoming, finished, localCompletedAssignments, isAssignmentCompleted]);

  // Save local completed assignments to localStorage (for display purposes only)
  useEffect(() => {
    if (localCompletedAssignments.length > 0) {
      const dataToSave = {
        assignments: localCompletedAssignments
      };
      localStorage.setItem('completedAssignments', JSON.stringify(dataToSave));
    }
  }, [localCompletedAssignments]);

  // Create unique ID for assignment
  const getAssignmentId = (assignment: Assignment) => {
    const id = `${assignment.title}-${assignment.course}-${assignment.dueDate}`;
    return id;
  };

  // Handle marking assignment as complete
  const markAsComplete = (assignment: Assignment) => {
    console.log('Marking assignment as complete:', assignment.title);
    
    if (markAssignmentAsComplete && !isAssignmentCompleted?.(assignment)) {
      // Use the parent's function to mark as complete
      markAssignmentAsComplete(assignment);
      
      // Create completed assignment for local display
      const completedAssignment: FinishedAssignment = {
        title: assignment.title,
        course: assignment.course,
        completedDate: dayjs().format('MMM D, YYYY'),
        grade: 'Completed'
      };
      
      // Add to local completed assignments for display
      setLocalCompletedAssignments(prev => [completedAssignment, ...prev]);
      
      console.log('Assignment marked complete via parent function');
    } else {
      console.log('Assignment already completed or no completion function available');
    }
  };

  // Handle moving assignment back to upcoming
  const moveBackToUpcoming = (completedAssignment: FinishedAssignment, index: number) => {
    // Find the original assignment to get the ID
    const originalAssignment = upcoming.find(a => 
      a.title === completedAssignment.title && 
      a.course === completedAssignment.course
    );
    
    if (originalAssignment && markAssignmentAsIncomplete) {
      // Use the parent's function to mark as incomplete
      markAssignmentAsIncomplete(originalAssignment);
      
      // Remove from local completed assignments
      setLocalCompletedAssignments(prev => prev.filter((_, i) => i !== index));
    }
  };

  // Filter out completed assignments from upcoming
  const remainingAssignments = upcoming.filter(assignment => 
    !isAssignmentCompleted?.(assignment)
  );
  
  // Use original finished assignments - completed assignments are now filtered from upcoming
  const allCompletedAssignments = finished;
  
  // Filter assignments within next 2 weeks
  const twoWeeksFromNow = dayjs().add(2, 'weeks');
  const upcomingWithinTwoWeeks = remainingAssignments.filter(assignment => 
    dayjs(assignment.dueDate).isBefore(twoWeeksFromNow)
  );
  const upcomingBeyondTwoWeeks = remainingAssignments.filter(assignment => 
    dayjs(assignment.dueDate).isAfter(twoWeeksFromNow) || dayjs(assignment.dueDate).isSame(twoWeeksFromNow)
  );
  
  const displayedUpcoming = showAllUpcoming ? remainingAssignments : upcomingWithinTwoWeeks;
  
  // Calculate completion stats based on current view using parent's completion state
  const totalCompletedCount = upcoming.filter(assignment => isAssignmentCompleted?.(assignment)).length;
  
  // Dynamic stats based on current view (2-week vs all assignments)
  if (showAllUpcoming) {
    // When showing all assignments, use all data
    var currentViewTotalAssignments = upcoming.length; // upcoming.length is the original total from server
    var currentViewCompletedCount = totalCompletedCount;
  } else {
    // When showing 2-week view, count only assignments within 2 weeks
    const twoWeeksFromNow = dayjs().add(2, 'weeks');
    
    // Count assignments within 2 weeks (both completed and remaining)
    const assignmentsWithinTwoWeeks = upcoming.filter(assignment => 
      dayjs(assignment.dueDate).isBefore(twoWeeksFromNow)
    );
    
    // Count completed assignments within 2 weeks using parent's completion check
    const completedWithinTwoWeeks = assignmentsWithinTwoWeeks.filter(assignment => 
      isAssignmentCompleted?.(assignment)
    ).length;
    
    var currentViewTotalAssignments = assignmentsWithinTwoWeeks.length; // Total assignments within 2 weeks
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
      <Card className="assignments-container">
        <CardHeader className="pb-4">
          <div className={cn(
            "flex items-center justify-between",
            isMobileView && "flex-col gap-3 items-start"
          )}>
            <div className="flex items-center gap-2">
              <CardTitle className={cn(
                "font-semibold",
                isMobileView ? "text-base" : "text-lg"
              )}>
                Upcoming Assignments
              </CardTitle>
              {!showAllUpcoming && upcomingBeyondTwoWeeks.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {upcomingBeyondTwoWeeks.length} more
                </Badge>
              )}
            </div>
            <div className={cn(
              "flex items-center gap-2",
              isMobileView && "w-full justify-between"
            )}>
              {upcomingBeyondTwoWeeks.length > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowAllUpcoming(!showAllUpcoming)}
                  className={cn(
                    "text-xs",
                    isMobileView && "flex-1"
                  )}
                >
                  {showAllUpcoming ? (
                    <>
                      <EyeOff className="w-3 h-3 mr-1" />
                      {isMobileView ? "2 Weeks" : "Show Next 2 Weeks"}
                    </>
                  ) : (
                    <>
                      <Eye className="w-3 h-3 mr-1" />
                      {isMobileView ? "All" : "View All"}
                    </>
                  )}
                </Button>
              )}
              <Button variant="outline" size="sm" className={cn(isMobileView && "flex-1")}>
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
              className={cn(
                "assignment-card rounded-lg border border-border hover:bg-muted/50 transition-colors",
                isMobileView 
                  ? "p-4 space-y-3" 
                  : "flex items-start gap-3 p-3"
              )}
            >
              {/* Mobile Layout */}
              {isMobileView ? (
                <>
                  {/* Header with title and priority */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      <div className="flex-shrink-0 mt-0.5">
                        {assignment.status === "in-progress" ? (
                          <Clock className="w-4 h-4 text-secondary" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-chart-3" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm text-foreground leading-tight">{assignment.title}</h4>
                      </div>
                    </div>
                    <Badge
                      variant={
                        assignment.priority === "high"
                          ? "destructive"
                          : assignment.priority === "medium"
                            ? "default"
                            : "secondary"
                      }
                      className="text-xs"
                    >
                      {assignment.priority}
                    </Badge>
                  </div>

                  {/* Course info */}
                  <div className="flex items-center gap-2 flex-wrap">
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

                  {/* Course name */}
                  {assignment.courseName && assignment.courseName !== assignment.course && (
                    <p className="text-xs text-muted-foreground" title={assignment.courseName}>
                      {assignment.courseName}
                    </p>
                  )}

                  {/* Description */}
                  {assignment.description && (
                    <p className="text-xs text-muted-foreground line-clamp-3" title={assignment.description}>
                      {assignment.description.substring(0, 150)}...
                    </p>
                  )}

                  {/* Due date and actions */}
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs text-muted-foreground">
                      Due: {dayjs(assignment.dueDate).format('MMM D, h:mm A')}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markAsComplete(assignment)}
                        className="h-8 w-8 p-0 hover:bg-primary/10"
                        title="Mark as complete"
                      >
                        <CheckCircle className="w-4 h-4 text-muted-foreground hover:text-primary" />
                      </Button>
                      {assignment.d2lUrl && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(assignment.d2lUrl, '_blank')}
                          className="h-8 w-8 p-0 hover:bg-primary/10"
                          title="Open in D2L"
                        >
                          <svg className="w-4 h-4 text-muted-foreground hover:text-primary" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.25 5.5a.75.75 0 00-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 00.75-.75v-4a.75.75 0 011.5 0v4A2.25 2.25 0 0112.75 17h-8.5A2.25 2.25 0 012 14.75v-8.5A2.25 2.25 0 014.25 4h5a.75.75 0 010 1.5h-5z" clipRule="evenodd" />
                            <path fillRule="evenodd" d="M6.194 12.753a.75.75 0 001.06.053L16.5 4.44v2.81a.75.75 0 001.5 0v-4.5a.75.75 0 00-.75-.75h-4.5a.75.75 0 000 1.5h2.553l-9.056 8.194a.75.75 0 00-.053 1.06z" clipRule="evenodd" />
                          </svg>
                        </Button>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                /* Desktop Layout */
                <>
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
                </>
              )}
            </div>
          )) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              {showAllUpcoming ? "No upcoming assignments." : "No assignments due in the next 2 weeks."}
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="assignments-container">
        <CardHeader className="pb-4">
          <div className={cn(
            "flex items-center justify-between",
            isMobileView && "flex-col gap-2 items-start"
          )}>
            <div className="flex items-center gap-2">
              <CardTitle className={cn(
                "font-semibold",
                isMobileView ? "text-base" : "text-lg"
              )}>
                Recent Completions
              </CardTitle>
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
            <div 
              key={index} 
              className={cn(
                "assignment-card rounded-lg border border-border hover:bg-muted/50 transition-colors",
                isMobileView 
                  ? "p-4 space-y-3" 
                  : "flex items-start gap-3 p-3"
              )}
            >
              {isMobileView ? (
                <>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm text-foreground">{assignment.title}</h4>
                      <p className="text-xs text-muted-foreground">{assignment.course}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs text-muted-foreground">Completed: {assignment.completedDate}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-primary border-primary text-xs">
                        {assignment.grade}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => moveBackToUpcoming(assignment, index)}
                        className="h-8 w-8 p-0 hover:bg-secondary/50"
                        title="Move back to upcoming"
                      >
                        <RotateCcw className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <>
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
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveBackToUpcoming(assignment, index)}
                      className="h-6 w-6 p-0 hover:bg-secondary/50"
                      title="Move back to upcoming"
                    >
                      <RotateCcw className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          )) : (
             <p className="text-sm text-muted-foreground text-center py-4">No recently completed assignments.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
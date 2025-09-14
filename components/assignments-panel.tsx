import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, CheckCircle, AlertCircle, Plus, Eye, EyeOff, RotateCcw } from "lucide-react"
import dayjs from 'dayjs';

interface Assignment {
  title: string;
  course: string;
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
}

export function AssignmentsPanel({ upcoming = [], finished = [] }: AssignmentsPanelProps) {
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
  
  // Calculate completion stats
  const totalOriginalAssignments = upcoming.length;
  const completedCount = completedAssignmentIds.size;
  const totalCompletedCount = allCompletedAssignments.length;


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
                <p className="text-xs text-muted-foreground">{assignment.course}</p>
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
              {totalCompletedCount > 0 && (
                <Badge variant="outline" className="text-primary border-primary text-xs">
                  {totalCompletedCount} completed
                </Badge>
              )}
            </div>
            {totalOriginalAssignments > 0 && (
              <div className="text-xs text-muted-foreground">
                {((totalCompletedCount / (totalOriginalAssignments + totalCompletedCount)) * 100).toFixed(0)}% done
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
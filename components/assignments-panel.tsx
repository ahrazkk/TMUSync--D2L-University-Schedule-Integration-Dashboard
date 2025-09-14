import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, CheckCircle, AlertCircle, Plus } from "lucide-react"
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
  console.log("AssignmentsPanel received props:", { upcoming, finished });


  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">Upcoming Assignments</CardTitle>
            <Button variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {upcoming.length > 0 ? upcoming.map((assignment, index) => (
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
            </div>
          )) : (
            <p className="text-sm text-muted-foreground text-center py-4">No upcoming assignments.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold">Recent Completions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {finished.length > 0 ? finished.map((assignment, index) => (
            <div key={index} className="flex items-start gap-3 p-3 rounded-lg border border-border">
              <CheckCircle className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm text-foreground">{assignment.title}</h4>
                <p className="text-xs text-muted-foreground">{assignment.course}</p>
                <p className="text-xs text-muted-foreground mt-1">Completed: {assignment.completedDate}</p>
              </div>
              <Badge variant="outline" className="text-primary border-primary">
                {assignment.grade}
              </Badge>
            </div>
          )) : (
             <p className="text-sm text-muted-foreground text-center py-4">No recently completed assignments.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
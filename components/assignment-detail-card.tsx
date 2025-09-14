"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CalendarDays, Clock, ExternalLink, FileText, GraduationCap, X } from "lucide-react"
import { cn } from "@/lib/utils"
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import duration from 'dayjs/plugin/duration'

dayjs.extend(relativeTime)
dayjs.extend(duration)

interface Assignment {
  title: string;
  dueDate: string;
  courseName?: string;
  course?: string;
  description?: string;
  source?: 'VSB' | 'ICS';
  d2lUrl?: string;
  type?: string;
  location?: string;
}

interface AssignmentDetailCardProps {
  assignment: Assignment;
  onClose?: () => void;
  isAssignmentCompleted?: (assignment: Assignment) => boolean;
  markAssignmentAsComplete?: (assignment: Assignment) => void;
  markAssignmentAsIncomplete?: (assignment: Assignment) => void;
}

export function AssignmentDetailCard({ 
  assignment, 
  onClose,
  isAssignmentCompleted,
  markAssignmentAsComplete,
  markAssignmentAsIncomplete
}: AssignmentDetailCardProps) {
  const dueDate = dayjs(assignment.dueDate);
  const now = dayjs();
  const timeUntilDue = dueDate.diff(now);
  const isOverdue = timeUntilDue < 0;
  const humanReadableTime = dueDate.fromNow();
  
  // Check if assignment is completed first
  const isCompleted = isAssignmentCompleted?.(assignment) || false;
  
  // Calculate urgency levels
  const hoursUntilDue = Math.abs(dueDate.diff(now, 'hour'));
  const daysUntilDue = Math.abs(dueDate.diff(now, 'day'));
  
  let urgencyLevel: 'high' | 'medium' | 'low' | 'completed' = 'low';
  let urgencyColor = "bg-green-100 text-green-800 border-green-300 dark:bg-green-900 dark:text-green-200 dark:border-green-700";
  
  if (isCompleted) {
    urgencyLevel = 'completed';
    urgencyColor = "bg-green-100 text-green-800 border-green-300 dark:bg-green-900 dark:text-green-200 dark:border-green-700";
  } else if (isOverdue) {
    urgencyLevel = 'high';
    urgencyColor = "bg-red-100 text-red-800 border-red-300 dark:bg-red-900 dark:text-red-200 dark:border-red-700";
  } else if (hoursUntilDue <= 24) {
    urgencyLevel = 'high';
    urgencyColor = "bg-red-100 text-red-800 border-red-300 dark:bg-red-900 dark:text-red-200 dark:border-red-700";
  } else if (daysUntilDue <= 3) {
    urgencyLevel = 'medium';
    urgencyColor = "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-700";
  }
  
  const courseName = assignment.courseName || assignment.course || 'Unknown Course';
  
  // Clean up description by removing URLs and other messy formatting
  const getCleanDescription = (description: string | undefined): string | null => {
    if (!description || description === assignment.title) return null;
    
    // Remove URLs
    let cleaned = description.replace(/https?:\/\/[^\s]+/g, '');
    
    // Remove extra whitespace and newlines
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    // Remove common prefixes that don't add value
    cleaned = cleaned.replace(/^(Assignment:|Assignments?:|Due:)/i, '').trim();
    
    // If it's too short or just contains the title again, don't show it
    if (cleaned.length < 10 || cleaned.toLowerCase().includes(assignment.title.toLowerCase())) {
      return null;
    }
    
    // Truncate if too long
    if (cleaned.length > 200) {
      cleaned = cleaned.substring(0, 200) + '...';
    }
    
    return cleaned;
  };
  
  const cleanDescription = getCleanDescription(assignment.description);
  
  return (
    <Card className="w-full border-2 border-primary/20 shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-primary">Assignment Details</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Course assignment information</p>
            </div>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
        
        <div className="flex items-center gap-2 mt-3">
          <Badge variant="outline" className={cn("border text-xs font-medium", urgencyColor)}>
            {urgencyLevel === 'completed' ? 'Completed' : isOverdue ? 'Overdue' : urgencyLevel === 'high' ? 'Due Soon' : urgencyLevel === 'medium' ? 'Due This Week' : 'Upcoming'}
          </Badge>
          {assignment.source && (
            <Badge variant="secondary" className="text-xs font-medium">
              {assignment.source}
            </Badge>
          )}
          {assignment.type && (
            <Badge variant="outline" className="text-xs">
              {assignment.type}
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Assignment Title and Description */}
        <div className="space-y-3">
          <div>
            <h3 className="font-semibold text-xl leading-tight break-words">{assignment.title}</h3>
          </div>
          
          {cleanDescription && (
            <div className="bg-muted/30 rounded-lg p-4 border-l-4 border-primary/30">
              <p className="text-sm text-muted-foreground leading-relaxed break-words">{cleanDescription}</p>
            </div>
          )}
        </div>
        
        {/* Course and Timing Information */}
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg">
              <div className="p-2 bg-primary/10 rounded-md">
                <GraduationCap className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Course</p>
                <p className="text-sm font-semibold break-words">{courseName}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-md">
                  <CalendarDays className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Due Date</p>
                  <p className="text-sm font-semibold">{dueDate.format('MMM D, YYYY')}</p>
                  <p className="text-xs text-muted-foreground">{dueDate.format('dddd')}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg">
                <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-md">
                  <Clock className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Due Time</p>
                  <p className="text-sm font-semibold">{dueDate.format('h:mm A')}</p>
                  <p className="text-xs text-muted-foreground">
                    {urgencyLevel === 'completed' ? 'Completed' : isOverdue ? `Overdue by ${humanReadableTime.replace('ago', '')}` : `Due ${humanReadableTime}`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Status and Actions */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-muted/20 to-muted/10 rounded-lg border">
            <div className={cn("w-3 h-3 rounded-full flex-shrink-0", 
              urgencyLevel === 'completed' ? "bg-green-500" :
              isOverdue ? "bg-red-500" : 
              urgencyLevel === 'high' ? "bg-red-500" : 
              urgencyLevel === 'medium' ? "bg-yellow-500" : "bg-green-500"
            )} />
            <div>
              <p className="text-sm font-medium">
                {urgencyLevel === 'completed' ? 'Assignment completed' :
                 isOverdue ? 'Assignment is overdue' : 
                 urgencyLevel === 'high' ? 'Assignment due very soon' : 
                 urgencyLevel === 'medium' ? 'Assignment due this week' : 'Assignment upcoming'}
              </p>
              <p className="text-xs text-muted-foreground">
                {urgencyLevel === 'completed' ? 'Completed' : isOverdue ? `Overdue by ${humanReadableTime.replace('ago', '')}` : `Due ${humanReadableTime}`}
              </p>
            </div>
          </div>
          
          {/* Completion Actions */}
          {markAssignmentAsComplete && markAssignmentAsIncomplete && (
            <div className="flex gap-2">
              {isCompleted ? (
                <Button 
                  onClick={() => markAssignmentAsIncomplete(assignment)}
                  variant="outline" 
                  size="sm"
                  className="flex-1"
                >
                  Mark as Incomplete
                </Button>
              ) : (
                <Button 
                  onClick={() => markAssignmentAsComplete(assignment)}
                  variant="default" 
                  size="sm"
                  className="flex-1"
                >
                  Mark as Complete
                </Button>
              )}
            </div>
          )}
          
          {assignment.d2lUrl && (
            <Button asChild variant="default" size="lg" className="w-full">
              <a href={assignment.d2lUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-2" />
                Open Assignment in D2L
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
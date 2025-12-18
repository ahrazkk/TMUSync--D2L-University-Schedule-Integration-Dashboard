"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { X, Clock, MapPin, User, Calendar, BookOpen, GraduationCap, FileText, ExternalLink, Pencil } from "lucide-react"
import { cn } from "@/lib/utils"
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

interface CourseSession {
  type: string;
  section?: string;
  day: number;
  startTime: string;
  endTime: string;
  duration: number;
  instructor: string;
  location: string;
  campus?: string;
  credits?: string;
  status?: string;
  capacity?: string;
}

interface CourseDetails {
  key: string;
  code?: string;
  number?: string;
  title: string;
  description: string;
  credits: string;
  campus: string;
  faculty?: string;
  sessions: CourseSession[];
  allTimeSlots: CourseSession[];
}

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

interface CourseDetailCardProps {
  courseDetails: CourseDetails;
  assignments?: {
    pending: Assignment[];
    completed: Assignment[];
  };
  onClose: () => void;
  onEdit?: () => void;
  onAssignmentClick?: (assignment: Assignment) => void;
  isAssignmentCompleted?: (assignment: Assignment) => boolean;
  markAssignmentAsComplete?: (assignment: Assignment) => void;
  markAssignmentAsIncomplete?: (assignment: Assignment) => void;
}

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const getSessionTypeColor = (type: string) => {
  switch (type.toUpperCase()) {
    case 'LEC':
    case 'LECTURE':
      return "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700";
    case 'LAB':
    case 'LABORATORY':
      return "bg-green-100 text-green-800 border-green-300 dark:bg-green-900 dark:text-green-200 dark:border-green-700";
    case 'TUT':
    case 'TUTORIAL':
      return "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900 dark:text-purple-200 dark:border-purple-700";
    case 'SEM':
    case 'SEMINAR':
      return "bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900 dark:text-orange-200 dark:border-orange-700";
    default:
      return "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-900 dark:text-gray-200 dark:border-gray-700";
  }
};

export function CourseDetailCard({
  courseDetails,
  assignments = { pending: [], completed: [] },
  onClose,
  onEdit,
  onAssignmentClick,
  isAssignmentCompleted,
  markAssignmentAsComplete,
  markAssignmentAsIncomplete
}: CourseDetailCardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'schedule' | 'assignments'>('overview');

  // Group sessions by type
  const sessionsByType = courseDetails.sessions.reduce((acc, session) => {
    const key = session.type.toUpperCase();
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(session);
    return acc;
  }, {} as Record<string, CourseSession[]>);

  // Sort sessions by day and time for schedule view
  const sortedSessions = [...courseDetails.sessions].sort((a, b) => {
    if (a.day !== b.day) return a.day - b.day;
    return a.startTime.localeCompare(b.startTime);
  });

  return (
    <Card className="w-full mb-6 border-2 border-primary/20 shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-primary" />
              <CardTitle className="text-xl font-bold text-primary">
                {courseDetails.key}
              </CardTitle>
              <Badge variant="secondary" className="text-xs">
                {courseDetails.credits} Credits
              </Badge>
            </div>
            <h3 className="text-lg font-medium text-muted-foreground">
              {courseDetails.title}
            </h3>
            <div className="flex flex-wrap gap-2">
              {courseDetails.campus !== 'N/A' && (
                <Badge variant="outline" className="text-xs">
                  <MapPin className="w-3 h-3 mr-1" />
                  {courseDetails.campus}
                </Badge>
              )}
              {courseDetails.faculty && courseDetails.faculty !== 'N/A' && (
                <Badge variant="outline" className="text-xs">
                  📚 {courseDetails.faculty}
                </Badge>
              )}
              {courseDetails.code && courseDetails.number && (
                <Badge variant="outline" className="text-xs">
                  {courseDetails.code} {courseDetails.number}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={onEdit}
                className="text-muted-foreground hover:text-foreground"
              >
                <Pencil className="w-4 h-4 mr-1" />
                Edit
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex gap-1 mt-4">
          <Button
            variant={activeTab === 'overview' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('overview')}
            className="text-xs"
          >
            <BookOpen className="w-3 h-3 mr-1" />
            Overview
          </Button>
          <Button
            variant={activeTab === 'schedule' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('schedule')}
            className="text-xs"
          >
            <Calendar className="w-3 h-3 mr-1" />
            Schedule
          </Button>
          <Button
            variant={activeTab === 'assignments' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('assignments')}
            className="text-xs"
          >
            <FileText className="w-3 h-3 mr-1" />
            Assignments {(assignments.pending.length + assignments.completed.length) > 0 && `(${assignments.pending.length + assignments.completed.length})`}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Course Description */}
            <div>
              <h4 className="font-semibold mb-2 text-sm uppercase tracking-wide text-muted-foreground">
                Course Description
              </h4>
              <p className="text-sm leading-relaxed">
                {courseDetails.description}
              </p>
              {courseDetails.description.includes('log out and log in again') && (
                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-300">
                  💡 Tip: For complete course information including instructor details and full descriptions, please log out and log in again to refresh the course data from VSB.
                </div>
              )}
            </div>

            <Separator />

            {/* Session Types Overview */}
            <div>
              <h4 className="font-semibold mb-3 text-sm uppercase tracking-wide text-muted-foreground">
                Session Types
              </h4>
              {Object.keys(sessionsByType).length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.entries(sessionsByType).map(([type, sessions]) => (
                    <div key={type} className="space-y-2">
                      <Badge className={cn("text-xs", getSessionTypeColor(type))}>
                        {type} ({sessions.length} session{sessions.length !== 1 ? 's' : ''})
                      </Badge>
                      <div className="space-y-1 text-xs">
                        {sessions.slice(0, 2).map((session, index) => (
                          <div key={index} className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            <span>{dayNames[session.day - 1]}</span>
                            <span>{session.startTime}{session.endTime !== 'N/A' ? ` - ${session.endTime}` : ''}</span>
                            {session.instructor !== 'TBA' && (
                              <span className="text-xs">• {session.instructor}</span>
                            )}
                          </div>
                        ))}
                        {sessions.length > 2 && (
                          <p className="text-muted-foreground italic">
                            +{sessions.length - 2} more session{sessions.length - 2 !== 1 ? 's' : ''}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  No session data available. Click "Schedule" tab or refresh your login for complete information.
                </p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'schedule' && (
          <div className="space-y-4">
            <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
              Weekly Schedule
            </h4>
            {sortedSessions.length > 0 ? (
              <div className="space-y-3">
                {sortedSessions.map((session, index) => (
                  <div key={index} className="border rounded-lg p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className={cn("text-xs", getSessionTypeColor(session.type))}>
                          {session.type}
                        </Badge>
                        {session.section && session.section !== 'N/A' && (
                          <span className="text-xs text-muted-foreground">
                            Section {session.section}
                          </span>
                        )}
                        <span className="font-medium text-sm">
                          {dayNames[session.day - 1]}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>
                          {session.startTime}
                          {session.endTime !== 'N/A' ? ` - ${session.endTime}` : ''}
                        </span>
                        <span className="text-xs">({session.duration}h)</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
                      {session.instructor !== 'TBA' && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <User className="w-3 h-3" />
                          <span>{session.instructor}</span>
                        </div>
                      )}
                      {session.location !== 'TBA' && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate" title={session.location}>
                            {session.location}
                          </span>
                        </div>
                      )}
                      {session.capacity && session.capacity !== 'N/A' && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <span className="text-xs">👥</span>
                          <span>{session.capacity}</span>
                        </div>
                      )}
                    </div>

                    {session.status && session.status !== 'Active' && session.status !== '' && (
                      <div className="mt-2">
                        <Badge variant="outline" className="text-xs">
                          Status: {session.status}
                        </Badge>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  No schedule data available
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Detailed schedule information will be available after your next login
                </p>
              </div>
            )}
          </div>
        )}

        {/* Assignments Tab */}
        {activeTab === 'assignments' && (
          <div className="space-y-4">
            {(assignments.pending.length + assignments.completed.length) > 0 ? (
              <>
                {/* Pending Assignments */}
                {assignments.pending.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                      Pending ({assignments.pending.length})
                    </h4>
                    {assignments.pending.map((assignment, index) => {
                      const dueDate = dayjs(assignment.dueDate);
                      const now = dayjs();
                      const timeUntilDue = dueDate.diff(now);
                      const isOverdue = timeUntilDue < 0;
                      const humanReadableTime = dueDate.fromNow();

                      // Calculate urgency
                      const hoursUntilDue = Math.abs(dueDate.diff(now, 'hour'));
                      const daysUntilDue = Math.abs(dueDate.diff(now, 'day'));

                      let urgencyColor = "bg-green-100 text-green-800 border-green-300 dark:bg-green-900 dark:text-green-200 dark:border-green-700";

                      if (isOverdue) {
                        urgencyColor = "bg-red-100 text-red-800 border-red-300 dark:bg-red-900 dark:text-red-200 dark:border-red-700";
                      } else if (hoursUntilDue <= 24) {
                        urgencyColor = "bg-red-100 text-red-800 border-red-300 dark:bg-red-900 dark:text-red-200 dark:border-red-700";
                      } else if (daysUntilDue <= 3) {
                        urgencyColor = "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-700";
                      }

                      return (
                        <div
                          key={`pending-${index}`}
                          className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() => onAssignmentClick && onAssignmentClick(assignment)}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-start gap-2">
                              <FileText className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <h4 className="font-medium text-sm line-clamp-2 break-words">{assignment.title}</h4>
                                {/* Only show clean description if it's different from title and reasonably short */}
                                {assignment.description &&
                                  assignment.description !== assignment.title &&
                                  assignment.description.length < 100 &&
                                  !assignment.description.includes('http') && (
                                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1 break-words">
                                      {assignment.description}
                                    </p>
                                  )}
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1 flex-shrink-0">
                              <Badge variant="outline" className={cn("text-xs border", urgencyColor)}>
                                {isOverdue ? 'Overdue' : hoursUntilDue <= 24 ? 'Due Soon' : daysUntilDue <= 3 ? 'Due This Week' : 'Upcoming'}
                              </Badge>
                              {assignment.source && (
                                <Badge variant="secondary" className="text-xs">
                                  {assignment.source}
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <div className="flex items-center gap-3">
                              <span className="font-medium">{dueDate.format('MMM D, YYYY')}</span>
                              <span>{dueDate.format('h:mm A')}</span>
                              {assignment.type && (
                                <Badge variant="outline" className="text-xs">
                                  {assignment.type}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={cn("font-medium text-xs",
                                isOverdue ? "text-red-600" :
                                  hoursUntilDue <= 24 ? "text-red-600" :
                                    daysUntilDue <= 3 ? "text-yellow-600" : "text-green-600"
                              )}>
                                {isOverdue ? `Overdue by ${humanReadableTime.replace('ago', '')}` : `Due ${humanReadableTime}`}
                              </span>
                              {markAssignmentAsComplete && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-6 px-2 text-xs"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markAssignmentAsComplete(assignment);
                                  }}
                                >
                                  Mark Done
                                </Button>
                              )}
                              {assignment.d2lUrl && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(assignment.d2lUrl, '_blank');
                                  }}
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Completed Assignments */}
                {assignments.completed.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                      Completed ({assignments.completed.length})
                    </h4>
                    {assignments.completed.map((assignment, index) => {
                      const dueDate = dayjs(assignment.dueDate);

                      return (
                        <div
                          key={`completed-${index}`}
                          className="p-3 border rounded-lg bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800 opacity-75"
                          onClick={() => onAssignmentClick && onAssignmentClick(assignment)}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-start gap-2">
                              <FileText className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <h4 className="font-medium text-sm line-clamp-2 break-words line-through text-green-700 dark:text-green-300">{assignment.title}</h4>
                                {assignment.description &&
                                  assignment.description !== assignment.title &&
                                  assignment.description.length < 100 &&
                                  !assignment.description.includes('http') && (
                                    <p className="text-xs text-green-600 dark:text-green-400 mt-1 line-clamp-1 break-words">
                                      {assignment.description}
                                    </p>
                                  )}
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1 flex-shrink-0">
                              <Badge variant="outline" className="text-xs border border-green-300 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 dark:border-green-700">
                                Done
                              </Badge>
                              {assignment.source && (
                                <Badge variant="secondary" className="text-xs">
                                  {assignment.source}
                                </Badge>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-xs text-green-600 dark:text-green-400">
                            <div className="flex items-center gap-3">
                              <span className="font-medium">{dueDate.format('MMM D, YYYY')}</span>
                              <span>{dueDate.format('h:mm A')}</span>
                              {assignment.type && (
                                <Badge variant="outline" className="text-xs">
                                  {assignment.type}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-xs text-green-600 dark:text-green-400">
                                Completed
                              </span>
                              {markAssignmentAsIncomplete && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-6 px-2 text-xs"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markAssignmentAsIncomplete(assignment);
                                  }}
                                >
                                  Undo
                                </Button>
                              )}
                              {assignment.d2lUrl && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(assignment.d2lUrl, '_blank');
                                  }}
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  No assignments found for this course
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Assignments will appear here as they're loaded from VSB and ICS files
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
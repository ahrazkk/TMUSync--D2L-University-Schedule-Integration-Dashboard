"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { X, Clock, MapPin, User, Calendar, BookOpen, GraduationCap } from "lucide-react"
import { cn } from "@/lib/utils"

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

interface CourseDetailCardProps {
  courseDetails: CourseDetails;
  onClose: () => void;
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

export function CourseDetailCard({ courseDetails, onClose }: CourseDetailCardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'schedule'>('overview');

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
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </Button>
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
      </CardContent>
    </Card>
  );
}
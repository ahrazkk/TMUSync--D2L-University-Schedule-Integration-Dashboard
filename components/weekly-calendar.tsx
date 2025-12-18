"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Plus, FileText, Calendar, List } from "lucide-react"
import { cn } from "@/lib/utils"
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import isBetween from 'dayjs/plugin/isBetween'

dayjs.extend(customParseFormat)
dayjs.extend(isBetween)

const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
const timeSlots = Array.from({ length: 14 }, (_, i) => dayjs().hour(i + 8).minute(0).format("h:00 A"));
// Add "Early Morning" and "Late Evening" slots for assignments outside 8 AM - 9 PM
const timeSlotsWithExtraRows = [...timeSlots, "Early Morning", "Late Evening"];

const getEventGridRows = (startTime: string, durationHours: number) => {
  const start = dayjs(startTime, "h:mm A");
  const base = dayjs("8:00 AM", "h:mm A");
  const diffInMinutes = start.diff(base, 'minute');

  // +1 for header, +1 for all-day row
  const startRow = (diffInMinutes / 30) + 3;
  const durationInRows = durationHours * 2;

  return {
    gridRow: `${startRow} / span ${durationInRows}`,
  }
}

// Enhanced solid colors for current day events with glass effect
const eventColors = [
  "bg-blue-500/20 border border-blue-500/30 text-blue-800 dark:bg-blue-500/10 dark:text-blue-200 backdrop-blur-sm shadow-sm",
  "bg-emerald-500/20 border border-emerald-500/30 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-200 backdrop-blur-sm shadow-sm",
  "bg-amber-500/20 border border-amber-500/30 text-amber-800 dark:bg-amber-500/10 dark:text-amber-200 backdrop-blur-sm shadow-sm",
  "bg-violet-500/20 border border-violet-500/30 text-violet-800 dark:bg-violet-500/10 dark:text-violet-200 backdrop-blur-sm shadow-sm",
  "bg-rose-500/20 border border-rose-500/30 text-rose-800 dark:bg-rose-500/10 dark:text-rose-200 backdrop-blur-sm shadow-sm",
  "bg-sky-500/20 border border-sky-500/30 text-sky-800 dark:bg-sky-500/10 dark:text-sky-200 backdrop-blur-sm shadow-sm",
  "bg-red-500/20 border border-red-500/30 text-red-800 dark:bg-red-500/10 dark:text-red-200 backdrop-blur-sm shadow-sm",
];

// Enhanced solid colors for current day events
const eventColorsEnhanced = [
  "bg-blue-500/60 border border-blue-700 text-blue-900 dark:bg-blue-500/70 dark:border-blue-400 dark:text-blue-100",
  "bg-emerald-500/60 border border-emerald-700 text-emerald-900 dark:bg-emerald-500/70 dark:border-emerald-400 dark:text-emerald-100",
  "bg-amber-500/60 border border-amber-700 text-amber-900 dark:bg-amber-500/70 dark:border-amber-400 dark:text-amber-100",
  "bg-violet-500/60 border border-violet-700 text-violet-900 dark:bg-violet-500/70 dark:border-violet-400 dark:text-violet-100",
  "bg-rose-500/60 border border-rose-700 text-rose-900 dark:bg-rose-500/70 dark:border-rose-400 dark:text-rose-100",
  "bg-sky-500/60 border border-sky-700 text-sky-900 dark:bg-sky-500/70 dark:border-sky-400 dark:text-sky-100",
  "bg-red-500/60 border border-red-700 text-red-900 dark:bg-red-500/70 dark:border-red-400 dark:text-red-100",
];
const courseColorMap = new Map<string, string>();
let colorIndex = 0;
let isRenderClearing = false;

const getCourseColor = (courseName: string, isFirstRender: boolean, isCurrentDay: boolean = false) => {
  if (isFirstRender) {
    courseColorMap.clear();
    colorIndex = 0;
    isRenderClearing = true;
  } else {
    isRenderClearing = false;
  }

  if (!courseColorMap.has(courseName)) {
    courseColorMap.set(courseName, eventColors[colorIndex % eventColors.length]);
    colorIndex++;
  }

  // Return enhanced color for current day, regular color otherwise
  const baseColorIndex = eventColors.indexOf(courseColorMap.get(courseName)!);
  return isCurrentDay ? eventColorsEnhanced[baseColorIndex] : courseColorMap.get(courseName);
};

// Helper function to detect and handle overlapping events
const getEventLayout = (events: CalendarEvent[], currentDate: dayjs.Dayjs) => {
  const startOfWeek = currentDate.startOf('week');
  const endOfWeek = currentDate.endOf('week');

  // Group events by day and time slot
  const eventsByDayAndTime: { [key: string]: (CalendarEvent & { originalIndex: number })[] } = {};

  events.forEach((event, index) => {
    let dayIndex: number;
    let timeSlot: string;

    if (event.type === 'class' && event.day && event.startTime) {
      dayIndex = event.day;
      timeSlot = event.startTime;
    } else if (event.type === 'assignment' && event.dueDate) {
      const eventDate = dayjs(event.dueDate);
      if (!eventDate.isBetween(startOfWeek, endOfWeek, 'day', '[]')) return;

      dayIndex = eventDate.day() + 1; // Adjust for Sunday = 0 to Sunday = 1
      timeSlot = eventDate.format('h:mm A');
    } else {
      return;
    }

    const key = `${dayIndex}-${timeSlot}`;
    if (!eventsByDayAndTime[key]) {
      eventsByDayAndTime[key] = [];
    }
    eventsByDayAndTime[key].push({ ...event, originalIndex: index });
  });

  // Calculate layout for each event
  const eventLayouts: { [key: number]: { width: string; left: string; zIndex: number } } = {};

  Object.values(eventsByDayAndTime).forEach(overlappingEvents => {
    const count = overlappingEvents.length;
    overlappingEvents.forEach((event, subIndex) => {
      const originalIndex = event.originalIndex;
      eventLayouts[originalIndex] = {
        width: `${100 / count}%`,
        left: `${(subIndex * 100) / count}%`,
        zIndex: 10 + subIndex
      };
    });
  });

  return eventLayouts;
};

interface CalendarEvent {
  day?: number;
  startTime?: string;
  title: string;
  courseName: string;
  duration?: number;
  type: string;
  dueDate?: string;
  courseDetails?: any; // Will contain detailed course information
}

interface WeeklyCalendarProps {
  events: CalendarEvent[];
  onCourseClick?: (courseDetails: any) => void;
  onAssignmentClick?: (assignment: any) => void;
  currentDate?: dayjs.Dayjs;
  onDateChange?: (date: dayjs.Dayjs) => void;
}

export function WeeklyCalendar({
  events = [],
  onCourseClick,
  onAssignmentClick,
  currentDate: externalDate,
  onDateChange
}: WeeklyCalendarProps) {
  const [internalDate, setInternalDate] = useState(dayjs());
  // Use external date if provided, otherwise internal
  const currentDate = externalDate || internalDate;

  const handleDateChange = (newDate: dayjs.Dayjs) => {
    if (onDateChange) {
      onDateChange(newDate);
    } else {
      setInternalDate(newDate);
    }
  };

  const [isMobileScreen, setIsMobileScreen] = useState(false);
  const [isListView, setIsListView] = useState(false);
  const [hasInitializedView, setHasInitializedView] = useState(false);
  const today = dayjs().day();

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      const isMobile = window.innerWidth < 768; // md breakpoint
      setIsMobileScreen(isMobile);

      // Auto-enable list view on mobile screens only on initial load
      if (isMobile && !hasInitializedView) {
        setIsListView(true);
        setHasInitializedView(true);
      } else if (!hasInitializedView) {
        setHasInitializedView(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [hasInitializedView]);

  const handlePreviousWeek = () => {
    handleDateChange(currentDate.subtract(1, 'week'));
  };

  const handleNextWeek = () => {
    handleDateChange(currentDate.add(1, 'week'));
  };

  const handleToday = () => {
    handleDateChange(dayjs());
  };

  const startOfWeek = currentDate.startOf('week');
  const endOfWeek = currentDate.endOf('week');
  const formattedDateRange = `${startOfWeek.format('MMM D')} - ${endOfWeek.format('MMM D, YYYY')}`;

  // Calculate event layouts for overlapping events
  const eventLayouts = getEventLayout(events, currentDate);

  // Toggle between list and calendar view
  const toggleView = () => {
    setIsListView(!isListView);
  };

  // Helper for transparency
  const getEventOpacity = (event: any) => {
    return event.hidden ? 'opacity-40 hover:opacity-100' : 'opacity-100';
  };

  // List view: Simple list view for today and upcoming events
  if (isListView) {
    const todayDate = dayjs();
    const todayEvents = events.filter(event => {
      if (event.type === 'class' && event.day) {
        const eventDay = todayDate.startOf('week').add(event.day - 1, 'day');
        return eventDay.isSame(todayDate, 'day');
      } else if (event.type === 'assignment' && event.dueDate) {
        const eventDate = dayjs(event.dueDate);
        return eventDate.isSame(todayDate, 'day');
      }
      return false;
    });

    const upcomingEvents = events.filter(event => {
      if (event.type === 'assignment' && event.dueDate) {
        const eventDate = dayjs(event.dueDate);
        return eventDate.isAfter(todayDate, 'day') && eventDate.isBefore(todayDate.add(7, 'day'), 'day');
      }
      return false;
    }).slice(0, 5); // Show only next 5 upcoming assignments

    return (
      <Card className="w-full">
        <CardHeader className="space-y-3 pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className={cn(
              "font-semibold",
              isMobileScreen ? "text-base" : "text-lg"
            )}>
              Schedule
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleView}
              className={cn(
                "gap-2",
                isMobileScreen && "px-3"
              )}
            >
              <Calendar className="w-4 h-4" />
              {isMobileScreen ? "Cal" : "Calendar"}
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={handlePreviousWeek}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-2">
              <span className="font-medium text-muted-foreground text-sm">{formattedDateRange}</span>
              <Button variant="outline" size="sm" onClick={handleToday} className="text-xs px-2 py-1">
                Today
              </Button>
            </div>
            <Button variant="ghost" size="sm" onClick={handleNextWeek}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Today's Events */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Today ({todayDate.format('MMM D')})</h3>
            <div className="space-y-2">
              {todayEvents.length > 0 ? (
                todayEvents.map((event, index) => {
                  const isClass = event.type === 'class';
                  const color = isClass
                    ? getCourseColor(event.courseName, index === 0, true)
                    : "bg-slate-900/70 text-slate-100 border border-slate-600 dark:bg-slate-950/80 dark:text-slate-200 dark:border-slate-400";

                  return (
                    <div
                      key={`${event.title}-${index}`}
                      className={cn(
                        "rounded-lg p-3 border cursor-pointer hover:brightness-110 transition-all",
                        color,
                        // @ts-ignore - Check for hidden property
                        event.hidden ? 'opacity-50' : ''
                      )}
                      onClick={() => {
                        if (isClass && onCourseClick) {
                          onCourseClick(event);
                        } else if (!isClass && onAssignmentClick) {
                          onAssignmentClick(event);
                        }
                      }}
                    >
                      <div className="flex items-center gap-2">
                        {isClass ? (
                          <div className="w-2 h-2 rounded-full bg-current"></div>
                        ) : (
                          <FileText className="w-4 h-4" />
                        )}
                        <span className="font-medium text-sm">{event.title}</span>
                      </div>
                      {event.startTime && (
                        <p className="text-xs opacity-80 mt-1">{event.startTime}</p>
                      )}
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-muted-foreground italic">No events today</p>
              )}
            </div>
          </div>

          {/* Upcoming Assignments */}
          {upcomingEvents.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Upcoming This Week</h3>
              <div className="space-y-2">
                {upcomingEvents.map((event, index) => (
                  <div
                    key={`${event.title}-upcoming-${index}`}
                    className="rounded-lg p-3 border bg-slate-900/40 text-slate-200 border-slate-700/50 cursor-pointer hover:brightness-110 transition-all dark:bg-slate-950/50 dark:text-slate-300 dark:border-slate-600/40"
                    onClick={() => onAssignmentClick && onAssignmentClick(event)}
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      <span className="font-medium text-sm">{event.title}</span>
                    </div>
                    <p className="text-xs opacity-80 mt-1">
                      Due: {dayjs(event.dueDate).format('MMM D, h:mm A')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-fit" hoverable>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className={cn(
            "font-serif font-bold tracking-tight",
            isMobileScreen ? "text-lg" : "text-2xl"
          )}>
            Your Enrolled Schedule
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleView}
              className={cn(
                "gap-2",
                isMobileScreen && "px-3"
              )}
            >
              <List className="w-4 h-4" />
              {isMobileScreen ? "List" : "List View"}
            </Button>
            <Button variant="outline" size="sm" className={cn(isMobileScreen && "px-3")}>
              <Plus className="w-4 h-4 mr-2" />
              {isMobileScreen ? "Add" : "Add Event"}
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={handlePreviousWeek}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-2">
            <span className="font-medium text-muted-foreground">{formattedDateRange}</span>
            <Button variant="outline" size="sm" onClick={handleToday} className="text-xs">
              Today
            </Button>
          </div>
          <Button variant="ghost" size="sm" onClick={handleNextWeek}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-[4rem_repeat(7,1fr)] grid-rows-[auto_auto_repeat(32,20px)]">
          <div className="sticky top-0 z-20 bg-card"></div>
          {days.map((day, index) => (
            <div
              key={day}
              className={cn(
                "sticky top-0 z-20 bg-card/80 backdrop-blur-md text-xs font-serif font-bold uppercase tracking-widest text-center p-2 text-muted-foreground border-b",
                dayjs().isSame(currentDate, 'week') && index === today && "bg-blue-50/50 dark:bg-blue-900/20 text-primary"
              )}
            >
              {day.slice(0, 3)}
            </div>
          ))}

          <div className="row-start-2 col-start-1 text-xs font-medium text-muted-foreground p-1 text-right pr-2 z-10 sticky top-12 bg-card border-b border-r">All-Day</div>
          {days.map((day, index) => (
            <div
              key={`${day}-allday`}
              className={cn(
                "row-start-2 border-b border-r border-border/50 p-1 space-y-1",
                dayjs().isSame(currentDate, 'week') && index === today && "bg-blue-100/50 dark:bg-blue-950/40"
              )}
              style={{ gridColumnStart: index + 2 }}
            ></div>
          ))}

          {timeSlotsWithExtraRows.map((time, index) => (
            <div key={time} className="row-start-auto col-start-1 col-end-10 grid grid-cols-subgrid -mt-px" style={{ gridRowStart: index * 2 + 3 }}>
              <div className="text-xs text-muted-foreground p-1 text-right pr-2 z-10 sticky top-12 bg-card">{time}</div>
              {days.map((day, dayIndex) => (
                <div
                  key={`${day}-cell-${time}`}
                  className={cn(
                    "border-t border-r border-border/50",
                    dayjs().isSame(currentDate, 'week') && dayIndex === today && "bg-blue-100/50 dark:bg-blue-950/40"
                  )}
                ></div>
              ))}
            </div>
          ))}

          {/* --- MODIFIED RENDER LOGIC --- */}
          {events.map((event: any, index) => {
            // Only render events that are in the current visible week
            const eventDate = event.dueDate ? dayjs(event.dueDate) : null;
            if (event.type === 'assignment' && eventDate && !eventDate.isBetween(startOfWeek, endOfWeek, 'day', '[]')) {
              return null;
            }

            // Apply transparency for hidden events
            const opacityClass = event.hidden
              ? "opacity-30 hover:opacity-100 grayscale"
              : "opacity-100";

            // A. Handle CLASS events
            if (event.type === 'class' && event.day && event.startTime && event.duration) {
              const uniqueKey = `class-${index}`;
              const { gridRow } = getEventGridRows(event.startTime, event.duration);
              const isCurrentDay = dayjs().isSame(currentDate, 'week') && (event.day - 1) === today;
              const colorClass = getCourseColor(event.courseName, index === 0 && !isRenderClearing, isCurrentDay);
              const layout = eventLayouts[index] || { width: '100%', left: '0%', zIndex: 10 };

              return (
                <div
                  key={uniqueKey}
                  className={cn("relative rounded text-xs p-1 m-1 font-medium overflow-hidden flex items-start justify-start cursor-pointer transition-all", colorClass, opacityClass)}
                  style={{
                    gridColumnStart: event.day + 1,
                    gridRow: gridRow,
                    width: layout.width === '100%' ? 'auto' : layout.width,
                    marginLeft: layout.left !== '0%' ? layout.left : '0px',
                    zIndex: layout.zIndex
                  }}
                  onClick={() => {
                    if (onCourseClick) {
                      // Pass the course details if available, or the basic event info for fallback
                      onCourseClick(event.courseDetails || {
                        key: event.courseName,
                        clickedEvent: event
                      });
                    }
                  }}
                  title={`Click to view ${event.courseName} details`}
                >
                  <span>{event.title}</span>
                </div>
              );
            }

            // B. Handle ASSIGNMENT events
            if (event.type === 'assignment' && eventDate) {
              const uniqueKey = `assign-${index}`;
              const dayIndex = eventDate.day();
              const isAllDay = eventDate.hour() === 0 && eventDate.minute() === 0;
              const layout = eventLayouts[index] || { width: '100%', left: '0%', zIndex: 10 };
              const isCurrentDay = dayjs().isSame(currentDate, 'week') && dayIndex === today;

              // Check if assignment time is outside 8 AM - 9 PM bounds
              const assignmentHour = eventDate.hour();
              const isEarlyMorning = assignmentHour < 8;
              const isLateEvening = assignmentHour >= 21; // 9 PM = 21 in 24-hour

              let gridRowValue;
              if (isAllDay) {
                gridRowValue = '2 / span 1'; // All-day row
              } else if (isEarlyMorning) {
                gridRowValue = '31 / span 2'; // Early Morning row (after all 14 time slots + header + all-day = row 31)
              } else if (isLateEvening) {
                gridRowValue = '33 / span 2'; // Late Evening row (after Early Morning = row 33)
              } else {
                gridRowValue = getEventGridRows(eventDate.format('h:mm A'), 1).gridRow;
              }

              // Enhanced assignment colors for current day
              const assignmentColorClass = isCurrentDay
                ? "relative rounded bg-slate-900/70 text-slate-100 border border-slate-600 text-xs p-1 m-1 font-medium overflow-hidden flex items-start justify-start gap-1 cursor-pointer hover:brightness-110 transition-all dark:bg-slate-950/80 dark:text-slate-200 dark:border-slate-400"
                : "relative rounded bg-slate-900/40 text-slate-200 border border-slate-700/50 text-xs p-1 m-1 font-medium overflow-hidden flex items-start justify-start gap-1 cursor-pointer hover:brightness-110 transition-all dark:bg-slate-950/50 dark:text-slate-300 dark:border-slate-600/40";

              return (
                <div
                  key={uniqueKey}
                  className={assignmentColorClass}
                  style={{
                    gridColumnStart: dayIndex + 2,
                    gridRow: gridRowValue,
                    width: layout.width === '100%' ? 'auto' : layout.width,
                    marginLeft: layout.left !== '0%' ? layout.left : '0px',
                    zIndex: layout.zIndex
                  }}
                  onClick={() => {
                    if (onAssignmentClick) {
                      onAssignmentClick(event);
                    }
                  }}
                  title={`Click to view assignment details: ${event.title}`}
                >
                  <FileText className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{event.title}</span>
                </div>
              )
            }

            return null;
          })}
        </div>
      </CardContent>
    </Card >
  )
}
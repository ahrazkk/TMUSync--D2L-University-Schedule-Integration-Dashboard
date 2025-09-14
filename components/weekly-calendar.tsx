"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Plus, FileText } from "lucide-react"
import { cn } from "@/lib/utils"
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import isBetween from 'dayjs/plugin/isBetween'

dayjs.extend(customParseFormat)
dayjs.extend(isBetween)

const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
const timeSlots = Array.from({ length: 14 }, (_, i) => dayjs().hour(i + 8).minute(0).format("h:00 A"));

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

const eventColors = [
  "bg-blue-500/20 border border-blue-700 text-blue-800 dark:bg-blue-500/30 dark:border-blue-500 dark:text-blue-200",
  "bg-emerald-500/20 border border-emerald-700 text-emerald-800 dark:bg-emerald-500/30 dark:border-emerald-500 dark:text-emerald-200",
  "bg-amber-500/20 border border-amber-700 text-amber-800 dark:bg-amber-500/30 dark:border-amber-500 dark:text-amber-200",
  "bg-violet-500/20 border border-violet-700 text-violet-800 dark:bg-violet-500/30 dark:border-violet-500 dark:text-violet-200",
  "bg-rose-500/20 border border-rose-700 text-rose-800 dark:bg-rose-500/30 dark:border-rose-500 dark:text-rose-200",
  "bg-sky-500/20 border border-sky-700 text-sky-800 dark:bg-sky-500/30 dark:border-sky-500 dark:text-sky-200",
  "bg-red-500/20 border border-red-700 text-red-800 dark:bg-red-500/30 dark:border-red-500 dark:text-red-200",
];
const courseColorMap = new Map<string, string>();
let colorIndex = 0;
let isRenderClearing = false;

const getCourseColor = (courseName: string, isFirstRender: boolean) => {
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
  return courseColorMap.get(courseName);
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
}

export function WeeklyCalendar({ events = [] }: { events: CalendarEvent[] }) {
  const [currentDate, setCurrentDate] = useState(dayjs());
  const today = dayjs().day();

  const handlePreviousWeek = () => {
    setCurrentDate(currentDate.subtract(1, 'week'));
  };

  const handleNextWeek = () => {
    setCurrentDate(currentDate.add(1, 'week'));
  };
  
  const startOfWeek = currentDate.startOf('week');
  const endOfWeek = currentDate.endOf('week');
  const formattedDateRange = `${startOfWeek.format('MMM D')} - ${endOfWeek.format('MMM D, YYYY')}`;

  // Calculate event layouts for overlapping events
  const eventLayouts = getEventLayout(events, currentDate);

  return (
    <Card className="h-fit">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold">Your Enrolled Schedule</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Event
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={handlePreviousWeek}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="font-medium text-muted-foreground">{formattedDateRange}</span>
          <Button variant="ghost" size="sm" onClick={handleNextWeek}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-[6rem_repeat(7,1fr)] grid-rows-[auto_auto_repeat(28,20px)]">
          <div className="sticky top-0 z-20 bg-card"></div>
          {days.map((day, index) => (
            <div 
              key={day} 
              className={cn(
                "sticky top-0 z-20 bg-card text-sm font-medium text-center p-2 text-muted-foreground border-b",
                dayjs().isSame(currentDate, 'week') && index === today && "bg-gray-100 dark:bg-gray-800"
              )}
            >
              {day.slice(0, 3)}
            </div>
          ))}
          
          <div className="row-start-2 col-start-1 text-xs font-medium text-muted-foreground p-2 text-right pr-4 z-10 sticky top-12 bg-card border-b border-r">All-Day</div>
          {days.map((day, index) => (
             <div key={`${day}-allday`} className="row-start-2 col-start-${index + 2} border-b border-r border-border/50 p-1 space-y-1"></div>
          ))}

          {timeSlots.map((time, index) => (
            <div key={time} className="row-start-auto col-start-1 col-end-10 grid grid-cols-subgrid -mt-px" style={{ gridRowStart: index * 2 + 3 }}>
              <div className="text-xs text-muted-foreground p-2 text-right pr-4 z-10 sticky top-12 bg-card">{time}</div>
              {days.map(day => <div key={`${day}-cell-${time}`} className="border-t border-r border-border/50"></div>)}
            </div>
          ))}
          
          {/* --- MODIFIED RENDER LOGIC --- */}
          {events.map((event, index) => {
            // Only render events that are in the current visible week
            const eventDate = event.dueDate ? dayjs(event.dueDate) : null;
            if (event.type === 'assignment' && eventDate && !eventDate.isBetween(startOfWeek, endOfWeek, 'day', '[]')) {
              return null;
            }

            // A. Handle CLASS events
            if (event.type === 'class' && event.day && event.startTime && event.duration) {
              const uniqueKey = `class-${index}`;
              const { gridRow } = getEventGridRows(event.startTime, event.duration);
              const colorClass = getCourseColor(event.courseName, index === 0 && !isRenderClearing);
              const layout = eventLayouts[index] || { width: '100%', left: '0%', zIndex: 10 };
              
              return (
                <div
                  key={uniqueKey}
                  className={cn("relative rounded text-xs p-1 m-1 font-medium overflow-hidden flex items-start justify-start", colorClass)}
                  style={{ 
                    gridColumnStart: event.day + 1, 
                    gridRow: gridRow,
                    width: layout.width === '100%' ? 'auto' : layout.width,
                    marginLeft: layout.left !== '0%' ? layout.left : '0px',
                    zIndex: layout.zIndex
                  }}
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

              return (
                <div
                  key={uniqueKey}
                  className="relative rounded bg-destructive/80 text-destructive-foreground border border-destructive text-xs p-1 font-semibold overflow-hidden flex items-center gap-1"
                  style={{
                    gridColumnStart: dayIndex + 2,
                    // If it's an all-day event, place it in the all-day row (row 2).
                    // Otherwise, calculate its position like a class, assuming a 1-hour duration.
                    gridRow: isAllDay ? '2 / span 1' : getEventGridRows(eventDate.format('h:mm A'), 1).gridRow,
                    width: layout.width === '100%' ? 'auto' : layout.width,
                    marginLeft: layout.left !== '0%' ? layout.left : '0px',
                    zIndex: layout.zIndex
                  }}
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
    </Card>
  )
}
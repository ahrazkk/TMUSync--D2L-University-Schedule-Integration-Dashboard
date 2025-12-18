"use client";
import { Card, CardContent } from "@/components/ui/card"
import { Clock, CheckCircle, BookOpen, Calendar } from "lucide-react"
import dayjs from "dayjs"
import weekOfYear from "dayjs/plugin/weekOfYear"
import { MagneticBorder } from "@/components/ui/magnetic-border"

dayjs.extend(weekOfYear)
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface StatsCardsProps {
  assignmentStats?: {
    completed: number;
    total: number;
    viewContext: string;
  };
  courseStats?: {
    activeCourses: number;
    courseNames: string[];
    weeklyClassHours?: number;
  };
  weeklyHours?: {
    classHours: number;
    assignmentHours: number;
    lastWeekTotal?: number;
  };
  currentDate?: any; // dayjs object
}

// Custom CSS for flip animation and scrollbar hiding
const styles = `
  .perspective-1000 {
    perspective: 1000px;
  }
  .transform-style-3d {
    transform-style: preserve-3d;
  }
  .backface-hidden {
    backface-visibility: hidden;
  }
  .rotate-x-180 {
    transform: rotateX(180deg);
  }
  .group:hover .group-hover\\:rotate-x-180 {
    transform: rotateX(180deg);
  }
  .no-scrollbar::-webkit-scrollbar {
    display: none;
  }
  .no-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`;

export function StatsCards({ assignmentStats, courseStats, weeklyHours, currentDate }: StatsCardsProps) {
  // Calculate weekly hours dynamically
  const classHours = weeklyHours?.classHours ?? 0;
  const assignmentHours = weeklyHours?.assignmentHours ?? (assignmentStats?.total ?? 0);
  const totalHours = classHours + assignmentHours; // 1 hour per assignment approx
  const lastWeekTotal = weeklyHours?.lastWeekTotal ?? 0;
  const hoursDiff = totalHours - lastWeekTotal;

  const stats = [
    {
      title: "Weekly Hours",
      value: `${totalHours}h`,
      icon: Clock,
      change: hoursDiff !== 0
        ? `${hoursDiff > 0 ? '+' : ''}${hoursDiff}h from last week`
        : "Same as last week",
      positive: hoursDiff >= 0,
      details: (
        <div className="space-y-4 text-sm text-card-foreground">
          <div className="flex justify-between items-center p-2 bg-secondary/20 rounded-lg border border-border/50">
            <span className="font-serif">Class Hours</span>
            <span className="font-bold text-lg">{classHours}h</span>
          </div>
          <div className="flex justify-between items-center p-2 bg-secondary/20 rounded-lg border border-border/50">
            <span className="font-serif">Assignments</span>
            <span className="font-bold text-lg">{assignmentHours}h</span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2 text-center italic font-serif">Estimated workload</p>
        </div>
      )
    },
    {
      title: "Assignments Done",
      value: assignmentStats ? `${assignmentStats.completed}/${assignmentStats.total}` : "0/0",
      icon: CheckCircle,
      change: assignmentStats ?
        assignmentStats.completed > 0 ?
          `${assignmentStats.completed} completed` :
          `${assignmentStats.total} pending` :
        "Loading...",
      positive: assignmentStats ? assignmentStats.completed > 0 : false,
      details: (
        <div className="space-y-3 text-sm text-card-foreground">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-2 bg-secondary/20 rounded-lg text-center border border-border/50">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Pending</p>
              <p className="text-xl font-bold font-serif">{assignmentStats?.total || 0}</p>
            </div>
            <div className="p-2 bg-secondary/20 rounded-lg text-center border border-border/50">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Done</p>
              <p className="text-xl font-bold font-serif">{assignmentStats?.completed || 0}</p>
            </div>
          </div>
          <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden mt-3">
            <div
              className="bg-primary h-full transition-all duration-500"
              style={{ width: `${assignmentStats && (assignmentStats.total + assignmentStats.completed) > 0 ? (assignmentStats.completed / (assignmentStats.total + assignmentStats.completed)) * 100 : 0}%` }}
            ></div>
          </div>
        </div>
      )
    },
    {
      title: "Active Courses",
      value: courseStats ? courseStats.activeCourses.toString() : "0",
      icon: BookOpen,
      change: courseStats ? `${courseStats.activeCourses} courses this week` : "Loading...",
      positive: true,
      details: (
        <div className="space-y-2 text-card-foreground h-full flex flex-col">
          <p className="text-xs text-muted-foreground mb-2 text-center italic font-serif">{courseStats?.activeCourses || 0} courses active</p>
          <div className="flex flex-wrap gap-2 justify-center content-start max-h-[90px] overflow-y-auto no-scrollbar">
            {courseStats?.courseNames && courseStats.courseNames.length > 0 ? (
              courseStats.courseNames.map((name, i) => (
                <span key={i} className="px-2 py-1 bg-background text-foreground rounded-full text-[10px] border shadow-sm font-medium tracking-wide">
                  {name}
                </span>
              ))
            ) : (
              <span className="text-sm opacity-70 italic">No active courses.</span>
            )}
          </div>
        </div>
      )
    },
    {
      title: "This Week",
      value: currentDate ? currentDate.format('MMM D') : 'Today',
      icon: Calendar,
      change: currentDate ? `Week ${currentDate.week()} of ${currentDate.year()}` : 'Loading...',
      positive: true,
      details: (
        <div className="text-center space-y-3 pt-1 text-card-foreground h-full flex flex-col justify-center">
          <div>
            <p className="font-bold text-xl font-serif">{currentDate?.format('dddd')}</p>
            <div className="w-8 h-px bg-border mx-auto my-2"></div>
            <p className="text-sm text-muted-foreground uppercase tracking-widest">{currentDate?.format('MMMM D')}</p>
            <p className="text-xs text-muted-foreground mt-1 font-serif italic">{currentDate?.year()}</p>
          </div>
        </div>
      )
    },
  ]

  return (
    <>
      <style>{styles}</style>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          return (
            <div key={stat.title} className="group h-[160px] perspective-1000 cursor-pointer">
              <div className="relative h-full w-full transition-all duration-700 transform-style-3d group-hover:rotate-x-180">
                {/* Front Face */}
                <div className="absolute inset-0 backface-hidden">
                  <Card className="h-full border shadow-sm bg-card hover:shadow-md transition-shadow dark:border-white/20" hoverable>
                    <CardContent className="p-6 h-full flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground tracking-wide uppercase text-[10px]">{stat.title}</p>
                          <p className="text-3xl font-serif font-medium text-foreground mt-1">{stat.value}</p>
                        </div>
                        <div className="w-10 h-10 bg-secondary/10 rounded-full flex items-center justify-center border border-border/50">
                          <stat.icon className="w-5 h-5 text-foreground opacity-70" />
                        </div>
                      </div>
                      <p className={`text-xs mt-2 font-medium ${stat.positive ? "text-green-600 dark:text-green-400" : "text-muted-foreground ml-1"}`}>
                        {stat.change}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Back Face - WHITE TAROT STYLE */}
                <div className="absolute inset-0 h-full w-full rounded-xl bg-card text-card-foreground p-5 rotate-x-180 backface-hidden border border-border dark:border-white/20 shadow-xl flex flex-col items-center justify-center relative group overflow-hidden">
                  <MagneticBorder />
                  <div className="absolute top-3 left-0 w-full flex justify-center opacity-10 pointer-events-none">
                    <stat.icon className="w-24 h-24" />
                  </div>

                  <div className="relative z-10 w-full h-full flex flex-col">
                    <div className="flex items-center justify-center gap-2 mb-3 border-b border-border/30 pb-2">
                      <h3 className="font-serif font-bold text-sm tracking-widest uppercase text-foreground">{stat.title}</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto no-scrollbar w-full">
                      {stat.details}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  )
}

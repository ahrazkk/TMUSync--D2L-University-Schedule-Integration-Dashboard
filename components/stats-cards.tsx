import { Card, CardContent } from "@/components/ui/card"
import { Clock, CheckCircle, BookOpen, TrendingUp } from "lucide-react"

interface StatsCardsProps {
  assignmentStats?: {
    completed: number;
    total: number;
    viewContext: string; // "2 weeks" or "all"
  };
  courseStats?: {
    activeCourses: number;
    courseNames: string[];
  };
}

export function StatsCards({ assignmentStats, courseStats }: StatsCardsProps) {
  // Define pastel colors for each card that work in both light and dark mode
  const pastelColors = [
    "hover:bg-pink-50 hover:border-pink-200 dark:hover:bg-pink-950/20 dark:hover:border-pink-800", // Soft pink
    "hover:bg-blue-50 hover:border-blue-200 dark:hover:bg-blue-950/20 dark:hover:border-blue-800", // Soft blue  
    "hover:bg-green-50 hover:border-green-200 dark:hover:bg-green-950/20 dark:hover:border-green-800", // Soft green
    "hover:bg-purple-50 hover:border-purple-200 dark:hover:bg-purple-950/20 dark:hover:border-purple-800", // Soft purple
  ]

  const stats = [
    {
      title: "Weekly Hours",
      value: "25h",
      icon: Clock,
      change: "+2h from last week",
      positive: true,
    },
    {
      title: "Assignments Done",
      value: assignmentStats ? `${assignmentStats.completed}/${assignmentStats.total}` : "0/0",
      icon: CheckCircle,
      change: assignmentStats ? 
        assignmentStats.completed > 0 ? 
          `${assignmentStats.completed} completed${assignmentStats.viewContext !== 'all' ? ` (${assignmentStats.viewContext})` : ''}` :
          `${assignmentStats.total} pending${assignmentStats.viewContext !== 'all' ? ` (${assignmentStats.viewContext})` : ''}` :
        "Loading...",
      positive: assignmentStats ? assignmentStats.completed > 0 : false,
    },
    {
      title: "Active Courses",
      value: courseStats ? courseStats.activeCourses.toString() : "0",
      icon: BookOpen,
      change: courseStats ? 
        courseStats.activeCourses > 0 ? 
          courseStats.activeCourses <= 3 ? 
            courseStats.courseNames.join(", ") : 
            `${courseStats.courseNames.slice(0, 2).join(", ")} +${courseStats.activeCourses - 2} more` :
          "No active courses" :
        "Loading...",
      positive: true,
    },
    {
      title: "GPA Trend",
      value: "3.8",
      icon: TrendingUp,
      change: "+0.2 this semester",
      positive: true,
    },
  ]
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <Card 
          key={stat.title} 
          className={`hover:shadow-md transition-all duration-300 ${pastelColors[index % pastelColors.length]}`}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className={`text-xs ${stat.positive ? "text-primary" : "text-muted-foreground"}`}>{stat.change}</p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <stat.icon className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

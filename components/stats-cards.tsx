import { Card, CardContent } from "@/components/ui/card"
import { Clock, CheckCircle, BookOpen, TrendingUp } from "lucide-react"

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
    value: "8/12",
    icon: CheckCircle,
    change: "4 remaining",
    positive: false,
  },
  {
    title: "Active Courses",
    value: "7",
    icon: BookOpen,
    change: "All on track",
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

export function StatsCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.title} className="hover:shadow-md transition-shadow">
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

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Timer, Target, BookOpen, BarChart3 } from "lucide-react"

export function QuickActions() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" className="w-full justify-start gap-3 h-12 bg-transparent">
            <Timer className="w-5 h-5 text-primary" />
            <div className="text-left">
              <div className="font-medium">Start Pomodoro</div>
              <div className="text-xs text-muted-foreground">25 min focus session</div>
            </div>
          </Button>

          <Button variant="outline" className="w-full justify-start gap-3 h-12 bg-transparent">
            <BookOpen className="w-5 h-5 text-secondary" />
            <div className="text-left">
              <div className="font-medium">Study Session</div>
              <div className="text-xs text-muted-foreground">Track your study time</div>
            </div>
          </Button>

          <Button variant="outline" className="w-full justify-start gap-3 h-12 bg-transparent">
            <Target className="w-5 h-5 text-chart-3" />
            <div className="text-left">
              <div className="font-medium">Set Goal</div>
              <div className="text-xs text-muted-foreground">Create new academic goal</div>
            </div>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold">Weekly Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Study Hours</span>
              <span className="font-medium">25/30h</span>
            </div>
            <Progress value={83} className="h-2" />
          </div>

          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Assignments</span>
              <span className="font-medium">8/12</span>
            </div>
            <Progress value={67} className="h-2" />
          </div>

          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Course Attendance</span>
              <span className="font-medium">95%</span>
            </div>
            <Progress value={95} className="h-2" />
          </div>

          <Button variant="ghost" className="w-full mt-4">
            <BarChart3 className="w-4 h-4 mr-2" />
            View Detailed Analytics
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

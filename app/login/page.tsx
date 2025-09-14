"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { GraduationCap, Loader2 } from "lucide-react"

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  twoFactorCode: z.string().min(1, "2FA Code is required"),
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.message || "An unknown error occurred.")
      }
      
      // --- MODIFICATION ---
      // 1. Check if schedule data exists in the response
      if (result.schedule) {
        // 2. Save it to localStorage as a JSON string
        localStorage.setItem('userSchedule', JSON.stringify(result.schedule));
      }
      
      // 3. Check if user needs to set up ICS URL
      if (result.needsSetup) {
        // Redirect to setup page
        router.push("/setup")
      } else {
        // Redirect to dashboard
        window.location.href = '/'; // This forces a full page load and ensures the new cookie is sent
      }

    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
<Card className="mx-auto max-w-md">        <CardHeader>
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center">
              <GraduationCap className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">UniTracker Login</CardTitle>
          <CardDescription className="text-center">
            Enter your university credentials to sync your schedule
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="jsmith"
                {...register("username")}
                disabled={isLoading}
              />
              {errors.username && <p className="text-xs text-red-500">{errors.username.message}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                {...register("password")}
                disabled={isLoading}
              />
              {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="twoFactorCode">2FA Code</Label>
              <Input
                id="twoFactorCode"
                type="text"
                placeholder="Duo Mobile Code"
                {...register("twoFactorCode")}
                disabled={isLoading}
              />
              {errors.twoFactorCode && <p className="text-xs text-red-500">{errors.twoFactorCode.message}</p>}
            </div>
            {error && <p className="text-sm text-red-500 text-center">{error}</p>}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? "Syncing Schedule..." : "Login & Sync"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
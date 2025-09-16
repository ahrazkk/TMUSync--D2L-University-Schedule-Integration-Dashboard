"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { BubbleBackground } from "@/components/ui/bubble-background"
import { ThemeToggle } from "@/components/theme-toggle"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"

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
  const [isSkipping, setIsSkipping] = useState(false)
  const [twoFactorCode, setTwoFactorCode] = useState("")
  const [hasCachedData, setHasCachedData] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Check for cached data on component mount
  useEffect(() => {
    setMounted(true)
    const cachedSchedule = localStorage.getItem('userSchedule')
    const cachedAssignments = localStorage.getItem('tmu-sync-assignments')
    setHasCachedData(!!(cachedSchedule || cachedAssignments))
  }, [])

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true)
    setError(null)

    // Set the 2FA code in the form data
    const formData = { ...data, twoFactorCode }

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
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
      setError("Failed to connect to the server.")
      setIsLoading(false)
    }
  }

  const handleSkipLogin = async () => {
    setIsSkipping(true)
    setError(null)

    try {
      // Check if we have cached schedule data
      const cachedSchedule = localStorage.getItem('userSchedule')
      const cachedAssignments = localStorage.getItem('tmu-sync-assignments')
      
      if (!cachedSchedule && !cachedAssignments) {
        setError("No cached data found. Please login first to sync your schedule.")
        setIsSkipping(false)
        return
      }

      // Create a mock session for offline mode
      const response = await fetch("/api/quick-reauth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ useCache: true }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to enter offline mode.")
      }

      console.log('Skip login successful:', result)
      
      // Redirect to dashboard in offline mode
      window.location.href = '/'

    } catch (err: any) {
      setError("Failed to use cached data. Try logging in normally.")
      setIsSkipping(false)
    }
  }

  return (
    <>
      <BubbleBackground />
      {/* Theme toggle button in top right corner */}
      <div className="absolute top-4 right-4 z-10">
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-lg p-1 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
          <ThemeToggle />
        </div>
      </div>
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-sm bg-white/30 dark:bg-gray-900/30 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center text-gray-900 dark:text-white">TMUSync</CardTitle>
            <CardDescription className="text-center text-gray-700 dark:text-gray-300">
              Enter your TMU credentials to sync your schedule.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="username" className="text-gray-900 dark:text-gray-100">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="my.tmu.ca username"
                  {...register("username")}
                  disabled={isLoading}
                  className="bg-white/70 dark:bg-gray-800/70 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
                />
                {errors.username && <p className="text-xs text-red-500 dark:text-red-400">{errors.username.message}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password" className="text-gray-900 dark:text-gray-100">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="********"
                  {...register("password")}
                  disabled={isLoading}
                  className="bg-white/70 dark:bg-gray-800/70 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
                />
                {errors.password && <p className="text-xs text-red-500 dark:text-red-400">{errors.password.message}</p>}
              </div>
              <div className="grid gap-2 justify-center">
                <Label htmlFor="otp-input" className="text-gray-900 dark:text-gray-100">Two-Factor Authentication</Label>
                <InputOTP 
                  maxLength={6} 
                  id="otp-input"
                  value={twoFactorCode}
                  onChange={(value) => {
                    setTwoFactorCode(value)
                    setValue("twoFactorCode", value)
                  }}
                  disabled={isLoading}
                  className="[&>div]:bg-white/70 dark:[&>div]:bg-gray-800/70 [&>div]:border-gray-300 dark:[&>div]:border-gray-600"
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} className="bg-white/70 dark:bg-gray-800/70 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100" />
                    <InputOTPSlot index={1} className="bg-white/70 dark:bg-gray-800/70 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100" />
                    <InputOTPSlot index={2} className="bg-white/70 dark:bg-gray-800/70 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100" />
                    <InputOTPSlot index={3} className="bg-white/70 dark:bg-gray-800/70 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100" />
                    <InputOTPSlot index={4} className="bg-white/70 dark:bg-gray-800/70 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100" />
                    <InputOTPSlot index={5} className="bg-white/70 dark:bg-gray-800/70 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100" />
                  </InputOTPGroup>
                </InputOTP>
                {errors.twoFactorCode && <p className="text-xs text-red-500 dark:text-red-400">{errors.twoFactorCode.message}</p>}
              </div>
              {error && <p className="text-sm text-red-500 dark:text-red-400 text-center">{error}</p>}
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isLoading || isSkipping}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? "Syncing Schedule..." : "Login & Sync"}
              </Button>
            </form>
            
            {/* Skip Login Button - Only show if cached data exists and component is mounted */}
            {mounted && hasCachedData && (
              <>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-300 dark:border-gray-600" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white/30 dark:bg-gray-900/30 px-2 text-gray-500 dark:text-gray-400">
                      Or
                    </span>
                  </div>
                </div>
                
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full bg-white/10 dark:bg-gray-800/10 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-white/20 dark:hover:bg-gray-800/20" 
                  onClick={handleSkipLogin}
                  disabled={isLoading || isSkipping}
                >
                  {isSkipping && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isSkipping ? "Loading Cache..." : "Skip Login (Use Cache)"}
                </Button>
                
                <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                  Uses previously saved schedule data
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
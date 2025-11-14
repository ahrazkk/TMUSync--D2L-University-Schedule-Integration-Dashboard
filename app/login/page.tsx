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

const icsLoginSchema = z.object({
  name: z.string().min(1, "Name is required"),
  scheduleIcsUrl: z.string().optional(),
  assignmentsIcsUrl: z.string().optional(),
}).refine(
  (data) => data.scheduleIcsUrl || data.assignmentsIcsUrl,
  { message: "At least one ICS URL is required" }
)

type LoginFormValues = z.infer<typeof loginSchema>
type ICSLoginFormValues = z.infer<typeof icsLoginSchema>

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSkipping, setIsSkipping] = useState(false)
  const [isICSLoading, setIsICSLoading] = useState(false)
  const [twoFactorCode, setTwoFactorCode] = useState("")
  const [hasCachedData, setHasCachedData] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [showICSLogin, setShowICSLogin] = useState(false)

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

  const {
    register: registerICS,
    handleSubmit: handleSubmitICS,
    formState: { errors: icsErrors },
  } = useForm<ICSLoginFormValues>({
    resolver: zodResolver(icsLoginSchema),
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

  const onICSSubmit = async (data: ICSLoginFormValues) => {
    setIsICSLoading(true)
    setError(null)

    try {
      console.log('[ICS Login] Submitting ICS URLs:', data);
      
      // Save the user's name to localStorage
      if (data.name) {
        localStorage.setItem('userName', data.name);
      }
      
      const response = await fetch("/api/login-ics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduleIcsUrl: data.scheduleIcsUrl,
          assignmentsIcsUrl: data.assignmentsIcsUrl
        }),
      })

      console.log('[ICS Login] Response status:', response.status);
      const result = await response.json()
      console.log('[ICS Login] Response data:', result);

      if (!response.ok || !result.success) {
        throw new Error(result.message || "An unknown error occurred.")
      }

      // Save schedule to localStorage
      if (result.schedule) {
        localStorage.setItem('userSchedule', JSON.stringify(result.schedule))
        console.log('[ICS Login] Saved schedule to localStorage');
      }

      console.log('[ICS Login] Login successful, redirecting to dashboard...');
      // Redirect to dashboard
      window.location.href = '/'

    } catch (err: any) {
      console.error('[ICS Login] Error:', err);
      setError(err.message || "Failed to connect to the server.")
      setIsICSLoading(false)
    }
  }

  const onDemoLogin = async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('[Demo Mode] Initiating demo login...');
      
      // Call the demo login API route
      const response = await fetch("/api/login-demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      console.log('[Demo Mode] Response status:', response.status);
      const result = await response.json();
      console.log('[Demo Mode] Response data:', result);

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to start demo mode");
      }
      
      // Set demo user name and flag
      localStorage.setItem('userName', 'Demo User');
      localStorage.setItem('isDemo', 'true');
      
      // Save demo schedule data from API response
      if (result.schedule) {
        localStorage.setItem('userSchedule', JSON.stringify(result.schedule));
      }
      
      // Save demo assignments data
      if (result.assignments) {
        localStorage.setItem('tmu-sync-assignments', JSON.stringify(result.assignments));
      }
      
      console.log('[Demo Mode] Demo data saved, redirecting to dashboard...');
      
      // Redirect to dashboard (client-side auth will allow access)
      window.location.href = '/';
    } catch (err: any) {
      console.error('[Demo Mode] Error:', err);
      setError(err.message || 'Failed to load demo');
      setIsLoading(false);
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
            <CardTitle className="text-3xl font-bold text-center text-gray-900 dark:text-white">
              TMU<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 dark:from-blue-400/30 dark:via-purple-400/30 dark:to-pink-400/30" style={{ WebkitTextStroke: '0.5px rgba(0, 0, 0, 0.3)' }}>Sync</span>
            </CardTitle>
            <CardDescription className="text-center text-gray-700 dark:text-gray-300">
              Enter your TMU credentials to sync your schedule.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {/* Credential Login - Disabled */}
            <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 opacity-60">
              <div className="grid gap-2">
                <Label htmlFor="username" className="text-gray-900 dark:text-gray-100">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="my.tmu.ca username"
                  {...register("username")}
                  disabled={true}
                  className="bg-white/70 dark:bg-gray-800/70 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password" className="text-gray-900 dark:text-gray-100">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="********"
                  {...register("password")}
                  disabled={true}
                  className="bg-white/70 dark:bg-gray-800/70 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
                />
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
                  disabled={true}
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
              </div>
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={true}>
                Login & Sync
              </Button>
            </form>
            <p className="text-xs text-center text-yellow-700 dark:text-yellow-400">⚠️ Credential login temporarily unavailable. Please use ICS or Demo mode below.</p>
            
            {/* ICS Login Section */}
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

            {!showICSLogin ? (
              <Button 
                type="button" 
                variant="outline" 
                className="w-full bg-white/10 dark:bg-gray-800/10 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-white/20 dark:hover:bg-gray-800/20" 
                onClick={() => setShowICSLogin(true)}
                disabled={isLoading || isSkipping || isICSLoading}
              >
                Login with ICS Codes
              </Button>
            ) : (
              <form onSubmit={handleSubmitICS(onICSSubmit)} className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name" className="text-gray-900 dark:text-gray-100">
                    Your Name
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your name"
                    {...registerICS("name")}
                    disabled={isICSLoading}
                    className="bg-white/70 dark:bg-gray-800/70 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
                  />
                  {icsErrors.name && <p className="text-xs text-red-500 dark:text-red-400">{icsErrors.name.message}</p>}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="scheduleIcsUrl" className="text-gray-900 dark:text-gray-100">
                    Schedule ICS URL <span className="text-xs text-gray-500 dark:text-gray-400">(Optional)</span>
                  </Label>
                  <Input
                    id="scheduleIcsUrl"
                    type="url"
                    placeholder="https://example.com/schedule.ics"
                    {...registerICS("scheduleIcsUrl")}
                    disabled={isICSLoading}
                    className="bg-white/70 dark:bg-gray-800/70 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
                  />
                  {icsErrors.scheduleIcsUrl && <p className="text-xs text-red-500 dark:text-red-400">{icsErrors.scheduleIcsUrl.message}</p>}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="assignmentsIcsUrl" className="text-gray-900 dark:text-gray-100">
                    Assignments ICS URL <span className="text-xs text-gray-500 dark:text-gray-400">(Optional)</span>
                  </Label>
                  <Input
                    id="assignmentsIcsUrl"
                    type="url"
                    placeholder="https://example.com/assignments.ics"
                    {...registerICS("assignmentsIcsUrl")}
                    disabled={isICSLoading}
                    className="bg-white/70 dark:bg-gray-800/70 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
                  />
                  {icsErrors.assignmentsIcsUrl && <p className="text-xs text-red-500 dark:text-red-400">{icsErrors.assignmentsIcsUrl.message}</p>}
                </div>
                {icsErrors.root && <p className="text-xs text-red-500 dark:text-red-400 text-center">{icsErrors.root.message}</p>}
                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="flex-1 bg-white/10 dark:bg-gray-800/10 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-white/20 dark:hover:bg-gray-800/20" 
                    onClick={() => setShowICSLogin(false)}
                    disabled={isICSLoading}
                  >
                    Back
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground" 
                    disabled={isLoading || isSkipping || isICSLoading}
                  >
                    {isICSLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isICSLoading ? "Syncing..." : "Sync with ICS"}
                  </Button>
                </div>
                <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                  At least one ICS URL is required. Get your ICS URLs from D2L or your calendar app.
                </p>
              </form>
            )}
            
            {/* Demo Button */}
            {!showICSLogin && (
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
                  className="w-full bg-purple-500/10 dark:bg-purple-700/10 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 hover:bg-purple-500/20 dark:hover:bg-purple-700/20" 
                  onClick={onDemoLogin}
                  disabled={isLoading || isSkipping || isICSLoading}
                >
                  ✨ Try Demo Mode
                </Button>
                
                <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                  View a sample schedule without ICS URLs
                </p>
              </>
            )}
            
            {/* Skip Login Button - Only show if cached data exists and component is mounted */}
            {mounted && hasCachedData && !showICSLogin && (
              <div className="opacity-50 pointer-events-none">
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
                  className="w-full bg-white/10 dark:bg-gray-800/10 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300" 
                  disabled={true}
                >
                  📦 Use Cached Data (Disabled)
                </Button>
                
                <p className="text-xs text-center text-yellow-700 dark:text-yellow-400">
                  ⚠️ Cache login temporarily unavailable
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
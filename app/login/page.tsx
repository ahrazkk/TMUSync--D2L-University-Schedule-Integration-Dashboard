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
import { Loader2, ChevronDown, ChevronUp } from "lucide-react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

// Feature flag for school login
const ENABLE_SCHOOL_LOGIN = process.env.NEXT_PUBLIC_ENABLE_SCHOOL_LOGIN === 'true';

// New email/password login schema
const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
})

// Legacy school login schema
const schoolLoginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  twoFactorCode: z.string().min(1, "2FA Code is required"),
})

type LoginFormValues = z.infer<typeof loginSchema>
type SchoolLoginFormValues = z.infer<typeof schoolLoginSchema>

export default function LoginPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showSchoolLogin, setShowSchoolLogin] = useState(false)
  const [twoFactorCode, setTwoFactorCode] = useState("")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    // Auto-logout if visiting login page to break redirect loops (especially from demo mode)
    // This allows the user to re-login purely by navigating here.
    const clearSession = async () => {
      try {
        await fetch('/api/auth/logout', { method: 'POST' });
      } catch (e) {
        console.error("Failed to clear session on login page visit", e);
      }
    };
    clearSession();
  }, [])

  // Email/password login form
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  })

  // School login form
  const {
    register: registerSchool,
    handleSubmit: handleSubmitSchool,
    formState: { errors: schoolErrors },
    setValue: setSchoolValue,
  } = useForm<SchoolLoginFormValues>({
    resolver: zodResolver(schoolLoginSchema),
  })

  // Handle email/password login
  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Login failed")
      }

      // Redirect to dashboard
      window.location.href = '/dashboard'
    } catch (err: any) {
      setError(err.message || "Failed to login. Please try again.")
      setIsLoading(false)
    }
  }

  // Handle school login (legacy)
  const onSchoolSubmit = async (data: SchoolLoginFormValues) => {
    setIsLoading(true)
    setError(null)

    const formData = { ...data, twoFactorCode }

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.message || "School login failed")
      }

      if (result.schedule) {
        localStorage.setItem('userSchedule', JSON.stringify(result.schedule));
      }

      if (result.needsSetup) {
        router.push("/setup")
      } else {
        window.location.href = '/'
      }
    } catch (err: any) {
      setError(err.message || "Failed to connect to the server.")
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <BubbleBackground />

      {/* Theme toggle in top right */}
      <div className="absolute top-4 right-4 z-10">
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-lg p-1 border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
          <ThemeToggle />
        </div>
      </div>

      <Card className="w-full max-w-sm backdrop-blur-md bg-white/80 dark:bg-gray-900/80 border-white/20 shadow-2xl">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            TMUSync
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-400">
            Sign in to access your schedule
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Email/Password Login Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400 rounded-md">
                {error}
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="email" className="text-gray-900 dark:text-gray-100">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                {...register("email")}
                disabled={isLoading}
                className="bg-white/70 dark:bg-gray-800/70 border-gray-300 dark:border-gray-600"
              />
              {errors.email && (
                <p className="text-xs text-red-500 dark:text-red-400">{errors.email.message}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password" className="text-gray-900 dark:text-gray-100">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...register("password")}
                disabled={isLoading}
                className="bg-white/70 dark:bg-gray-800/70 border-gray-300 dark:border-gray-600"
              />
              {errors.password && (
                <p className="text-xs text-red-500 dark:text-red-400">{errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>

            {/* Back to Home Button */}
            <Button
              type="button"
              variant="ghost"
              className="w-full text-muted-foreground hover:text-foreground"
              onClick={() => router.push('/')}
            >
              Back to Home
            </Button>
          </form>

          {/* Sign up link */}
          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            Don't have an account?{" "}
            <a href="/signup" className="text-primary hover:underline font-medium">
              Create one
            </a>
          </p>

          {/* School Login Section (if enabled) */}
          {ENABLE_SCHOOL_LOGIN && mounted && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-300 dark:border-gray-600" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white/80 dark:bg-gray-900/80 px-2 text-gray-500 dark:text-gray-400">
                    Or
                  </span>
                </div>
              </div>

              <Collapsible open={showSchoolLogin} onOpenChange={setShowSchoolLogin}>
                <CollapsibleTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full bg-white/10 dark:bg-gray-800/10 border-gray-300 dark:border-gray-600"
                  >
                    {showSchoolLogin ? (
                      <>
                        <ChevronUp className="mr-2 h-4 w-4" />
                        Hide School Login
                      </>
                    ) : (
                      <>
                        <ChevronDown className="mr-2 h-4 w-4" />
                        Login with TMU Account
                      </>
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 pt-4">
                  <form onSubmit={handleSubmitSchool(onSchoolSubmit)} className="space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="school-username" className="text-gray-900 dark:text-gray-100">
                        TMU Username
                      </Label>
                      <Input
                        id="school-username"
                        type="text"
                        placeholder="my.tmu.ca username"
                        {...registerSchool("username")}
                        disabled={isLoading}
                        className="bg-white/70 dark:bg-gray-800/70 border-gray-300 dark:border-gray-600"
                      />
                      {schoolErrors.username && (
                        <p className="text-xs text-red-500">{schoolErrors.username.message}</p>
                      )}
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="school-password" className="text-gray-900 dark:text-gray-100">
                        Password
                      </Label>
                      <Input
                        id="school-password"
                        type="password"
                        placeholder="••••••••"
                        {...registerSchool("password")}
                        disabled={isLoading}
                        className="bg-white/70 dark:bg-gray-800/70 border-gray-300 dark:border-gray-600"
                      />
                      {schoolErrors.password && (
                        <p className="text-xs text-red-500">{schoolErrors.password.message}</p>
                      )}
                    </div>

                    <div className="grid gap-2 items-center">
                      <Label className="text-gray-900 dark:text-gray-100">
                        Two-Factor Authentication
                      </Label>
                      <InputOTP
                        maxLength={6}
                        value={twoFactorCode}
                        onChange={(value) => {
                          setTwoFactorCode(value)
                          setSchoolValue("twoFactorCode", value)
                        }}
                        disabled={isLoading}
                      >
                        <InputOTPGroup>
                          <InputOTPSlot index={0} className="bg-white/70 dark:bg-gray-800/70 border-gray-300 dark:border-gray-600" />
                          <InputOTPSlot index={1} className="bg-white/70 dark:bg-gray-800/70 border-gray-300 dark:border-gray-600" />
                          <InputOTPSlot index={2} className="bg-white/70 dark:bg-gray-800/70 border-gray-300 dark:border-gray-600" />
                          <InputOTPSlot index={3} className="bg-white/70 dark:bg-gray-800/70 border-gray-300 dark:border-gray-600" />
                          <InputOTPSlot index={4} className="bg-white/70 dark:bg-gray-800/70 border-gray-300 dark:border-gray-600" />
                          <InputOTPSlot index={5} className="bg-white/70 dark:bg-gray-800/70 border-gray-300 dark:border-gray-600" />
                        </InputOTPGroup>
                      </InputOTP>
                      {schoolErrors.twoFactorCode && (
                        <p className="text-xs text-red-500">{schoolErrors.twoFactorCode.message}</p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Syncing Schedule...
                        </>
                      ) : (
                        "Login & Sync Schedule"
                      )}
                    </Button>
                  </form>
                </CollapsibleContent>
              </Collapsible>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
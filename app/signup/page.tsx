"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { BubbleBackground } from "@/components/ui/bubble-background"
import { ThemeToggle } from "@/components/theme-toggle"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, HelpCircle, ExternalLink, ChevronDown, ChevronUp } from "lucide-react"
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"

const signupSchema = z.object({
    firstName: z.string().min(1, "First name is required").max(50, "First name must be less than 50 characters"),
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    d2lIcsUrl: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
    googleCalendarUrl: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
}).refine((data) => data.d2lIcsUrl || data.googleCalendarUrl, {
    message: "Please provide at least one ICS URL (D2L or Google Calendar)",
    path: ["d2lIcsUrl"],
});

type SignupFormValues = z.infer<typeof signupSchema>

export default function SignupPage() {
    const router = useRouter()
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [showIcsHelp, setShowIcsHelp] = useState(false)

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<SignupFormValues>({
        resolver: zodResolver(signupSchema),
        defaultValues: {
            firstName: "",
            email: "",
            password: "",
            confirmPassword: "",
            d2lIcsUrl: "",
            googleCalendarUrl: "",
        },
    })

    const onSubmit = async (data: SignupFormValues) => {
        setIsLoading(true)
        setError(null)

        try {
            const response = await fetch("/api/auth/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    firstName: data.firstName,
                    email: data.email,
                    password: data.password,
                    icsUrls: {
                        d2l: data.d2lIcsUrl || undefined,
                        googleCalendar: data.googleCalendarUrl || undefined,
                    },
                }),
            })

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.error || "Failed to create account")
            }

            // Redirect to dashboard
            window.location.href = '/'
        } catch (err: any) {
            setError(err.message || "Failed to create account. Please try again.")
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
            <BubbleBackground />

            {/* Theme toggle in top right */}
            <div className="absolute top-4 right-4 z-10">
                <ThemeToggle />
            </div>

            <Card className="w-full max-w-lg backdrop-blur-md bg-white/80 dark:bg-gray-900/80 border-white/20 shadow-2xl">
                <CardHeader className="text-center pb-4">
                    <CardTitle className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                        TMUSync
                    </CardTitle>
                    <CardDescription className="text-gray-600 dark:text-gray-400">
                        Create your account to sync your schedule
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        {error && (
                            <div className="p-3 text-sm text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400 rounded-md">
                                {error}
                            </div>
                        )}

                        {/* First Name */}
                        <div className="grid gap-2">
                            <Label htmlFor="firstName" className="text-gray-900 dark:text-gray-100">
                                First Name
                            </Label>
                            <Input
                                id="firstName"
                                type="text"
                                placeholder="Your first name"
                                {...register("firstName")}
                                disabled={isLoading}
                                className="bg-white/70 dark:bg-gray-800/70 border-gray-300 dark:border-gray-600"
                            />
                            {errors.firstName && (
                                <p className="text-sm text-red-600 dark:text-red-400">{errors.firstName.message}</p>
                            )}
                        </div>

                        {/* Email */}
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
                                <p className="text-sm text-red-600 dark:text-red-400">{errors.email.message}</p>
                            )}
                        </div>

                        {/* Password */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="password" className="text-gray-900 dark:text-gray-100">
                                    Password
                                </Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Min 8 characters"
                                    {...register("password")}
                                    disabled={isLoading}
                                    className="bg-white/70 dark:bg-gray-800/70 border-gray-300 dark:border-gray-600"
                                />
                                {errors.password && (
                                    <p className="text-sm text-red-600 dark:text-red-400">{errors.password.message}</p>
                                )}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="confirmPassword" className="text-gray-900 dark:text-gray-100">
                                    Confirm Password
                                </Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="Confirm password"
                                    {...register("confirmPassword")}
                                    disabled={isLoading}
                                    className="bg-white/70 dark:bg-gray-800/70 border-gray-300 dark:border-gray-600"
                                />
                                {errors.confirmPassword && (
                                    <p className="text-sm text-red-600 dark:text-red-400">{errors.confirmPassword.message}</p>
                                )}
                            </div>
                        </div>

                        {/* ICS URLs Section */}
                        <div className="space-y-3 pt-2">
                            <div className="flex items-center justify-between">
                                <Label className="text-gray-900 dark:text-gray-100 font-medium">
                                    Calendar ICS URLs
                                </Label>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowIcsHelp(!showIcsHelp)}
                                    className="text-primary hover:text-primary/80"
                                >
                                    <HelpCircle className="w-4 h-4 mr-1" />
                                    Where to find these?
                                </Button>
                            </div>

                            {/* ICS Help Collapsible */}
                            <Collapsible open={showIcsHelp} onOpenChange={setShowIcsHelp}>
                                <CollapsibleContent className="space-y-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                    <div>
                                        <h4 className="font-medium text-blue-900 dark:text-blue-100 flex items-center gap-2">
                                            D2L/Brightspace ICS URL
                                        </h4>
                                        <ol className="text-sm text-blue-800 dark:text-blue-200 mt-2 space-y-1 list-decimal list-inside">
                                            <li>Log into D2L/Brightspace</li>
                                            <li>Go to Calendar</li>
                                            <li>Click "Subscribe" or look for a calendar feed option</li>
                                            <li>Copy the ICS URL (ends with .ics)</li>
                                        </ol>
                                    </div>
                                    <div className="border-t border-blue-200 dark:border-blue-700 pt-3">
                                        <h4 className="font-medium text-blue-900 dark:text-blue-100 flex items-center gap-2">
                                            Google Calendar ICS URL
                                        </h4>
                                        <ol className="text-sm text-blue-800 dark:text-blue-200 mt-2 space-y-1 list-decimal list-inside">
                                            <li>Open Google Calendar settings</li>
                                            <li>Click on your calendar under "Settings for my calendars"</li>
                                            <li>Scroll to "Integrate calendar"</li>
                                            <li>Copy "Secret address in iCal format"</li>
                                        </ol>
                                    </div>
                                </CollapsibleContent>
                            </Collapsible>

                            {/* D2L ICS URL */}
                            <div className="grid gap-2">
                                <Label htmlFor="d2lIcsUrl" className="text-gray-700 dark:text-gray-300 text-sm">
                                    D2L Calendar URL (optional)
                                </Label>
                                <Input
                                    id="d2lIcsUrl"
                                    type="url"
                                    placeholder="https://your-school.brightspace.com/d2l/..."
                                    {...register("d2lIcsUrl")}
                                    disabled={isLoading}
                                    className="bg-white/70 dark:bg-gray-800/70 border-gray-300 dark:border-gray-600 text-sm"
                                />
                            </div>

                            {/* Google Calendar ICS URL */}
                            <div className="grid gap-2">
                                <Label htmlFor="googleCalendarUrl" className="text-gray-700 dark:text-gray-300 text-sm">
                                    Google Calendar URL (optional)
                                </Label>
                                <Input
                                    id="googleCalendarUrl"
                                    type="url"
                                    placeholder="https://calendar.google.com/calendar/ical/..."
                                    {...register("googleCalendarUrl")}
                                    disabled={isLoading}
                                    className="bg-white/70 dark:bg-gray-800/70 border-gray-300 dark:border-gray-600 text-sm"
                                />
                            </div>

                            {errors.d2lIcsUrl && (
                                <p className="text-sm text-red-600 dark:text-red-400">{errors.d2lIcsUrl.message}</p>
                            )}
                        </div>

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            className="w-full mt-6"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating Account...
                                </>
                            ) : (
                                "Create Account"
                            )}
                        </Button>

                        {/* Login Link */}
                        <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-4">
                            Already have an account?{" "}
                            <a
                                href="/login"
                                className="text-primary hover:underline font-medium"
                            >
                                Sign in
                            </a>
                        </p>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}

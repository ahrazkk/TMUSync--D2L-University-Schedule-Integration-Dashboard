"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { CalendarIcon, Plus, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

const assignmentSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
    dueDate: z.coerce.date({ required_error: "Due date is required" }),
    courseKey: z.string().optional(),
    repetition: z.enum(["none", "daily", "weekly", "biweekly", "monthly"]).default("none"),
    priority: z.enum(["low", "medium", "high"]).default("medium"),
})

type AssignmentFormValues = z.infer<typeof assignmentSchema>

interface Course {
    key: string;
    name: string;
    code: string;
}

interface AddAssignmentModalProps {
    courses?: Course[];
    onAddAssignment?: (assignment: AssignmentFormValues) => Promise<void>;
    trigger?: React.ReactNode;
    onSuccess?: () => void;
}

export function AddAssignmentModal({
    courses = [],
    onAddAssignment,
    trigger,
    onSuccess
}: AddAssignmentModalProps) {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [date, setDate] = useState<Date>()

    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
        reset,
        watch,
    } = useForm<AssignmentFormValues>({
        resolver: zodResolver(assignmentSchema),
        defaultValues: {
            repetition: "none",
            priority: "medium",
        },
    })

    const onSubmit = async (data: AssignmentFormValues) => {
        setIsLoading(true)
        try {
            if (onAddAssignment) {
                await onAddAssignment(data)
            } else {
                // Default: call API directly
                await fetch("/api/user/assignments", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        title: data.title,
                        dueDate: data.dueDate.toISOString(),
                        courseKey: data.courseKey,
                        repetition: data.repetition,
                        priority: data.priority,
                    }),
                })
            }

            if (onSuccess) {
                onSuccess();
            }

            reset()
            setDate(undefined)
            setOpen(false)
        } catch (error) {
            console.error("Failed to add assignment:", error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="outline" size="sm" className="gap-2">
                        <Plus className="w-4 h-4" />
                        Add Assignment
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add New Assignment</DialogTitle>
                    <DialogDescription>
                        Create a custom assignment to track. Fill in the details below.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
                    {/* Title */}
                    <div className="space-y-2">
                        <Label htmlFor="title">Title *</Label>
                        <Input
                            id="title"
                            placeholder="e.g., Research Paper Draft"
                            {...register("title")}
                            disabled={isLoading}
                        />
                        {errors.title && (
                            <p className="text-sm text-red-500">{errors.title.message}</p>
                        )}
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description">Description (optional)</Label>
                        <textarea
                            id="description"
                            placeholder="Add notes, requirements, or details about this assignment..."
                            {...register("description")}
                            disabled={isLoading}
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                    </div>

                    {/* Due Date */}
                    <div className="space-y-2">
                        <Label>Due Date *</Label>
                        <div className="flex flex-col gap-2">
                            {/* Native date input for reliability */}
                            <Input
                                type="datetime-local"
                                id="dueDate"
                                className="w-full"
                                {...register("dueDate", { valueAsDate: true })}
                                disabled={isLoading}
                            />
                            {/* Optional: Calendar view can be added back if needed, but native is safest for now */}
                            <p className="text-[10px] text-muted-foreground">
                                * Use the browser's date picker to select due date and time
                            </p>
                        </div>
                        {errors.dueDate && (
                            <p className="text-sm text-red-500">{errors.dueDate.message}</p>
                        )}
                    </div>

                    {/* Course Selection */}
                    <div className="space-y-2">
                        <Label>Course (optional)</Label>
                        <Select
                            onValueChange={(value) => setValue("courseKey", value === "none" ? undefined : value)}
                            disabled={isLoading}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Leave unattached or select a course" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">No course (General)</SelectItem>
                                {courses.map((course) => (
                                    <SelectItem key={course.key} value={course.key}>
                                        {course.code} - {course.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Repetition */}
                    <div className="space-y-2">
                        <Label>Repetition</Label>
                        <Select
                            defaultValue="none"
                            onValueChange={(value) => setValue("repetition", value as any)}
                            disabled={isLoading}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select repetition" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">No repeat (one-time)</SelectItem>
                                <SelectItem value="daily">Daily</SelectItem>
                                <SelectItem value="weekly">Weekly</SelectItem>
                                <SelectItem value="biweekly">Every 2 weeks</SelectItem>
                                <SelectItem value="monthly">Monthly</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Priority */}
                    <div className="space-y-2">
                        <Label>Priority</Label>
                        <Select
                            defaultValue="medium"
                            onValueChange={(value) => setValue("priority", value as any)}
                            disabled={isLoading}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="low">
                                    <span className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-green-500" />
                                        Low
                                    </span>
                                </SelectItem>
                                <SelectItem value="medium">
                                    <span className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-yellow-500" />
                                        Medium
                                    </span>
                                </SelectItem>
                                <SelectItem value="high">
                                    <span className="flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-red-500" />
                                        High
                                    </span>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Adding...
                                </>
                            ) : (
                                "Add Assignment"
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}

"use client"

import { useState, useEffect } from "react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Eye,
    EyeOff,
    Save,
    RotateCcw,
    Calendar,
    Clock,
    MapPin,
    Sparkles,
    Link2,
    FileText
} from "lucide-react"
import { cn } from "@/lib/utils"
import { getAIConfig, isAIConfigured, generateClassDescription } from "@/lib/ai-assistant"

interface ClassEvent {
    id?: string
    title: string
    course?: string
    location?: string
    startTime?: string
    endTime?: string
    day?: number
    dayOfWeek?: number
    description?: string
    color?: string
}

interface Assignment {
    title: string
    course: string
    dueDate: string
    priority?: 'low' | 'medium' | 'high'
}

interface ClassEditModalProps {
    classEvent: ClassEvent | null
    open: boolean
    onOpenChange: (open: boolean) => void
    assignments?: Assignment[]
    onSave?: (updates: ClassCustomization) => void
    onHide?: (classId: string) => void
    customizations?: ClassCustomization
}

export interface ClassCustomization {
    classId: string
    customDescription?: string
    customNotes?: string
    linkedAssignments?: string[]
    hidden?: boolean
    customColor?: string
}

// Load customizations from localStorage
export function loadClassCustomizations(): Record<string, ClassCustomization> {
    if (typeof window === 'undefined') return {}
    const data = localStorage.getItem('class_customizations')
    return data ? JSON.parse(data) : {}
}

// Save customizations to localStorage
export function saveClassCustomization(customization: ClassCustomization): void {
    if (typeof window === 'undefined') return
    const all = loadClassCustomizations()
    all[customization.classId] = customization
    localStorage.setItem('class_customizations', JSON.stringify(all))
}

// Get hidden class IDs
export function getHiddenClasses(): string[] {
    const customizations = loadClassCustomizations()
    return Object.values(customizations)
        .filter(c => c.hidden)
        .map(c => c.classId)
}

// Unhide a class
export function unhideClass(classId: string): void {
    const all = loadClassCustomizations()
    if (all[classId]) {
        all[classId].hidden = false
        localStorage.setItem('class_customizations', JSON.stringify(all))
    }
}

// Reset all customizations
export function resetAllCustomizations(): void {
    localStorage.removeItem('class_customizations')
}

export function ClassEditModal({
    classEvent,
    open,
    onOpenChange,
    assignments = [],
    onSave,
    onHide,
    customizations: initialCustomizations
}: ClassEditModalProps) {
    const [activeTab, setActiveTab] = useState("details")
    const [description, setDescription] = useState("")
    const [notes, setNotes] = useState("")
    const [linkedAssignments, setLinkedAssignments] = useState<string[]>([])
    const [customColor, setCustomColor] = useState<string>("")
    const [isHidden, setIsHidden] = useState(false)
    const [isGeneratingAI, setIsGeneratingAI] = useState(false)
    const [hasChanges, setHasChanges] = useState(false)

    // Filter assignments for this class
    const relatedAssignments = assignments.filter(a => {
        if (!classEvent?.course) return false
        const courseCode = classEvent.course.replace(/[^A-Z0-9]/gi, '').toUpperCase()
        const assignmentCourse = a.course.replace(/[^A-Z0-9]/gi, '').toUpperCase()
        return assignmentCourse.includes(courseCode.substring(0, 6)) ||
            courseCode.includes(assignmentCourse.substring(0, 6))
    })

    // Load existing customizations
    useEffect(() => {
        if (classEvent && open) {
            const classId = classEvent.id || classEvent.title
            const all = loadClassCustomizations()
            const existing = all[classId] || initialCustomizations

            if (existing) {
                setDescription(existing.customDescription || "")
                setNotes(existing.customNotes || "")
                setLinkedAssignments(existing.linkedAssignments || [])
                setCustomColor(existing.customColor || "")
                setIsHidden(existing.hidden || false)
            } else {
                setDescription("")
                setNotes("")
                setLinkedAssignments([])
                setCustomColor("")
                setIsHidden(false)
            }
            setHasChanges(false)
        }
    }, [classEvent, open, initialCustomizations])

    const handleGenerateAIDescription = async () => {
        if (!classEvent || !isAIConfigured()) return

        setIsGeneratingAI(true)
        try {
            const config = getAIConfig()
            const result = await generateClassDescription(config, classEvent.title)
            if (result?.description) {
                setDescription(result.description)
                setHasChanges(true)
            }
        } catch (error) {
            console.error('Failed to generate AI description:', error)
        } finally {
            setIsGeneratingAI(false)
        }
    }

    const handleSave = () => {
        if (!classEvent) return

        const classId = classEvent.id || classEvent.title
        const customization: ClassCustomization = {
            classId,
            customDescription: description || undefined,
            customNotes: notes || undefined,
            linkedAssignments: linkedAssignments.length > 0 ? linkedAssignments : undefined,
            hidden: isHidden,
            customColor: customColor || undefined
        }

        saveClassCustomization(customization)
        onSave?.(customization)
        setHasChanges(false)
        onOpenChange(false)
    }

    const handleHide = () => {
        if (!classEvent) return
        const classId = classEvent.id || classEvent.title
        setIsHidden(true)

        const customization: ClassCustomization = {
            classId,
            customDescription: description || undefined,
            customNotes: notes || undefined,
            linkedAssignments: linkedAssignments.length > 0 ? linkedAssignments : undefined,
            hidden: true,
            customColor: customColor || undefined
        }

        saveClassCustomization(customization)
        onHide?.(classId)
        onOpenChange(false)
    }

    const handleReset = () => {
        setDescription("")
        setNotes("")
        setLinkedAssignments([])
        setCustomColor("")
        setIsHidden(false)
        setHasChanges(true)
    }

    const toggleAssignment = (assignmentTitle: string) => {
        setLinkedAssignments(prev => {
            if (prev.includes(assignmentTitle)) {
                return prev.filter(a => a !== assignmentTitle)
            }
            return [...prev, assignmentTitle]
        })
        setHasChanges(true)
    }

    if (!classEvent) return null

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const dayOfWeek = classEvent.dayOfWeek ?? classEvent.day ?? 0

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[550px] max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-blue-500" />
                        Class Details
                    </DialogTitle>
                    <DialogDescription>
                        View and customize class information
                    </DialogDescription>
                </DialogHeader>

                {/* Class Info Header */}
                <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                    <h3 className="font-semibold text-lg">{classEvent.title}</h3>
                    <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                        {classEvent.location && (
                            <span className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                {classEvent.location}
                            </span>
                        )}
                        {classEvent.startTime && (
                            <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {classEvent.startTime}
                            </span>
                        )}
                        <Badge variant="outline">
                            {dayNames[dayOfWeek]}
                        </Badge>
                    </div>
                    {isHidden && (
                        <Badge variant="secondary" className="mt-2">
                            <EyeOff className="w-3 h-3 mr-1" />
                            Hidden from calendar
                        </Badge>
                    )}
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="details">Details</TabsTrigger>
                        <TabsTrigger value="assignments">Assignments</TabsTrigger>
                        <TabsTrigger value="settings">Settings</TabsTrigger>
                    </TabsList>

                    {/* Details Tab */}
                    <TabsContent value="details" className="space-y-4 mt-4">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="description">Custom Description</Label>
                                {isAIConfigured() && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleGenerateAIDescription}
                                        disabled={isGeneratingAI}
                                        className="text-xs"
                                    >
                                        <Sparkles className="w-3 h-3 mr-1" />
                                        {isGeneratingAI ? 'Generating...' : 'AI Generate'}
                                    </Button>
                                )}
                            </div>
                            <textarea
                                id="description"
                                value={description}
                                onChange={(e) => { setDescription(e.target.value); setHasChanges(true) }}
                                placeholder="Add a custom description for this class..."
                                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="notes">Personal Notes</Label>
                            <textarea
                                id="notes"
                                value={notes}
                                onChange={(e) => { setNotes(e.target.value); setHasChanges(true) }}
                                placeholder="Add private notes about this class..."
                                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                        </div>
                    </TabsContent>

                    {/* Assignments Tab */}
                    <TabsContent value="assignments" className="space-y-4 mt-4">
                        <p className="text-sm text-muted-foreground">
                            Link assignments to this class. Related assignments are pre-filtered.
                        </p>

                        {relatedAssignments.length > 0 ? (
                            <div className="space-y-2 max-h-[200px] overflow-y-auto">
                                {relatedAssignments.map((assignment, idx) => (
                                    <div
                                        key={idx}
                                        className={cn(
                                            "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                                            linkedAssignments.includes(assignment.title)
                                                ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                                                : "hover:bg-muted/50"
                                        )}
                                        onClick={() => toggleAssignment(assignment.title)}
                                    >
                                        <Checkbox
                                            checked={linkedAssignments.includes(assignment.title)}
                                            onCheckedChange={() => toggleAssignment(assignment.title)}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{assignment.title}</p>
                                            <p className="text-xs text-muted-foreground">
                                                Due: {new Date(assignment.dueDate).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <Badge variant="outline" className="text-xs">
                                            {assignment.priority || 'medium'}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">No related assignments found</p>
                                <p className="text-xs mt-1">Assignments matching the course code will appear here</p>
                            </div>
                        )}

                        {linkedAssignments.length > 0 && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Link2 className="w-4 h-4" />
                                <span>{linkedAssignments.length} assignment(s) linked</span>
                            </div>
                        )}
                    </TabsContent>

                    {/* Settings Tab */}
                    <TabsContent value="settings" className="space-y-4 mt-4">
                        {/* Visibility */}
                        <div className="flex items-center justify-between p-3 rounded-lg border">
                            <div className="flex items-center gap-3">
                                {isHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                <div>
                                    <p className="text-sm font-medium">Visibility</p>
                                    <p className="text-xs text-muted-foreground">
                                        {isHidden ? 'Hidden from calendar' : 'Visible on calendar'}
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant={isHidden ? "default" : "outline"}
                                size="sm"
                                onClick={() => { setIsHidden(!isHidden); setHasChanges(true) }}
                            >
                                {isHidden ? 'Show' : 'Hide'}
                            </Button>
                        </div>

                        {/* Reset */}
                        <div className="flex items-center justify-between p-3 rounded-lg border">
                            <div className="flex items-center gap-3">
                                <RotateCcw className="w-4 h-4" />
                                <div>
                                    <p className="text-sm font-medium">Reset Customizations</p>
                                    <p className="text-xs text-muted-foreground">
                                        Remove all custom settings for this class
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleReset}
                            >
                                Reset
                            </Button>
                        </div>

                        {/* Info */}
                        <div className="bg-muted/50 p-3 rounded-lg text-xs text-muted-foreground">
                            <p><strong>Note:</strong> Customizations are stored locally and don't modify your original calendar.</p>
                            <p className="mt-1">The source calendar remains your source of truth.</p>
                        </div>
                    </TabsContent>
                </Tabs>

                {/* Action Buttons */}
                <div className="flex justify-between gap-3 pt-4 border-t">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <div className="flex gap-2">
                        {!isHidden && (
                            <Button variant="outline" onClick={handleHide}>
                                <EyeOff className="w-4 h-4 mr-2" />
                                Hide
                            </Button>
                        )}
                        <Button onClick={handleSave} disabled={!hasChanges}>
                            <Save className="w-4 h-4 mr-2" />
                            Save Changes
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

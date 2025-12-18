"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Search, Calendar, BookOpen, Settings, Clock, X, Command } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import dayjs from "dayjs"

interface SearchResult {
    type: 'assignment' | 'class' | 'course' | 'setting'
    title: string
    subtitle?: string
    metadata?: string
    data: any
}

interface EnhancedSearchProps {
    assignments?: any[]
    classes?: any[]
    courses?: any[]
    onAssignmentClick?: (assignment: any) => void
    onClassClick?: (classEvent: any) => void
    onSettingClick?: (setting: string) => void
}

const SETTINGS_OPTIONS = [
    { key: 'profile', label: 'Profile Settings', description: 'Update your profile information' },
    { key: 'ics', label: 'Calendar Sync (ICS)', description: 'Manage ICS calendar URLs' },
    { key: 'ai', label: 'AI Configuration', description: 'Set up Gemini API key' },
    { key: 'appearance', label: 'Appearance', description: 'Theme and display options' },
    { key: 'notifications', label: 'Notifications', description: 'Manage notification preferences' },
]

export function EnhancedSearch({
    assignments = [],
    classes = [],
    courses = [],
    onAssignmentClick,
    onClassClick,
    onSettingClick,
}: EnhancedSearchProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [query, setQuery] = useState("")
    const [results, setResults] = useState<SearchResult[]>([])
    const [selectedIndex, setSelectedIndex] = useState(0)
    const inputRef = useRef<HTMLInputElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    // Handle keyboard shortcut (Ctrl+K / Cmd+K)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault()
                setIsOpen(true)
                setTimeout(() => inputRef.current?.focus(), 100)
            }
            if (e.key === 'Escape') {
                setIsOpen(false)
                setQuery("")
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [])

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false)
            }
        }
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        }
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [isOpen])

    // Search logic
    const performSearch = useCallback((searchQuery: string) => {
        if (!searchQuery.trim()) {
            setResults([])
            return
        }

        const q = searchQuery.toLowerCase()
        const searchResults: SearchResult[] = []

        // Search assignments
        assignments.forEach(assignment => {
            const title = assignment.title?.toLowerCase() || ''
            const course = assignment.course?.toLowerCase() || ''
            if (title.includes(q) || course.includes(q)) {
                searchResults.push({
                    type: 'assignment',
                    title: assignment.title,
                    subtitle: assignment.course,
                    metadata: `Due: ${dayjs(assignment.dueDate).format('MMM D, h:mm A')}`,
                    data: assignment
                })
            }
        })

        // Search classes
        classes.forEach(classEvent => {
            const title = classEvent.title?.toLowerCase() || ''
            const course = classEvent.course?.toLowerCase() || ''
            if (title.includes(q) || course.includes(q)) {
                searchResults.push({
                    type: 'class',
                    title: classEvent.title,
                    subtitle: classEvent.location,
                    metadata: classEvent.startTime,
                    data: classEvent
                })
            }
        })

        // Search courses (unique)
        const uniqueCourses = [...new Set([
            ...assignments.map(a => a.course),
            ...classes.map(c => c.course)
        ])].filter(Boolean)

        uniqueCourses.forEach(courseCode => {
            if (courseCode?.toLowerCase().includes(q)) {
                searchResults.push({
                    type: 'course',
                    title: courseCode,
                    subtitle: 'Course',
                    data: { code: courseCode }
                })
            }
        })

        // Search settings
        SETTINGS_OPTIONS.forEach(setting => {
            if (setting.label.toLowerCase().includes(q) || setting.description.toLowerCase().includes(q)) {
                searchResults.push({
                    type: 'setting',
                    title: setting.label,
                    subtitle: setting.description,
                    data: setting.key
                })
            }
        })

        setResults(searchResults.slice(0, 15)) // Limit to 15 results
        setSelectedIndex(0)
    }, [assignments, classes])

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => performSearch(query), 150)
        return () => clearTimeout(timer)
    }, [query, performSearch])

    // Handle keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault()
            setSelectedIndex(prev => Math.min(prev + 1, results.length - 1))
        } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setSelectedIndex(prev => Math.max(prev - 1, 0))
        } else if (e.key === 'Enter' && results[selectedIndex]) {
            handleResultClick(results[selectedIndex])
        }
    }

    // Handle result click
    const handleResultClick = (result: SearchResult) => {
        switch (result.type) {
            case 'assignment':
                onAssignmentClick?.(result.data)
                break
            case 'class':
                onClassClick?.(result.data)
                break
            case 'setting':
                onSettingClick?.(result.data)
                break
        }
        setIsOpen(false)
        setQuery("")
    }

    // Get icon for result type
    const getResultIcon = (type: string) => {
        switch (type) {
            case 'assignment':
                return <Clock className="w-4 h-4 text-orange-500" />
            case 'class':
                return <Calendar className="w-4 h-4 text-blue-500" />
            case 'course':
                return <BookOpen className="w-4 h-4 text-purple-500" />
            case 'setting':
                return <Settings className="w-4 h-4 text-gray-500" />
            default:
                return <Search className="w-4 h-4" />
        }
    }

    // Group results by type
    const groupedResults = results.reduce((acc, result) => {
        if (!acc[result.type]) acc[result.type] = []
        acc[result.type].push(result)
        return acc
    }, {} as Record<string, SearchResult[]>)

    const typeLabels = {
        assignment: '📋 Assignments',
        class: '📅 Classes',
        course: '📚 Courses',
        setting: '⚙️ Settings'
    }

    return (
        <div ref={containerRef} className="relative w-full max-w-md">
            {/* Search Input */}
            <div
                className={cn(
                    "relative flex items-center",
                    "transition-all duration-200"
                )}
                onClick={() => {
                    setIsOpen(true)
                    setTimeout(() => inputRef.current?.focus(), 100)
                }}
            >
                <Search className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                    ref={inputRef}
                    type="text"
                    placeholder="Search assignments, classes, settings..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setIsOpen(true)}
                    className="pl-10 pr-16 h-10 bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
                />
                <div className="absolute right-3 flex items-center gap-1 text-xs text-muted-foreground pointer-events-none">
                    <Command className="w-3 h-3" />
                    <span>K</span>
                </div>
            </div>

            {/* Search Results Dropdown */}
            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-2xl z-[200] max-h-[70vh] overflow-y-auto">
                    {query.trim() === "" ? (
                        <div className="p-4 text-center text-muted-foreground">
                            <p className="text-sm">Start typing to search...</p>
                            <p className="text-xs mt-1 opacity-70">Assignments • Classes • Courses • Settings</p>
                        </div>
                    ) : results.length === 0 ? (
                        <div className="p-4 text-center text-muted-foreground">
                            <p className="text-sm">No results found for "{query}"</p>
                        </div>
                    ) : (
                        <div className="py-2">
                            {Object.entries(groupedResults).map(([type, typeResults]) => (
                                <div key={type}>
                                    <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide bg-zinc-50 dark:bg-zinc-800/50">
                                        {typeLabels[type as keyof typeof typeLabels] || type}
                                    </div>
                                    {typeResults.map((result, idx) => {
                                        const globalIndex = results.indexOf(result)
                                        return (
                                            <div
                                                key={idx}
                                                className={cn(
                                                    "px-3 py-2 cursor-pointer flex items-start gap-3 transition-colors",
                                                    globalIndex === selectedIndex
                                                        ? "bg-blue-50 dark:bg-blue-900/30"
                                                        : "hover:bg-zinc-50 dark:hover:bg-zinc-800"
                                                )}
                                                onClick={() => handleResultClick(result)}
                                                onMouseEnter={() => setSelectedIndex(globalIndex)}
                                            >
                                                <div className="mt-0.5">{getResultIcon(result.type)}</div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium truncate">{result.title}</p>
                                                    {result.subtitle && (
                                                        <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                                                    )}
                                                </div>
                                                {result.metadata && (
                                                    <Badge variant="outline" className="text-xs shrink-0">
                                                        {result.metadata}
                                                    </Badge>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Footer hint */}
                    <div className="border-t border-zinc-200 dark:border-zinc-700 px-3 py-2 text-xs text-muted-foreground flex items-center justify-between">
                        <span>↑↓ Navigate • Enter Select • Esc Close</span>
                        {results.length > 0 && <span>{results.length} results</span>}
                    </div>
                </div>
            )}
        </div>
    )
}

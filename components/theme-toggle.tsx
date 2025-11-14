"use client"

import * as React from "react"
import { Moon, Sun, Sparkles } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  const cycleTheme = () => {
    if (theme === "light") {
      setTheme("dark")
    } else if (theme === "dark") {
      setTheme("purple")
    } else {
      setTheme("light")
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={cycleTheme}
    >
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:scale-0 purple:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 transition-all dark:scale-100 purple:scale-0" />
      <Sparkles className="absolute h-[1.2rem] w-[1.2rem] scale-0 transition-all purple:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}

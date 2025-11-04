"use client"

import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"

export function DebugTheme() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="fixed bottom-4 left-4 z-50 p-4 bg-card border rounded-lg shadow-lg">
      <p className="text-sm font-medium mb-2">Current theme: {theme}</p>
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={() => setTheme("light")}
          variant={theme === "light" ? "default" : "outline"}
        >
          Light
        </Button>
        <Button
          size="sm"
          onClick={() => setTheme("dark")}
          variant={theme === "dark" ? "default" : "outline"}
        >
          Dark
        </Button>
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        Check browser console for click logs
      </p>
    </div>
  )
}
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Terminal } from "@phosphor-icons/react"
import { DevConsole } from "./dev-console"

export function DebugToggle() {
  const [isConsoleOpen, setIsConsoleOpen] = useState(false)

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsConsoleOpen(true)}
        className="fixed bottom-4 right-4 z-40 bg-background/80 backdrop-blur-sm hover:bg-background border-border shadow-lg"
      >
        <Terminal className="w-4 h-4 mr-2" />
        Debug
      </Button>
      
      <DevConsole 
        isOpen={isConsoleOpen} 
        onClose={() => setIsConsoleOpen(false)} 
      />
    </>
  )
}
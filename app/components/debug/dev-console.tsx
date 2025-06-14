"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { logger, LogEvent } from "@/lib/utils/logger"
import { 
  Terminal, 
  X, 
  Download, 
  Trash, 
  Funnel,
  Bug,
  Info,
  Warning,
  XCircle
} from "@phosphor-icons/react"

interface DevConsoleProps {
  isOpen: boolean
  onClose: () => void
}

export function DevConsole({ isOpen, onClose }: DevConsoleProps) {
  const [logs, setLogs] = useState<LogEvent[]>([])
  const [filter, setFilter] = useState<{
    level?: LogEvent['level']
    category?: LogEvent['category']
  }>({})

  useEffect(() => {
    if (isOpen) {
      // Refresh logs when console opens
      const allLogs = logger.getLogs()
      setLogs(allLogs)
      
      // Set up periodic refresh
      const interval = setInterval(() => {
        const updatedLogs = logger.getLogs(filter)
        setLogs(updatedLogs)
      }, 1000)
      
      return () => clearInterval(interval)
    }
  }, [isOpen, filter])

  const handleExport = () => {
    const exportData = logger.exportLogs()
    const blob = new Blob([exportData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `aida-logs-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleClear = () => {
    logger.clearLogs()
    setLogs([])
  }

  const getLogIcon = (level: LogEvent['level']) => {
    switch (level) {
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />
      case 'warning': return <Warning className="w-4 h-4 text-yellow-500" />
      case 'info': return <Info className="w-4 h-4 text-blue-500" />
      case 'debug': return <Bug className="w-4 h-4 text-gray-500" />
    }
  }

  const getLevelBadgeVariant = (level: LogEvent['level']) => {
    switch (level) {
      case 'error': return 'destructive'
      case 'warning': return 'secondary'
      case 'info': return 'default'
      case 'debug': return 'outline'
      default: return 'outline'
    }
  }

  const getCategoryColor = (category: LogEvent['category']) => {
    switch (category) {
      case 'agent': return 'text-purple-600 dark:text-purple-400'
      case 'tool': return 'text-green-600 dark:text-green-400'
      case 'ui': return 'text-blue-600 dark:text-blue-400'
      case 'api': return 'text-orange-600 dark:text-orange-400'
      default: return 'text-gray-600 dark:text-gray-400'
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end justify-end p-4">
      <Card className="w-full max-w-4xl h-[80vh] bg-background border-border">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2">
            <Terminal className="w-5 h-5" />
            AIDA Developer Console
            <Badge variant="outline" className="ml-2">
              {logs.length} events
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select 
              value={filter.level || "all"} 
              onValueChange={(value) => setFilter(prev => ({ 
                ...prev, 
                level: value === "all" ? undefined : value as LogEvent['level'] 
              }))}
            >
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="debug">Debug</SelectItem>
              </SelectContent>
            </Select>
            
            <Select 
              value={filter.category || "all"} 
              onValueChange={(value) => setFilter(prev => ({ 
                ...prev, 
                category: value === "all" ? undefined : value as LogEvent['category'] 
              }))}
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="agent">Agent</SelectItem>
                <SelectItem value="tool">Tool</SelectItem>
                <SelectItem value="ui">UI</SelectItem>
                <SelectItem value="api">API</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleClear}>
              <Trash className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-0 h-full">
          <ScrollArea className="h-full p-4">
            <div className="space-y-2">
              {logs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Terminal className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No logs available</p>
                  <p className="text-sm">Interact with agents and tools to see logs here</p>
                </div>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="flex gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                    <div className="flex-shrink-0 pt-1">
                      {getLogIcon(log.level)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={getLevelBadgeVariant(log.level)} className="text-xs">
                          {log.level}
                        </Badge>
                        <span className={`text-sm font-medium ${getCategoryColor(log.category)}`}>
                          {log.category}
                        </span>
                        <span className="text-sm font-mono text-muted-foreground">
                          {log.action}
                        </span>
                        <span className="text-xs text-muted-foreground ml-auto">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      
                      {log.data && (
                        <details className="text-xs">
                          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                            View data
                          </summary>
                          <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">
                            {JSON.stringify(log.data, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
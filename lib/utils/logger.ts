export interface LogEvent {
  timestamp: string
  level: 'info' | 'warning' | 'error' | 'debug'
  category: 'agent' | 'tool' | 'ui' | 'api'
  action: string
  data?: any
  userId?: string
  sessionId?: string
}

class Logger {
  private logs: LogEvent[] = []
  private maxLogs = 1000

  log(event: Omit<LogEvent, 'timestamp'>) {
    const logEvent: LogEvent = {
      ...event,
      timestamp: new Date().toISOString()
    }
    
    this.logs.unshift(logEvent)
    
    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs)
    }

    // Console output in development
    if (process.env.NODE_ENV === 'development') {
      const style = this.getLogStyle(event.level)
      console.log(
        `%c[${event.level.toUpperCase()}] ${event.category}:${event.action}`,
        style,
        event.data || ''
      )
    }
  }

  private getLogStyle(level: LogEvent['level']): string {
    switch (level) {
      case 'error': return 'color: #ef4444; font-weight: bold;'
      case 'warning': return 'color: #f59e0b; font-weight: bold;'
      case 'info': return 'color: #3b82f6; font-weight: bold;'
      case 'debug': return 'color: #6b7280; font-weight: normal;'
      default: return 'color: inherit;'
    }
  }

  getLogs(filter?: Partial<Pick<LogEvent, 'level' | 'category' | 'action'>>) {
    if (!filter) return this.logs

    return this.logs.filter(log => {
      return (!filter.level || log.level === filter.level) &&
             (!filter.category || log.category === filter.category) &&
             (!filter.action || log.action.includes(filter.action))
    })
  }

  clearLogs() {
    this.logs = []
  }

  exportLogs() {
    return JSON.stringify(this.logs, null, 2)
  }
}

export const logger = new Logger()

// Convenience methods
export const logAgent = (action: string, data?: any) => 
  logger.log({ level: 'info', category: 'agent', action, data })

export const logTool = (action: string, data?: any) => 
  logger.log({ level: 'info', category: 'tool', action, data })

export const logUI = (action: string, data?: any) => 
  logger.log({ level: 'info', category: 'ui', action, data })

export const logAPI = (action: string, data?: any) => 
  logger.log({ level: 'info', category: 'api', action, data })

export const logError = (category: LogEvent['category'], action: string, error: any) => 
  logger.log({ level: 'error', category, action, data: error })

export const logWarning = (category: LogEvent['category'], action: string, data?: any) => 
  logger.log({ level: 'warning', category, action, data })

export const logDebug = (category: LogEvent['category'], action: string, data?: any) => 
  logger.log({ level: 'debug', category, action, data })
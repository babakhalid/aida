"use client"

import { cn } from "@/lib/utils"
import type { ToolInvocationUIPart } from "@ai-sdk/ui-utils"
import {
  CaretDown,
  CheckCircle,
  Code,
  Link,
  Nut,
  Spinner,
  Wrench,
} from "@phosphor-icons/react"
import { AnimatePresence, motion } from "motion/react"
import { useEffect, useState } from "react"
import { BookingWizard } from "./booking-wizard"
import { MathWidget } from "./math-widget"
import { PurchaseRequestForm } from "./purchase-request-form"
import { MasterAgentOrchestrator } from "./master-agent-orchestrator"
import { logTool, logUI } from "@/lib/utils/logger"

interface ToolInvocationProps {
  toolInvocations: ToolInvocationUIPart[]
  className?: string
  defaultOpen?: boolean
}

const TRANSITION = {
  type: "spring" as const,
  duration: 0.2,
  bounce: 0,
}

export function ToolInvocation({
  toolInvocations,
  defaultOpen = false,
}: ToolInvocationProps) {
  const [isExpanded, setIsExpanded] = useState(true) // Always start expanded to show tools

  const toolInvocationsData = Array.isArray(toolInvocations)
    ? toolInvocations
    : [toolInvocations]

  // Group tool invocations by toolCallId
  const groupedTools = toolInvocationsData.reduce(
    (acc, item) => {
      const { toolCallId } = item.toolInvocation
      if (!acc[toolCallId]) {
        acc[toolCallId] = []
      }
      acc[toolCallId].push(item)
      return acc
    },
    {} as Record<string, ToolInvocationUIPart[]>
  )

  const uniqueToolIds = Object.keys(groupedTools)
  const isSingleTool = uniqueToolIds.length === 1

  // Check if we should render tools directly (for interactive tools)
  const shouldRenderDirect = (toolName: string) => {
    const directRenderTools = [
      "createPurchaseOrder", 
      "sapPurchaseOrder", 
      "createPO",
      "bookSportSession"
    ]
    return directRenderTools.includes(toolName)
  }

  // If single tool and should render directly, pass it to SingleToolView
  if (isSingleTool) {
    return (
      <SingleToolView
        toolInvocations={toolInvocationsData}
        defaultOpen={defaultOpen}
        className="mb-10"
      />
    )
  }

  return (
    <div className="mb-10">
      <div className="border-border flex flex-col gap-0 overflow-hidden rounded-md border">
        <button
          onClick={(e) => {
            e.preventDefault()
            setIsExpanded(!isExpanded)
          }}
          type="button"
          className="hover:bg-accent flex w-full flex-row items-center rounded-t-md px-3 py-2 transition-colors"
        >
          <div className="flex flex-1 flex-row items-center gap-2 text-left text-base">
            <Nut className="text-muted-foreground size-4" />
            <span className="text-sm">Tools executed</span>
            <div className="bg-secondary rounded-full px-1.5 py-0.5 font-mono text-xs text-slate-700">
              {uniqueToolIds.length}
            </div>
          </div>
          <CaretDown
            className={cn(
              "h-4 w-4 transition-transform",
              isExpanded ? "rotate-180 transform" : ""
            )}
          />
        </button>

        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={TRANSITION}
              className="overflow-hidden"
            >
              <div className="px-3 pt-3 pb-3">
                <div className="space-y-2">
                  {uniqueToolIds.map((toolId) => {
                    const toolInvocationsForId = groupedTools[toolId]

                    if (!toolInvocationsForId?.length) return null

                    return (
                      <div
                        key={toolId}
                        className="pb-2 last:border-0 last:pb-0"
                      >
                        <SingleToolView
                          toolInvocations={toolInvocationsForId}
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

type SingleToolViewProps = {
  toolInvocations: ToolInvocationUIPart[]
  defaultOpen?: boolean
  className?: string
}

function SingleToolView({
  toolInvocations,
  defaultOpen = false,
  className,
}: SingleToolViewProps) {
  // Group by toolCallId and pick the most informative state
  const groupedTools = toolInvocations.reduce(
    (acc, item) => {
      const { toolCallId } = item.toolInvocation
      if (!acc[toolCallId]) {
        acc[toolCallId] = []
      }
      acc[toolCallId].push(item)
      return acc
    },
    {} as Record<string, ToolInvocationUIPart[]>
  )

  // For each toolCallId, get the most informative state (result > call > requested)
  const toolsToDisplay = Object.values(groupedTools)
    .map((group) => {
      const resultTool = group.find(
        (item) => item.toolInvocation.state === "result"
      )
      const callTool = group.find(
        (item) => item.toolInvocation.state === "call"
      )
      const partialCallTool = group.find(
        (item) => item.toolInvocation.state === "partial-call"
      )

      // Return the most informative one
      return resultTool || callTool || partialCallTool
    })
    .filter(Boolean) as ToolInvocationUIPart[]

  if (toolsToDisplay.length === 0) return null

  // If there's only one tool, display it directly
  if (toolsToDisplay.length === 1) {
    return (
      <SingleToolCard
        toolData={toolsToDisplay[0]}
        defaultOpen={defaultOpen}
        className={className}
      />
    )
  }

  // If there are multiple tools, show them in a list
  return (
    <div className={className}>
      <div className="space-y-4">
        {toolsToDisplay.map((tool) => (
          <SingleToolCard
            key={tool.toolInvocation.toolCallId}
            toolData={tool}
            defaultOpen={defaultOpen}
          />
        ))}
      </div>
    </div>
  )
}

// New component to handle individual tool cards
function SingleToolCard({
  toolData,
  defaultOpen = false,
  className,
}: {
  toolData: ToolInvocationUIPart
  defaultOpen?: boolean
  className?: string
}) {
  const [isExpanded, setIsExpanded] = useState(true) // Always start expanded to show tool details
  const [parsedResult, setParsedResult] = useState<any>(null)
  const [parseError, setParseError] = useState<string | null>(null)

  const { toolInvocation } = toolData
  const { state, toolName, toolCallId, args } = toolInvocation

  // Log tool invocation lifecycle
  useEffect(() => {
    logTool('TOOL_INVOCATION_MOUNTED', { 
      toolName, 
      toolCallId, 
      state, 
      hasArgs: !!args,
      defaultOpen 
    })
  }, [toolName, toolCallId, state, args, defaultOpen])
  const isLoading = state === "call"
  const isCompleted = state === "result"
  const result = isCompleted ? toolInvocation.result : undefined

  // Parse the result JSON if available
  useEffect(() => {
    let didCancel = false

    if (isCompleted && result) {
      // Handle array results (like search results)
      if (Array.isArray(result)) {
        if (!didCancel) {
          setParsedResult(result)
        }
        return
      }

      // Handle object results with content property
      if (
        typeof result === "object" &&
        result !== null &&
        "content" in result
      ) {
        try {
          const content = result.content
          const textContent = content.find(
            (item: { type: string }) => item.type === "text"
          )

          if (textContent && textContent.text) {
            try {
              // Try to parse as JSON first
              const parsed = JSON.parse(textContent.text)
              if (!didCancel) {
                setParsedResult(parsed)
              }
            } catch (e) {
              // If not valid JSON, just use the text as is
              if (!didCancel) {
                setParsedResult(textContent.text)
              }
            }
            if (!didCancel) {
              setParseError(null)
            }
          }
        } catch (error) {
          if (!didCancel) {
            setParseError("Failed to parse result")
          }
          console.error("Failed to parse result:", error)
        }
      } else {
        // Handle direct object results
        if (!didCancel) {
          setParsedResult(result)
        }
      }
    }

    return () => {
      didCancel = true
    }
  }, [isCompleted, result])

  // Format the arguments for display
  const formattedArgs = args
    ? Object.entries(args).map(([key, value]) => (
        <div key={key} className="mb-1">
          <span className="font-medium text-slate-600">{key}:</span>{" "}
          <span className="font-mono">
            {typeof value === "object"
              ? value === null
                ? "null"
                : Array.isArray(value)
                  ? value.length === 0
                    ? "[]"
                    : JSON.stringify(value)
                  : JSON.stringify(value)
              : String(value)}
          </span>
        </div>
      ))
    : null

  // Check if this tool should render directly without collapse
  const shouldRenderDirect = (toolName: string) => {
    const directRenderTools = [
      "createPurchaseOrder", 
      "sapPurchaseOrder", 
      "createPO",
      "bookSportSession"
    ]
    return directRenderTools.includes(toolName)
  }

  // Render interactive tools directly
  const renderDirectTool = () => {
    // Handle booking wizard UI
    if (toolName === "bookSportSession") {
      return (
        <BookingWizard 
          result={parsedResult} 
          parameters={args as any}
        />
      )
    }

    // Handle SAP purchase order creation
    if (toolName === "createPurchaseOrder" || toolName === "sapPurchaseOrder" || toolName === "createPO") {
      logTool('PURCHASE_REQUEST_UI_RENDERED', { toolName, hasResult: !!parsedResult, parameters: args })
      return (
        <PurchaseRequestForm 
          result={parsedResult} 
          parameters={args as any}
        />
      )
    }

    // Handle Master Agent Orchestrator
    if (toolName === "orchestrateAgent" || toolName === "selectAgent" || (parsedResult && parsedResult.ui === "master-orchestrator")) {
      logTool('MASTER_ORCHESTRATOR_UI_RENDERED', { toolName, hasResult: !!parsedResult, parameters: args })
      
      // Enhanced reasoning display
      const orchestratorData = {
        userPrompt: args?.userPrompt || args?.prompt || "",
        selection: parsedResult?.selection || {
          selectedAgent: null,
          availableAgents: [],
          reasoning: "Processing...",
          confidence: 0,
          requiresVerification: false,
          analysisSteps: [],
          finalDecision: "Analyzing request..."
        },
        steps: parsedResult?.steps || [],
        reasoning: parsedResult?.reasoning || null,
        autoTriggered: parsedResult?.autoTriggered || false,
        triggeredAgent: parsedResult?.triggeredAgent || null,
        isActive: !isCompleted
      }
      
      return (
        <div className="space-y-4">
          <MasterAgentOrchestrator {...orchestratorData} />
          
          {/* Show detailed reasoning if available */}
          {parsedResult?.reasoning && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-3">🧠 Detailed Analysis</h4>
              
              {/* Confidence Level */}
              <div className="mb-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-blue-700">Confidence Level</span>
                  <span className="text-blue-700 font-medium">{parsedResult.reasoning.confidence}%</span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2 mt-1">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${parsedResult.reasoning.confidence}%` }}
                  ></div>
                </div>
              </div>
              
              {/* Analysis Steps */}
              {parsedResult.reasoning.analysisSteps && (
                <div className="mb-3">
                  <span className="text-sm font-medium text-blue-800">Analysis Steps:</span>
                  <ul className="mt-1 space-y-1">
                    {parsedResult.reasoning.analysisSteps.map((step: string, index: number) => (
                      <li key={index} className="text-sm text-blue-700 flex items-start gap-2">
                        <span className="flex-shrink-0 w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium text-blue-800 mt-0.5">
                          {index + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {/* Selected Reason */}
              <div className="mb-3">
                <span className="text-sm font-medium text-blue-800">Decision Reasoning:</span>
                <p className="text-sm text-blue-700 mt-1">{parsedResult.reasoning.selectedReason}</p>
              </div>
              
              {/* Agent Suggestion */}
              {parsedResult.suggestion && parsedResult.suggestion.action === "switch_to_agent" && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-green-600">💡</span>
                        <span className="text-sm font-medium text-green-800">
                          Suggested Agent: {parsedResult.suggestion.agentName}
                        </span>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-green-600">Confidence:</span>
                          <span className="text-xs font-medium text-green-700">{parsedResult.suggestion.confidence}%</span>
                        </div>
                      </div>
                      <p className="text-sm text-green-700 mb-3">
                        {parsedResult.suggestion.reasoning}
                      </p>
                      <div className="flex gap-2">
                        <button 
                          className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                          onClick={() => window.location.href = `/c/${window.location.pathname.split('/c/')[1]?.split('?')[0] || ''}?agent=${parsedResult.suggestion.agentSlug}`}
                        >
                          Switch to {parsedResult.suggestion.agentName}
                        </button>
                        <button 
                          className="bg-gray-100 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-200 transition-colors"
                          onClick={() => {
                            // Copy @mention to clipboard
                            navigator.clipboard.writeText(`@${parsedResult.suggestion.agentSlug} `)
                          }}
                        >
                          Copy @{parsedResult.suggestion.agentSlug}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )
    }

    return null
  }

  // If this is a direct render tool, show it immediately
  if (shouldRenderDirect(toolName)) {
    return (
      <div className="mb-6">
        {renderDirectTool()}
      </div>
    )
  }

  // Render generic results based on their structure
  const renderResults = () => {
    if (!parsedResult) return "No result data available"

    // Handle comprehensive math widget for ANY mathematical operations
    if ((toolName.includes("math") || toolName.includes("calc") || toolName.includes("equation") || 
         toolName.includes("solve") || toolName.includes("algebra") || toolName.includes("geometry") ||
         toolName === "calculate" || toolName === "compute") && typeof parsedResult === "object") {
      return (
        <MathWidget 
          result={parsedResult} 
          parameters={args as any}
          toolName={toolName}
        />
      )
    }

    // Handle array of items with url, title, and snippet (like search results)
    if (Array.isArray(parsedResult) && parsedResult.length > 0) {
      // Check if items look like search results
      if (
        parsedResult[0] &&
        typeof parsedResult[0] === "object" &&
        "url" in parsedResult[0] &&
        "title" in parsedResult[0]
      ) {
        return (
          <div className="space-y-3">
            {parsedResult.map((item: any, index: number) => (
              <div
                key={index}
                className="border-b border-gray-100 pb-3 last:border-0 last:pb-0"
              >
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary group flex items-center gap-1 font-medium hover:underline"
                >
                  {item.title}
                  <Link className="h-3 w-3 opacity-70 transition-opacity group-hover:opacity-100" />
                </a>
                <div className="text-muted-foreground mt-1 font-mono text-xs">
                  {item.url}
                </div>
                {item.snippet && (
                  <div className="mt-1 line-clamp-2 text-sm">
                    {item.snippet}
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      }

      // Generic array display
      return (
        <div className="font-mono text-xs">
          <pre className="whitespace-pre-wrap">
            {JSON.stringify(parsedResult, null, 2)}
          </pre>
        </div>
      )
    }

    // Handle object results
    if (typeof parsedResult === "object" && parsedResult !== null) {
      return (
        <div>
          {parsedResult.title && (
            <div className="mb-2 font-medium">{parsedResult.title}</div>
          )}
          {parsedResult.html_url && (
            <div className="mb-2">
              <a
                href={parsedResult.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary flex items-center gap-1 hover:underline"
              >
                <span className="font-mono">{parsedResult.html_url}</span>
                <Link className="h-3 w-3 opacity-70" />
              </a>
            </div>
          )}
          <div className="font-mono text-xs">
            <pre className="whitespace-pre-wrap">
              {JSON.stringify(parsedResult, null, 2)}
            </pre>
          </div>
        </div>
      )
    }

    // Handle string results
    if (typeof parsedResult === "string") {
      return <div className="whitespace-pre-wrap">{parsedResult}</div>
    }

    // Fallback
    return "No result data available"
  }

  return (
    <div
      className={cn(
        "border-border flex flex-col gap-0 overflow-hidden rounded-md border",
        className
      )}
    >
      <button
        onClick={(e) => {
          e.preventDefault()
          const newState = !isExpanded
          logUI('TOOL_INVOCATION_TOGGLE', { toolName, toolCallId, expanded: newState })
          setIsExpanded(newState)
        }}
        type="button"
        className="hover:bg-accent flex w-full flex-row items-center rounded-t-md px-3 py-2 transition-colors"
      >
        <div className="flex flex-1 flex-row items-center gap-2 text-left text-base">
          <Wrench className="text-muted-foreground size-4" />
          <span className="font-mono text-sm">{toolName}</span>
          <AnimatePresence mode="popLayout" initial={false}>
            {isLoading ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, filter: "blur(2px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, scale: 0.9, filter: "blur(2px)" }}
                transition={{ duration: 0.15 }}
                key="loading"
              >
                <div className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-xs text-blue-700">
                  <Spinner className="mr-1 h-3 w-3 animate-spin" />
                  Running
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, filter: "blur(2px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, scale: 0.9, filter: "blur(2px)" }}
                transition={{ duration: 0.15 }}
                key="completed"
              >
                <div className="inline-flex items-center rounded-full border border-green-200 bg-green-50 px-1.5 py-0.5 text-xs text-green-700">
                  <CheckCircle className="mr-1 h-3 w-3" />
                  Completed
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <CaretDown
          className={cn(
            "h-4 w-4 transition-transform",
            isExpanded ? "rotate-180 transform" : ""
          )}
        />
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={TRANSITION}
            className="overflow-hidden"
          >
            <div className="space-y-3 px-3 pt-3 pb-3">
              {/* Arguments section */}
              {args && Object.keys(args).length > 0 && (
                <div>
                  <div className="text-muted-foreground mb-1 text-xs font-medium">
                    Arguments
                  </div>
                  <div className="bg-background rounded border p-2 text-sm">
                    {formattedArgs}
                  </div>
                </div>
              )}

              {/* Result section */}
              {isCompleted && (
                <div>
                  <div className="text-muted-foreground mb-1 text-xs font-medium">
                    Result
                  </div>
                  <div className="bg-background max-h-60 overflow-auto rounded border p-2 text-sm">
                    {parseError ? (
                      <div className="text-red-500">{parseError}</div>
                    ) : (
                      renderResults()
                    )}
                  </div>
                </div>
              )}

              {/* Tool call ID */}
              <div className="text-muted-foreground flex items-center justify-between text-xs">
                <div className="flex items-center">
                  <Code className="mr-1 inline size-3" />
                  Tool Call ID:{" "}
                  <span className="ml-1 font-mono">{toolCallId}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

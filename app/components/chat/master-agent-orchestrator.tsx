"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Brain, 
  CheckCircle, 
  Clock, 
  Eye, 
  Gear, 
  Lightning,
  Target,
  Users,
  Sparkle,
  Robot,
  Star,
  Warning
} from "@phosphor-icons/react"
import { useState, useEffect } from "react"

interface OrchestrationStep {
  step: number
  action: 'analyzing' | 'selecting' | 'delegating' | 'verifying' | 'finalizing'
  description: string
  timestamp: Date
  details?: any
}

interface AvailableAgent {
  id: string
  name: string
  description: string
  capabilities: string[]
  score: number
  reasoning: string
}

interface AgentSelection {
  selectedAgent: string | null
  availableAgents: AvailableAgent[]
  reasoning: string
  confidence: number
  requiresVerification: boolean
  analysisSteps: string[]
  finalDecision: string
}

interface MasterAgentOrchestratorProps {
  userPrompt: string
  selection: AgentSelection
  steps: OrchestrationStep[]
  isActive: boolean
}

const stepIcons = {
  analyzing: Brain,
  selecting: Target,
  delegating: Users,
  verifying: Eye,
  finalizing: CheckCircle
}

const stepColors = {
  analyzing: "text-blue-600 bg-blue-50",
  selecting: "text-purple-600 bg-purple-50", 
  delegating: "text-orange-600 bg-orange-50",
  verifying: "text-green-600 bg-green-50",
  finalizing: "text-emerald-600 bg-emerald-50"
}

export function MasterAgentOrchestrator({ 
  userPrompt, 
  selection, 
  steps, 
  isActive 
}: MasterAgentOrchestratorProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (isActive && steps.length > 0) {
      const interval = setInterval(() => {
        setCurrentStep(prev => {
          if (prev < steps.length - 1) {
            setProgress(((prev + 1) / steps.length) * 100)
            return prev + 1
          }
          setProgress(100)
          clearInterval(interval)
          return prev
        })
      }, 1500)
      
      return () => clearInterval(interval)
    }
  }, [isActive, steps.length])

  return (
    <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3 text-blue-800">
          <Brain className="size-6" />
          Master Agent Orchestrator
          <Badge variant="outline" className="ml-auto bg-blue-100 text-blue-700 border-blue-300">
            <Sparkle className="size-3 mr-1" />
            Claude
          </Badge>
        </CardTitle>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-blue-600">Processing Request</span>
            <span className="text-blue-600">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2 bg-blue-100" />
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* User Request */}
        <div className="space-y-2">
          <h4 className="font-medium text-blue-800 flex items-center gap-2">
            <Lightning className="size-4" />
            Request Analysis
          </h4>
          <div className="bg-white/70 p-3 rounded border border-blue-200">
            <p className="text-sm text-gray-700">"{userPrompt}"</p>
          </div>
        </div>

        {/* Orchestration Steps */}
        <div className="space-y-3">
          <h4 className="font-medium text-blue-800 flex items-center gap-2">
            <Gear className="size-4" />
            Orchestration Process
          </h4>
          
          <div className="space-y-3">
            {steps.map((step, index) => {
              const Icon = stepIcons[step.action]
              const isCompleted = index <= currentStep
              const isCurrent = index === currentStep
              
              return (
                <div 
                  key={step.step}
                  className={`flex items-start gap-3 p-3 rounded transition-all duration-500 ${
                    isCompleted ? 'bg-white/70 border border-blue-200' : 'bg-gray-100/50'
                  }`}
                >
                  <div className={`p-2 rounded-full transition-all duration-300 ${
                    isCompleted ? stepColors[step.action] : 'bg-gray-200 text-gray-400'
                  }`}>
                    <Icon className="size-4" />
                  </div>
                  
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${
                        isCompleted ? 'text-gray-900' : 'text-gray-400'
                      }`}>
                        Step {step.step}: {step.action.charAt(0).toUpperCase() + step.action.slice(1)}
                      </span>
                      {isCurrent && (
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                          <span className="text-xs text-blue-600">Active</span>
                        </div>
                      )}
                      {isCompleted && index < currentStep && (
                        <CheckCircle className="size-4 text-green-500" />
                      )}
                    </div>
                    
                    <p className={`text-sm ${
                      isCompleted ? 'text-gray-700' : 'text-gray-400'
                    }`}>
                      {step.description}
                    </p>
                    
                    {step.details && isCompleted && (
                      <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-700">
                        {typeof step.details === 'object' ? 
                          JSON.stringify(step.details, null, 2) : 
                          step.details
                        }
                      </div>
                    )}
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    <Clock className="size-3 inline mr-1" />
                    {step.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Agent Selection Results */}
        {selection && currentStep >= 1 && (
          <div className="space-y-4">
            <Separator />
            <h4 className="font-medium text-blue-800 flex items-center gap-2">
              <Target className="size-4" />
              Agent Selection Process
            </h4>
            
            {/* Analysis Steps */}
            {selection.analysisSteps && selection.analysisSteps.length > 0 && (
              <div className="space-y-2">
                <span className="text-sm font-medium text-gray-700">Analysis Steps:</span>
                <div className="space-y-2">
                  {selection.analysisSteps.map((step, index) => (
                    <div key={index} className="flex items-start gap-2 p-2 bg-white/50 rounded text-sm">
                      <div className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium mt-0.5">
                        {index + 1}
                      </div>
                      <span className="text-gray-700">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Available Agents Analysis */}
            {selection.availableAgents && selection.availableAgents.length > 0 && (
              <div className="space-y-2">
                <span className="text-sm font-medium text-gray-700">Agent Candidates Evaluated:</span>
                <div className="space-y-2">
                  {selection.availableAgents.map((agent, index) => (
                    <div key={agent.id} className="p-3 bg-white/70 rounded border border-blue-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Robot className="size-4 text-gray-600" />
                          <span className="font-medium text-gray-900">{agent.name}</span>
                          {agent.id === selection.selectedAgent && (
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              <Star className="size-3 mr-1" />
                              Selected
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress value={agent.score} className="w-16 h-2" />
                          <span className="text-xs font-medium text-gray-600">{agent.score}%</span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 mb-2">{agent.description}</p>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {agent.capabilities.map((capability, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {capability}
                          </Badge>
                        ))}
                      </div>
                      <div className="text-xs text-gray-500 italic">
                        {agent.reasoning}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Final Decision */}
            <div className="space-y-2">
              <span className="text-sm font-medium text-gray-700">Final Decision:</span>
              <div className="p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  {selection.selectedAgent ? (
                    <>
                      <CheckCircle className="size-4 text-green-600" />
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        {selection.selectedAgent}
                      </Badge>
                    </>
                  ) : (
                    <>
                      <Brain className="size-4 text-blue-600" />
                      <Badge variant="outline" className="bg-blue-100 text-blue-800">
                        Direct Response
                      </Badge>
                    </>
                  )}
                  <div className="ml-auto flex items-center gap-1">
                    <span className="text-xs text-gray-600">Confidence:</span>
                    <Progress value={selection.confidence} className="w-16 h-2" />
                    <span className="text-xs font-medium">{selection.confidence}%</span>
                  </div>
                </div>
                <p className="text-sm text-gray-700">{selection.finalDecision}</p>
              </div>
            </div>
            
            {selection.requiresVerification && (
              <Alert className="border-amber-200 bg-amber-50">
                <Warning className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800">
                  <span className="font-medium">Verification Required:</span> This response will be verified by the master agent for accuracy and completeness.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
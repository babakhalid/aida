// lib/hooks/use-master-orchestrator.ts
import { useState, useCallback } from 'react'
import { MasterOrchestrator, AgentSelectionResult } from '@/lib/agents/master-orchestrator'

interface OrchestrationStep {
  step: number
  action: 'analyzing' | 'selecting' | 'delegating' | 'verifying' | 'finalizing'
  description: string
  timestamp: Date
  details?: any
}

interface UseMasterOrchestratorResult {
  isOrchestrating: boolean
  selection: AgentSelectionResult | null
  steps: OrchestrationStep[]
  progress: number
  orchestrate: (userPrompt: string, orchestrator: MasterOrchestrator) => Promise<AgentSelectionResult>
  reset: () => void
}

export function useMasterOrchestrator(): UseMasterOrchestratorResult {
  const [isOrchestrating, setIsOrchestrating] = useState(false)
  const [selection, setSelection] = useState<AgentSelectionResult | null>(null)
  const [steps, setSteps] = useState<OrchestrationStep[]>([])
  const [progress, setProgress] = useState(0)

  const orchestrate = useCallback(async (
    userPrompt: string, 
    orchestrator: MasterOrchestrator
  ): Promise<AgentSelectionResult> => {
    setIsOrchestrating(true)
    setSelection(null)
    setProgress(0)

    // Generate orchestration steps for UI
    const orchestrationSteps = orchestrator.generateOrchestrationSteps(userPrompt)
    setSteps(orchestrationSteps)

    try {
      // Simulate step-by-step progress
      for (let i = 0; i < orchestrationSteps.length - 1; i++) {
        await new Promise(resolve => setTimeout(resolve, 800))
        setProgress(((i + 1) / orchestrationSteps.length) * 80)
      }

      // Perform actual agent selection
      const result = await orchestrator.selectAgent(userPrompt)
      setSelection(result)
      setProgress(100)

      return result
    } catch (error) {
      console.error('Orchestration error:', error)
      
      // Fallback selection
      const fallbackResult: AgentSelectionResult = {
        selectedAgent: null,
        availableAgents: [],
        reasoning: 'Error during orchestration, handling directly',
        confidence: 50,
        requiresVerification: true,
        analysisSteps: [
          'Encountered error during analysis',
          'Falling back to direct handling'
        ],
        finalDecision: 'Handling request directly due to orchestration error'
      }
      
      setSelection(fallbackResult)
      setProgress(100)
      return fallbackResult
    } finally {
      setIsOrchestrating(false)
    }
  }, [])

  const reset = useCallback(() => {
    setIsOrchestrating(false)
    setSelection(null)
    setSteps([])
    setProgress(0)
  }, [])

  return {
    isOrchestrating,
    selection,
    steps,
    progress,
    orchestrate,
    reset
  }
}
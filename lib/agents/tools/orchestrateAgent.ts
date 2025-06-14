// lib/agents/tools/orchestrateAgent.ts
import { createMasterOrchestrator } from "../master-orchestrator"

interface OrchestrateAgentParams {
  userPrompt: string
  requireReasoning?: boolean
  supabase?: any // Will be injected by the chat API
}

export async function orchestrateAgent({ userPrompt, requireReasoning = true, supabase }: OrchestrateAgentParams) {
  try {
    // Create orchestrator with real agents from database
    const orchestrator = await createMasterOrchestrator(supabase)
    
    // Perform agent selection
    const selection = await orchestrator.selectAgent(userPrompt)
    const steps = orchestrator.generateOrchestrationSteps(userPrompt)
    
    // Get selected agent details for UI display (but don't auto-execute)
    let selectedAgentDetails = null
    if (selection.selectedAgent) {
      const { data: selectedAgentData } = await supabase
        .from("agents")
        .select("*")
        .eq("id", selection.selectedAgent)
        .single()
      
      if (selectedAgentData) {
        selectedAgentDetails = {
          id: selectedAgentData.id,
          name: selectedAgentData.name,
          slug: selectedAgentData.slug,
          description: selectedAgentData.description,
          systemPrompt: selectedAgentData.system_prompt
        }
      }
    }

    return {
      success: true,
      selection,
      steps,
      userPrompt,
      timestamp: new Date().toISOString(),
      orchestratorVersion: "1.0.0",
      autoTriggered: false, // Never auto-trigger, only suggest
      selectedAgent: selectedAgentDetails,
      reasoning: {
        confidence: selection.confidence,
        selectedReason: selection.reasoning,
        analysisSteps: selection.analysisSteps,
        finalDecision: selection.finalDecision,
        requiresVerification: selection.requiresVerification,
        availableAgents: selection.availableAgents.map(agent => ({
          name: agent.name,
          score: agent.score,
          reasoning: agent.reasoning,
          capabilities: agent.capabilities
        }))
      },
      // Suggestion for user action
      suggestion: selectedAgentDetails ? {
        action: "switch_to_agent",
        agentSlug: selectedAgentDetails.slug,
        agentName: selectedAgentDetails.name,
        confidence: selection.confidence,
        reasoning: `Based on your request "${userPrompt}", I recommend using ${selectedAgentDetails.name}. You can switch to this agent by clicking the suggestion or typing "@${selectedAgentDetails.slug}".`
      } : {
        action: "direct_response",
        reasoning: "I can help you directly with this request."
      }
    }
  } catch (error) {
    console.error("Error in orchestrateAgent tool:", error)
    
    return {
      success: false,
      error: "Failed to orchestrate agent selection",
      details: error instanceof Error ? error.message : "Unknown error",
      selection: {
        selectedAgent: null,
        availableAgents: [],
        reasoning: "Error occurred during agent selection",
        confidence: 0,
        requiresVerification: true,
        analysisSteps: ["Error encountered during analysis"],
        finalDecision: "Handling request directly due to orchestration error"
      },
      steps: [],
      userPrompt,
      timestamp: new Date().toISOString()
    }
  }
}
import { createMasterOrchestrator } from "@/lib/agents/master-orchestrator"
import { validateUserIdentity } from "@/lib/server/api"
import { NextRequest } from "next/server"

export const maxDuration = 30

type OrchestrateRequest = {
  userPrompt: string
  userId: string
  isAuthenticated: boolean
}

export async function POST(req: NextRequest) {
  try {
    const { userPrompt, userId, isAuthenticated } = (await req.json()) as OrchestrateRequest

    if (!userPrompt || !userId) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        { status: 400 }
      )
    }

    const supabase = await validateUserIdentity(userId, isAuthenticated)
    const orchestrator = await createMasterOrchestrator(supabase)
    
    const selection = await orchestrator.selectAgent(userPrompt)
    const steps = orchestrator.generateOrchestrationSteps(userPrompt)

    return Response.json({ 
      selection, 
      steps,
      success: true 
    })
  } catch (error) {
    console.error("Error in orchestration:", error)
    return new Response(
      JSON.stringify({ 
        error: "Orchestration failed", 
        details: error instanceof Error ? error.message : "Unknown error" 
      }),
      { status: 500 }
    )
  }
}
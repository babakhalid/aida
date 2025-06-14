// lib/agents/master-orchestrator.ts
import { anthropic } from '@ai-sdk/anthropic'
import { generateObject } from 'ai'
import { z } from 'zod'

const agentSelectionSchema = z.object({
  selectedAgent: z.string().nullable().describe('The ID of the selected agent, or null if direct response is preferred'),
  availableAgents: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    capabilities: z.array(z.string()),
    score: z.number().min(0).max(100),
    reasoning: z.string()
  })),
  reasoning: z.string().describe('Overall reasoning for the selection decision'),
  confidence: z.number().min(0).max(100).describe('Confidence level in the selection'),
  requiresVerification: z.boolean().describe('Whether the response requires verification'),
  analysisSteps: z.array(z.string()).describe('Step-by-step analysis of the user request'),
  finalDecision: z.string().describe('Final decision explanation')
})

export type AgentSelectionResult = z.infer<typeof agentSelectionSchema>

// Schema for multi-agent coordination
const multiAgentCoordinationSchema = z.object({
  requiresMultipleAgents: z.boolean().describe('Whether the task requires coordination between multiple agents'),
  agentSequence: z.array(z.object({
    agentId: z.string(),
    purpose: z.string(),
    expectedOutput: z.string(),
    dependsOn: z.array(z.string()).optional()
  })),
  coordinationStrategy: z.enum(['sequential', 'parallel', 'hierarchical']),
  reasoning: z.string().describe('Why this coordination approach was chosen'),
  finalSynthesis: z.boolean().describe('Whether results need to be synthesized by the orchestrator')
})

export type MultiAgentCoordinationResult = z.infer<typeof multiAgentCoordinationSchema>

interface Agent {
  id: string
  name: string
  description: string
  system_prompt: string
  tools?: any[]
  slug: string
}

export class MasterOrchestrator {
  private availableAgents: Agent[] = []

  constructor(agents: Agent[]) {
    this.availableAgents = agents
  }

  async selectAgent(userPrompt: string): Promise<AgentSelectionResult> {
    const systemPrompt = `You are Claude, the Master Agent Orchestrator. Your role is to analyze user requests and select the most appropriate specialized agent to handle the task, or decide to handle it directly yourself.

Available Agents:
${this.availableAgents.map(agent => `
- ID: ${agent.id}
- Name: ${agent.name}
- Description: ${agent.description}
- Capabilities: ${this.extractCapabilities(agent)}
- Slug: ${agent.slug}
`).join('\n')}

Your analysis process should:
1. Understand the user's intent and requirements
2. Evaluate each available agent's suitability
3. Score each agent based on capability match (0-100)
4. Consider complexity, domain expertise, and specialized tools
5. Decide whether to delegate to an agent or handle directly
6. Provide detailed reasoning for your decision

Selection criteria:
- Score agents based on domain expertise and tool availability
- Consider whether the task requires specialized knowledge
- Evaluate if the agent's system prompt aligns with the request
- Factor in confidence level and verification needs
- Prefer direct handling for general queries that don't require specialized tools

Provide step-by-step analysis and clear reasoning for your decision.`

    try {
      const result = await generateObject({
        model: anthropic('claude-3-7-sonnet-20250219'),
        system: systemPrompt,
        prompt: `Analyze this user request and select the best agent: "${userPrompt}"`,
        schema: agentSelectionSchema,
        maxRetries: 2
      })

      return result.object
    } catch (error) {
      console.error('Error in agent selection:', error)
      
      // Fallback response
      return {
        selectedAgent: null,
        availableAgents: this.availableAgents.map(agent => ({
          id: agent.id,
          name: agent.name,
          description: agent.description,
          capabilities: this.extractCapabilities(agent),
          score: 50,
          reasoning: 'Error in analysis - using fallback scoring'
        })),
        reasoning: 'Failed to analyze request due to technical issues, handling directly',
        confidence: 50,
        requiresVerification: true,
        analysisSteps: [
          'Encountered technical error in analysis',
          'Falling back to direct handling',
          'Will monitor and verify response quality'
        ],
        finalDecision: 'Handling request directly due to analysis error'
      }
    }
  }

  private extractCapabilities(agent: Agent): string[] {
    const capabilities: string[] = []
    
    // Extract capabilities from system prompt
    if (agent.system_prompt) {
      if (agent.system_prompt.toLowerCase().includes('research')) capabilities.push('Research')
      if (agent.system_prompt.toLowerCase().includes('search')) capabilities.push('Web Search')
      if (agent.system_prompt.toLowerCase().includes('analysis')) capabilities.push('Analysis')
      if (agent.system_prompt.toLowerCase().includes('report')) capabilities.push('Reporting')
      if (agent.system_prompt.toLowerCase().includes('purchase')) capabilities.push('Purchase Orders')
      if (agent.system_prompt.toLowerCase().includes('booking')) capabilities.push('Booking')
      if (agent.system_prompt.toLowerCase().includes('policy')) capabilities.push('Policy')
      if (agent.system_prompt.toLowerCase().includes('sap')) capabilities.push('SAP')
      if (agent.system_prompt.toLowerCase().includes('sport')) capabilities.push('Sports')
    }

    // Extract capabilities from tools
    if (agent.tools && agent.tools.length > 0) {
      agent.tools.forEach(tool => {
        if (typeof tool === 'string') {
          capabilities.push(tool.charAt(0).toUpperCase() + tool.slice(1))
        } else if (tool.name) {
          capabilities.push(tool.name.charAt(0).toUpperCase() + tool.name.slice(1))
        }
      })
    }

    // Default capabilities based on agent name/slug
    if (agent.slug.includes('research')) capabilities.push('Research')
    if (agent.slug.includes('policy')) capabilities.push('Policy')
    if (agent.slug.includes('purchase')) capabilities.push('Procurement')
    if (agent.slug.includes('sport')) capabilities.push('Sports')

    return capabilities.length > 0 ? capabilities : ['General Assistant']
  }

  async coordinateMultipleAgents(userPrompt: string): Promise<MultiAgentCoordinationResult> {
    const systemPrompt = `You are Claude, the Master Agent Orchestrator analyzing whether a user request requires coordination between multiple specialized agents.

Available Agents:
${this.availableAgents.map(agent => `
- ID: ${agent.id}
- Name: ${agent.name}
- Description: ${agent.description}
- Capabilities: ${this.extractCapabilities(agent)}
`).join('\n')}

Analyze the user request to determine:
1. If it requires multiple agents working together
2. The optimal coordination strategy
3. The sequence and dependencies between agents
4. Whether final synthesis is needed

Examples of multi-agent scenarios:
- Research + Writing: Research agent gathers information, then writing agent creates content
- Policy + Purchase: Policy agent verifies guidelines, then SAP agent creates purchase order
- UX + Code Review: UX agent reviews interface copy, then code review agent checks implementation
- Research + Sports Booking: Research agent finds facility info, then booking agent reserves

Choose coordination strategies:
- Sequential: Agents work one after another with dependencies
- Parallel: Agents work simultaneously on different aspects
- Hierarchical: One primary agent coordinates with supporting agents`

    try {
      const result = await generateObject({
        model: anthropic('claude-3-7-sonnet-20250219'),
        system: systemPrompt,
        prompt: `Analyze this user request for multi-agent coordination: "${userPrompt}"`,
        schema: multiAgentCoordinationSchema,
        maxRetries: 2
      })

      return result.object
    } catch (error) {
      console.error('Error in multi-agent coordination:', error)
      
      // Fallback to single agent
      return {
        requiresMultipleAgents: false,
        agentSequence: [],
        coordinationStrategy: 'sequential' as const,
        reasoning: 'Error in analysis - defaulting to single agent approach',
        finalSynthesis: false
      }
    }
  }

  // Orchestration steps for UI display
  generateOrchestrationSteps(userPrompt: string) {
    return [
      {
        step: 1,
        action: 'analyzing' as const,
        description: 'Analyzing user request and understanding requirements',
        timestamp: new Date(),
        details: { prompt: userPrompt }
      },
      {
        step: 2,
        action: 'selecting' as const,
        description: 'Evaluating available agents and capabilities',
        timestamp: new Date(),
        details: { agentCount: this.availableAgents.length }
      },
      {
        step: 3,
        action: 'delegating' as const,
        description: 'Delegating to selected agent or handling directly',
        timestamp: new Date()
      },
      {
        step: 4,
        action: 'verifying' as const,
        description: 'Verifying response quality and accuracy',
        timestamp: new Date()
      },
      {
        step: 5,
        action: 'finalizing' as const,
        description: 'Finalizing response and ensuring completeness',
        timestamp: new Date()
      }
    ]
  }
}

// Helper function to create orchestrator instance
export async function createMasterOrchestrator(supabase: any): Promise<MasterOrchestrator> {
  try {
    const { data: agents, error } = await supabase
      .from('agents')
      .select('id, name, description, system_prompt, tools, slug')
      .eq('is_public', true)

    if (error) {
      console.error('Error fetching agents:', error)
      return new MasterOrchestrator([])
    }

    return new MasterOrchestrator(agents || [])
  } catch (error) {
    console.error('Error creating master orchestrator:', error)
    return new MasterOrchestrator([])
  }
}
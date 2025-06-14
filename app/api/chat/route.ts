import { loadAgent } from "@/lib/agents/load-agent"
import { handlePolicyResponse } from "@/lib/agents/policy-response-handler"
import { checkSpecialAgentUsage, incrementSpecialAgentUsage } from "@/lib/api"
import { MODELS_OPTIONS, SYSTEM_PROMPT_DEFAULT, MODEL_DEFAULT } from "@/lib/config"
import { loadMCPToolsFromURL } from "@/lib/mcp/load-mcp-from-url"
import { sanitizeUserInput } from "@/lib/sanitize"
import { validateUserIdentity } from "@/lib/server/api"
import { checkUsageByModel, incrementUsageByModel } from "@/lib/usage"
import { Attachment } from "@ai-sdk/ui-utils"
import { createOpenRouter } from "@openrouter/ai-sdk-provider"
import { LanguageModelV1, Message as MessageAISDK, streamText } from "ai"
import { saveFinalAssistantMessage } from "./db"

export const maxDuration = 60

type ChatRequest = {
  messages: MessageAISDK[]
  chatId: string
  userId: string
  model: string
  isAuthenticated: boolean
  systemPrompt: string
  agentId?: string
}

export async function POST(req: Request) {
  try {
    const {
      messages,
      chatId,
      userId,
      model,
      isAuthenticated,
      systemPrompt,
      agentId,
    } = (await req.json()) as ChatRequest

    if (!messages || !chatId || !userId) {
      return new Response(
        JSON.stringify({ error: "Error, missing information" }),
        { status: 400 }
      )
    }

    // Sanitize messages to prevent tool validation errors
    const sanitizedMessages = messages.map((msg) => {
      if (Array.isArray(msg.content)) {
        const sanitizedContent = msg.content.filter((part: any) => {
          // Remove malformed tool calls that cause validation errors
          if (part?.type === 'tool_use' && (!part?.input || part?.input === null)) {
            console.warn(`Removing malformed tool_use without input: ${part?.name || 'unknown'}`)
            return false
          }
          if (part?.type === 'tool-call' && (!part?.args || part?.args === null)) {
            console.warn(`Removing malformed tool-call without args: ${part?.toolName || 'unknown'}`)
            return false
          }
          return true
        })
        return { ...msg, content: sanitizedContent.length > 0 ? sanitizedContent : msg.content }
      }
      return msg
    }) as MessageAISDK[]

    const supabase = await validateUserIdentity(userId, isAuthenticated)

    let agentConfig = null
    let isPolicyAgent = false
    let effectiveModel = model

    if (agentId) {
      agentConfig = await loadAgent(agentId)
      
      // Check if this is the policy assistant agent and get agent details
      const { data: agent } = await supabase
        .from("agents")
        .select("slug, model_preference")
        .eq("id", agentId)
        .single()
      
      isPolicyAgent = agent?.slug === "policy-assistant"
      
      // Use agent's model preference if available and valid, otherwise use Claude as master orchestrator
      if (agent?.model_preference) {
        const agentModelConfig = MODELS_OPTIONS.find((m) => m.id === agent.model_preference)
        if (agentModelConfig) {
          effectiveModel = agent.model_preference
        } else {
          // If agent's preferred model is not found, use Claude as master orchestrator
          console.log(`⚠️ Agent ${agentId} has invalid model preference: ${agent.model_preference}, using Claude as master orchestrator`)
          effectiveModel = MODEL_DEFAULT
        }
      } else {
        // If no preference, use Claude as master orchestrator
        effectiveModel = MODEL_DEFAULT
      }
    } else {
      // If no agent, use Claude as master orchestrator with orchestrateAgent tool
      effectiveModel = MODEL_DEFAULT
    }

    // Check usage limits with the effective model
    await checkUsageByModel(supabase, userId, effectiveModel, isAuthenticated)

    // Save user message and track usage
    const userMessage = sanitizedMessages[sanitizedMessages.length - 1]
    if (userMessage && userMessage.role === "user") {
      const { error: msgError } = await supabase.from("messages").insert({
        chat_id: chatId,
        role: "user",
        content: sanitizeUserInput(typeof userMessage.content === 'string' ? userMessage.content : JSON.stringify(userMessage.content)),
        experimental_attachments:
          userMessage.experimental_attachments as unknown as Attachment[],
        user_id: userId,
      })
      if (msgError) {
        console.error("Error saving user message:", msgError)
      } else {
        console.log("User message saved successfully.")
        await incrementUsageByModel(supabase, userId, effectiveModel, isAuthenticated)
      }
    }

    const modelConfig = MODELS_OPTIONS.find((m) => m.id === effectiveModel)

    if (!modelConfig) {
      throw new Error(`Model ${effectiveModel} not found`)
    }
    let modelInstance
    if (modelConfig.provider === "openrouter") {
      const openRouter = createOpenRouter({
        apiKey: process.env.OPENROUTER_API_KEY,
      })
      modelInstance = openRouter.chat(modelConfig.api_sdk as string) // this is a special case for openrouter. Normal openrouter models are not supported.
    } else {
      modelInstance = modelConfig.api_sdk
    }

    let effectiveSystemPrompt = agentConfig?.systemPrompt || systemPrompt || SYSTEM_PROMPT_DEFAULT
    
    // If no agent is selected, enhance the system prompt for orchestration
    if (!agentConfig) {
      effectiveSystemPrompt = `You are Claude, the Master Agent Orchestrator. When users ask questions or request tasks, you should:

1. **Always use the orchestrateAgent tool first** to analyze the request and select the most appropriate specialized agent
2. Show your reasoning process and explain why you selected a particular agent
3. If no specific agent is needed, you can respond directly with your expertise

Available specialized agents include:
- SAP Operations: For purchase orders, procurement, finance, HR tasks
- Sport Booking: For booking sports facilities and sessions  
- Policy Assistant: For company policies, rules, and guidelines
- Research Agent: For web research and information gathering
- Writing agents: For blogs, essays, tweets, and content creation
- UX/Product agents: For interface copy, naming, and product strategy
- Code Review: For reviewing pull requests and code quality
- And many more specialized agents

Use the orchestrateAgent tool to determine the best approach for each user request. Be thorough in your analysis and transparent about your decision-making process.

${SYSTEM_PROMPT_DEFAULT}`
    }

    let toolsToUse = undefined
    let effectiveMaxSteps = agentConfig?.maxSteps || 3

    if (agentConfig?.mcpConfig) {
      const { tools } = await loadMCPToolsFromURL(agentConfig.mcpConfig.server)
      toolsToUse = tools
    } else if (agentConfig?.tools) {
      toolsToUse = agentConfig.tools
      await checkSpecialAgentUsage(supabase, userId)
      await incrementSpecialAgentUsage(supabase, userId)
    } else if (!agentConfig) {
      // When no agent is selected, provide orchestrateAgent tool to Claude master orchestrator
      const { tool } = await import("ai")
      const { z } = await import("zod")
      
      const orchestrateAgentTool = tool({
        description: "Use the Master Agent Orchestrator to analyze user requests and select the most appropriate specialized agent for the task. Always use this tool first when a user asks a question.",
        parameters: z.object({
          userPrompt: z.string().describe("The user's request or question to analyze"),
          requireReasoning: z.boolean().optional().default(true).describe("Whether to show detailed reasoning process")
        }),
        execute: async (params) => {
          const { orchestrateAgent } = await import("@/lib/agents/tools/orchestrateAgent")
          return await orchestrateAgent({ ...params, supabase })
        }
      })
      
      toolsToUse = { orchestrateAgent: orchestrateAgentTool }
      effectiveMaxSteps = 5
    }

    // Special handling for Policy Assistant - use Response API directly
    if (isPolicyAgent) {
      console.log('🎯 Policy Agent detected - using Response API')
      try {
        const userMessage = sanitizedMessages[sanitizedMessages.length - 1]
        console.log('📨 Processing user message:', userMessage)
        
        const userContent = typeof userMessage.content === 'string' 
          ? userMessage.content 
          : Array.isArray(userMessage.content) 
            ? (userMessage.content as any[]).filter((c: any) => c.type === 'text').map((c: any) => c.text).join(' ')
            : String(userMessage.content)

        console.log('🔍 Extracted user content:', userContent)

        const policyResponse = await handlePolicyResponse(userContent)
        console.log('✅ Policy response received, length:', policyResponse.length)
        
        // Save the assistant response
        const { error: assistantMsgError } = await supabase.from("messages").insert({
          chat_id: chatId,
          role: "assistant",
          content: policyResponse,
          user_id: userId,
        })

        if (assistantMsgError) {
          console.error("❌ Error saving policy assistant message:", assistantMsgError)
        } else {
          console.log("✅ Assistant message saved successfully")
        }

        // Create a modified message list with the policy response pre-added
        const modifiedMessages = [
          ...sanitizedMessages,
          {
            role: 'assistant' as const,
            content: policyResponse
          }
        ]

        // Use regular streamText but with pre-generated response
        const result = streamText({
          model: modelInstance as LanguageModelV1,
          system: "You are a helpful assistant. The user's question has already been answered by the policy system. Simply return the provided response exactly as given.",
          messages: [
            ...sanitizedMessages.slice(0, -1), // All messages except the last user message
            {
              role: 'user' as const,
              content: `Please respond with exactly this text: "${policyResponse}"`
            }
          ],
          maxSteps: 1,
          onFinish: async () => {
            // Message already saved above
          }
        })

        return result.toDataStreamResponse({
          sendReasoning: true,
        })

      } catch (error) {
        console.error("❌ Policy assistant error:", error)
        console.error("🔍 Policy assistant error details:", {
          name: error instanceof Error ? error.name : 'Unknown',
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : 'No stack trace'
        })
        // Fall back to regular chat flow on error
      }
    }

    const result = streamText({
      model: modelInstance as LanguageModelV1,
      system: effectiveSystemPrompt,
      messages: sanitizedMessages,
      tools: toolsToUse,
      // @todo: remove this
      // hardcoded for now
      maxSteps: 10,
      onError: (err) => {
        console.error("🛑 streamText error:", err)
      },
      async onFinish({ response }) {
        try {
          await saveFinalAssistantMessage(supabase, chatId, response.messages)
        } catch (err) {
          console.error(
            "Error in onFinish while saving assistant messages:",
            err
          )
        }
      },
    })

    // Ensure the stream is consumed so onFinish is triggered.
    result.consumeStream()
    const originalResponse = result.toDataStreamResponse({
      sendReasoning: true,
    })
    // Optionally attach chatId in a custom header.
    const headers = new Headers(originalResponse.headers)
    headers.set("X-Chat-Id", chatId)

    return new Response(originalResponse.body, {
      status: originalResponse.status,
      headers,
    })
  } catch (err: any) {
    console.error("Error in /api/chat:", err)
    // Return a structured error response if the error is a UsageLimitError.
    if (err.code === "DAILY_LIMIT_REACHED") {
      return new Response(
        JSON.stringify({ error: err.message, code: err.code }),
        { status: 403 }
      )
    }

    return new Response(
      JSON.stringify({ error: err.message || "Internal server error" }),
      { status: 500 }
    )
  }
}

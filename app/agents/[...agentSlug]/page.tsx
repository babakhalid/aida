import { AgentDetail } from "@/app/components/agents/agent-detail"
import { LayoutApp } from "@/app/components/layout/layout-app"
import { MessagesProvider } from "@/lib/chat-store/messages/provider"
import { createClient } from "@/lib/supabase/server"

export default async function AgentIdPage({
  params,
}: {
  params: Promise<{ agentSlug: string | string[] }>
}) {
  const { agentSlug: slugParts } = await params
  const agentSlug = Array.isArray(slugParts) ? slugParts.join("/") : slugParts

  const supabase = await createClient()

  const { data: agentResults, error: agentError } = await supabase
    .from("agents")
    .select("*")
    .eq("slug", agentSlug)
    .eq("is_public", true)
    .limit(1)

  if (agentError) {
    throw new Error(agentError.message)
  }

  const agent = agentResults?.[0]
  if (!agent) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Agent Not Found</h1>
          <p className="text-gray-600 mb-6">The agent "{agentSlug}" could not be found.</p>
          <a 
            href="/agents" 
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Browse all agents
          </a>
        </div>
      </div>
    )
  }

  const { data: agents, error: agentsError } = await supabase
    .from("agents")
    .select("*")
    .not("slug", "eq", agentSlug)
    .limit(4)

  if (agentsError) {
    throw new Error(agentsError.message)
  }

  return (
    <MessagesProvider>
      <LayoutApp>
        <div className="bg-background mx-auto max-w-3xl pt-20">
          <AgentDetail
            slug={agent.slug}
            name={agent.name}
            description={agent.description}
            example_inputs={agent.example_inputs || []}
            creator_id={agent.creator_id}
            avatar_url={agent.avatar_url}
            randomAgents={agents || []}
            isFullPage
            system_prompt={agent.system_prompt}
            tools={agent.tools}
            mcp_config={agent.mcp_config}
          />
        </div>
      </LayoutApp>
    </MessagesProvider>
  )
}

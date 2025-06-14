"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MasterAgentOrchestrator } from "./master-agent-orchestrator"
import { useMasterOrchestrator } from "@/lib/hooks/use-master-orchestrator"
import { createMasterOrchestrator } from "@/lib/agents/master-orchestrator"
import { Play, ArrowClockwise } from "@phosphor-icons/react"

// Mock agents for demo
const mockAgents = [
  {
    id: "research-agent",
    name: "Research Assistant",
    description: "Specialized in web research, data analysis, and report generation",
    system_prompt: "You are a research assistant specialized in web search, analysis, and reporting.",
    tools: ["search", "generateReport", "summarizeSources"],
    slug: "research-assistant"
  },
  {
    id: "purchase-agent", 
    name: "Purchase Assistant",
    description: "Handles procurement, purchase orders, and SAP integration",
    system_prompt: "You are a purchase assistant specialized in SAP procurement and purchase orders.",
    tools: ["createPurchaseOrder"],
    slug: "purchase-assistant"
  },
  {
    id: "booking-agent",
    name: "Booking Assistant", 
    description: "Manages sports bookings and facility reservations",
    system_prompt: "You are a booking assistant specialized in sports and facility reservations.",
    tools: ["bookSportSession"],
    slug: "booking-assistant"
  },
  {
    id: "policy-agent",
    name: "Policy Assistant",
    description: "Provides information about university policies and procedures",
    system_prompt: "You are a policy assistant specialized in university policies and procedures.",
    tools: [],
    slug: "policy-assistant"
  }
]

export function MasterOrchestratorDemo() {
  const [userPrompt, setUserPrompt] = useState("")
  const { isOrchestrating, selection, steps, orchestrate, reset } = useMasterOrchestrator()

  const handleOrchestrate = async () => {
    if (!userPrompt.trim()) return
    
    // Create orchestrator with mock agents
    const orchestrator = new (await import("@/lib/agents/master-orchestrator")).MasterOrchestrator(mockAgents as any)
    await orchestrate(userPrompt, orchestrator)
  }

  const handleReset = () => {
    reset()
    setUserPrompt("")
  }

  // Example prompts for quick testing
  const examplePrompts = [
    "I need to book a tennis court for tomorrow at 2 PM",
    "Can you research the latest trends in AI and create a report?", 
    "I want to create a purchase order for office supplies",
    "What is the university policy on student housing?",
    "Help me with general math calculations",
    "I need information about sports facilities and their booking process"
  ]

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="size-5" />
            Master Agent Orchestrator Demo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="prompt">User Request</Label>
            <Input
              id="prompt"
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              placeholder="Enter your request here..."
              disabled={isOrchestrating}
            />
          </div>

          <div className="space-y-2">
            <Label>Quick Examples</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {examplePrompts.map((prompt, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => setUserPrompt(prompt)}
                  disabled={isOrchestrating}
                  className="text-left justify-start h-auto p-2 text-xs"
                >
                  {prompt}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={handleOrchestrate}
              disabled={!userPrompt.trim() || isOrchestrating}
              className="flex-1"
            >
              {isOrchestrating ? "Orchestrating..." : "Start Orchestration"}
            </Button>
            <Button 
              onClick={handleReset}
              variant="outline"
              disabled={isOrchestrating}
            >
              <ArrowClockwise className="size-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {(isOrchestrating || selection) && (
        <MasterAgentOrchestrator
          userPrompt={userPrompt}
          selection={selection!}
          steps={steps}
          isActive={isOrchestrating}
        />
      )}
    </div>
  )
}
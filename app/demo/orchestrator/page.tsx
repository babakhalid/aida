import { MasterOrchestratorDemo } from "@/app/components/chat/master-orchestrator-demo"

export default function OrchestratorDemoPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Master Agent Orchestrator Demo
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Experience how Claude 4 Sonnet analyzes your requests and intelligently selects 
          the most appropriate specialized agent for your task. Watch the step-by-step 
          reasoning process in real-time.
        </p>
      </div>
      
      <MasterOrchestratorDemo />
    </div>
  )
}
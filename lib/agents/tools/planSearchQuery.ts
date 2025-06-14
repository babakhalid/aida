// lib/agents/tools/plan-search-queries.ts
import { anthropic } from "@ai-sdk/anthropic"
import { generateObject } from "ai"
import { z } from "zod"

export async function planSearchQueries(input: {
  prompt: string
}): Promise<{ result: string[] }> {
  try {
    const { object } = await generateObject({
      model: anthropic("claude-3-7-sonnet-20250219"),
      schema: z.object({ queries: z.array(z.string()) }),
      prompt: `Generate exactly 3 search queries for "${input.prompt}" that would make good H2 sections.`,
    })

    return { result: object.queries }
  } catch (error) {
    console.error("Error in planSearchQueries:", error)
    throw new Error("planSearchQueries failed")
  }
}

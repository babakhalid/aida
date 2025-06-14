// lib/agents/tools.ts
import { tool } from "ai"
import { z } from "zod"
import { generateReport } from "./tools/generateReport"
import { generateTitle } from "./tools/generateTitle"
import { planSearchQueries } from "./tools/planSearchQuery"
import { searchWeb } from "./tools/searchWeb"
import { summarizeSources } from "./tools/summarizeSources"
import { bookSportSession } from "./tools/bookSportSession"
import { createPurchaseOrder } from "./tools/createPurchaseOrder"
import { orchestrateAgent } from "./tools/orchestrateAgent"

export const tools = {
  search: tool({
    description: "Search the web.",
    parameters: z.object({
      query: z.string(),
    }),
    async execute({ query }) {
      return await searchWeb(query)
    },
  }),
  planSearchQueries: tool({
    description: "Plan search queries.",
    parameters: z.object({
      prompt: z.string(),
    }),
    async execute({ prompt }) {
      return await planSearchQueries({ prompt })
    },
  }),
  generateTitle: tool({
    description: "Generate a title for a report.",
    parameters: z.object({
      prompt: z.string(),
    }),
    async execute({ prompt }) {
      return await generateTitle(prompt)
    },
  }),
  summarizeSources: tool({
    description: "Summarize sources.",
    parameters: z.object({
      searchResults: z
        .union([
          z.array(
            z.object({
              query: z.string(),
              sources: z.array(
                z.object({
                  title: z.string(),
                  url: z.string(),
                  snippet: z.string(),
                })
              ),
            })
          ),
          z
            .object({
              query: z.string(),
              sources: z.array(
                z.object({
                  title: z.string(),
                  url: z.string(),
                  snippet: z.string(),
                })
              ),
            })
            .transform((item) => [item]),
        ])
        .transform((input) => (Array.isArray(input) ? input : [input])),
    }),
    async execute({ searchResults }) {
      return await summarizeSources({ searchResults })
    },
  }),
  generateReport: tool({
    description: "Generate a report.",
    parameters: z.object({
      findings: z.array(
        z.object({
          query: z.string(),
          summary: z.string(),
          citations: z.array(
            z.object({
              title: z.string(),
              url: z.string(),
              snippet: z.string(),
            })
          ),
        })
      ),
      title: z.string(),
    }),
    async execute({ findings, title }) {
      return await generateReport({ findings, title })
    },
  }),
  bookSportSession: tool({
    description: "Book a sport session with interactive UI wizard.",
    parameters: z.object({
      service: z.string().describe("The sport service to book (e.g., 'Tennis Court', 'Basketball Court', 'Swimming Pool')"),
      date: z.string().describe("Date for the booking in YYYY-MM-DD format"),
      timeSlot: z.string().describe("Time slot for the booking (e.g., '10:00-11:00')"),
      duration: z.number().describe("Duration in minutes"),
      customerName: z.string().describe("Customer's full name"),
      customerEmail: z.string().describe("Customer's email address"),
      customerPhone: z.string().optional().describe("Customer's phone number (optional)"),
    }),
    async execute(params) {
      return await bookSportSession(params)
    }
  }),
  createPurchaseOrder: tool({
    description: "Create a purchase request (Demande d'Achat) in UM6P SAP system following the digitalized procurement process. This replaces email-based requests and guides users through the complete UM6P procurement workflow.",
    parameters: z.object({
      // UM6P Basic Information
      subject: z.string().optional().describe("Objet de la demande - Will receive DA number with this subject"),
      requestor: z.string().optional().describe("Nom du demandeur - Full name of requestor"),
      projectManager: z.string().optional().describe("Chef de projet concerné - Project manager if applicable"),
      
      // Purchase Type (UM6P specific)
      purchaseType: z.string().optional().describe("Type d'achat: direct (≤50 KMAD), tender (>50 KMAD), direct_contract (gré à gré), online, contract, vacation"),
      
      // Product Details
      designation: z.string().optional().describe("Désignation - Product name in French"),
      description: z.string().optional().describe("Description technique détaillée"),
      amount: z.string().optional().describe("Montant estimé - Estimated amount"),
      currency: z.string().optional().describe("Currency (MAD, USD, EUR)"),
      vendor: z.string().optional().describe("Fournisseur proposé - Proposed supplier if known"),
      
      // UM6P Specific Fields
      entity: z.string().optional().describe("Entité - Entity code (ex: U129 for Communication)"),
      budgetLine: z.string().optional().describe("Ligne budgétaire (ordre interne) + type d'achat"),
      familyReferent: z.string().optional().describe("Famille Référent - Family category for the procurement"),
      
      // Additional Info
      deliveryDate: z.string().optional().describe("Date de livraison souhaitée"),
      approver: z.string().optional().describe("Approbateur - Approver name"),
      notes: z.string().optional().describe("Notes additionnelles"),
      
      // Legacy fields for compatibility
      department: z.string().optional().describe("Department (legacy field)"),
      costCenter: z.string().optional().describe("Cost center (legacy field)"),
      priority: z.string().optional().describe("Priority level"),
    }),
    async execute(params) {
      return await createPurchaseOrder(params)
    }
  }),
  orchestrateAgent: tool({
    description: "Use the Master Agent Orchestrator to analyze user requests and select the most appropriate specialized agent for the task.",
    parameters: z.object({
      userPrompt: z.string().describe("The user's request or question to analyze"),
      requireReasoning: z.boolean().optional().default(true).describe("Whether to show detailed reasoning process")
    }),
    async execute(params) {
      return await orchestrateAgent(params)
    }
  }),
}

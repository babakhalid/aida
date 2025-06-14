import Claude from "@/components/icons/claude"
import DeepSeek from "@/components/icons/deepseek"
import Gemini from "@/components/icons/gemini"
import Grok from "@/components/icons/grok"
import Mistral from "@/components/icons/mistral"
import OpenAI from "@/components/icons/openai"
import OpenRouter from "@/components/icons/openrouter"
import Xai from "@/components/icons/xai"
import {
  BookOpenText,
  Brain,
  Code,
  Lightbulb,
  Notepad,
  PaintBrush,
  Sparkle,
  Calendar,
} from "@phosphor-icons/react/dist/ssr"
import { openproviders, OpenProvidersOptions } from "./openproviders"
import { SupportedModel } from "./openproviders/types"

export const NON_AUTH_DAILY_MESSAGE_LIMIT = 5
export const AUTH_DAILY_MESSAGE_LIMIT = 1000
export const REMAINING_QUERY_ALERT_THRESHOLD = 2
export const DAILY_FILE_UPLOAD_LIMIT = 5
export const DAILY_SPECIAL_AGENT_LIMIT = 100
export const DAILY_LIMIT_PRO_MODELS = 5

export type Model = {
  id: string
  name: string
  provider: string
  api_sdk: OpenProvidersOptions<SupportedModel>
  features?: {
    id: string
    enabled: boolean
  }[]
  description?: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
}

export const MODELS_FREE = [
   {
    id: "claude-3-7-sonnet-20250219",
    name: "Claude 3.7 Sonnet",
    provider: "anthropic",
    features: [
      {
        id: "file-upload",
        enabled: true,
      },
      {
        id: "tool-use",
        enabled: true,
      },
    ],
    creator: "anthropic",
    api_sdk: openproviders("claude-3-7-sonnet-20250219"),
    description:
      "Anthropic's most intelligent model. Excels at step-by-step reasoning and complex tasks.",
    icon: Claude,
  },
  {
    id: "grok-3",
    name: "Grok 3",
    provider: "xai",
    features: [
      {
        id: "file-upload",
        enabled: false,
      },
      {
        id: "tool-use",
        enabled: true,
      },
    ],
    creator: "xai",
    api_sdk: openproviders("grok-3"),
    description:
      "Flagship model excelling at enterprise use cases with deep domain knowledge in finance, healthcare, law, and science.",
    icon: Grok,
  },
  {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "openai",
    features: [
      {
        id: "file-upload",
        enabled: true,
      },
      {
        id: "tool-use",
        enabled: true,
      },
    ],
    creator: "openai",
    api_sdk: openproviders("gpt-4o"),
    description:
      "OpenAI's flagship model with multimodal capabilities. Excellent at coding, writing, and complex tasks.",
    icon: OpenAI,
  },
]

export const MODELS_PRO = [
  {
    id: "gemini-2.5-pro-preview-03-25",
    name: "Gemini 2.5 Pro",
    provider: "gemini",
    features: [
      {
        id: "file-upload",
        enabled: true,
      },
      {
        id: "tool-use",
        enabled: true,
      },
    ],
    creator: "google",
    api_sdk: openproviders("gemini-2.5-pro-exp-03-25"),
    description: "Advanced reasoning, coding, and multimodal understanding.",
    icon: Gemini,
  },
]

export const MODELS_OPTIONS = [...MODELS_FREE, ...MODELS_PRO] as Model[]

export type Provider = {
  id: string
  name: string
  available: boolean
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
}

export const PROVIDERS = [
  {
    id: "openrouter",
    name: "OpenRouter",
    icon: OpenRouter,
  },
  {
    id: "openai",
    name: "OpenAI",
    icon: OpenAI,
  },
  {
    id: "mistral",
    name: "Mistral",
    icon: Mistral,
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    icon: DeepSeek,
  },
  {
    id: "gemini",
    name: "Gemini",
    icon: Gemini,
  },
  {
    id: "claude",
    name: "Claude",
    icon: Claude,
  },
  {
    id: "grok",
    name: "Grok",
    icon: Grok,
  },
  {
    id: "xai",
    name: "XAI",
    icon: Xai,
  },
] as Provider[]

export const MODEL_DEFAULT = "claude-3-7-sonnet-20250219"

export const APP_NAME = "AIDA"
export const APP_DOMAIN = "https://aida.chat"
export const APP_DESCRIPTION =
  "AIDA is a free, open-source AI chat app with multi-model support."

export const SUGGESTIONS = [
  {
    label: "Education",
    highlight: "Education",
    prompt: `Education`,
    items: [
      "What are the academic policies for student assessment?",
      "How do I register for courses at UM6P?",
      "What is the grading policy for undergraduate programs?",
      "How to report academic misconduct or plagiarism?",
    ],
    icon: BookOpenText,
  },
  {
    label: "Research",
    highlight: "Research", 
    prompt: `Research`,
    items: [
      "Research the latest developments in renewable energy technologies",
      "Find academic papers on artificial intelligence in healthcare",
      "What are UM6P's research collaboration policies?",
      "Search for funding opportunities for PhD research projects",
    ],
    icon: Brain,
  },
  {
    label: "Operations",
    highlight: "Operations",
    prompt: `Operations`,
    items: [
      "Create a purchase order for research equipment worth 10,000 USD",
      "Book a tennis court for faculty recreation tomorrow at 4 PM",
      "What is the procedure for reporting workplace harassment?",
      "Submit a purchase order for laboratory supplies and chemicals",
    ],
    icon: Code,
  },
  {
    label: "Entrepreneurship",
    highlight: "Entrepreneurship",
    prompt: `Entrepreneurship`,
    items: [
      "What support does UM6P provide for student startups?",
      "How to access the university's innovation incubator program?",
      "What are the policies for commercializing university research?",
      "Book a meeting room for startup pitch presentation",
    ],
    icon: Lightbulb,
  },
]

export const SYSTEM_PROMPT_DEFAULT = `You are AIDA, a thoughtful and clear assistant. Your tone is calm, minimal, and human. You write with intention—never too much, never too little. You avoid clichés, speak simply, and offer helpful, grounded answers. When needed, you ask good questions. You don't try to impress—you aim to clarify. You may use metaphors if they bring clarity, but you stay sharp and sincere. You're here to help the user think clearly and move forward, not to overwhelm or overperform.`

export const MESSAGE_MAX_LENGTH = 4000

export const CURATED_AGENTS_SLUGS = [
  "github/ibelick/prompt-kit",
  "github/ibelick/aida",
  "github/shadcn/ui",
  "research",
  "tweet-vibe-checker",
  "blog-draft",
  "sport-booking",
  "sap-operations",
  "policy-assistant",
]

// Enhanced agent selection logic based on user prompt analysis
export function selectBestAgent(prompt: string): string | null {
  const lowerPrompt = prompt.toLowerCase()
  
  // Purchase/procurement/SAP related
  if (lowerPrompt.includes('purchase') || lowerPrompt.includes('order') || 
      lowerPrompt.includes('buy') || lowerPrompt.includes('procurement') ||
      lowerPrompt.includes('achat') || lowerPrompt.includes('demande') ||
      lowerPrompt.includes('sap') || lowerPrompt.includes('expense') ||
      lowerPrompt.includes('vendor') || lowerPrompt.includes('payment')) {
    return 'sap-operations'
  }
  
  // Sport/booking related
  if (lowerPrompt.includes('book') || lowerPrompt.includes('court') || 
      lowerPrompt.includes('sport') || lowerPrompt.includes('tennis') ||
      lowerPrompt.includes('basketball') || lowerPrompt.includes('swimming') ||
      lowerPrompt.includes('pool') || lowerPrompt.includes('gym') ||
      lowerPrompt.includes('badminton') || lowerPrompt.includes('reserve')) {
    return 'sport-booking'
  }
  
  // Policy/academic/HR related
  if (lowerPrompt.includes('policy') || lowerPrompt.includes('rule') || 
      lowerPrompt.includes('regulation') || lowerPrompt.includes('academic') ||
      lowerPrompt.includes('student') || lowerPrompt.includes('course') ||
      lowerPrompt.includes('grade') || lowerPrompt.includes('assessment') ||
      lowerPrompt.includes('vacation') || lowerPrompt.includes('leave') ||
      lowerPrompt.includes('hr') || lowerPrompt.includes('workplace')) {
    return 'policy-assistant'
  }
  
  // Research related
  if (lowerPrompt.includes('research') || lowerPrompt.includes('study') || 
      lowerPrompt.includes('paper') || lowerPrompt.includes('publication') ||
      lowerPrompt.includes('journal') || lowerPrompt.includes('find studies') ||
      lowerPrompt.includes('latest developments') || lowerPrompt.includes('summarize')) {
    return 'research'
  }
  
  // Writing/content related
  if (lowerPrompt.includes('write') || lowerPrompt.includes('essay') || 
      lowerPrompt.includes('blog') || lowerPrompt.includes('draft') ||
      lowerPrompt.includes('outline') || lowerPrompt.includes('article')) {
    return 'blog-draft'
  }
  
  // Social media/tweet related
  if (lowerPrompt.includes('tweet') || lowerPrompt.includes('twitter') || 
      lowerPrompt.includes('social media') || lowerPrompt.includes('post') ||
      lowerPrompt.includes('vibe') || lowerPrompt.includes('tone')) {
    return 'tweet-vibe-checker'
  }
  
  // Email/communication related
  if (lowerPrompt.includes('email') || lowerPrompt.includes('message') || 
      lowerPrompt.includes('communication') || lowerPrompt.includes('respond') ||
      lowerPrompt.includes('reply') || lowerPrompt.includes('professional')) {
    return 'inbox-fix'
  }
  
  // Product/UX related
  if (lowerPrompt.includes('ux') || lowerPrompt.includes('copy') || 
      lowerPrompt.includes('interface') || lowerPrompt.includes('user') ||
      lowerPrompt.includes('product') || lowerPrompt.includes('ui')) {
    return 'clear-ux-copywriter'
  }
  
  // Naming/branding related
  if (lowerPrompt.includes('name') || lowerPrompt.includes('brand') || 
      lowerPrompt.includes('suggest') || lowerPrompt.includes('domain') ||
      lowerPrompt.includes('company name') || lowerPrompt.includes('product name')) {
    return 'name-vibe-check'
  }
  
  // Startup/business strategy related
  if (lowerPrompt.includes('startup') || lowerPrompt.includes('business') || 
      lowerPrompt.includes('validate') || lowerPrompt.includes('strategy') ||
      lowerPrompt.includes('product idea') || lowerPrompt.includes('0 to 1')) {
    return '0-to-1-advisor'
  }
  
  // Code review related
  if (lowerPrompt.includes('review') || lowerPrompt.includes('code') || 
      lowerPrompt.includes('pull request') || lowerPrompt.includes('pr') ||
      lowerPrompt.includes('security') || lowerPrompt.includes('best practices')) {
    return 'pull-check'
  }
  
  // Creative/ideation related
  if (lowerPrompt.includes('creative') || lowerPrompt.includes('brainstorm') || 
      lowerPrompt.includes('idea') || lowerPrompt.includes('innovation') ||
      lowerPrompt.includes('explore') || lowerPrompt.includes('possibility')) {
    return 'eloi'
  }
  
  return null // Use master orchestrator for selection
}
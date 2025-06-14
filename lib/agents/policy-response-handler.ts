import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const VECTOR_STORE_ID = 'vs_684971fa2c9c8191ba6d484095aa15bc'

export async function handlePolicyResponse(userMessage: string): Promise<string> {
  try {
    console.log('🔵 Policy Response Handler - Starting')
    console.log('📝 User Message:', userMessage)
    
    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ OpenAI API key not configured')
      throw new Error('OpenAI API key not configured')
    }

    console.log('🚀 Making OpenAI Response API call...')
    const response = await openai.responses.create({
      model: "gpt-4.1",
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: "You are a Policy Assistant that helps users understand company policies, procedures, and guidelines. You have direct access to company policy documents and provide accurate, helpful answers based on that knowledge. Always cite relevant policy sections when possible and be clear about any limitations or areas where users should seek additional clarification. If you cannot find relevant information in the policies, clearly state that and suggest contacting HR or the appropriate department."
            }
          ]
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: userMessage
            }
          ]
        }
      ],
      text: {
        format: {
          type: "text"
        }
      },
      reasoning: {},
      tools: [
        {
          type: "file_search",
          vector_store_ids: [VECTOR_STORE_ID]
        }
      ],
      temperature: 0.3,
      max_output_tokens: 2048,
      top_p: 1,
      store: true
    })

    console.log('✅ OpenAI Response received')
    console.log('📊 Response structure keys:', Object.keys(response))
    console.log('📊 Has input array:', !!(response as any).input)
    console.log('📊 Input array length:', (response as any).input?.length)
    
    // Extract the response content - the Response API puts the final text in output_text
    let result = ''
    
    const typedResponse = response as any
    
    // First try: direct output_text property
    if (typedResponse.output_text) {
      result = typedResponse.output_text
      console.log('✅ Found content in output_text')
    }
    // Second try: output array with message content
    else if (typedResponse.output && Array.isArray(typedResponse.output)) {
      const messageOutput = typedResponse.output.find((item: any) => item.type === 'message' && item.content)
      if (messageOutput && messageOutput.content && Array.isArray(messageOutput.content)) {
        const textContent = messageOutput.content.find((c: any) => c.type === 'output_text')
        if (textContent && textContent.text) {
          result = textContent.text
          console.log('✅ Found content in output array message')
        }
      }
    }
    // Third try: text property
    else if (typedResponse.text?.content) {
      result = typedResponse.text.content
      console.log('✅ Found content in text property')
    }
    
    if (!result) {
      console.log('❌ Could not extract content from response')
      result = 'No response generated - unable to parse response structure'
    }
    
    console.log('📤 Returning result length:', result.length)
    console.log('📤 First 200 chars:', result.substring(0, 200) + '...')
    
    return result

  } catch (error) {
    console.error('❌ Error with policy response handler:', error)
    console.error('🔍 Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    })
    throw new Error(`Failed to query policy assistant: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}
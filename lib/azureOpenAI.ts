import { ChatMessage } from './prompt'

const AZURE_OPENAI_ENDPOINT = process.env.AZURE_OPENAI_ENDPOINT!
const AZURE_OPENAI_API_KEY = process.env.AZURE_OPENAI_API_KEY!
const AZURE_OPENAI_DEPLOYMENT = process.env.AZURE_OPENAI_DEPLOYMENT!

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionRequest {
  messages: ChatMessage[]
  temperature?: number
  max_tokens?: number
  stream?: boolean
}

export interface ChatCompletionResponse {
  text: string
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export async function chatCompletion(
  messages: ChatMessage[], 
  stream: boolean = false,
  temperature: number = 0.2
): Promise<ChatCompletionResponse> {
  try {
    const url = `${AZURE_OPENAI_ENDPOINT}/openai/deployments/${AZURE_OPENAI_DEPLOYMENT}/chat/completions?api-version=2024-02-15-preview`
    
    const body = {
      messages,
      temperature,
      max_tokens: 1000,
      top_p: 0.9,
      frequency_penalty: 0,
      presence_penalty: 0,
      stream
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': AZURE_OPENAI_API_KEY
      },
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      throw new Error(`Azure OpenAI API error: ${response.status} ${response.statusText}`)
    }

    if (stream) {
      // Handle streaming response
      return await handleStreamResponse(response)
    } else {
      // Handle non-streaming response
      const data = await response.json()
      return {
        text: data.choices[0]?.message?.content || '',
        usage: data.usage
      }
    }

  } catch (error) {
    console.error('Azure OpenAI error:', error)
    throw error
  }
}

async function handleStreamResponse(response: Response): Promise<ChatCompletionResponse> {
  const reader = response.body!.getReader()
  let accumulatedText = ''
  
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      
      // Process the stream chunk
      const chunk = new TextDecoder().decode(value)
      const lines = chunk.split('\n').filter(line => line.trim() !== '')
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = JSON.parse(line.slice(6))
          if (data.choices?.[0]?.delta?.content) {
            accumulatedText += data.choices[0].delta.content
          }
        }
      }
    }
    
    return {
      text: accumulatedText
    }
    
  } finally {
    reader.releaseLock()
  }
}

// Create a streaming response for Next.js
export function createStreamingResponse(messages: ChatMessage[]): ReadableStream {
  return new ReadableStream({
    async start(controller) {
      try {
        const response = await chatCompletion(messages, true)
        const encoder = new TextEncoder()
        
        // Send the complete response as a single chunk
        controller.enqueue(encoder.encode(response.text))
        controller.close()
      } catch (error) {
        console.error('Streaming error:', error)
        controller.error(error)
      }
    }
  })
} 

export async function embedQuery(text: string): Promise<number[] | null> {
  try {
    // Use the same deployment as chat, or create a separate embedding deployment
    const embeddingDeployment = process.env.AZURE_OPENAI_EMBEDDING || AZURE_OPENAI_DEPLOYMENT
    const url = `${AZURE_OPENAI_ENDPOINT}/openai/deployments/${embeddingDeployment}/embeddings?api-version=2024-02-15-preview`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type':'application/json', 'api-key': AZURE_OPENAI_API_KEY },
      body: JSON.stringify({ input: text })
    })

    if (!res.ok) {
      console.error('Embedding API error:', await res.text())
      throw new Error(`Embedding API error: ${res.status}`)
    }

    const json = await res.json()
    
    if (!json.data?.[0]?.embedding) {
      console.error('Unexpected embedding response:', json)
      throw new Error('No embedding in response')
    }

    return json.data[0].embedding
  } catch (error) {
    console.error('Embedding error:', error)
    // Return null to indicate embedding failed - searchKb will fall back to keyword search
    return null
  }
} 
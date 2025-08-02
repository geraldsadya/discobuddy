import { SearchResult } from './search'

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export function buildMessages(hits: SearchResult[], userQuery: string): ChatMessage[] {
  // Build context blocks from search results
  const contextBlocks = hits.map((hit, index) => 
    `# Document ${index + 1} (${hit.filename})\n${hit.content}`
  ).join('\n\n---\n\n')

  // System prompt with strict guardrails
  const systemPrompt = `You are DiscoBuddy, a Discovery-only assistant. You must follow these rules strictly:

1. ONLY answer questions about Discovery products, services, benefits, and processes
2. If asked about anything else, reply exactly: "I can only assist with Discovery-related queries."
3. Use ONLY the provided context to answer questions
4. If the exact information isn't in the context, but you can provide related helpful information, do so and then add: "For the most up-to-date information, please contact Discovery directly."
5. If no relevant information is found, say: "While I can help with Discovery queries, I don't have specific information about that. I can tell you about Vitality benefits, KeyCare plans, or medical scheme coverage. What would you like to know?"
6. Be helpful, accurate, and professional
7. Cite the source documents when possible
8. Keep answers concise but complete
9. If unsure, err on the side of caution and refer to official Discovery channels

Remember: You are a Discovery assistant. Stay in scope but try to be helpful with related information when possible.`

  // Context instructions
  const contextInstructions = `IMPORTANT: You MUST answer using ONLY the following context. Do not use any external knowledge.

Context documents:
${contextBlocks}

User question: ${userQuery}

Instructions:
- Answer based ONLY on the context above
- If the answer isn't in the context, say you don't have enough information
- Cite the source document(s) you used
- Be specific and accurate`

  return [
    { role: 'system', content: systemPrompt },
    { role: 'system', content: contextInstructions },
    { role: 'user', content: userQuery }
  ]
}

export function buildRefusalMessage(): string {
  return "I can only assist with Discovery-related queries."
}

export function buildClarifierMessage(): string {
  return "I'd be happy to help with Discovery-related questions. Could you please specify which Discovery product or service you're asking about? (e.g., Vitality, KeyCare, medical scheme, etc.)"
}

export function buildErrorMessage(): string {
  return "I'm experiencing a temporary issue. Please try again in a moment."
}

// Format citations for the response
export function formatCitations(hits: SearchResult[]): Array<{doc: string, score: number}> {
  return hits.map(hit => ({
    doc: hit.filename,
    score: Math.round(hit.score * 100) / 100 // Round to 2 decimal places
  }))
} 
import { NextRequest, NextResponse } from 'next/server'
import { detectLanguage, translate } from '@/lib/translate'
import { classifyIntent, isOutOfScope, isUnsafe, getClarifierQuestion } from '@/lib/guardrails'
import { searchKb, fallbackSearch, isSearchQualityGood } from '@/lib/search'
import { buildMessages, buildRefusalMessage, buildClarifierMessage, buildErrorMessage, formatCitations } from '@/lib/prompt'
import { chatCompletion } from '@/lib/azureOpenAI'
import { logTelemetry, createTelemetryEvent } from '@/lib/telemetry'

export interface ChatRequest {
  message: string
  lang?: string
  sessionId?: string
  meta?: { channel?: string }
}

export interface ChatResponse {
  text: string
  citations?: Array<{ doc: string; score: number }>
  refused: boolean
  intent?: { label: string; confidence: number }
  sessionId?: string
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const body: ChatRequest = await request.json()
    const { message, lang = 'auto', sessionId, meta } = body

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required and must be a string' },
        { status: 400 }
      )
    }

    // A) Language detection and translation
    const detectedLanguage = lang === 'auto' ? await detectLanguage(message) : lang
    const enText = detectedLanguage !== 'en' ? await translate(message, detectedLanguage, 'en') : message

    // B) Intent classification and guardrails
    const intent = classifyIntent(enText)
    
    // Only refuse if clearly out of scope
    if (intent.label === 'out') {
      const telemetryEvent = createTelemetryEvent(
        sessionId,
        message,
        detectedLanguage,
        intent,
        true,
        [],
        0,
        { totalHits: 0, topScore: 0, hasGoodQuality: false },
        Date.now() - startTime,
        'Out of scope',
        meta?.channel
      )
      logTelemetry(telemetryEvent)
      
      return NextResponse.json({
        text: buildRefusalMessage(),
        refused: true,
        intent
      })
    }

    // For ambiguous queries, ask for clarification
    if (intent.label === 'ambiguous') {
      const telemetryEvent = createTelemetryEvent(
        sessionId,
        message,
        detectedLanguage,
        intent,
        true,
        [],
        0,
        { totalHits: 0, topScore: 0, hasGoodQuality: false },
        Date.now() - startTime,
        'Ambiguous intent',
        meta?.channel
      )
      logTelemetry(telemetryEvent)
      
      return NextResponse.json({
        text: buildClarifierMessage(),
        refused: true,
        intent
      })
    }

    // C) Search the knowledge base
    let searchResults = await searchKb(enText, 3)
    
    // DEBUG: Log search results
    console.log('🔍 SEARCH DEBUG:', {
      query: enText,
      totalHits: searchResults.totalCount,
      hits: searchResults.hits.map(h => ({ filename: h.filename, score: h.score, contentLength: h.content.length })),
      hasGoodQuality: isSearchQualityGood(searchResults.hits)
    })
    
    // Try fallback search if vector search returns no hits
    if (searchResults.hits.length === 0) {
      console.log('🔄 No vector hits, trying fallback search...')
      searchResults = await fallbackSearch(enText, 3)
    }

    // If still no hits, give a softer response for in-scope queries
    if (searchResults.hits.length === 0) {
      const telemetryEvent = createTelemetryEvent(
        sessionId,
        message,
        detectedLanguage,
        intent,
        false, // Not refused, just no results
        [],
        0,
        { 
          totalHits: searchResults.totalCount, 
          topScore: 0, 
          hasGoodQuality: false 
        },
        Date.now() - startTime,
        'No search results found',
        meta?.channel
      )
      logTelemetry(telemetryEvent)
      
      // Different message based on intent
      const responseText = intent.label === 'in'
        ? "I understand you're asking about Discovery services. While I don't have specific information about that, I can help with questions about Vitality benefits, KeyCare plans, or medical scheme coverage. Could you try asking about one of these topics?"
        : buildRefusalMessage()

      return NextResponse.json({
        text: responseText,
        refused: false, // Not refused if intent is 'in'
        intent
      })
    }

    // D) Build messages for Azure OpenAI
    const messages = buildMessages(searchResults.hits, enText)

    // E) Call Azure OpenAI
    const completion = await chatCompletion(messages, false, 0.2)
    let finalText = completion.text

    // F) Translate back to original language if needed
    if (detectedLanguage !== 'en') {
      try {
        finalText = await translate(completion.text, 'en', detectedLanguage)
      } catch (translateError) {
        console.error('Answer translation error:', translateError)
        // Keep English answer if translation fails
      }
    }

    // G) Log telemetry
    const telemetryEvent = createTelemetryEvent(
      sessionId,
      message,
      detectedLanguage,
      intent,
      false,
      searchResults.hits.map(hit => hit.filename),
      finalText.length,
      {
        totalHits: searchResults.totalCount,
        topScore: searchResults.hits[0]?.score || 0,
        hasGoodQuality: true
      },
      Date.now() - startTime,
      undefined,
      meta?.channel
    )
    logTelemetry(telemetryEvent)

    // H) Return response
    return NextResponse.json({
      text: finalText,
      citations: formatCitations(searchResults.hits),
      refused: false,
      intent,
      sessionId
    })

  } catch (error) {
    console.error('Chat API error:', error)
    
    const telemetryEvent = createTelemetryEvent(
      undefined,
      'Error occurred',
      'en',
      { label: 'error', confidence: 0 },
      true,
      [],
      0,
      { totalHits: 0, topScore: 0, hasGoodQuality: false },
      Date.now() - startTime,
      error instanceof Error ? error.message : 'Unknown error'
    )
    logTelemetry(telemetryEvent)
    
    return NextResponse.json(
      { 
        text: buildErrorMessage(),
        refused: true,
        error: 'Internal server error'
      },
      { status: 500 }
    )
  }
}

// Handle streaming requests
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const message = searchParams.get('message')
  const sessionId = searchParams.get('sessionId')
  const lang = searchParams.get('lang') || 'auto'

  if (!message) {
    return NextResponse.json(
      { error: 'Message parameter is required' },
      { status: 400 }
    )
  }

  // For streaming, we'll use the same logic but return a stream
  // This is a simplified version - you might want to implement proper streaming
  try {
    const response = await POST(new NextRequest(request.url, {
      method: 'POST',
      body: JSON.stringify({ message, sessionId, lang })
    }))
    
    return response
  } catch (error) {
    return NextResponse.json(
      { error: 'Streaming not implemented yet' },
      { status: 501 }
    )
  }
}

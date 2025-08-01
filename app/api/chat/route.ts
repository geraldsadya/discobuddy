import { NextRequest, NextResponse } from 'next/server'
import { detectLanguage, translate } from '@/lib/translate'
import { classifyIntent, getClarifierQuestion } from '@/lib/guardrails'
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

    const detectedLanguage = lang === 'auto' ? await detectLanguage(message) : lang
    const enText = detectedLanguage !== 'en' ? await translate(message, detectedLanguage, 'en') : message
    const intent = classifyIntent(enText)

    if (intent.label === 'out') {
      return NextResponse.json({
        text: buildRefusalMessage(),
        refused: true,
        intent
      })
    }

    if (intent.label === 'ambiguous') {
      return NextResponse.json({
        text: buildClarifierMessage(),
        refused: true,
        intent
      })
    }

    let searchResults = await searchKb(enText, 3)

    if (searchResults.hits.length === 0) {
      searchResults = await fallbackSearch(enText, 3)
    }

    if (searchResults.hits.length === 0) {
      const responseText = intent.label === 'in'
        ? "I understand you're asking about Discovery services. Could you try asking about Vitality benefits, KeyCare plans, or medical scheme coverage?"
        : buildRefusalMessage()

      return NextResponse.json({
        text: responseText,
        refused: false,
        intent
      })
    }

    const messages = buildMessages(searchResults.hits, enText)
    const completion = await chatCompletion(messages, false, 0.2)
    let finalText = completion.text

    if (detectedLanguage !== 'en') {
      try {
        finalText = await translate(completion.text, 'en', detectedLanguage)
      } catch (e) {
        console.error('Translation back failed:', e)
      }
    }

    return NextResponse.json({
      text: finalText,
      citations: formatCitations(searchResults.hits),
      refused: false,
      intent,
      sessionId
    })
  } catch (error) {
    console.error('Chat error:', error)
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

  try {
    const response = await POST(new NextRequest(request.url, {
      method: 'POST',
      body: JSON.stringify({ message, sessionId, lang })
    }))

    return response
  } catch (e) {
    return NextResponse.json(
      { error: 'Streaming not implemented yet' },
      { status: 501 }
    )
  }
}

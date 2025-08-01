import { NextResponse } from 'next/server'
import { detectLanguage, translate } from '@/lib/translate'
import { classifyIntent, getClarifierQuestion } from '@/lib/guardrails'

export interface ChatRequest {
  message: string
  lang?: string
  sessionId?: string
  meta?: { channel?: string }
}

export interface ChatResponse {
  text: string
  refused: boolean
  intent?: { label: string; confidence: number }
  lang?: string
}

export async function POST(request: Request) {
  const body: ChatRequest = await request.json()
  const { message, lang = 'auto' } = body

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
      text: "I'm sorry, I can't help with that topic.",
      refused: true,
      intent,
      lang: detectedLanguage
    })
  }

  if (intent.label === 'ambiguous') {
    return NextResponse.json({
      text: getClarifierQuestion(),
      refused: true,
      intent,
      lang: detectedLanguage
    })
  }

  return NextResponse.json({
    text: `Intent: ${intent.label}. Proceeding...`,
    refused: false,
    intent,
    lang: detectedLanguage
  })
}

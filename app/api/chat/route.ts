import { NextResponse } from 'next/server'
import { detectLanguage, translate } from '@/lib/translate'

export interface ChatRequest {
  message: string
  lang?: string
  sessionId?: string
  meta?: { channel?: string }
}

export interface ChatResponse {
  text: string
  refused: boolean
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

  return NextResponse.json({
    text: `Translated input: ${enText}`,
    refused: false,
    lang: detectedLanguage
  })
}

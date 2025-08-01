import { NextResponse } from 'next/server'

export interface ChatRequest {
  message: string
  lang?: string
  sessionId?: string
  meta?: { channel?: string }
}

export interface ChatResponse {
  text: string
  refused: boolean
}

export async function POST(request: Request) {
  const body: ChatRequest = await request.json()
  const { message } = body

  if (!message || typeof message !== 'string') {
    return NextResponse.json(
      { error: 'Message is required and must be a string' },
      { status: 400 }
    )
  }

  return NextResponse.json({
    text: 'This is a placeholder response.',
    refused: false
  })
}

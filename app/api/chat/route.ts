import { NextResponse } from 'next/server';
import { searchKb } from '@/lib/search';
import { getUserProfile, getProfileContextForQuestion } from '@/lib/user-profile';
import { chatCompletion, ChatMessage } from '@/lib/azureOpenAI';
import { isOutOfScope } from '@/lib/guardrails';
import { logTelemetry } from '@/lib/telemetry';

export async function POST(req: Request) {
  const startTime = Date.now();
  
  try {
    const { messages } = await req.json();
    const userMessage = messages[messages.length - 1].content;

    // Check if question is within Discovery scope
    if (isOutOfScope(userMessage)) {
      return NextResponse.json({
        response: "I can only help with Discovery-related questions. Please ask about Discovery's products, services, or benefits.",
        refused: true
      });
    }

    // Get user profile and relevant context
    const profile = await getUserProfile('gerald'); // In production, get from auth
    const profileContext = getProfileContextForQuestion(profile, userMessage);

    // Search knowledge base
    const searchResults = await searchKb(userMessage);
    const kbContext = searchResults.hits.map(hit => hit.content).join('\n\n');

    // Build system prompt
    const systemPrompt = `You are DiscoBuddy, Discovery's AI assistant.

Use only Discovery knowledge provided in "KB Context" to answer.
If—and only if—the user's question naturally relates to a benefit that this user can activate or improve (based on the "User Context"), add a short "Personalised tip" after the answer.

Rules:
- First: answer factually from the KB.
- Personalise only when it clearly helps with THIS topic (e.g., groceries ↔ HealthyFood; gyms ↔ Vitality Gym).
- Use profile numbers for estimates (preface with "about" or "up to").
- Do NOT invent Discovery policies or student discounts.
- If required details are missing (KB facts or profile data), skip the tip.
- If the KB doesn't mention a fact, do not infer it.

User Context (summarised): ${profileContext}

You will receive "KB Context" in the user message.`;

    // Format user message with KB context
    const formattedUserMessage = `Question: ${userMessage}

KB Context:
${kbContext}`;

    // Create messages array with just system prompt and current user message
    const chatMessages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: formattedUserMessage }
    ];

    // Generate response
    const completion = await chatCompletion(chatMessages);

    // Log telemetry
    logTelemetry({
      timestamp: new Date().toISOString(),
      sessionId: 'demo', // In production, use real session ID
      question: userMessage,
      kb_confidence: searchResults.hits[0]?.score || 0,
      tip_appended: completion.text.includes('Personalised tip:'),
      response_time_ms: Date.now() - startTime,
      profile_context_used: profileContext
    });

    return NextResponse.json({
      response: completion.text,
      citations: searchResults.hits.map(hit => ({
        filename: hit.filename,
        score: hit.score
      }))
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to process chat request' },
      { status: 500 }
    );
  }
} 
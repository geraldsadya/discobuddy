import { NextRequest, NextResponse } from 'next/server';
import { OpenAIClient, AzureKeyCredential } from "@azure/openai";

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    // Get environment variables
    const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const azureApiKey = process.env.AZURE_OPENAI_API_KEY;
    const deploymentId = process.env.AZURE_OPENAI_DEPLOYMENT_ID;
    const searchEndpoint = process.env.AZURE_AI_SEARCH_ENDPOINT;
    const searchKey = process.env.AZURE_AI_SEARCH_API_KEY;
    const searchIndex = process.env.AZURE_AI_SEARCH_INDEX;

    if (!endpoint || !azureApiKey || !deploymentId || !searchEndpoint || !searchKey || !searchIndex) {
      return NextResponse.json(
        { error: "Missing required environment variables" },
        { status: 500 }
      );
    }

    const client = new OpenAIClient(endpoint, new AzureKeyCredential(azureApiKey));

    // Prepare messages with system prompt
    const systemMessage = {
      role: "system" as const,
      content: `You are Discovery's AI assistant. You have access to Discovery's comprehensive knowledge base and user data. 

IMPORTANT INSTRUCTIONS:
1. Always format answers in GitHub-flavored Markdown (GFM). Use headings (###), bold (**text**), lists, and tables when helpful
2. Always provide detailed, comprehensive answers based on the retrieved documents
3. Include specific numbers, percentages, and exact details when available
4. Structure your responses clearly with bullet points, tables, and sections
5. Reference specific document citations when possible
6. If information is not found in the documents, clearly state this
7. Be thorough and professional in your responses

USER CONTEXT (Gerald Sadya):
- Name: Gerald Sadya, Age: 25
- Monthly Salary: R40,000, Discretionary Income: R2,000
- Account: Black Suite Transaction Account (Bundled Fees)
- Account Balance: R150,000
- Vitality Status: Silver (12,500 points)
- Discovery Miles: 1,000
- Medical Aid: Classic Priority
- Insurance: No Life/Car/Home Insurance
- Gym: Virgin Active

When answering questions:
- Use Gerald's account details to personalize responses
- Search through Discovery documents for comprehensive information
- Provide detailed breakdowns of benefits, fees, rates, and rewards
- Include step-by-step explanations when relevant`
    };

    const chatMessages = [systemMessage, ...messages];

    // Get response with Azure Cognitive Search integration (RAG)
    const events = await client.streamChatCompletions(deploymentId, chatMessages, {
      pastMessages: 10,
      maxTokens: 13107,
      temperature: 0.7,
      topP: 1.0,
      frequencyPenalty: 0,
      presencePenalty: 0,
      azureExtensionOptions: {
        extensions: [
          {
            type: "AzureCognitiveSearch",
            parameters: {
              endpoint: searchEndpoint,
              key: searchKey,
              indexName: searchIndex,
            },
          },
        ],
      },
    });

    let response = "";
    for await (const event of events) {
      for (const choice of event.choices) {
        const newText = choice.delta?.content;
        if (!!newText) {
          response += newText;
        }
      }
    }

    return NextResponse.json({ response });

  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 
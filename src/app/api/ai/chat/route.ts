import { NextRequest, NextResponse } from 'next/server';

/**
 * AI Chat Proxy Route
 * Forwards chat messages to Groq (Llama 3) for the AI Copilot.
 */
export async function POST(req: NextRequest) {
  try {
    const { message, history = [] } = await req.json();

    const apiKey = process.env.AI_API_KEY;
    if (!apiKey) {
      console.error('AI_API_KEY is missing in environment variables');
      return NextResponse.json(
        { error: 'AI API key not configured' },
        { status: 500 }
      );
    }

    console.log('Forwarding message to Groq AI...');

    const response = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama3-8b-8192',
          messages: [
            {
              role: 'system',
              content: `You are an AI assistant for a WhatsApp reseller platform dashboard. 
              Help users understand their analytics, manage business users, and navigate the platform. 
              Be concise, professional, and helpful. 
              The current user is a Reseller looking at their analytics dashboard.`
            },
            ...history,
            { role: 'user', content: message }
          ],
          max_tokens: 500,
          temperature: 0.7,
        }),
      }
    );

    if (!response.ok) {
      const err = await response.json();
      console.error('Groq AI Provider Error:', err);
      return NextResponse.json(
        { error: 'AI service error', detail: err },
        { status: response.status }
      );
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || 'Sorry, I could not process that.';

    return NextResponse.json({ reply });

  } catch (err: any) {
    console.error('AI Chat Route Error:', err);
    return NextResponse.json(
      { error: 'Internal server error', details: err.message },
      { status: 500 }
    );
  }
}

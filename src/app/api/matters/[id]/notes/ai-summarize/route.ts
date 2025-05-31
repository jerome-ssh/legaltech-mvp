import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';

export async function POST(request: Request) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { content } = await request.json();
  if (!content) return NextResponse.json({ error: 'Content required' }, { status: 400 });

  // --- Replace this with your OpenAI or LLM call ---
  // For now, mock a summary
  const summary = `Summary: ${content.slice(0, 100)}...`;

  return NextResponse.json({ summary });
} 
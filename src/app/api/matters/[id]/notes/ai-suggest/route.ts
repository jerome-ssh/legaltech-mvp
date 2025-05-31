import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';

export async function POST(request: Request) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { content } = await request.json();
  if (!content) return NextResponse.json({ error: 'Content required' }, { status: 400 });

  // --- Replace this with your OpenAI or LLM call ---
  // For now, mock a suggestion
  const suggestion = `Consider researching related case law or adding supporting evidence for: ${content.slice(0, 80)}...`;

  return NextResponse.json({ suggestion });
} 
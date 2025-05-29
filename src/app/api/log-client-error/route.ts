export async function POST(req: Request) {
  const body = await req.json();
  // Log to server terminal
  console.error('[Client Error]', body);
  return new Response('Logged', { status: 200 });
} 
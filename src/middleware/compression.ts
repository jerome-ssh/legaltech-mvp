import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { compress } from 'compression';

const compression = compress({
  filter: (req) => {
    if (req.headers.get('accept')?.includes('text/html')) {
      return false;
    }
    return true;
  },
  threshold: 1024, // Only compress responses larger than 1KB
});

export async function withCompression(
  req: NextRequest,
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  const response = await handler(req);
  
  // Only compress if the response is JSON or text
  const contentType = response.headers.get('content-type');
  if (contentType?.includes('application/json') || contentType?.includes('text/')) {
    const compressed = await compression(req, response);
    return compressed;
  }
  
  return response;
} 
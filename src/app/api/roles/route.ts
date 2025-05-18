import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { profileId } = await request.json();
    if (!profileId) {
      return NextResponse.json({ success: false, error: 'Profile ID is required' }, { status: 400 });
    }
    // TODO: Implement real logic to fetch roles from Supabase
    const roles = [
      { id: '1', name: 'attorney' },
      { id: '2', name: 'admin' }
    ];
    return NextResponse.json({ success: true, roles });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
} 
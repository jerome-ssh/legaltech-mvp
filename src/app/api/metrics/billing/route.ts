import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { profileId } = await request.json();

    if (!profileId) {
      return NextResponse.json(
        { success: false, error: 'Profile ID is required' },
        { status: 400 }
      );
    }

    const { data: invoices, error } = await supabaseAdmin
      .from('invoices')
      .select('amount, status')
      .eq('profile_id', profileId)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    if (error) {
      console.error('Error fetching invoices:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch invoices' },
        { status: 500 }
      );
    }

    if (!invoices?.length) {
      return NextResponse.json(
        { success: true, score: 0 },
        { status: 200 }
      );
    }

    const paidInvoices = invoices.filter(invoice => invoice.status === 'paid');
    const totalAmount = invoices.reduce((acc, curr) => acc + curr.amount, 0);
    const paidAmount = paidInvoices.reduce((acc, curr) => acc + curr.amount, 0);
    const score = Math.round((paidAmount / totalAmount) * 100);

    return NextResponse.json(
      { success: true, score },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in billing API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
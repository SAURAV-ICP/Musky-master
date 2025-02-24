import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { user_id, solana_address } = await request.json();

    if (!user_id || !solana_address) {
      return NextResponse.json(
        { error: 'User ID and Solana address are required' },
        { status: 400 }
      );
    }

    // Update the user's Solana address in Supabase
    const { error } = await supabase
      .from('users')
      .update({ solana_address })
      .eq('user_id', user_id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating Solana address:', error);
    return NextResponse.json(
      { error: 'Failed to update Solana address' },
      { status: 500 }
    );
  }
} 
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

interface UpdateWalletRequest {
  user_id: string;
  wallet_address: string;
}

export async function POST(request: Request) {
  try {
    const data = await request.json() as UpdateWalletRequest;
    
    if (!data.user_id || !data.wallet_address) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Update the user's wallet address
    const { data: updatedUser, error } = await supabase
      .from('users')
      .update({
        ton_address: data.wallet_address,
        // Also update telegram_id if it's not set
        telegram_id: data.user_id
      })
      .eq('user_id', data.user_id)
      .select()
      .single();
      
    if (error) {
      console.error('Error updating wallet address:', error);
      return NextResponse.json({ error: 'Failed to update wallet address' }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      user: updatedUser
    });
    
  } catch (error) {
    console.error('Error in update-wallet route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

interface DatabaseUser {
  user_id: string; // UUID as string
  balance: number;
  energy: number;
  mining_rate: number;
  last_tap_time: string | null;
  level: string;
  last_energy_reset: string | null; // Ensure this exists
}

const INITIAL_ENERGY = 1000; // 1000 represents 100% energy
const ENERGY_DECREASE_PER_TAP = 1; // 0.1% of 1000 (1 unit per tap)
const MUSKY_PER_TAP = 1;

interface TapRequest {
  user_id: string; // UUID as string
}

interface TapResponse {
  success: boolean;
  new_balance?: number;
  new_energy?: number;
  earned?: number;
  mining_rate?: number;
  is_new_user?: boolean;
  error?: string;
  can_purchase?: boolean;
  timeLeft?: number; // Add for energy reset
}

export async function POST(request: Request): Promise<NextResponse<TapResponse>> {
  try {
    const { user_id } = await request.json() as TapRequest;
    console.log('Tap request received for user:', user_id);

    if (!user_id) {
      return NextResponse.json({ 
        success: false, 
        error: 'User ID is required' 
      }, { status: 400 });
    }

    // Get current user
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', user_id) // UUID as string
      .single<DatabaseUser>();

    console.log('User data:', user);
    console.log('Fetch error:', fetchError);

    if (fetchError) {
      if (fetchError.code === 'PGRST116') { // Not found error
        // Create new user with initial energy
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({
            user_id, // UUID as string
            energy: INITIAL_ENERGY,
            balance: 0,
            mining_rate: 1,
            level: '1',
            last_tap_time: null,
            last_energy_reset: null // Ensure this field exists
          })
          .select()
          .single<DatabaseUser>();

        if (createError) {
          throw createError;
        }

        return NextResponse.json({
          success: true,
          new_balance: 0,
          new_energy: INITIAL_ENERGY,
          earned: 0,
          is_new_user: true
        });
      }
      throw fetchError;
    }

    const now = new Date();
    const lastTap = user.last_tap_time ? new Date(user.last_tap_time) : null;

    // Prevent rapid tapping (minimum 100ms between taps)
    if (lastTap && now.getTime() - lastTap.getTime() < 100) {
      console.log('Tapping too fast');
      return NextResponse.json({ 
        success: false,
        error: 'Tapping too fast' 
      }, { status: 429 });
    }

    // Check if user has energy
    if (user.energy <= 0) {
      console.log('User has no energy');
      const resetTime = user.last_energy_reset ? new Date(user.last_energy_reset) : new Date();
      const timeLeft = Math.max(0, resetTime.getTime() + 4 * 60 * 60 * 1000 - now.getTime()) / (60 * 60 * 1000); // Hours left
      return NextResponse.json({ 
        success: false,
        error: 'No energy left',
        can_purchase: true,
        timeLeft: Math.ceil(timeLeft) * 3600 * 1000 // Return timeLeft in milliseconds for frontend
      }, { status: 400 });
    }

    // Calculate new energy (decrease by 1, 0.1% of 1000)
    const newEnergy = Math.max(0, user.energy - ENERGY_DECREASE_PER_TAP);

    // Increase MUSKY balance by 1
    const newBalance = user.balance + MUSKY_PER_TAP;

    console.log('Updating user with:', {
      balance: newBalance,
      energy: newEnergy,
      last_tap_time: now.toISOString()
    });

    // Update user's balance, energy, tap time, and reset if needed
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        balance: newBalance,
        energy: newEnergy,
        last_tap_time: now.toISOString(),
        last_energy_reset: newEnergy <= 0 ? new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString() : user.last_energy_reset,
      })
      .eq('user_id', user_id) // UUID as string
      .select()
      .single<DatabaseUser>();

    if (updateError) {
      console.error('Update error:', updateError);
      throw updateError;
    }

    console.log('Updated user:', updatedUser);

    // Log mining activity
    const { error: historyError } = await supabase
      .from('mining_history')
      .insert({
        user_id: user_id, // UUID as string
        amount: MUSKY_PER_TAP,
        type: 'tap',
        timestamp: now.toISOString()
      });

    if (historyError) {
      console.error('History logging error:', historyError);
    }

    return NextResponse.json({
      success: true,
      new_balance: updatedUser.balance,
      new_energy: newEnergy,
      earned: MUSKY_PER_TAP,
      mining_rate: user.mining_rate || 1
    });
  } catch (error) {
    console.error('Tap error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
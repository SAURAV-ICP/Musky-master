import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

interface PaymentRequest {
  user_id: string;
  amount: number;
  currency: 'TON' | 'Stars' | 'MUSKY';
  item_type: string;
}

interface UserData {
  balance: number;
  stars_balance: number;
  mining_equipment: any; // Using any to avoid TypeScript errors with complex nested structure
  mining_rate: number;
  solana_balance: number;
  spin_energy: number;
  is_admin: boolean;
}

export async function POST(request: Request) {
  try {
    const { user_id, amount, currency, item_type } = await request.json() as PaymentRequest;

    if (!user_id || !amount || !currency || !item_type) {
      return NextResponse.json({ 
        error: 'Missing required fields' 
      }, { status: 400 });
    }

    // Get the user's current data
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('balance, stars_balance, mining_equipment, mining_rate, solana_balance, spin_energy, is_admin')
      .eq('user_id', user_id)
      .single();

    if (userError) {
      console.error('Error fetching user:', userError);
      return NextResponse.json({ 
        error: 'Failed to fetch user data' 
      }, { status: 500 });
    }

    if (!user) {
      return NextResponse.json({ 
        error: 'User not found' 
      }, { status: 404 });
    }

    const userData = user as UserData;
    const isAdmin = userData.is_admin || user_id === 'admin';

    // Process payment based on currency
    if (currency === 'MUSKY') {
      // Check if user has enough MUSKY balance
      if (userData.balance < amount && !isAdmin) {
        return NextResponse.json({ 
          error: 'Insufficient MUSKY balance' 
        }, { status: 400 });
      }

      // Update user's MUSKY balance (skip for admin)
      if (!isAdmin) {
        const { error: updateError } = await supabase
          .from('users')
          .update({ 
            balance: userData.balance - amount 
          })
          .eq('user_id', user_id);

        if (updateError) {
          console.error('Error updating balance:', updateError);
          return NextResponse.json({ 
            error: 'Failed to update balance' 
          }, { status: 500 });
        }
      }
    } else if (currency === 'Stars') {
      // For Stars payments, we just record the transaction
      // The actual payment is handled by Telegram
    } else if (currency === 'TON') {
      // For TON payments, we just record the transaction
      // The actual payment is handled by Telegram
    }

    // Record the transaction
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        user_id,
        amount,
        currency,
        item_type,
        status: 'completed',
        created_at: new Date().toISOString()
      });

    if (transactionError) {
      console.error('Error recording transaction:', transactionError);
      return NextResponse.json({ 
        error: 'Failed to record transaction' 
      }, { status: 500 });
    }

    // Process the item purchase based on item_type
    let updateData: any = {};
    
    if (item_type.startsWith('RTX')) {
      // Handle GPU purchase
      // Initialize or update mining equipment
      const equipment = userData.mining_equipment || {};
      
      // Check if user already has the maximum number of this GPU type (2)
      const currentCount = equipment[item_type] || 0;
      if (currentCount >= 2 && !isAdmin) {
        return NextResponse.json({ 
          error: 'Maximum GPU limit reached for this type' 
        }, { status: 400 });
      }
      
      // Check if total GPU count is at maximum (8)
      let totalGPUs = 0;
      const validGpuTypes = ['RTX4070', 'RTX4090', 'RTX5070', 'RTX5090'];
      for (const gpuType of validGpuTypes) {
        totalGPUs += equipment[gpuType] || 0;
      }
      
      if (totalGPUs >= 8 && !isAdmin) {
        return NextResponse.json({ 
          error: 'Maximum total GPU limit reached (8)' 
        }, { status: 400 });
      }
      
      // Update GPU count
      if (!equipment[item_type]) {
        equipment[item_type] = 0;
      }
      equipment[item_type] += 1;
      
      // Update mining rate based on new equipment
      const miningRateIncrease = getMiningRateForGPU(item_type);
      const newMiningRate = (userData.mining_rate || 0) + miningRateIncrease;
      
      // Set expiration date for the GPU (30 days from now)
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 30);
      
      // Store GPU purchase with expiration date
      if (!equipment.expiration) {
        equipment.expiration = {};
      }
      
      if (!equipment.expiration[item_type]) {
        equipment.expiration[item_type] = [];
      }
      
      equipment.expiration[item_type].push(expirationDate.toISOString());
      
      updateData = {
        mining_equipment: equipment,
        mining_rate: newMiningRate
      };
      
      console.log(`User ${user_id} purchased ${item_type}. New mining rate: ${newMiningRate}`);
    } else if (item_type === 'stamina') {
      // Handle stamina purchase
      const staminaAmount = getStaminaAmount(amount, currency);
      updateData = {
        spin_energy: (userData.spin_energy || 0) + staminaAmount
      };
    } else if (item_type === 'hero' || item_type === 'superhero') {
      // Handle hero purchase
      const boostDuration = new Date();
      boostDuration.setDate(boostDuration.getDate() + 3); // 3 days boost
      
      updateData = {
        level: item_type === 'superhero' ? 'superhero' : 'hero',
        mining_boost: item_type === 'superhero' ? 4 : 2, // 4x or 2x boost
        mining_boost_expiry: boostDuration.toISOString(),
        energy_boost: item_type === 'superhero' ? 2 : 1.5, // 100% or 50% boost
        energy_boost_expiry: boostDuration.toISOString()
      };
    }
    
    // Update user with any additional changes
    if (Object.keys(updateData).length > 0) {
      const { error: finalUpdateError } = await supabase
        .from('users')
        .update(updateData)
        .eq('user_id', user_id);
        
      if (finalUpdateError) {
        console.error('Error updating user data:', finalUpdateError);
        return NextResponse.json({ 
          error: 'Failed to update user data' 
        }, { status: 500 });
      }
    }

    // Fetch updated user data to return the latest values
    const { data: updatedUser, error: updatedUserError } = await supabase
      .from('users')
      .select('mining_rate, solana_balance')
      .eq('user_id', user_id)
      .single();
      
    if (updatedUserError) {
      console.error('Error fetching updated user data:', updatedUserError);
    }

    return NextResponse.json({ 
      success: true,
      message: 'Payment processed successfully',
      mining_rate: updatedUser?.mining_rate || updateData.mining_rate || userData.mining_rate || 0,
      solana_balance: updatedUser?.solana_balance || userData.solana_balance || 0
    });

  } catch (error) {
    console.error('Payment processing error:', error);
    return NextResponse.json({ 
      error: 'Failed to process payment' 
    }, { status: 500 });
  }
}

// Helper function to get mining rate increase for different GPUs
// Based on LOGIC_PAYMENT.md
function getMiningRateForGPU(gpuType: string): number {
  switch (gpuType) {
    case 'RTX4070':
      return 0.03; // 0.03 SOL per day
    case 'RTX4090':
      return 0.08; // 0.08 SOL per day
    case 'RTX5070':
      return 0.25; // 0.25 SOL per day
    case 'RTX5090':
      return 0.5;  // 0.5 SOL per day
    default:
      return 0.01;
  }
}

// Helper function to calculate stamina amount based on payment
function getStaminaAmount(amount: number, currency: 'TON' | 'Stars' | 'MUSKY'): number {
  if (currency === 'Stars') {
    return amount * 10; // 100 Stars = 1000 stamina
  } else if (currency === 'TON') {
    return amount * 5000; // 1 TON = 5000 stamina
  } else {
    return amount / 10; // 10 MUSKY = 1 stamina
  }
} 
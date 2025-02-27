import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

interface PaymentRequest {
  user_id: string;
  amount: number;
  currency: 'TON' | 'Stars' | 'MUSKY';
  item_type: string;
}

export async function POST(request: Request) {
  try {
    const { user_id, amount, currency, item_type } = await request.json() as PaymentRequest;

    if (!user_id || !amount || !currency || !item_type) {
      return NextResponse.json({ 
        error: 'Missing required fields' 
      }, { status: 400 });
    }

    // Get the user's current balance
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('balance, stars_balance')
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

    // Process payment based on currency
    if (currency === 'MUSKY') {
      // Check if user has enough MUSKY balance
      if (user.balance < amount) {
        return NextResponse.json({ 
          error: 'Insufficient MUSKY balance' 
        }, { status: 400 });
      }

      // Update user's MUSKY balance
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          balance: user.balance - amount 
        })
        .eq('user_id', user_id);

      if (updateError) {
        console.error('Error updating balance:', updateError);
        return NextResponse.json({ 
          error: 'Failed to update balance' 
        }, { status: 500 });
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
    let updateData = {};
    
    if (item_type.startsWith('RTX')) {
      // Handle GPU purchase
      const { data: userData, error: equipmentError } = await supabase
        .from('users')
        .select('mining_equipment')
        .eq('user_id', user_id)
        .single();
        
      if (equipmentError) {
        console.error('Error fetching user equipment:', equipmentError);
        return NextResponse.json({ 
          error: 'Failed to fetch user equipment' 
        }, { status: 500 });
      }
      
      // Initialize or update mining equipment
      const equipment = userData.mining_equipment || {};
      equipment[item_type] = (equipment[item_type] || 0) + 1;
      
      // Update mining rate based on new equipment
      const miningRateIncrease = getMiningRateForGPU(item_type);
      
      updateData = {
        mining_equipment: equipment,
        mining_rate: supabase.rpc('increment_mining_rate', { 
          user_id, 
          increment: miningRateIncrease 
        })
      };
    } else if (item_type === 'stamina') {
      // Handle stamina purchase
      updateData = {
        spin_energy: supabase.rpc('increment_spin_energy', { 
          user_id, 
          increment: 100 // Add 100 spin energy
        })
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

    return NextResponse.json({ 
      success: true,
      message: 'Payment processed successfully' 
    });

  } catch (error) {
    console.error('Payment processing error:', error);
    return NextResponse.json({ 
      error: 'Failed to process payment' 
    }, { status: 500 });
  }
}

// Helper function to get mining rate increase for different GPUs
function getMiningRateForGPU(gpuType: string): number {
  switch (gpuType) {
    case 'RTX4070':
      return 0.5;
    case 'RTX4090':
      return 1.0;
    case 'RTX5070':
      return 1.5;
    case 'RTX5090':
      return 2.0;
    default:
      return 0.1;
  }
} 
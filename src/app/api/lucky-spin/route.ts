import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const SPIN_COST = 1000; // Energy cost for spinning
const INITIAL_SPIN_ENERGY = 1200; // Changed from 2000 to 1200
const RESET_INTERVAL = 12 * 60 * 60 * 1000; // Changed from 4 hours to 12 hours
const REGEN_RATE = Math.floor(INITIAL_SPIN_ENERGY / 12); // Stamina points per hour

const PRIZES = [
  { type: 'solana', amount: 1, weight: 1 },      // 0.01%
  { type: 'solana', amount: 0.5, weight: 10 },   // 0.1%
  { type: 'solana', amount: 0.1, weight: 100 },  // 1%
  { type: 'musky', amount: 1000, weight: 4000 }, // 40%
  { type: 'musky', amount: 2000, weight: 2500 }, // 25%
  { type: 'musky', amount: 5000, weight: 1500 }, // 15%
  { type: 'musky', amount: 10000, weight: 500 }, // 5%
  { type: 'energy', amount: 500, weight: 1000 }, // 10%
  { type: 'solana', amount: 0.01, weight: 389 }  // ~3.89% (remaining)
];

// Total weight should be 10,000 for easy percentage calculations
// 1 + 10 + 100 + 4000 + 2500 + 1500 + 500 + 1000 + 389 = 10,000

function getRandomPrize() {
  const totalWeight = PRIZES.reduce((sum, prize) => sum + prize.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const prize of PRIZES) {
    if (random < prize.weight) {
      return prize;
    }
    random -= prize.weight;
  }
  return PRIZES[PRIZES.length - 1]; // Fallback to last prize
}

function calculateStamina(lastResetTime: string | null, isAdmin: boolean): number {
  if (isAdmin) return 100000; // Return high stamina for admins
  if (!lastResetTime) return INITIAL_SPIN_ENERGY;
  
  const now = Date.now();
  const lastReset = new Date(lastResetTime).getTime();
  const hoursSinceReset = (now - lastReset) / (60 * 60 * 1000);
  
  return Math.min(INITIAL_SPIN_ENERGY, Math.floor(hoursSinceReset * REGEN_RATE));
}

function shouldResetEnergy(lastResetTime: string | null): boolean {
  if (!lastResetTime) return true;
  const lastReset = new Date(lastResetTime).getTime();
  const now = Date.now();
  return now - lastReset >= RESET_INTERVAL;
}

export async function POST(request: Request) {
  try {
    const { user_id } = await request.json();

    if (!user_id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Get user data
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', user_id)
      .single();

    if (fetchError) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let currentStamina = user.spin_energy || 0;
    let lastResetTime = user.last_spin_energy_reset;

    // Check if energy should be reset
    if (shouldResetEnergy(lastResetTime) || user.is_admin) {
      currentStamina = user.is_admin ? 100000 : INITIAL_SPIN_ENERGY;
      lastResetTime = new Date().toISOString();
    } else {
      // Calculate gradual stamina regeneration
      currentStamina = calculateStamina(lastResetTime, user.is_admin);
    }

    // Check if user has enough stamina
    if (currentStamina < SPIN_COST) {
      const nextReset = lastResetTime ? 
        new Date(new Date(lastResetTime).getTime() + RESET_INTERVAL) :
        new Date(Date.now() + RESET_INTERVAL);

      return NextResponse.json({
        error: 'Insufficient stamina',
        spin_energy: currentStamina,
        next_reset: nextReset.toISOString()
      }, { status: 400 });
    }

    // Get random prize
    const prize = getRandomPrize();

    // Update user's balance and stamina
    const updates: any = {
      spin_energy: currentStamina - SPIN_COST,
      last_spin_energy_reset: lastResetTime
    };

    if (prize.type === 'musky') {
      updates.balance = user.balance + prize.amount;
    } else if (prize.type === 'solana') {
      updates.solana_balance = (user.solana_balance || 0) + prize.amount;
    } else if (prize.type === 'energy') {
      updates.spin_energy = currentStamina - SPIN_COST + prize.amount;
    }

    // Update user
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update(updates)
      .eq('user_id', user_id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Log spin history
    await supabase
      .from('spin_history')
      .insert({
        user_id,
        prize_type: prize.type,
        amount: prize.amount,
        timestamp: new Date().toISOString()
      });

    return NextResponse.json({
      success: true,
      prize: {
        type: prize.type,
        amount: prize.amount
      },
      spin_energy: updatedUser.spin_energy,
      next_reset: new Date(new Date(lastResetTime).getTime() + RESET_INTERVAL).toISOString()
    });

  } catch (error) {
    console.error('Lucky spin error:', error);
    return NextResponse.json({ error: 'Failed to process spin' }, { status: 500 });
  }
} 
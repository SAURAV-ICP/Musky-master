import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

interface MiningEquipment {
  [key: string]: number | any; // Allow any type for non-GPU properties
  expiration?: {
    [key: string]: string[];
  };
}

interface MiningRates {
  perSecond: number;
  perMinute: number;
  perHour: number;
  perDay: number;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const user_id = url.searchParams.get('user_id');

    if (!user_id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Fetch user data including mining equipment, mining rate, and solana balance
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('mining_equipment, mining_rate, solana_balance, is_admin')
      .eq('user_id', user_id)
      .single();

    if (userError) {
      console.error('Error fetching user data:', userError);
      return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 });
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Extract mining equipment or initialize empty object
    const equipment = user.mining_equipment || {} as MiningEquipment;
    
    // Count active GPUs - only count valid GPU types and ignore expiration and other properties
    let activeCount = 0;
    const validGpuTypes = ['RTX4070', 'RTX4090', 'RTX5070', 'RTX5090'];
    
    // Create a cleaned version of the equipment object for the response
    // This ensures we only return valid GPU counts
    const cleanedEquipment: {[key: string]: number} = {};
    
    // For admin users, ensure they have 2 of each GPU type (8 total)
    const isAdmin = user.is_admin || user_id === 'admin';
    
    if (isAdmin) {
      // Admin always has 2 of each GPU type
      for (const gpuType of validGpuTypes) {
        cleanedEquipment[gpuType] = 2;
      }
      activeCount = 8; // 2 of each GPU type = 8 total
      
      // Calculate admin mining rate (sum of all GPUs at max capacity)
      // RTX4070: 0.03 SOL/day × 2 = 0.06 SOL/day
      // RTX4090: 0.08 SOL/day × 2 = 0.16 SOL/day
      // RTX5070: 0.25 SOL/day × 2 = 0.50 SOL/day
      // RTX5090: 0.50 SOL/day × 2 = 1.00 SOL/day
      // Total: 1.72 SOL/day
      const adminMiningRate = 0.06 + 0.16 + 0.50 + 1.00;
      
      // Calculate mining rates
      const miningRates: MiningRates = {
        perSecond: adminMiningRate / (24 * 60 * 60),
        perMinute: adminMiningRate / (24 * 60),
        perHour: adminMiningRate / 24,
        perDay: adminMiningRate
      };
      
      // Calculate estimated earnings
      const dailyEarnings = adminMiningRate;
      const weeklyEarnings = dailyEarnings * 7;
      const monthlyEarnings = dailyEarnings * 30;
      
      return NextResponse.json({
        gpus: cleanedEquipment,
        activeCount,
        miningRate: adminMiningRate,
        solanaBalance: user.solana_balance || 0,
        miningRates,
        earnings: {
          daily: dailyEarnings,
          weekly: weeklyEarnings,
          monthly: monthlyEarnings
        },
        lastUpdated: new Date().toISOString()
      });
    }
    
    // For regular users, process their actual equipment
    for (const [key, value] of Object.entries(equipment)) {
      // Only count if it's a valid GPU type and not the expiration object
      if (validGpuTypes.includes(key) && typeof value === 'number') {
        const count = Math.min(value as number, 2); // Max 2 per type
        activeCount += count;
        cleanedEquipment[key] = count;
      }
    }
    
    // Ensure activeCount doesn't exceed 8
    activeCount = Math.min(activeCount, 8);
    
    // Fill in missing GPU types with 0
    for (const gpuType of validGpuTypes) {
      if (cleanedEquipment[gpuType] === undefined) {
        cleanedEquipment[gpuType] = 0;
      }
    }

    // Calculate mining rates
    const miningRate = user.mining_rate || 0;
    const miningRates: MiningRates = {
      perSecond: miningRate / (24 * 60 * 60),
      perMinute: miningRate / (24 * 60),
      perHour: miningRate / 24,
      perDay: miningRate
    };

    // Calculate estimated earnings
    const dailyEarnings = miningRate;
    const weeklyEarnings = dailyEarnings * 7;
    const monthlyEarnings = dailyEarnings * 30;

    return NextResponse.json({
      gpus: cleanedEquipment,
      activeCount,
      miningRate: miningRate,
      solanaBalance: user.solana_balance || 0,
      miningRates,
      earnings: {
        daily: dailyEarnings,
        weekly: weeklyEarnings,
        monthly: monthlyEarnings
      },
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching GPU data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 
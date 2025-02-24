import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: Request,
  { params }: { params: { user_id: string } }
) {
  try {
    const user_id = params.user_id;

    // Get user's referrals from the referrals table
    const { data: referrals, error: referralsError } = await supabase
      .from('referrals')
      .select(`
        referred_id,
        created_at,
        users!referred_id (
          username,
          level,
          mining_rate
        )
      `)
      .eq('referrer_id', user_id)
      .order('created_at', { ascending: false });

    if (referralsError) {
      throw referralsError;
    }

    // Get user's total earned from referrals
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('referral_count')
      .eq('user_id', user_id)
      .single();

    if (userError) {
      throw userError;
    }

    // Format the response
    const recentReferrals = referrals.map((ref: any) => ({
      username: ref.users?.username || 'Anonymous',
      date: new Date(ref.created_at).toLocaleDateString(),
      earned: 2000, // Referral bonus amount
      level: ref.users?.level || 'basic',
      mining_rate: ref.users?.mining_rate || 1
    }));

    const referralLink = `https://t.me/MUSKY_ON_SOL_BOT?start=ref_${user_id}`;

    return NextResponse.json({
      totalReferrals: user.referral_count || 0,
      totalEarned: (user.referral_count || 0) * 2000,
      referralLink,
      recentReferrals
    });

  } catch (error) {
    console.error('Error fetching referral data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch referral data' },
      { status: 500 }
    );
  }
} 
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

interface ReferralUser {
  username: string;
  date: string;
  earned: number;
}

export async function GET(
  request: Request,
  { params }: { params: { user_id: string } }
) {
  try {
    const { user_id } = params;

    if (!user_id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Get user's referral count and other data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('referral_count')
      .eq('user_id', user_id)
      .single();

    if (userError) {
      console.error('Error fetching user data:', userError);
      return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 });
    }

    // Get referral earnings (from transactions table)
    const { data: earningsData, error: earningsError } = await supabase
      .from('transactions')
      .select('amount')
      .eq('user_id', user_id)
      .eq('type', 'referral')
      .eq('status', 'completed');

    if (earningsError) {
      console.error('Error fetching earnings data:', earningsError);
      return NextResponse.json({ error: 'Failed to fetch earnings data' }, { status: 500 });
    }

    // Calculate total earnings
    const totalEarned = earningsData?.reduce((sum, transaction) => sum + transaction.amount, 0) || 0;

    // Get recent referrals (this would be from a referrals table)
    const { data: recentReferrals, error: referralsError } = await supabase
      .from('referrals')
      .select('referred_id, created_at, amount')
      .eq('referrer_id', user_id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (referralsError) {
      console.error('Error fetching recent referrals:', referralsError);
      // Continue anyway, just won't show recent referrals
    }

    // Get usernames for recent referrals
    let formattedReferrals: ReferralUser[] = [];
    if (recentReferrals && recentReferrals.length > 0) {
      const userIds = recentReferrals.map(ref => ref.referred_id);
      
      const { data: referredUsers, error: usersError } = await supabase
        .from('users')
        .select('user_id, username')
        .in('user_id', userIds);
        
      if (!usersError && referredUsers) {
        formattedReferrals = recentReferrals.map(ref => {
          const user = referredUsers.find(u => u.user_id === ref.referred_id);
          return {
            username: user?.username || 'Unknown User',
            date: new Date(ref.created_at).toLocaleDateString(),
            earned: ref.amount || 0
          };
        });
      }
    }

    // Generate referral link
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://t.me/MuskyCoinBot';
    const referralLink = `${appUrl}?start=${user_id}`;

    return NextResponse.json({
      totalReferrals: userData?.referral_count || 0,
      totalEarned,
      referralLink,
      recentReferrals: formattedReferrals
    });

  } catch (error) {
    console.error('Error in referrals API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 
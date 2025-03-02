import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Admin ID from environment variable
const ADMIN_ID = process.env.NEXT_PUBLIC_ADMIN_ID || '7093793454';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const user_id = url.searchParams.get('user_id');

    if (!user_id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    console.log(`Debug endpoint: Fetching user data for ID: ${user_id}`);

    // Fetch user data
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', user_id)
      .single();

    if (userError) {
      console.error('Error fetching user data:', userError);
      return NextResponse.json({ 
        error: 'Failed to fetch user data',
        errorDetails: userError
      }, { status: 500 });
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user is admin
    const isAdmin = user.is_admin === true;
    const isAdminId = user.user_id === ADMIN_ID;

    // Return detailed user information for debugging
    return NextResponse.json({
      user: {
        ...user,
        // Redact sensitive information
        solana_address: user.solana_address ? '[REDACTED]' : null
      },
      adminCheck: {
        isAdmin: isAdmin,
        isAdminId: isAdminId,
        adminId: ADMIN_ID,
        userId: user.user_id
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasAdminId: !!process.env.NEXT_PUBLIC_ADMIN_ID
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in debug endpoint:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      errorDetails: String(error)
    }, { status: 500 });
  }
} 
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Admin ID from environment variable
const ADMIN_ID = process.env.NEXT_PUBLIC_ADMIN_ID || '7093793454';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { user_id, is_admin } = body;

    if (!user_id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    console.log(`Fixing admin status for user ${user_id}. Setting is_admin to ${is_admin}`);

    // Update user's admin status
    const { data, error } = await supabase
      .from('users')
      .update({
        is_admin: user_id === ADMIN_ID, // Only set admin if it matches ADMIN_ID
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user_id)
      .select()
      .single();

    if (error) {
      console.error('Error updating admin status:', error);
      return NextResponse.json({ error: 'Failed to update admin status' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Admin status updated successfully',
      user: {
        user_id: data.user_id,
        is_admin: data.is_admin
      }
    });
  } catch (error) {
    console.error('Error in fix-status endpoint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 
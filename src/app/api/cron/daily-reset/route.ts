import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (key !== process.env.CRON_SECRET_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Reset daily tasks and energy
    const { error: resetError } = await supabase
      .from('users')
      .update({
        daily_tasks_completed: 0,
        energy: 100
      })
      .neq('id', 0); // Update all users

    if (resetError) {
      console.error('Error resetting daily values:', resetError);
      return NextResponse.json({ error: resetError.message }, { status: 500 });
    }

    // Reset daily claim streaks for users who missed yesterday
    const { error: streakError } = await supabase.rpc('reset_broken_streaks');

    if (streakError) {
      console.error('Error resetting streaks:', streakError);
      return NextResponse.json({ error: streakError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in daily reset cron:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 
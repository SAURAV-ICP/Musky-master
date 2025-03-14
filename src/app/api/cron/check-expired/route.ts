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

    // Check and update expired mining equipment
    const { error: equipmentError } = await supabase
      .from('mining_equipment')
      .update({ is_active: false })
      .lt('expires_at', new Date().toISOString())
      .eq('is_active', true);

    if (equipmentError) {
      console.error('Error updating expired equipment:', equipmentError);
      return NextResponse.json({ error: equipmentError.message }, { status: 500 });
    }

    // Check and update expired boosts
    const { error: boostError } = await supabase
      .from('user_boosts')
      .update({ is_active: false })
      .lt('expires_at', new Date().toISOString())
      .eq('is_active', true);

    if (boostError) {
      console.error('Error updating expired boosts:', boostError);
      return NextResponse.json({ error: boostError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in expiry check cron:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 
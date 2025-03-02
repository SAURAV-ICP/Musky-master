import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    // Get the most recent active broadcast message
    const { data, error } = await supabase
      .from('broadcast_messages')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error fetching broadcast message:', error);
      return NextResponse.json({ error: 'Failed to fetch broadcast message' }, { status: 500 });
    }

    // If no active broadcast message found
    if (!data || data.length === 0) {
      // Check for app_broadcasts as fallback
      const { data: appBroadcasts, error: appError } = await supabase
        .from('app_broadcasts')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false })
        .limit(1);
        
      if (appError) {
        console.error('Error fetching app broadcasts:', appError);
        return NextResponse.json({ message: null });
      }
      
      if (appBroadcasts && appBroadcasts.length > 0) {
        // Convert app_broadcast to broadcast_message format
        return NextResponse.json({
          message: {
            id: appBroadcasts[0].id,
            title: 'MUSKY Announcement',
            content: appBroadcasts[0].message || 'Check out the latest MUSKY features!',
            type: 'info',
            active: true,
            created_at: appBroadcasts[0].created_at,
            expires_at: null,
            button_text: appBroadcasts[0].button_text,
            button_url: appBroadcasts[0].button_url
          }
        });
      }
      
      return NextResponse.json({ message: null });
    }

    return NextResponse.json({ message: data[0] });
  } catch (error) {
    console.error('Error in broadcast/active route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 
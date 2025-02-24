import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

interface Task {
  id: string;
  type: 'telegram' | 'youtube' | 'twitter';
  title: string;
  description: string;
  link: string;
  clicks_wanted: number;
  clicks_received: number;
  payment_amount: number;
  payment_type: 'stars' | 'ton';
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  user_id?: string;
  username: string;
  button_text?: string;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');
    const action = searchParams.get('action');

    if (!user_id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    if (action === 'metrics') {
      // Fetch metrics for user's ad campaigns (tasks they created)
      let query = supabase
        .from('task_submissions')
        .select(`
          id,
          title,
          clicks_wanted,
          clicks_received,
          payment_amount,
          payment_type,
          status,
          created_at
        `)
        .eq('user_id', user_id)
        .order('created_at', { ascending: false });

      const { data: userTasks, error } = await query;

      if (error) {
        throw error;
      }

      return NextResponse.json({
        tasks: userTasks.map((task: any) => ({
          id: task.id,
          title: task.title,
          clicks_wanted: task.clicks_wanted,
          clicks_received: task.clicks_received,
          payment_amount: task.payment_amount,
          payment_type: task.payment_type,
          status: task.status,
          created_at: task.created_at,
        })),
      });
    } else {
      // Fetch all approved tasks for the marketplace (similar to TasksPage)
      let query = supabase
        .from('task_submissions')
        .select(`
          *,
          users (
            username
          )
        `)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      const { data: tasks, error } = await query;

      if (error) {
        throw error;
      }

      return NextResponse.json({
        tasks: tasks.map((task: any) => ({
          id: task.id,
          type: task.type || 'telegram',
          title: task.title,
          description: task.description,
          link: task.link || '#',
          clicks_wanted: task.clicks_wanted || 0,
          clicks_received: task.clicks_received || 0,
          payment_amount: task.payment_amount || 0,
          payment_type: task.payment_type || 'stars',
          status: task.status,
          created_at: task.created_at,
          user_id: task.user_id,
          button_text: task.button_text,
          username: task.users?.username || 'Anonymous',
        })),
      });
    }
  } catch (error) {
    console.error('Error fetching marketplace tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch marketplace tasks' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { user_id, title, description, link, clicks_wanted, payment_type } = await request.json();

    // Validate input
    if (!user_id || !title || !description || !link || !clicks_wanted || !payment_type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate clicks range (1,000 to 1,000,000)
    if (clicks_wanted < 1000 || clicks_wanted > 1000000) {
      return NextResponse.json({ error: 'Clicks must be between 1,000 and 1,000,000' }, { status: 400 });
    }

    // Calculate cost (1 click = 2 stars, 500 stars = 1 TON)
    const starsCost = clicks_wanted * 2; // Minimum 2,000 stars for 1,000 clicks
    const tonCost = starsCost / 500; // 4 TON for 1,000 clicks, up to 4,000 TON for 1,000,000 clicks

    const paymentAmount = payment_type === 'stars' ? starsCost : tonCost;

    // Get user's balance
    const { data: user, error: userError } = await supabase
      .from('users')
      .select(payment_type === 'stars' ? 'stars_balance' : 'ton_balance')
      .eq('user_id', user_id)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has enough balance
    const userBalance = payment_type === 'stars' 
      ? (user as { stars_balance: number }).stars_balance 
      : (user as { ton_balance: number }).ton_balance;
    if (userBalance < paymentAmount) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });
    }

    // Create task submission with pending status for admin review
    const { data: task, error: taskError } = await supabase
      .from('task_submissions')
      .insert({
        user_id,
        type: 'telegram', // Default or dynamically set based on link if needed
        title,
        description,
        link,
        clicks_wanted,
        clicks_received: 0,
        payment_amount: paymentAmount,
        payment_type,
        status: 'pending', // Task goes to admin for review
        created_at: new Date().toISOString(),
        button_text: 'Join', // Default button text, can be customized
      })
      .select()
      .single();

    if (taskError) {
      throw taskError;
    }

    // Deduct payment from user's balance
    const { error: updateError } = await supabase
      .from('users')
      .update({
        [payment_type === 'stars' ? 'stars_balance' : 'ton_balance']: 
          userBalance - paymentAmount
      })
      .eq('user_id', user_id);

    if (updateError) {
      throw updateError;
    }

    // Broadcast real-time update for admin review
    await supabase.realtime
      .channel('task_changes')
      .send({
        type: 'broadcast',
        event: 'task_created',
        payload: { task },
      });

    return NextResponse.json({
      success: true,
      task_id: task.id,
      status: 'pending'
    });

  } catch (error) {
    console.error('Marketplace task submission error:', error);
    return NextResponse.json(
      { error: 'Failed to submit marketplace task' },
      { status: 500 }
    );
  }
}
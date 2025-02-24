import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

interface Task {
  id: string;
  type: 'telegram' | 'youtube' | 'twitter';
  title: string;
  description: string;
  link: string;
  payment_amount: number;
  status: 'pending' | 'approved' | 'rejected';
  clicks_wanted: number;
  clicks_received: number;
  payment_type: 'stars' | 'ton';
  created_at: string;
  user_id?: string;
  username: string;
  button_text?: string;
}

// Initial Telegram tasks
const INITIAL_TASKS = [
  {
    type: 'telegram',
    title: 'Join BoomBets Official',
    description: 'Join our partner channel BoomBets Official for latest updates',
    link: 'https://t.me/boombetsofficial',
    payment_amount: 2000,
    status: 'approved',
    clicks_wanted: 10000,
    clicks_received: 0,
    payment_type: 'stars',
    button_text: 'Join Channel'
  },
  {
    type: 'telegram',
    title: 'Join Musky Group Chat',
    description: 'Join the official Musky community chat',
    link: 'https://t.me/musky_groupchat',
    payment_amount: 2000,
    status: 'approved',
    clicks_wanted: 10000,
    clicks_received: 0,
    payment_type: 'stars',
    button_text: 'Join Group'
  },
  {
    type: 'telegram',
    title: 'Join Musky on Solana',
    description: 'Join the official Musky on Solana channel',
    link: 'https://t.me/musky_on_solana',
    payment_amount: 2000,
    status: 'approved',
    clicks_wanted: 10000,
    clicks_received: 0,
    payment_type: 'stars',
    button_text: 'Join Channel'
  }
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'approved';
    const user_id = searchParams.get('user_id');

    // First, check if we need to add initial tasks
    const { data: existingTasks } = await supabase
      .from('task_submissions')
      .select('*')
      .limit(1);

    if (!existingTasks || existingTasks.length === 0) {
      // Add initial tasks
      await supabase
        .from('task_submissions')
        .insert(INITIAL_TASKS.map(task => ({
          ...task,
          created_at: new Date().toISOString()
        })));
    }

    let query = supabase
      .from('task_submissions')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (user_id) {
      query = query.eq('user_id', user_id);
    }

    const { data: tasks, error } = await query;

    if (error) throw error;

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error('GET tasks error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { task_id, user_id } = await request.json();

    if (!task_id || !user_id) {
      return NextResponse.json({ error: 'Task ID and User ID are required' }, { status: 400 });
    }

    // Check if user has already completed this task
    const { data: existingClick } = await supabase
      .from('task_clicks')
      .select('*')
      .eq('task_id', task_id)
      .eq('user_id', user_id)
      .single();

    if (existingClick) {
      return NextResponse.json({ error: 'Task already completed' }, { status: 400 });
    }

    // Fetch the task
    const { data: task, error: taskError } = await supabase
      .from('task_submissions')
      .select('*')
      .eq('id', task_id)
      .eq('status', 'approved')
      .single();

    if (taskError || !task) {
      return NextResponse.json({ error: 'Task not found or not approved' }, { status: 404 });
    }

    // Record the click immediately
    const { error: clickError } = await supabase
      .from('task_clicks')
      .insert({
        task_id,
        user_id
      });

    if (clickError) {
      throw clickError;
    }

    // Update task clicks count
    await supabase
      .from('task_submissions')
      .update({ clicks_received: (task.clicks_received || 0) + 1 })
      .eq('id', task_id);

    // Wait 10 seconds before updating user's balance
    setTimeout(async () => {
      try {
        // Get current user balance first
        const { data: currentUser, error: fetchError } = await supabase
          .from('users')
          .select('balance')
          .eq('user_id', user_id)
          .single();

        if (fetchError) throw fetchError;

        // Update user's balance by adding the reward
        const { data: updatedUser, error: updateError } = await supabase
          .from('users')
          .update({ 
            balance: (currentUser?.balance || 0) + task.payment_amount
          })
          .eq('user_id', user_id)
          .select()
          .single();

        if (updateError) throw updateError;

        // Send real-time notification
        await supabase.channel('task_completion').send({
          type: 'broadcast',
          event: 'task_completed',
          payload: {
            type: 'success',
            message: 'Task completed successfully!',
            amount: task.payment_amount
          }
        });
      } catch (error) {
        console.error('Error in delayed balance update:', error);
      }
    }, 10000);

    return NextResponse.json({ 
      success: true,
      message: 'Task completion recorded',
      reward: task.payment_amount
    });

  } catch (error) {
    console.error('POST tasks error:', error);
    return NextResponse.json({ error: 'Failed to complete task' }, { status: 500 });
  }
}
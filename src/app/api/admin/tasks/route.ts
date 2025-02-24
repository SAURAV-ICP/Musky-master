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
  status?: 'pending' | 'approved' | 'rejected';
  created_at: string;
  user_id?: string;
  button_text?: string;
  active: boolean;
  payment_amount_locked?: number; // For user-submitted tasks with locked Musky reward
}

// Helper function to verify admin status
async function verifyAdmin(userId: string) {
  const { data: user, error } = await supabase
    .from('users')
    .select('is_admin')
    .eq('user_id', userId)
    .single();

  if (error || !user?.is_admin) {
    console.log('Admin verification failed for userId:', userId, 'Error:', error);
    return false;
  }
  return true;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status') || 'all';

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const isAdmin = await verifyAdmin(userId);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    let query = supabase
      .from('task_submissions')
      .select(`
        *,
        users (
          username
        )
      `)
      .order('created_at', { ascending: false });

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: tasks, error } = await query;

    if (error) {
      console.error('Error fetching tasks:', error);
      return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
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
        active: task.status === 'approved',
        payment_amount_locked: task.payment_amount_locked || 0, // For user-submitted tasks
        username: task.users?.username || 'Anonymous',
      })),
    });
  } catch (error) {
    console.error('GET tasks error:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const body = await request.json();
    console.log('Received task creation request with body:', body);

    const { type, title, description, link, clicks_wanted, payment_amount, payment_type, active, button_text, user_id: taskUserId, payment_amount_locked } = body;

    // Determine if this is an admin or user submission
    const isAdmin = await verifyAdmin(userId);
    let status: 'pending' | 'approved' | 'rejected' = 'pending';
    let finalPaymentAmount = payment_amount || 0;
    let finalPaymentAmountLocked = payment_amount_locked || 0;

    if (isAdmin) {
      // Admin tasks (no payment required, immediate approval if active)
      if (!type || !['telegram', 'youtube', 'twitter'].includes(type)) {
        return NextResponse.json({ error: 'Invalid or missing task type' }, { status: 400 });
      }
      if (!title || !description || !link || !payment_amount) {
        return NextResponse.json({ 
          error: 'Missing required fields: title, description, link, and reward are required' 
        }, { status: 400 });
      }
      status = active ? 'approved' : 'pending';
    } else {
      // User submission (non-admin, pay with Stars or TON for ad campaign)
      if (!taskUserId || taskUserId !== userId) {
        return NextResponse.json({ error: 'Unauthorized user submission' }, { status: 403 });
      }
      if (!type || !['telegram', 'youtube', 'twitter'].includes(type) || !title || !description || !link || !clicks_wanted || !payment_type) {
        return NextResponse.json({ error: 'Missing required fields for user task submission' }, { status: 400 });
      }
      if (clicks_wanted < 1000 || clicks_wanted > 1000000) {
        return NextResponse.json({ error: 'Clicks must be between 1,000 and 1,000,000' }, { status: 400 });
      }

      // Calculate cost (locked reward of 2,000 Musky)
      const starsCost = clicks_wanted * 2; // 1 click = 2 Stars, min 2,000 Stars
      const tonCost = starsCost / 500; // 500 Stars = 1 TON, min 4 TON
      finalPaymentAmount = payment_type === 'stars' ? starsCost : tonCost;
      finalPaymentAmountLocked = 2000; // Locked Musky reward for user

      // Verify user's balance
      const balanceKey = payment_type === 'stars' ? 'stars_balance' : 'ton_balance';
      const { data: userBalance, error: balanceError } = await supabase
        .from('users')
        .select(balanceKey)
        .eq('user_id', userId)
        .single();

      if (balanceError || !userBalance) {
        return NextResponse.json({ error: 'User balance not found' }, { status: 404 });
      }

      const userBalanceValue = (userBalance as any)[balanceKey];
      if (userBalanceValue < finalPaymentAmount) {
        return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });
      }

      // Deduct payment from user's balance
      const { error: updateError } = await supabase
        .from('users')
        .update({
          [balanceKey]: userBalanceValue - finalPaymentAmount
        })
        .eq('user_id', userId);

      if (updateError) {
        throw updateError;
      }
    }

    const { data: task, error: createError } = await supabase
      .from('task_submissions')
      .insert({
        type,
        title,
        description,
        link,
        clicks_wanted: clicks_wanted || 0,
        clicks_received: 0,
        payment_amount: finalPaymentAmount,
        payment_type: payment_type || 'stars',
        status,
        user_id: taskUserId || userId,
        button_text,
        created_at: new Date().toISOString(),
        payment_amount_locked: finalPaymentAmountLocked, // Store locked Musky reward
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating task:', createError);
      return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
    }

    // Broadcast real-time update using send
    await supabase.realtime
      .channel('task_changes')
      .send({
        type: 'broadcast',
        event: 'task_created',
        payload: { task },
      });

    return NextResponse.json({
      success: true,
      task: {
        id: task.id,
        type: task.type,
        title: task.title,
        description: task.description,
        link: task.link,
        clicks_wanted: task.clicks_wanted,
        clicks_received: task.clicks_received,
        payment_amount: task.payment_amount,
        payment_type: task.payment_type,
        status: task.status,
        created_at: task.created_at,
        user_id: task.user_id,
        button_text: task.button_text,
        active: task.status === 'approved',
        payment_amount_locked: task.payment_amount_locked,
      },
    });
  } catch (error) {
    console.error('POST tasks error:', error);
    return NextResponse.json({ error: 'Failed to process task request' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const taskId = params.id;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!taskId || !userId) {
      return NextResponse.json({ error: 'Task ID and User ID are required' }, { status: 400 });
    }

    const isAdmin = await verifyAdmin(userId);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { type, title, description, link, clicks_wanted, payment_amount, payment_type, active, button_text, status, payment_amount_locked } = body;

    const updates: Partial<Task> = {};
    if (type) updates.type = type;
    if (title) updates.title = title;
    if (description) updates.description = description;
    if (link) updates.link = link;
    if (clicks_wanted !== undefined) updates.clicks_wanted = clicks_wanted;
    if (payment_amount !== undefined) updates.payment_amount = payment_amount;
    if (payment_type) updates.payment_type = payment_type;
    if (active !== undefined) updates.status = active ? 'approved' : 'pending';
    if (button_text) updates.button_text = button_text;
    if (status) updates.status = status;
    if (payment_amount_locked !== undefined) updates.payment_amount_locked = payment_amount_locked;

    const { data: updatedTask, error: updateError } = await supabase
      .from('task_submissions')
      .update(updates)
      .eq('id', taskId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating task:', updateError);
      return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
    }

    // Broadcast real-time update using send
    await supabase.realtime
      .channel('task_changes')
      .send({
        type: 'broadcast',
        event: 'task_updated',
        payload: { task: updatedTask },
      });

    return NextResponse.json({
      success: true,
      task: updatedTask,
    });
  } catch (error) {
    console.error('PATCH tasks error:', error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const taskId = params.id;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!taskId || !userId) {
      return NextResponse.json({ error: 'Task ID and User ID are required' }, { status: 400 });
    }

    const isAdmin = await verifyAdmin(userId);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check if the task exists
    const { data: task, error: fetchError } = await supabase
      .from('task_submissions')
      .select('user_id')
      .eq('id', taskId)
      .single();

    if (fetchError) {
      console.error('Error fetching task for deletion:', fetchError);
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Delete the task
    const { error } = await supabase
      .from('task_submissions')
      .delete()
      .eq('id', taskId);

    if (error) {
      console.error('Error deleting task:', error);
      return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
    }

    // Broadcast real-time update using send
    await supabase.realtime
      .channel('task_changes')
      .send({
        type: 'broadcast',
        event: 'task_deleted',
        payload: { taskId },
      });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE tasks error:', error);
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}
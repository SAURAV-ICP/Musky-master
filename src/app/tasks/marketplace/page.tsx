'use client';

import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { useUser } from '@/contexts/UserContext';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
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

export default function MarketplacePage() {
  const { user, loading } = useUser();
  const router = useRouter();
  const [newTask, setNewTask] = useState<Partial<Task>>({
    type: 'telegram',
    title: '',
    description: '',
    link: '',
    clicks_wanted: 1000, // Minimum 1,000 clicks
    payment_type: 'stars',
  });
  const [userTasks, setUserTasks] = useState<Task[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login'); // Redirect to login if not authenticated
      return;
    }
    if (user.user_id) {
      fetchUserTasks();
    }
  }, [user, router]);

  const fetchUserTasks = async () => {
    try {
      const response = await fetch(`/api/admin/tasks?userId=${user?.user_id}`);
      if (response.ok) {
        const data = await response.json();
        setUserTasks(data.tasks.filter((task: Task) => task.user_id === user?.user_id && task.status !== 'approved') || []);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to fetch user tasks');
      }
    } catch (error) {
      console.error('Error fetching user tasks:', error);
      toast.error('Failed to fetch user tasks');
    }
  };

  const handleSubmitTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.user_id) {
      toast.error('Please log in to submit a task');
      return;
    }

    setIsSubmitting(true);

    try {
      // Validate inputs
      if (!newTask.type || !['telegram', 'youtube', 'twitter'].includes(newTask.type)) {
        toast.error('Invalid or missing task type');
        setIsSubmitting(false);
        return;
      }
      if (!newTask.title || !newTask.description || !newTask.link || !newTask.clicks_wanted) {
        toast.error('Missing required fields: title, description, link, and clicks wanted are required');
        setIsSubmitting(false);
        return;
      }
      if (newTask.clicks_wanted < 1000 || newTask.clicks_wanted > 1000000) {
        toast.error('Clicks must be between 1,000 and 1,000,000');
        setIsSubmitting(false);
        return;
      }

      // Calculate cost (locked reward of 2,000 Musky)
      const starsCost = newTask.clicks_wanted * 2; // 1 click = 2 Stars, min 2,000 Stars
      const tonCost = starsCost / 500; // 500 Stars = 1 TON, min 4 TON
      const paymentAmount = newTask.payment_type === 'stars' ? starsCost : tonCost;

      // Get user's balance
      const balanceKey = newTask.payment_type === 'stars' ? 'stars_balance' : 'ton_balance';
      const { data: userBalance, error: balanceError } = await supabase
        .from('users')
        .select(balanceKey)
        .eq('user_id', user.user_id)
        .single();

      if (balanceError || !userBalance) {
        toast.error('User balance not found');
        setIsSubmitting(false);
        return;
      }

      const userBalanceValue = (userBalance as any)[balanceKey];
      if (userBalanceValue < paymentAmount) {
        toast.error('Insufficient balance');
        setIsSubmitting(false);
        return;
      }

      // Submit task to admin for review with locked reward of 2,000 Musky
      const response = await fetch('/api/admin/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newTask,
          user_id: user.user_id,
          payment_amount: paymentAmount,
          payment_type: newTask.payment_type,
          status: 'pending', // Tasks from users go to admin for review
          payment_amount_locked: 2000, // Locked Musky reward for user
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        toast.error(error.error || 'Failed to submit task');
        setIsSubmitting(false);
        return;
      }

      const data = await response.json();
      if (data.success) {
        toast.success('Task submitted for review successfully');
        setNewTask({
          type: 'telegram',
          title: '',
          description: '',
          link: '',
          clicks_wanted: 1000,
          payment_type: 'stars',
        });
        fetchUserTasks(); // Refresh user tasks
      } else {
        toast.error(data.error || 'Failed to submit task');
      }
    } catch (error) {
      console.error('Error submitting task:', error);
      toast.error('Failed to submit task');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setNewTask({ ...newTask, payment_type: e.target.value as 'stars' | 'ton' });
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setNewTask({ ...newTask, type: e.target.value as Task['type'] });
  };

  const getButtonText = (type: Task['type'] | undefined): string => {
    switch (type?.toLowerCase()) {
      case 'telegram':
        return 'Join';
      case 'youtube':
        return 'Watch';
      case 'twitter':
        return 'Follow';
      default:
        return 'Complete';
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto px-4 flex items-center justify-center min-h-[400px]">
          <p className="text-white/60">Loading...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-white mb-6">Ad Marketplace</h1>

        {/* Task Creation Form for User Ads */}
        <div className="mb-8 p-6 bg-primary/20 backdrop-blur-lg rounded-xl border border-white/10">
          <h2 className="text-lg font-semibold text-white mb-4">Create Your Ad Campaign</h2>
          <form onSubmit={handleSubmitTask} className="space-y-4">
            <div>
              <label className="block text-sm text-white/60 mb-1">Task Type</label>
              <select
                value={newTask.type || 'telegram'}
                onChange={handleTypeChange}
                className="w-full px-4 py-2 rounded-lg bg-black/20 border border-white/10 text-white"
              >
                <option value="telegram">Telegram</option>
                <option value="youtube">YouTube</option>
                <option value="twitter">Twitter</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1">Title</label>
              <input
                type="text"
                value={newTask.title || ''}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-black/20 border border-white/10"
                placeholder="Ad title"
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1">Description</label>
              <textarea
                value={newTask.description || ''}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-black/20 border border-white/10 h-24"
                placeholder="Ad description"
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1">Link</label>
              <input
                type="text"
                value={newTask.link || ''}
                onChange={(e) => setNewTask({ ...newTask, link: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-black/20 border border-white/10"
                placeholder="Enter ad link"
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1">Clicks Wanted (1,000–1,000,000)</label>
              <input
                type="number"
                value={newTask.clicks_wanted || 1000}
                onChange={(e) => setNewTask({ ...newTask, clicks_wanted: parseInt(e.target.value) || 1000 })}
                className="w-full px-4 py-2 rounded-lg bg-black/20 border border-white/10"
                min="1000"
                max="1000000"
                placeholder="Number of clicks (min 1,000)"
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1">Payment Type</label>
              <select
                value={newTask.payment_type || 'stars'}
                onChange={handlePaymentTypeChange}
                className="w-full px-4 py-2 rounded-lg bg-black/20 border border-white/10 text-white"
              >
                <option value="stars">Stars (2 Stars per click, min 2,000)</option>
                <option value="ton">TON (4 TON minimum, 1 TON = 500 Stars)</option>
              </select>
            </div>
            <motion.button
              type="submit"
              className="w-full py-3 bg-accent rounded-lg font-bold text-white"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Ad Campaign'}
            </motion.button>
          </form>
        </div>

        {/* User Task Metrics (Ad Campaigns) */}
        {userTasks.length > 0 && (
          <div className="p-6 bg-primary/20 backdrop-blur-lg rounded-xl border border-white/10">
            <h2 className="text-lg font-semibold text-white mb-4">Your Ad Campaigns</h2>
            <motion.div
              variants={{
                hidden: { opacity: 0 },
                show: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.1
                  }
                }
              }}
              initial="hidden"
              animate="show" 
              className="space-y-4"
            >
              {userTasks.map((task) => (
                <motion.div
                  key={task.id}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    show: { opacity: 1, y: 0 }
                  }}
                  className="bg-primary/10 rounded-xl p-4 border border-white/5"
                >
                  <h3 className="font-semibold text-white">{task.title}</h3>
                  <p className="text-sm text-white/60">{task.description}</p>
                  <div className="mt-2 space-y-1">
                    <p className="text-xs text-white/80">Status: {task.status}</p>
                    <p className="text-xs text-white/80">Clicks Wanted: {task.clicks_wanted}</p>
                    <p className="text-xs text-white/80">Clicks Received: {task.clicks_received}</p>
                    <p className="text-xs text-accent">Reward: +2,000 Musky (Locked)</p>
                  </div>
                  <a
                    href={task.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block px-4 py-1 bg-accent rounded-full text-sm text-white hover:bg-accent/80"
                  >
                    {getButtonText(task.type)}
                  </a>
                </motion.div>
              ))}
            </motion.div>
          </div>
        )}
      </div>
    </Layout>
  );
}
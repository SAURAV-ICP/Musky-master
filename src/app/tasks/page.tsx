'use client';

import React, { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '@/contexts/UserContext';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import TaskNotification from '@/components/common/TaskNotification';
import Image from 'next/image';

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

interface Notification {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
  amount?: number;
  timestamp: number;
}

export default function TasksPage() {
  const { user } = useUser();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completedTasks, setCompletedTasks] = useState<Task[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [processingTasks, setProcessingTasks] = useState<{ [key: string]: boolean }>({});
  const [activeTab, setActiveTab] = useState<'available' | 'completed'>('available');
  const router = useRouter();

  useEffect(() => {
    if (user) {
      fetchTasks();
      fetchCompletedTasks();
    }
  }, [user]);

  useEffect(() => {
    // Subscribe to task completion notifications
    const channel = supabase.channel('task_notifications')
      .on('broadcast', { event: 'task_completed' }, (payload) => {
        const { type, message, amount } = payload.payload;
        const notificationId = Date.now();
        
        setNotifications(prev => [...prev, {
          id: notificationId.toString(),
          type,
          message,
          amount,
          timestamp: notificationId
        }]);

        // Remove notification after 5 seconds
        setTimeout(() => {
          setNotifications(prev => prev.filter(n => n.id !== notificationId.toString()));
        }, 5000);

        // Refresh tasks lists
        fetchTasks();
        fetchCompletedTasks();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchTasks = async () => {
    if (!user) return;
    
    try {
      // Get completed task IDs first
      const { data: clicks } = await supabase
        .from('task_clicks')
        .select('task_id')
        .eq('user_id', user.user_id);

      const completedTaskIds = clicks?.map(click => click.task_id) || [];

      // Fetch available tasks (not completed by user)
      const { data: tasks, error } = await supabase
        .from('task_submissions')
        .select('*')
        .eq('status', 'approved')
        .eq('active', true) // Only get active tasks
        .order('created_at', { ascending: false }) // Show newest first
        .then(result => {
          if (result.error) throw result.error;
          // Filter out completed tasks
          return {
            data: result.data?.filter(task => !completedTaskIds.includes(task.id)) || [],
            error: null
          };
        });

      if (error) throw error;
      setTasks(tasks || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Failed to fetch tasks');
    }
  };

  const fetchCompletedTasks = async () => {
    if (!user) return;

    try {
      const { data: clicks } = await supabase
        .from('task_clicks')
        .select('task_id')
        .eq('user_id', user.user_id);

      if (!clicks?.length) {
        setCompletedTasks([]);
        return;
      }

      const taskIds = clicks.map(click => click.task_id);
      const { data: completedTasks, error } = await supabase
        .from('task_submissions')
        .select('*')
        .in('id', taskIds)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCompletedTasks(completedTasks || []);
    } catch (error) {
      console.error('Error fetching completed tasks:', error);
      toast.error('Failed to fetch completed tasks');
    }
  };

  const getCompletedTaskIds = () => {
    return completedTasks.map(task => task.id).join(',') || '0';
  };

  const handleCompleteTask = async (task: Task) => {
    if (!user) return;
    
    try {
      // Set processing state
      setProcessingTasks(prev => ({ ...prev, [task.id]: true }));

      // Open link in new tab
      window.open(task.link, '_blank');

      // Wait 10 seconds before completing the task
      setTimeout(async () => {
        try {
          // Record the task click
          const { error: clickError } = await supabase
            .from('task_clicks')
            .insert({
              task_id: task.id,
              user_id: user.user_id
            });

          if (clickError) throw clickError;

          // Update user's balance
          const { data: currentUser, error: fetchError } = await supabase
            .from('users')
            .select('balance')
            .eq('user_id', user.user_id)
            .single();

          if (fetchError) throw fetchError;

          const { error: updateError } = await supabase
            .from('users')
            .update({
              balance: (currentUser?.balance || 0) + task.payment_amount
            })
            .eq('user_id', user.user_id);

          if (updateError) throw updateError;

          // Add success notification
          addNotification({
            id: Date.now().toString(),
            type: 'success',
            message: 'Task completed successfully!',
            amount: task.payment_amount,
            timestamp: Date.now()
          });

          // Refresh tasks
          fetchTasks();
          fetchCompletedTasks();
        } catch (error) {
          console.error('Error completing task:', error);
          addNotification({
            id: Date.now().toString(),
            type: 'error',
            message: 'Failed to complete task',
            timestamp: Date.now()
          });
        } finally {
          setProcessingTasks(prev => ({ ...prev, [task.id]: false }));
        }
      }, 10000); // 10 seconds delay
    } catch (error) {
      console.error('Error handling task:', error);
      setProcessingTasks(prev => ({ ...prev, [task.id]: false }));
    }
  };

  const addNotification = (notification: Notification) => {
    setNotifications(prev => [notification, ...prev]);
    setTimeout(() => dismissNotification(notification.id), 5000);
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getTaskIcon = (type: Task['type']): string => {
    switch (type) {
      case 'telegram':
        return '/images/telegram.png';
      case 'youtube':
        return '/images/youtube.png';
      case 'twitter':
        return '/images/twitter.png';
      default:
        return '/images/link.png';
    }
  };

  const getButtonText = (type: Task['type']): string => {
    switch (type) {
      case 'telegram':
        return 'Join';
      case 'youtube':
        return 'Subscribe';
      case 'twitter':
        return 'Follow';
      default:
        return 'Complete';
    }
  };

  if (!user) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto px-4 flex items-center justify-center min-h-[400px]">
          <p className="text-white/60">Please log in to view tasks</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <TaskNotification
        notifications={notifications}
        onDismiss={dismissNotification}
      />

      <div className="max-w-4xl mx-auto">
        <div className="flex justify-end mb-6">
          <div className="flex space-x-4">
            <button
              onClick={() => setActiveTab('available')}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'available'
                  ? 'bg-accent text-white shadow-lg shadow-accent/20'
                  : 'bg-primary/20 text-white/60 hover:bg-primary/30'
              }`}
            >
              Available Tasks
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'completed'
                  ? 'bg-accent text-white shadow-lg shadow-accent/20'
                  : 'bg-primary/20 text-white/60 hover:bg-primary/30'
              }`}
            >
              Completed Tasks
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {activeTab === 'available' ? (
            tasks.length > 0 ? (
              tasks.map((task) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-primary/20 backdrop-blur-lg rounded-xl p-6 border border-white/10"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <Image 
                          src={getTaskIcon(task.type)}
                          alt={task.type}
                          width={24}
                          height={24}
                          className="w-6 h-6"
                        />
                        <h3 className="text-xl font-semibold">{task.title}</h3>
                      </div>
                      <p className="mt-2 text-white/60">{task.description}</p>
                      <div className="mt-2">
                        <span className="text-accent text-lg font-semibold">+{task.payment_amount} MUSKY</span>
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`px-6 py-2 rounded-lg font-semibold ${
                        processingTasks[task.id]
                          ? 'bg-primary/50 cursor-wait'
                          : 'bg-accent hover:bg-accent/80'
                      }`}
                      onClick={() => !processingTasks[task.id] && handleCompleteTask(task)}
                      disabled={processingTasks[task.id]}
                    >
                      {processingTasks[task.id] ? (
                        <div className="flex items-center space-x-2">
                          <motion.div
                            className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          />
                          <span>Processing...</span>
                        </div>
                      ) : (
                        getButtonText(task.type)
                      )}
                    </motion.button>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-12 text-white/60">
                <p className="text-6xl mb-4">🎯</p>
                <p className="text-xl">No tasks available right now</p>
                <p className="mt-2">Check back later for new tasks!</p>
              </div>
            )
          ) : (
            completedTasks.length > 0 ? (
              completedTasks.map((task) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-primary/10 backdrop-blur-lg rounded-xl p-6 border border-white/5"
                >
                  <div className="flex items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <Image 
                          src={getTaskIcon(task.type)}
                          alt={task.type}
                          width={24}
                          height={24}
                          className="w-6 h-6"
                        />
                        <h3 className="text-xl font-semibold text-white/60">{task.title}</h3>
                      </div>
                      <p className="mt-2 text-white/40">{task.description}</p>
                      <div className="mt-2">
                        <span className="text-green-400 text-lg font-semibold">+{task.payment_amount} MUSKY</span>
                      </div>
                    </div>
                    <div className="px-4 py-1 rounded-full bg-green-500/20 text-green-400 text-sm font-medium">
                      Completed
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center py-12 text-white/60">
                <p className="text-6xl mb-4">📝</p>
                <p className="text-xl">No completed tasks yet</p>
                <p className="mt-2">Complete some tasks to earn rewards!</p>
              </div>
            )
          )}
        </div>

        {activeTab === 'available' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 p-6 bg-primary/20 backdrop-blur-lg rounded-xl border border-white/10"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">Create Your Own Campaign</h2>
                <p className="text-sm text-white/60 mt-1">
                  Launch custom tasks and earn when others complete them
                </p>
              </div>
              <motion.button
                className="px-6 py-2 bg-accent rounded-lg font-medium text-white shadow-lg shadow-accent/20"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => router.push('/tasks/marketplace')}
              >
                Open Marketplace
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>
    </Layout>
  );
}
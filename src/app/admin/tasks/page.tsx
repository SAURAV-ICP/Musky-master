'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Layout from '@/components/layout/Layout';
import { useUser } from '@/contexts/UserContext';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';

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
  username: string;
}

export default function AdminTasksPage() {
  const { user } = useUser();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    type: 'telegram' as Task['type'],
    link: '',
    payment_amount: 2000,
    clicks_wanted: 1000,
    payment_type: 'stars' as 'stars' | 'ton',
    button_text: 'Join'
  });

  useEffect(() => {
    console.log('AdminTasksPage - Initial user state:', { 
      user_id: user?.user_id,
      is_admin: user?.is_admin,
      username: user?.username
    });
    
    if (user && !user.is_admin) {
      console.log('Redirecting non-admin user to home');
      router.push('/');
      return;
    }
    if (user?.is_admin) {
      console.log('Admin user detected, fetching tasks');
      fetchTasks();
    }
  }, [user]);

  // Add real-time subscription
  useEffect(() => {
    if (!user?.is_admin) return;

    const channel = supabase
      .channel('task_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'task_submissions' 
        }, 
        (payload) => {
          console.log('Real-time update:', payload);
          fetchTasks(); // Refresh tasks on any change
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchTasks = async () => {
    try {
      const { data: tasks, error } = await supabase
        .from('task_submissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(tasks || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async () => {
    console.log('handleAddTask - Starting with user:', { 
      user_id: user?.user_id,
      is_admin: user?.is_admin,
      username: user?.username
    });
    console.log('handleAddTask - New task data:', newTask);

    try {
      if (!user) {
        console.error('handleAddTask - No user found');
        return;
      }

      if (!newTask.title || !newTask.description || !newTask.link) {
        console.log('handleAddTask - Missing required fields');
        toast.error('Please fill in all required fields');
        return;
      }

      let finalLink = newTask.link;
      if (newTask.type === 'telegram' && !finalLink.startsWith('https://')) {
        finalLink = `https://${finalLink}`;
      }

      const taskData = {
        ...newTask,
        link: finalLink,
        user_id: user.user_id,
        status: 'approved',
        clicks_received: 0,
        active: true,
        username: user.username || 'Admin'
      };

      console.log('handleAddTask - Inserting task with data:', taskData);

      const { data: task, error } = await supabase
        .from('task_submissions')
        .insert(taskData)
        .select()
        .single();

      console.log('handleAddTask - Insert response:', { task, error });

      if (error) {
        console.error('handleAddTask - Insert error:', error);
        throw error;
      }

      setShowAddModal(false);
      setNewTask({
        title: '',
        description: '',
        type: 'telegram',
        link: '',
        payment_amount: 2000,
        clicks_wanted: 1000,
        payment_type: 'stars',
        button_text: 'Join'
      });
      
      toast.success('Task added successfully');
      fetchTasks();
    } catch (error) {
      console.error('handleAddTask - Error:', error);
      toast.error('Failed to add task');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      // First delete related task_clicks
      await supabase
        .from('task_clicks')
        .delete()
        .eq('task_id', taskId);

      // Then delete the task
      const { error } = await supabase
        .from('task_submissions')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
      
      toast.success('Task deleted successfully');
      fetchTasks(); // Refresh the task list
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
    }
  };

  const handleUpdateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      const { error } = await supabase
        .from('task_submissions')
        .update(updates)
        .eq('id', taskId);

      if (error) throw error;

      setEditingTask(null);
      toast.success('Task updated successfully');
      fetchTasks(); // Refresh the task list
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
    }
  };

  // Show loading state while checking admin status
  if (loading && !user) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-screen">
          <motion.div
            className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          />
        </div>
      </Layout>
    );
  }

  // Only return null if we're sure user is not admin
  if (user && !user.is_admin) {
    return null;
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Task Management</h1>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="bg-accent px-6 py-2 rounded-lg font-semibold"
            onClick={() => setShowAddModal(true)}
          >
            Add Task
          </motion.button>
        </div>

        {loading ? (
          <div className="flex justify-center">
            <motion.div
              className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
          </div>
        ) : (
          <div className="space-y-4">
            {tasks.map((task) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-primary/20 backdrop-blur-lg rounded-xl p-6 border border-white/10"
              >
                {editingTask?.id === task.id ? (
                  <div className="space-y-4">
                    <input
                      type="text"
                      value={editingTask.title}
                      onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                      className="w-full bg-black/20 rounded-lg px-4 py-2"
                      placeholder="Task title"
                    />
                    <textarea
                      value={editingTask.description}
                      onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                      className="w-full bg-black/20 rounded-lg px-4 py-2"
                      placeholder="Task description"
                    />
                    <input
                      type="text"
                      value={editingTask.link}
                      onChange={(e) => setEditingTask({ ...editingTask, link: e.target.value })}
                      className="w-full bg-black/20 rounded-lg px-4 py-2"
                      placeholder="Task link"
                    />
                    <div className="flex gap-4">
                      <input
                        type="number"
                        value={editingTask.payment_amount}
                        onChange={(e) => setEditingTask({ ...editingTask, payment_amount: parseInt(e.target.value) })}
                        className="w-1/2 bg-black/20 rounded-lg px-4 py-2"
                        placeholder="Reward amount"
                      />
                      <input
                        type="number"
                        value={editingTask.clicks_wanted}
                        onChange={(e) => setEditingTask({ ...editingTask, clicks_wanted: parseInt(e.target.value) })}
                        className="w-1/2 bg-black/20 rounded-lg px-4 py-2"
                        placeholder="Clicks wanted"
                      />
                    </div>
                    <div className="flex justify-end gap-4">
                      <button
                        onClick={() => setEditingTask(null)}
                        className="px-4 py-2 rounded-lg bg-black/20"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleUpdateTask(task.id, editingTask)}
                        className="px-4 py-2 rounded-lg bg-accent"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-semibold">{task.title}</h3>
                        <p className="text-white/60">{task.description}</p>
                      </div>
                      <div className="flex gap-2">
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setEditingTask(task)}
                          className="p-2 rounded-lg bg-black/20"
                        >
                          ✏️
                        </motion.button>
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this task?')) {
                              handleDeleteTask(task.id);
                            }
                          }}
                          className="p-2 rounded-lg bg-black/20 text-red-400"
                        >
                          🗑️
                        </motion.button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="bg-black/20 rounded-lg p-3">
                        <p className="text-white/60">Type</p>
                        <p className="font-semibold capitalize">{task.type}</p>
                      </div>
                      <div className="bg-black/20 rounded-lg p-3">
                        <p className="text-white/60">Link</p>
                        <a href={task.link} target="_blank" rel="noopener noreferrer" className="font-semibold text-accent">
                          {task.link}
                        </a>
                      </div>
                      <div className="bg-black/20 rounded-lg p-3">
                        <p className="text-white/60">Reward</p>
                        <p className="font-semibold">{task.payment_amount} {task.payment_type}</p>
                      </div>
                      <div className="bg-black/20 rounded-lg p-3">
                        <p className="text-white/60">Clicks</p>
                        <p className="font-semibold">{task.clicks_received} / {task.clicks_wanted}</p>
                      </div>
                    </div>
                  </>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* Add Task Modal */}
        <AnimatePresence>
          {showAddModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-primary/90 backdrop-blur-xl rounded-2xl p-6 w-full max-w-lg"
              >
                <h2 className="text-xl font-bold mb-6">Add New Task</h2>
                <div className="space-y-4">
                  <input
                    type="text"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    className="w-full bg-black/20 rounded-lg px-4 py-2"
                    placeholder="Task title"
                  />
                  <textarea
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    className="w-full bg-black/20 rounded-lg px-4 py-2"
                    placeholder="Task description"
                  />
                  <select
                    value={newTask.type}
                    onChange={(e) => setNewTask({ ...newTask, type: e.target.value as Task['type'] })}
                    className="w-full bg-black/20 rounded-lg px-4 py-2"
                  >
                    <option value="telegram">Telegram</option>
                    <option value="youtube">YouTube</option>
                    <option value="twitter">Twitter</option>
                  </select>
                  <input
                    type="text"
                    value={newTask.link}
                    onChange={(e) => setNewTask({ ...newTask, link: e.target.value })}
                    className="w-full bg-black/20 rounded-lg px-4 py-2"
                    placeholder="Task link (e.g., t.me/group or full URL)"
                  />
                  <div className="flex gap-4">
                    <input
                      type="number"
                      value={newTask.payment_amount}
                      onChange={(e) => setNewTask({ ...newTask, payment_amount: parseInt(e.target.value) })}
                      className="w-1/2 bg-black/20 rounded-lg px-4 py-2"
                      placeholder="Reward amount"
                    />
                    <input
                      type="number"
                      value={newTask.clicks_wanted}
                      onChange={(e) => setNewTask({ ...newTask, clicks_wanted: parseInt(e.target.value) })}
                      className="w-1/2 bg-black/20 rounded-lg px-4 py-2"
                      placeholder="Clicks wanted"
                    />
                  </div>
                  <div className="flex justify-end gap-4 mt-6">
                    <button
                      onClick={() => setShowAddModal(false)}
                      className="px-6 py-2 rounded-lg bg-black/20"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddTask}
                      className="px-6 py-2 rounded-lg bg-accent"
                    >
                      Add Task
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}
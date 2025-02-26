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

interface TaskFormData {
  title: string;
  description: string;
  type: 'telegram' | 'youtube' | 'twitter';
  link: string;
  payment_amount: number;
  clicks_wanted: number;
  payment_type: 'stars' | 'ton';
  button_text: string;
}

export default function AdminTasksPage() {
  const { user } = useUser();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [newTask, setNewTask] = useState<TaskFormData>({
    title: '',
    description: '',
    type: 'telegram',
    link: '',
    payment_amount: 2000,
    clicks_wanted: 1000,
    payment_type: 'stars',
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
  }, [user, activeTab]);

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
      console.log('Fetching tasks...');
      const { data: tasks, error } = await supabase
        .from('task_submissions')
        .select('*')
        .eq('status', activeTab)
        .order('created_at', { ascending: false });

      if (error) throw error;
      console.log('Fetched tasks:', tasks);
      setTasks(tasks || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    console.log(`Input changed - ${name}:`, value);
    
    setNewTask(prev => {
      const updated = {
        ...prev,
        [name]: name === 'payment_amount' || name === 'clicks_wanted' 
          ? parseInt(value) || 0 
          : value
      };
      console.log('Updated newTask:', updated);
      return updated;
    });
  };

  const handleAddTask = async () => {
    console.log('Add Task button clicked');
    console.log('Form Values:', newTask);

    try {
      if (!user) {
        console.error('No user found');
        toast.error('Please log in to add tasks');
        return;
      }

      if (!user.is_admin) {
        console.error('User is not admin');
        toast.error('Only admins can add tasks');
        return;
      }

      // Validate all required fields
      const missingFields = [];
      if (!newTask.title.trim()) missingFields.push('Title');
      if (!newTask.description.trim()) missingFields.push('Description');
      if (!newTask.link.trim()) missingFields.push('Link');

      if (missingFields.length > 0) {
        console.log('Missing fields:', missingFields);
        toast.error(`Please fill in: ${missingFields.join(', ')}`);
        return;
      }

      const taskData = {
        ...newTask,
        user_id: user.user_id,
        status: 'approved',
        clicks_received: 0,
        active: true,
        username: user.username || 'Admin'
      };

      console.log('Attempting to insert task with data:', taskData);

      const { data: task, error } = await supabase
        .from('task_submissions')
        .insert(taskData)
        .select()
        .single();

      if (error) throw error;

      toast.success('Task added successfully');
      setShowAddForm(false);
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
      
      await fetchTasks();
    } catch (error) {
      console.error('Error in handleAddTask:', error);
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

  const handleUpdateStatus = async (taskId: string, newStatus: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('task_submissions')
        .update({ status: newStatus })
        .eq('id', taskId);

      if (error) throw error;
      toast.success(`Task ${newStatus}`);
      fetchTasks();
    } catch (error) {
      console.error('Error updating task status:', error);
      toast.error('Failed to update task status');
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
            onClick={() => setShowAddForm(true)}
          >
            Add Task
          </motion.button>
        </div>

        {/* Task Status Tabs */}
        <div className="flex space-x-4 mb-6">
          {(['pending', 'approved', 'rejected'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setActiveTab(status)}
              className={`px-4 py-2 rounded-lg font-semibold capitalize ${
                activeTab === status
                  ? 'bg-accent text-white'
                  : 'bg-black/20 text-white/60'
              }`}
            >
              {status}
            </button>
          ))}
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
                  <motion.div 
                    className="space-y-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <div className="sticky top-0 bg-primary/20 backdrop-blur-lg p-4 rounded-lg z-10">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold">Edit Task</h3>
                        <div className="flex space-x-2">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="px-4 py-2 bg-accent rounded-lg font-semibold"
                            onClick={() => handleUpdateTask(task.id, editingTask)}
                          >
                            Save
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="px-4 py-2 bg-black/20 rounded-lg font-semibold"
                            onClick={() => setEditingTask(null)}
                          >
                            Cancel
                          </motion.button>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4 mt-4 max-h-[70vh] overflow-y-auto p-4">
                      <div>
                        <label className="block text-sm text-white/60 mb-2">Title</label>
                        <input
                          type="text"
                          value={editingTask.title}
                          onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                          className="w-full bg-black/20 rounded-lg px-4 py-2"
                          placeholder="Task title"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-white/60 mb-2">Description</label>
                        <textarea
                          value={editingTask.description}
                          onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                          className="w-full bg-black/20 rounded-lg px-4 py-2 min-h-[100px]"
                          placeholder="Task description"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-white/60 mb-2">Link</label>
                        <input
                          type="text"
                          value={editingTask.link}
                          onChange={(e) => setEditingTask({ ...editingTask, link: e.target.value })}
                          className="w-full bg-black/20 rounded-lg px-4 py-2"
                          placeholder="Task link"
                        />
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-semibold">{task.title}</h3>
                        <p className="text-white/60">{task.description}</p>
                      </div>
                      <div className="flex gap-2">
                        {activeTab === 'pending' && (
                          <>
                            <motion.button
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleUpdateStatus(task.id, 'approved')}
                              className="p-2 rounded-lg bg-green-500/20 text-green-400"
                            >
                              ✓
                            </motion.button>
                            <motion.button
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleUpdateStatus(task.id, 'rejected')}
                              className="p-2 rounded-lg bg-red-500/20 text-red-400"
                            >
                              ✕
                            </motion.button>
                          </>
                        )}
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
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-primary/20 backdrop-blur-lg rounded-xl p-6 w-full max-w-lg border border-white/10"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">Add New Task</h3>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="text-white/60 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-white/60 mb-2">Title</label>
                  <input
                    type="text"
                    value={newTask.title}
                    onChange={(e) => handleInputChange(e)}
                    name="title"
                    className="w-full bg-black/20 rounded-lg px-4 py-2"
                    placeholder="Task title"
                  />
                </div>

                <div>
                  <label className="block text-sm text-white/60 mb-2">Description</label>
                  <textarea
                    value={newTask.description}
                    onChange={(e) => handleInputChange(e)}
                    name="description"
                    className="w-full bg-black/20 rounded-lg px-4 py-2 min-h-[100px]"
                    placeholder="Task description"
                  />
                </div>

                <div>
                  <label className="block text-sm text-white/60 mb-2">Type</label>
                  <select
                    value={newTask.type}
                    onChange={(e) => handleInputChange(e)}
                    name="type"
                    className="w-full bg-black/20 rounded-lg px-4 py-2"
                  >
                    <option value="telegram">Telegram</option>
                    <option value="youtube">YouTube</option>
                    <option value="twitter">Twitter</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-white/60 mb-2">Link</label>
                  <input
                    type="text"
                    value={newTask.link}
                    onChange={(e) => handleInputChange(e)}
                    name="link"
                    className="w-full bg-black/20 rounded-lg px-4 py-2"
                    placeholder="Task link"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-white/60 mb-2">Clicks Wanted</label>
                    <input
                      type="number"
                      value={newTask.clicks_wanted}
                      onChange={(e) => handleInputChange(e)}
                      name="clicks_wanted"
                      className="w-full bg-black/20 rounded-lg px-4 py-2"
                      placeholder="Required clicks"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-white/60 mb-2">Payment Amount</label>
                    <input
                      type="number"
                      value={newTask.payment_amount}
                      onChange={(e) => handleInputChange(e)}
                      name="payment_amount"
                      className="w-full bg-black/20 rounded-lg px-4 py-2"
                      placeholder="Reward amount"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-white/60 mb-2">Button Text</label>
                  <input
                    type="text"
                    value={newTask.button_text}
                    onChange={(e) => handleInputChange(e)}
                    name="button_text"
                    className="w-full bg-black/20 rounded-lg px-4 py-2"
                    placeholder="Button text"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleAddTask}
                  className="px-4 py-2 rounded-lg bg-accent hover:bg-accent/80"
                >
                  Add Task
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </Layout>
  );
}
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TaskSubmission {
  id: string;
  title: string;
  description: string;
  type: 'telegram' | 'twitter' | 'youtube' | 'website';
  clicks: number;
  reward: number;
  link: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: Date;
  submittedBy: string;
  totalRewardPool: number;
}

const AdminTaskManager = () => {
  const [selectedTask, setSelectedTask] = useState<TaskSubmission | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Mock data - replace with actual API calls
  const taskSubmissions: TaskSubmission[] = [
    {
      id: '1',
      title: 'Join Telegram Group',
      description: 'Join our Telegram group and stay active',
      type: 'telegram',
      clicks: 5000,
      reward: 2,
      link: 'https://t.me/example',
      status: 'pending',
      submittedAt: new Date(),
      submittedBy: 'user123',
      totalRewardPool: 10000,
    },
    // Add more mock submissions
  ];

  const handleApprove = (task: TaskSubmission) => {
    // Implement approval logic
    console.log('Approving task:', task.id);
  };

  const handleReject = (task: TaskSubmission) => {
    // Implement rejection logic
    console.log('Rejecting task:', task.id);
  };

  const getStatusColor = (status: TaskSubmission['status']) => {
    switch (status) {
      case 'approved':
        return 'text-green-400';
      case 'rejected':
        return 'text-red-400';
      default:
        return 'text-yellow-400';
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold mb-4">Task Submissions</h2>

      {/* Task List */}
      <div className="space-y-4">
        {taskSubmissions.map((task) => (
          <motion.div
            key={task.id}
            className="bg-primary/20 rounded-xl p-4 border border-white/10"
            whileHover={{ scale: 1.01 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h3 className="font-bold">{task.title}</h3>
                  <span className={`text-sm ${getStatusColor(task.status)}`}>
                    {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                  </span>
                </div>
                <p className="text-sm text-white/60">
                  Submitted by {task.submittedBy} on {formatDate(task.submittedAt)}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <motion.button
                  className="px-3 py-1 bg-accent rounded-lg text-sm font-bold"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setSelectedTask(task);
                    setShowDetailsModal(true);
                  }}
                >
                  Details
                </motion.button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Task Details Modal */}
      <AnimatePresence>
        {showDetailsModal && selectedTask && (
          <motion.div
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-primary p-6 rounded-2xl w-full max-w-md m-4"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">Task Details</h3>
                <motion.button
                  className="text-white/60"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowDetailsModal(false)}
                >
                  ✕
                </motion.button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-white/60">Title</p>
                  <p className="font-bold">{selectedTask.title}</p>
                </div>

                <div>
                  <p className="text-sm text-white/60">Description</p>
                  <p className="bg-background/50 p-3 rounded-lg">
                    {selectedTask.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-white/60">Type</p>
                    <p className="font-bold capitalize">{selectedTask.type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-white/60">Required Clicks</p>
                    <p className="font-bold">{selectedTask.clicks.toLocaleString()}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-white/60">Reward per Click</p>
                    <p className="font-bold">{selectedTask.reward} MUSKY</p>
                  </div>
                  <div>
                    <p className="text-sm text-white/60">Total Reward Pool</p>
                    <p className="font-bold">{selectedTask.totalRewardPool.toLocaleString()} MUSKY</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-white/60">Link</p>
                  <a
                    href={selectedTask.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent break-all hover:underline"
                  >
                    {selectedTask.link}
                  </a>
                </div>

                {selectedTask.status === 'pending' && (
                  <div className="flex space-x-4 mt-6">
                    <motion.button
                      className="flex-1 py-3 bg-red-500 rounded-xl font-bold"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleReject(selectedTask)}
                    >
                      Reject
                    </motion.button>
                    <motion.button
                      className="flex-1 py-3 bg-green-500 rounded-xl font-bold"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleApprove(selectedTask)}
                    >
                      Approve
                    </motion.button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminTaskManager; 
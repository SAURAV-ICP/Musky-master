import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

interface TaskNotification {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
  amount?: number;
  timestamp: number;
}

interface Props {
  notifications: TaskNotification[];
  onDismiss: (id: string) => void;
}

const TaskNotification: React.FC<Props> = ({ notifications, onDismiss }) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      <AnimatePresence>
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: 100, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.9 }}
            className={`bg-black/80 backdrop-blur-lg rounded-lg p-4 shadow-lg border border-white/10 w-80 ${
              notification.type === 'success' ? 'border-green-500/50' : 
              notification.type === 'error' ? 'border-red-500/50' : 
              'border-white/10'
            }`}
          >
            <div className="flex items-start space-x-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl
                ${notification.type === 'success' ? 'bg-green-500/20 text-green-400' :
                  notification.type === 'error' ? 'bg-red-500/20 text-red-400' :
                  'bg-primary/30 text-white'}`}
              >
                {notification.type === 'success' ? '✓' :
                  notification.type === 'error' ? '✕' : 'ℹ'}
              </div>
              <div className="flex-1">
                <p className={`text-sm ${
                  notification.type === 'success' ? 'text-green-400' :
                  notification.type === 'error' ? 'text-red-400' :
                  'text-white/90'
                }`}>
                  {notification.message}
                </p>
                {notification.amount && notification.type === 'success' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center space-x-2 mt-1"
                  >
                    <span className="text-xs text-white/60">Reward:</span>
                    <motion.span
                      className="text-sm font-bold text-green-400"
                      initial={{ scale: 1 }}
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 0.5 }}
                    >
                      +{notification.amount} MUSKY
                    </motion.span>
                  </motion.div>
                )}
              </div>
              <button
                onClick={() => onDismiss(notification.id)}
                className="text-white/60 hover:text-white"
              >
                ✕
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default TaskNotification; 
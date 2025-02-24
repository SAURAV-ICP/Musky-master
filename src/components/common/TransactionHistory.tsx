import React from 'react';
import { motion } from 'framer-motion';

interface Transaction {
  id: string;
  type: 'mining' | 'staking' | 'referral' | 'upgrade' | 'withdrawal' | 'spin';
  amount: number;
  currency: 'MUSKY' | 'SOL' | 'TON' | 'Stars';
  timestamp: Date;
  status: 'completed' | 'pending' | 'failed';
}

const transactionIcons = {
  mining: '⛏️',
  staking: '📈',
  referral: '👥',
  upgrade: '⭐',
  withdrawal: '💸',
  spin: '🎰',
};

interface Props {
  transactions: Transaction[];
}

const TransactionHistory: React.FC<Props> = ({ transactions }) => {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getStatusColor = (status: Transaction['status']) => {
    switch (status) {
      case 'completed':
        return 'text-green-400';
      case 'pending':
        return 'text-yellow-400';
      case 'failed':
        return 'text-red-400';
      default:
        return 'text-white';
    }
  };

  return (
    <div className="w-full">
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-3"
      >
        {transactions.map((tx) => (
          <motion.div
            key={tx.id}
            variants={item}
            className="bg-primary/20 rounded-xl p-4 border border-white/10"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-primary/30 flex items-center justify-center text-xl">
                  {transactionIcons[tx.type]}
                </div>
                <div>
                  <h3 className="font-bold capitalize">{tx.type}</h3>
                  <p className="text-sm text-white/60">{formatDate(tx.timestamp)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-bold ${tx.amount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {tx.amount >= 0 ? '+' : ''}{tx.amount} {tx.currency}
                </p>
                <p className={`text-sm ${getStatusColor(tx.status)}`}>
                  {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {transactions.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-8 text-white/60"
        >
          <p>No transactions yet</p>
        </motion.div>
      )}
    </div>
  );
};

export default TransactionHistory; 
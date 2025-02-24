import React from 'react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';

const Navigation = () => {
  const router = useRouter();
  const currentPath = router.pathname;

  const navigationItems = [
    { href: '/', label: 'Home', icon: '🏠' },
    { href: '/tasks', label: 'Tasks', icon: '📝' },
    { href: '/mining', label: 'Mining', icon: '⛏️' },
    { href: '/lucky-spin', label: 'Lucky Spin', icon: '🎰' },
    { href: '/refer', label: 'Refer', icon: '👥' },
    { href: '/earn', label: 'Earn', icon: '💰' },
  ];

  return (
    <motion.div 
      className="fixed bottom-0 left-0 right-0 bg-primary/90 backdrop-blur-lg border-t border-white/10"
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex justify-around items-center h-16 px-2">
        {navigationItems.map((item) => (
          <motion.button
            key={item.href}
            className={`flex flex-col items-center justify-center w-16 h-full ${
              currentPath === item.href ? 'text-white' : 'text-white/60'
            }`}
            whileTap={{ scale: 0.9 }}
            onClick={() => router.push(item.href)}
          >
            <span className="text-xl mb-1">{item.icon}</span>
            <span className="text-xs">{item.label}</span>
            {currentPath === item.href && (
              <motion.div
                className="absolute bottom-0 w-8 h-1 bg-accent rounded-t-full"
                layoutId="activeTab"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};

export default Navigation; 
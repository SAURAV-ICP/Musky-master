'use client';
import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { usePathname } from 'next/navigation';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const pathname = usePathname();
  
  const navItems = [
    { href: '/', label: 'Home', icon: '🏠' },
    { href: '/tasks', label: 'Tasks', icon: '📋' },
    { href: '/mining', label: 'Mining', icon: '⛏️' },
    { href: '/refer', label: 'Refer', icon: '👥' },
    { href: '/earn', label: 'Earn', icon: '💰' },
  ];

  return (
    <div className="min-h-screen">
      <motion.div 
        className="min-h-screen bg-gradient-to-b from-background-start-rgb to-background-end-rgb"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <main className="container mx-auto px-4 py-8 pb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {children}
          </motion.div>
        </main>
        
        <motion.nav 
          className="fixed bottom-0 left-0 right-0 bg-white/10 backdrop-blur-lg border-t border-white/20"
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center py-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="relative flex flex-col items-center p-2 group"
                >
                  <motion.span 
                    className={`text-2xl transition-transform duration-200 ${
                      pathname === item.href ? 'scale-110' : 'scale-100'
                    }`}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    {item.icon}
                  </motion.span>
                  <span className={`text-xs mt-1 ${
                    pathname === item.href ? 'text-white font-bold' : 'text-white/60'
                  }`}>
                    {item.label}
                  </span>
                  {pathname === item.href && (
                    <motion.div
                      className="absolute -bottom-2 w-12 h-1 bg-accent rounded-full"
                      layoutId="activeTab"
                      transition={{ type: "spring", bounce: 0.2 }}
                    />
                  )}
                </Link>
              ))}
            </div>
          </div>
        </motion.nav>
      </motion.div>
    </div>
  );
} 
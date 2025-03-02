'use client';

import React from 'react';
import { useUser } from '@/contexts/UserContext';
import BalancePopup from './BalancePopup';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user } = useUser();

  return (
    <div className="min-h-screen bg-primary text-white">
      <main className="pb-20">
        {children}
      </main>
      
      {/* Show balance popup for users with MUSKY balance */}
      {user && <BalancePopup minBalance={1000} />}
    </div>
  );
} 
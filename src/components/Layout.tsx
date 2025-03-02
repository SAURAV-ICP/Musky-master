'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@/contexts/UserContext';
import BalancePopup from './BalancePopup';
import { TonConnectUIProvider } from '@tonconnect/ui-react';

interface LayoutProps {
  children: React.ReactNode;
}

// TON Connect configuration
const manifestUrl = '/tonconnect-manifest.json';

export default function Layout({ children }: LayoutProps) {
  const { user, loading } = useUser();
  const [showBalancePopup, setShowBalancePopup] = useState(false);
  
  // Check if we should show the balance popup
  useEffect(() => {
    if (user && !loading) {
      // Show popup if user has a balance and hasn't seen the popup recently
      const lastPopupTime = localStorage.getItem('last_balance_popup_time');
      const now = new Date().getTime();
      
      // Only show popup once every 24 hours
      if (!lastPopupTime || (now - parseInt(lastPopupTime)) > 24 * 60 * 60 * 1000) {
        setShowBalancePopup(true);
        localStorage.setItem('last_balance_popup_time', now.toString());
      }
    }
  }, [user, loading]);
  
  const handleClosePopup = () => {
    setShowBalancePopup(false);
  };
  
  return (
    <TonConnectUIProvider manifestUrl={manifestUrl}>
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-blue-900 to-blue-950">
        <main className="flex-grow container mx-auto px-4 py-8">
          {children}
        </main>
        
        {/* Show balance popup conditionally */}
        {showBalancePopup && user && (
          <BalancePopup 
            minBalance={1000} 
            onClose={handleClosePopup} 
          />
        )}
      </div>
    </TonConnectUIProvider>
  );
} 
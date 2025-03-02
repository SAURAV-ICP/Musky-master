'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import useSWR from 'swr';
import { supabase } from '@/lib/supabase';

// No need to redefine the Window interface as it's already defined in global.d.ts

export interface User {
  stars_balance: number;
  user_id: string;
  username: string;
  balance: number;
  solana_balance: number;
  energy: number;
  spin_energy: number;
  last_spin_energy_reset: string | null;
  last_energy_reset: string | null;
  last_tap_time: string | null;
  created_at: string;
  updated_at: string;
  level: string;
  is_admin: boolean;
  solana_address: string | null;
  mining_rate: number;
}

interface UserContextType {
  user: User | null;
  loading: boolean;
  error: any;
  mutate: () => Promise<any>;
}

const UserContext = createContext<UserContextType>({
  user: null,
  loading: false,
  error: null,
  mutate: async () => {},
});

const INITIAL_SPIN_ENERGY = 1200;
// Admin ID for reference
const ADMIN_ID = process.env.NEXT_PUBLIC_ADMIN_ID || '7093793454';

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [telegramUserId, setTelegramUserId] = useState<string | null>(null);
  
  // Extract Telegram user ID when component mounts
  useEffect(() => {
    const getTelegramUser = () => {
      try {
        console.log('Attempting to get Telegram user ID...');
        
        // Check if we're in the Telegram WebApp environment
        if (typeof window !== 'undefined' && window.Telegram) {
          console.log('Telegram WebApp detected');
          
          // Try to get user from Telegram WebApp
          try {
            // Use type assertion to access potentially undefined properties
            const webApp = window.Telegram.WebApp;
            // @ts-ignore - Ignore type checking for this line as Telegram types may vary
            const webAppData = webApp.initDataUnsafe;
            // @ts-ignore
            const webAppUser = webAppData?.user;
            
            if (webAppUser && webAppUser.id) {
              const userId = String(webAppUser.id);
              console.log('Found Telegram user from WebApp:', userId);
              return userId;
            }
          } catch (e) {
            console.error('Error accessing Telegram WebApp data:', e);
          }
          
          // If we can't get the user from WebApp, try to parse it from the URL
          const tgWebAppData = new URLSearchParams(window.location.search).get('tgWebAppData');
          if (tgWebAppData) {
            try {
              // Try to extract user_id from tgWebAppData
              const decodedData = decodeURIComponent(tgWebAppData);
              const userMatch = decodedData.match(/"id":(\d+)/);
              if (userMatch && userMatch[1]) {
                const userId = userMatch[1];
                console.log('Found Telegram user from tgWebAppData:', userId);
                return userId;
              }
            } catch (e) {
              console.error('Error parsing tgWebAppData:', e);
            }
          }
        }
        
        // Check URL parameters as fallback
        if (typeof window !== 'undefined') {
          const urlParams = new URLSearchParams(window.location.search);
          const userIdFromUrl = urlParams.get('user_id');
          if (userIdFromUrl) {
            console.log('Found user_id in URL:', userIdFromUrl);
            return userIdFromUrl;
          }
          
          // Try to get user_id from hash
          const hash = window.location.hash;
          const hashParams = new URLSearchParams(hash.substring(1));
          const userIdFromHash = hashParams.get('user_id');
          if (userIdFromHash) {
            console.log('Found user_id in hash:', userIdFromHash);
            return userIdFromHash;
          }
        }
        
        // For development/testing only - DO NOT use in production
        if (process.env.NODE_ENV === 'development') {
          console.log('Development environment detected, using test user ID');
          const testId = localStorage.getItem('test_user_id') || 'test_user';
          localStorage.setItem('test_user_id', testId);
          return testId;
        }
        
        console.warn('No Telegram user ID found. This should only happen in development.');
        return null;
      } catch (error) {
        console.error('Error getting Telegram user:', error);
        return null;
      }
    };
    
    const userId = getTelegramUser();
    if (userId) {
      setTelegramUserId(userId);
      console.log('Set Telegram user ID:', userId);
    } else {
      console.error('Failed to get a valid user ID');
    }
  }, []);

  const { data: user, error, isLoading, mutate } = useSWR(
    telegramUserId ? ['user', telegramUserId] : null, 
    async ([_, userId]) => {
      try {
        console.log('Fetching user data for ID:', userId);
        
        // First, check if user exists
        const { data: existingUser, error: fetchError } = await supabase
          .from('users')
          .select('*')
          .eq('user_id', userId)
          .single();

        console.log('Existing user data:', existingUser);
        
        if (fetchError) {
          if (fetchError.code === 'PGRST116') { // Not found error
            console.log('User not found, creating new user...');
            // Create new user with initial spin energy
            const { data: newUser, error: createError } = await supabase
              .from('users')
              .insert({
                user_id: userId,
                balance: 0,
                solana_balance: 0,
                energy: 1200,
                spin_energy: INITIAL_SPIN_ENERGY,
                last_spin_energy_reset: new Date().toISOString(),
                level: '1',
                is_admin: userId === ADMIN_ID, // Only set admin if it matches ADMIN_ID
                mining_equipment: {}, // Initialize empty mining equipment
                mining_rate: 0 // Initialize mining rate to 0
              })
              .select()
              .single();

            if (createError) {
              console.error('Error creating new user:', createError);
              throw createError;
            }
            console.log('New user created:', newUser);
            return newUser;
          }
          throw fetchError;
        }

        // If user exists but has no spin energy, update them
        if (existingUser && (existingUser.spin_energy === undefined || existingUser.spin_energy === null || existingUser.spin_energy === 0)) {
          console.log('Updating user with spin energy...');
          const { data: updatedUser, error: updateError } = await supabase
            .from('users')
            .update({
              spin_energy: INITIAL_SPIN_ENERGY,
              last_spin_energy_reset: new Date().toISOString(),
            })
            .eq('user_id', userId)
            .select()
            .single();

          if (updateError) {
            console.error('Error updating user:', updateError);
            throw updateError;
          }
          console.log('User updated with spin energy:', updatedUser);
          return updatedUser;
        }

        // Check if energy needs to be reset (12 hours passed)
        if (existingUser.last_spin_energy_reset) {
          const lastReset = new Date(existingUser.last_spin_energy_reset);
          const now = new Date();
          const hoursSinceReset = (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60);
          
          if (hoursSinceReset >= 12) {
            console.log('Resetting spin energy after 12 hours...');
            const { data: resetUser, error: resetError } = await supabase
              .from('users')
              .update({
                spin_energy: INITIAL_SPIN_ENERGY,
                last_spin_energy_reset: now.toISOString(),
              })
              .eq('user_id', userId)
              .select()
              .single();

            if (resetError) {
              console.error('Error resetting energy:', resetError);
              throw resetError;
            }
            console.log('Energy reset complete:', resetUser);
            return resetUser;
          }
        }

        // Ensure is_admin is correctly set
        if (existingUser.is_admin === true && userId !== ADMIN_ID) {
          console.log('Fixing incorrect admin status for user:', userId);
          const { data: fixedUser, error: fixError } = await supabase
            .from('users')
            .update({
              is_admin: userId === ADMIN_ID
            })
            .eq('user_id', userId)
            .select()
            .single();
            
          if (fixError) {
            console.error('Error fixing admin status:', fixError);
          } else if (fixedUser) {
            console.log('Admin status fixed for user:', fixedUser);
            return fixedUser;
          }
        }

        return existingUser;
      } catch (error) {
        console.error('Error in user context:', error);
        throw error;
      }
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      refreshInterval: 60000, // Refresh every minute
    }
  );

  return (
    <UserContext.Provider value={{ user, loading: isLoading, error, mutate }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
} 
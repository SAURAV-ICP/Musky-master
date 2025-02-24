'use client';

import React, { createContext, useContext } from 'react';
import useSWR from 'swr';
import { supabase } from '@/lib/supabase';

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
const TEST_USER_ID = '12345';

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { data: user, error, isLoading, mutate } = useSWR('user', async () => {
    try {
      console.log('Fetching user data...');
      
      // First, check if user exists
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('user_id', TEST_USER_ID)
        .single();

      console.log('Existing user data:', existingUser);
      console.log('Fetch error:', fetchError);

      if (fetchError) {
        if (fetchError.code === 'PGRST116') { // Not found error
          console.log('User not found, creating new user...');
          // Create new user with initial spin energy
          const { data: newUser, error: createError } = await supabase
            .from('users')
            .insert({
              user_id: TEST_USER_ID,
              balance: 0,
              solana_balance: 0,
              energy: 1200,
              spin_energy: INITIAL_SPIN_ENERGY,
              last_spin_energy_reset: new Date().toISOString(),
              level: '1',
              is_admin: false
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
          .eq('user_id', TEST_USER_ID)
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
            .eq('user_id', TEST_USER_ID)
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

      return existingUser;
    } catch (error) {
      console.error('Error in user context:', error);
      throw error;
    }
  });

  return (
    <UserContext.Provider value={{ user, loading: isLoading, error, mutate }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
} 
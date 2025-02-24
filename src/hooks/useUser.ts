import useSWR from 'swr';

interface User {
  user_id: string;
  username: string;
  balance: number;
  solana_balance: number;
  energy: number;
  referral_count: number;
  solana_address: string | null;
  verification_complete: boolean;
  mining_rate: number;
  level: string;
  last_tap_time: string | null;
  spin_energy: number;
  last_spin_energy_reset: string | null;
}

export function useUser() {
  const { data: user, error, mutate } = useSWR<User>('/api/user', async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error('Failed to fetch user');
    }
    return res.json();
  });

  return {
    user,
    isLoading: !error && !user,
    isError: error,
    mutate,
  };
} 
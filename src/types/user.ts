interface User {
  user_id: string;
  username: string;
  balance: number;
  solana_balance: number;
  is_admin: boolean;
  mining_rate: number;
  level: string;
  energy: number;
  last_tap_time: string | null;
  last_energy_reset: string | null;
  spin_energy: number;
  last_spin_energy_reset: string | null;
  referral_count: number;
  solana_address: string | null;
  verification_complete: boolean;
}

export type { User }; 
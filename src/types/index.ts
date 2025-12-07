export interface Project {
  id: string;
  name: string;
  description: string;
  logo_url: string | null;
  banner_url: string | null;
  token_name: string;
  token_symbol: string;
  token_address: string | null;
  total_supply: number;
  token_price: number;
  hard_cap: number;
  soft_cap: number;
  raised_amount: number;
  sale_start: string;
  sale_end: string;
  status: 'upcoming' | 'live' | 'ended';
  website: string | null;
  twitter: string | null;
  telegram: string | null;
  discord: string | null;
  vesting_schedule: VestingSchedule | null;
  created_at: string;
}

export interface VestingSchedule {
  tge_percent: number;
  cliff_months: number;
  vesting_months: number;
  description?: string;
}

export interface Investment {
  id: string;
  user_wallet: string;
  project_id: string;
  amount_invested: number;
  tokens_purchased: number;
  transaction_hash: string | null;
  claimed_amount: number;
  created_at: string;
  project?: Project;
}

export interface User {
  id: string;
  wallet_address: string;
  email: string | null;
  is_admin: boolean;
  created_at: string;
}

export interface WalletState {
  address: string | null;
  balance: string;
  chainId: number | null;
  isConnecting: boolean;
  isConnected: boolean;
}

export interface ProjectFilter {
  status?: 'upcoming' | 'live' | 'ended' | 'all';
  search?: string;
  sortBy?: 'newest' | 'ending_soon' | 'most_raised';
}

export interface ProjectStats {
  totalRaised: number;
  activeProjects: number;
  totalParticipants: number;
  completedProjects: number;
}

export interface TokenomicsData {
  name: string;
  value: number;
  color: string;
}

export interface TeamMember {
  name: string;
  role: string;
  image: string;
  twitter?: string;
  linkedin?: string;
}

export interface RoadmapItem {
  quarter: string;
  title: string;
  description: string;
  completed: boolean;
}

export interface TransactionStatus {
  hash: string;
  status: 'pending' | 'success' | 'failed';
  timestamp: number;
}

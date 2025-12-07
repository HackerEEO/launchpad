import { supabase } from '@/lib/supabase';
import type { Investment } from '@/types';

export const investmentsService = {
  async create(investment: Omit<Investment, 'id' | 'created_at' | 'claimed_amount'>): Promise<Investment> {
    const { data, error } = await supabase
      .from('investments')
      .insert(investment)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getByWallet(walletAddress: string): Promise<Investment[]> {
    const { data, error } = await supabase
      .from('investments')
      .select(`
        *,
        project:projects(*)
      `)
      .eq('user_wallet', walletAddress)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getByProject(projectId: string): Promise<Investment[]> {
    const { data, error } = await supabase
      .from('investments')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async updateClaimedAmount(investmentId: string, claimedAmount: number): Promise<Investment> {
    const { data, error } = await supabase
      .from('investments')
      .update({ claimed_amount: claimedAmount })
      .eq('id', investmentId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getPortfolioStats(walletAddress: string) {
    const investments = await this.getByWallet(walletAddress);

    const totalInvested = investments.reduce((sum, inv) => sum + Number(inv.amount_invested), 0);
    const totalTokens = investments.reduce((sum, inv) => sum + Number(inv.tokens_purchased), 0);
    const totalClaimed = investments.reduce((sum, inv) => sum + Number(inv.claimed_amount), 0);
    const claimableTokens = totalTokens - totalClaimed;

    return {
      totalInvested,
      totalTokens,
      totalClaimed,
      claimableTokens,
      investmentCount: investments.length,
      investments,
    };
  },
};

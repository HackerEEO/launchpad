import { supabase } from '@/lib/supabase';
import type { User } from '@/types';

export const usersService = {
  async getOrCreate(walletAddress: string): Promise<User> {
    const { data: existing, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('wallet_address', walletAddress)
      .maybeSingle();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    if (existing) {
      return existing;
    }

    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({ wallet_address: walletAddress })
      .select()
      .single();

    if (createError) throw createError;
    return newUser;
  },

  async updateEmail(walletAddress: string, email: string): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .update({ email })
      .eq('wallet_address', walletAddress)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async isAdmin(walletAddress: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('users')
      .select('is_admin')
      .eq('wallet_address', walletAddress)
      .maybeSingle();

    if (error) return false;
    return data?.is_admin || false;
  },

  async getAll(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },
};

import { supabase } from '@/lib/supabase';
import type { Project, ProjectFilter } from '@/types';

export const projectsService = {
  async getAll(filters?: ProjectFilter): Promise<Project[]> {
    let query = supabase.from('projects').select('*');

    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }

    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,token_symbol.ilike.%${filters.search}%`);
    }

    if (filters?.sortBy === 'newest') {
      query = query.order('created_at', { ascending: false });
    } else if (filters?.sortBy === 'ending_soon') {
      query = query.order('sale_end', { ascending: true });
    } else if (filters?.sortBy === 'most_raised') {
      query = query.order('raised_amount', { ascending: false });
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<Project | null> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async getFeatured(limit = 6): Promise<Project[]> {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('status', 'live')
      .order('raised_amount', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  async create(project: Omit<Project, 'id' | 'created_at' | 'raised_amount'>): Promise<Project> {
    const { data, error } = await supabase
      .from('projects')
      .insert(project)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Partial<Project>): Promise<Project> {
    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getStats() {
    const [projectsData, investmentsData] = await Promise.all([
      supabase.from('projects').select('status, raised_amount'),
      supabase.from('investments').select('user_wallet'),
    ]);

    const projects = projectsData.data || [];
    const investments = investmentsData.data || [];

    const totalRaised = projects.reduce((sum, p) => sum + Number(p.raised_amount), 0);
    const activeProjects = projects.filter(p => p.status === 'live').length;
    const completedProjects = projects.filter(p => p.status === 'ended').length;
    const uniqueParticipants = new Set(investments.map(i => i.user_wallet)).size;

    return {
      totalRaised,
      activeProjects,
      totalParticipants: uniqueParticipants,
      completedProjects,
    };
  },

  subscribeToChanges(callback: (payload: any) => void) {
    return supabase
      .channel('projects-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, callback)
      .subscribe();
  },
};

import { useEffect, useState } from 'react';
import { projectsService } from '@/services/projects.service';
import type { Project, ProjectFilter, ProjectStats } from '@/types';
import toast from 'react-hot-toast';

export const useProjects = (filters?: ProjectFilter) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProjects();
  }, [filters?.status, filters?.search, filters?.sortBy]);

  const loadProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await projectsService.getAll(filters);
      setProjects(data);
    } catch (err: any) {
      setError(err.message);
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => {
    loadProjects();
  };

  return {
    projects,
    loading,
    error,
    refresh,
  };
};

export const useProject = (id: string | undefined) => {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const loadProject = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await projectsService.getById(id);
        setProject(data);
      } catch (err: any) {
        setError(err.message);
        toast.error('Failed to load project');
      } finally {
        setLoading(false);
      }
    };

    loadProject();
  }, [id]);

  const refresh = async () => {
    if (!id) return;
    try {
      const data = await projectsService.getById(id);
      setProject(data);
    } catch (err: any) {
      console.error('Failed to refresh project:', err);
    }
  };

  return {
    project,
    loading,
    error,
    refresh,
  };
};

export const useProjectStats = () => {
  const [stats, setStats] = useState<ProjectStats>({
    totalRaised: 0,
    activeProjects: 0,
    totalParticipants: 0,
    completedProjects: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await projectsService.getStats();
        setStats(data);
      } catch (err) {
        console.error('Failed to load stats:', err);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  return {
    stats,
    loading,
  };
};
